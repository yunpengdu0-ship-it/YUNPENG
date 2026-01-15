/**
 * RuleEngine 属性测试
 * 
 * 使用 fast-check 进行基于属性的测试
 */

import { describe, test, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { RuleEngine } from './RuleEngine';
import {
  ValidationRule,
  RulePriority,
  createSuccessResult,
  createFailureResult,
  createValidationError,
} from './types';
import { ChordProgression, Chord, Note } from '../types/music';

// 生成随机音符
const noteArbitrary = fc.record({
  pitch: fc.constantFrom('C', 'D', 'E', 'F', 'G', 'A', 'B'),
  octave: fc.integer({ min: 2, max: 5 }),
  duration: fc.constant('w'),
});

// 生成随机和弦
const chordArbitrary = fc.record({
  notes: fc.array(noteArbitrary, { minLength: 4, maxLength: 4 }),
  romanNumeral: fc.constantFrom('I', 'II', 'III', 'IV', 'V', 'VI', 'VII'),
  inversion: fc.integer({ min: 0, max: 2 }),
});

// 生成随机和弦进行
const progressionArbitrary = fc.record({
  chords: fc.array(chordArbitrary, { minLength: 2, maxLength: 8 }),
  key: fc.constantFrom('C major', 'G major', 'D major', 'A minor', 'E minor'),
});

// 生成章节号
const chapterArbitrary = fc.integer({ min: 1, max: 60 });

// 创建一个总是失败的规则
function createFailingRule(id: string, chapter: number, priority: number): ValidationRule {
  return {
    id,
    name: `Failing Rule ${id}`,
    chapter,
    priority,
    description: `Always fails for chapter ${chapter}`,
    validate: (progression, chordIndex) => {
      if (chordIndex > 0) {
        return createFailureResult([
          createValidationError(
            id,
            `Failing Rule ${id}`,
            `Violation detected by ${id}`,
            `第${chapter}章`,
            [0, 1],
            [chordIndex - 1, chordIndex]
          ),
        ]);
      }
      return createSuccessResult();
    },
  };
}

// 创建一个总是成功的规则
function createPassingRule(id: string, chapter: number, priority: number): ValidationRule {
  return {
    id,
    name: `Passing Rule ${id}`,
    chapter,
    priority,
    description: `Always passes for chapter ${chapter}`,
    validate: () => createSuccessResult(),
  };
}

describe('RuleEngine 属性测试', () => {
  let engine: RuleEngine;
  
  beforeEach(() => {
    engine = new RuleEngine();
  });
  
  // Feature: harmony-game, Property 1: 规则验证完整性
  describe('属性 1: 规则验证完整性', () => {
    test('如果进行违反规则，验证引擎必须识别出所有违规', () => {
      fc.assert(
        fc.property(
          progressionArbitrary,
          chapterArbitrary,
          fc.integer({ min: 1, max: 5 }),
          (progression, chapter, ruleCount) => {
            // 清空引擎
            engine.clearRules();
            
            // 注册多个失败的规则
            const ruleIds: string[] = [];
            for (let i = 0; i < ruleCount; i++) {
              const ruleId = `fail-${chapter}-${i}`;
              ruleIds.push(ruleId);
              engine.registerRule(
                createFailingRule(ruleId, chapter, RulePriority.STRUCTURE + i * 10)
              );
            }
            
            // 验证和弦进行
            const result = engine.validate(progression, chapter);
            
            // 验证结果应该是失败的
            expect(result.isValid).toBe(false);
            
            // 应该包含所有规则的错误
            const errorRuleIds = new Set(result.errors.map(e => e.ruleId));
            for (const ruleId of ruleIds) {
              expect(errorRuleIds.has(ruleId)).toBe(true);
            }
            
            // 每个错误都应该有完整的信息
            for (const error of result.errors) {
              expect(error.ruleId).toBeTruthy();
              expect(error.ruleName).toBeTruthy();
              expect(error.message).toBeTruthy();
              expect(error.chapterReference).toBeTruthy();
              expect(Array.isArray(error.affectedVoices)).toBe(true);
              expect(Array.isArray(error.affectedChords)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('如果进行符合所有规则，验证引擎必须返回成功', () => {
      fc.assert(
        fc.property(
          progressionArbitrary,
          chapterArbitrary,
          fc.integer({ min: 1, max: 5 }),
          (progression, chapter, ruleCount) => {
            // 清空引擎
            engine.clearRules();
            
            // 注册多个通过的规则
            for (let i = 0; i < ruleCount; i++) {
              engine.registerRule(
                createPassingRule(`pass-${chapter}-${i}`, chapter, RulePriority.STRUCTURE + i * 10)
              );
            }
            
            // 验证和弦进行
            const result = engine.validate(progression, chapter);
            
            // 验证结果应该是成功的
            expect(result.isValid).toBe(true);
            expect(result.errors.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // Feature: harmony-game, Property 6: 规则累积性
  describe('属性 6: 规则累积性', () => {
    test('章节N的规则集必须包含所有前面章节的规则', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          (targetChapter) => {
            // 清空引擎
            engine.clearRules();
            
            // 为每个章节注册一个规则
            const allRuleIds: string[] = [];
            for (let ch = 1; ch <= targetChapter; ch++) {
              const ruleId = `rule-ch${ch}`;
              allRuleIds.push(ruleId);
              engine.registerRule(
                createPassingRule(ruleId, ch, RulePriority.STRUCTURE + ch)
              );
            }
            
            // 获取目标章节的规则
            const rules = engine.getRulesForChapter(targetChapter);
            
            // 应该包含所有章节的规则
            expect(rules.length).toBe(targetChapter);
            
            const ruleIds = rules.map(r => r.id);
            for (const expectedId of allRuleIds) {
              expect(ruleIds).toContain(expectedId);
            }
            
            // 规则应该按优先级排序
            for (let i = 1; i < rules.length; i++) {
              expect(rules[i].priority).toBeGreaterThanOrEqual(rules[i - 1].priority);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('验证时应该应用所有累积的规则', () => {
      fc.assert(
        fc.property(
          progressionArbitrary,
          fc.integer({ min: 2, max: 10 }),
          (progression, targetChapter) => {
            // 清空引擎
            engine.clearRules();
            
            // 为每个章节注册一个失败的规则
            const expectedRuleIds: string[] = [];
            for (let ch = 1; ch <= targetChapter; ch++) {
              const ruleId = `fail-ch${ch}`;
              expectedRuleIds.push(ruleId);
              engine.registerRule(
                createFailingRule(ruleId, ch, RulePriority.STRUCTURE + ch)
              );
            }
            
            // 验证和弦进行
            const result = engine.validate(progression, targetChapter);
            
            // 应该检测到所有章节的规则违规
            const errorRuleIds = new Set(result.errors.map(e => e.ruleId));
            for (const ruleId of expectedRuleIds) {
              expect(errorRuleIds.has(ruleId)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('章节N不应该包含章节N+1的规则', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 9 }),
          (chapter) => {
            // 清空引擎
            engine.clearRules();
            
            // 为当前章节和下一章节注册规则
            engine.registerRule(createPassingRule(`rule-ch${chapter}`, chapter, RulePriority.STRUCTURE));
            engine.registerRule(createPassingRule(`rule-ch${chapter + 1}`, chapter + 1, RulePriority.STRUCTURE));
            
            // 获取当前章节的规则
            const rules = engine.getRulesForChapter(chapter);
            
            // 不应该包含下一章节的规则
            const ruleIds = rules.map(r => r.id);
            expect(ruleIds).not.toContain(`rule-ch${chapter + 1}`);
            expect(ruleIds).toContain(`rule-ch${chapter}`);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // Feature: harmony-game, Property 16: 规则应用顺序一致性
  describe('属性 16: 规则应用顺序一致性', () => {
    test('错误应该按优先级排序（结构 → 进行 → 和弦 → 风格）', () => {
      fc.assert(
        fc.property(
          progressionArbitrary,
          chapterArbitrary,
          (progression, chapter) => {
            // 清空引擎
            engine.clearRules();
            
            // 注册不同优先级的失败规则
            engine.registerRule(createFailingRule('style', chapter, RulePriority.STYLE));
            engine.registerRule(createFailingRule('structure', chapter, RulePriority.STRUCTURE));
            engine.registerRule(createFailingRule('chord', chapter, RulePriority.CHORD));
            engine.registerRule(createFailingRule('voice', chapter, RulePriority.VOICE_LEADING));
            
            // 验证和弦进行
            const result = engine.validate(progression, chapter);
            
            if (result.errors.length > 0) {
              // 错误应该按优先级排序
              for (let i = 1; i < result.errors.length; i++) {
                const prevRule = engine.getRule(result.errors[i - 1].ruleId);
                const currRule = engine.getRule(result.errors[i].ruleId);
                
                if (prevRule && currRule) {
                  expect(currRule.priority).toBeGreaterThanOrEqual(prevRule.priority);
                }
              }
              
              // 第一个错误应该是结构规则（如果存在）
              const firstError = result.errors[0];
              if (firstError.ruleId === 'structure') {
                const firstRule = engine.getRule(firstError.ruleId);
                expect(firstRule?.priority).toBe(RulePriority.STRUCTURE);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // 额外的属性测试
  describe('额外属性测试', () => {
    test('注册规则应该是幂等的', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          chapterArbitrary,
          (ruleCount, chapter) => {
            // 清空引擎
            engine.clearRules();
            
            // 多次注册相同的规则
            for (let i = 0; i < ruleCount; i++) {
              engine.registerRule(createPassingRule('same-rule', chapter, RulePriority.STRUCTURE));
            }
            
            // 应该只有一个规则
            expect(engine.getRuleCount()).toBe(1);
            expect(engine.getRule('same-rule')).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('空和弦进行应该总是通过验证', () => {
      fc.assert(
        fc.property(
          chapterArbitrary,
          fc.integer({ min: 1, max: 5 }),
          (chapter, ruleCount) => {
            // 清空引擎
            engine.clearRules();
            
            // 注册多个失败的规则
            for (let i = 0; i < ruleCount; i++) {
              engine.registerRule(
                createFailingRule(`fail-${i}`, chapter, RulePriority.STRUCTURE + i * 10)
              );
            }
            
            // 验证空和弦进行
            const emptyProgression: ChordProgression = {
              chords: [],
              key: 'C major',
            };
            
            const result = engine.validate(emptyProgression, chapter);
            
            // 应该通过验证
            expect(result.isValid).toBe(true);
            expect(result.errors.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
