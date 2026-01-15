/**
 * RuleEngine 单元测试
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { RuleEngine } from './RuleEngine';
import {
  ValidationRule,
  RulePriority,
  createSuccessResult,
  createFailureResult,
  createValidationError,
} from './types';
import { ChordProgression, Chord, Note } from '../types/music';

// 辅助函数：创建测试用的和弦进行
function createTestProgression(chordCount: number): ChordProgression {
  const chords: Chord[] = [];
  
  for (let i = 0; i < chordCount; i++) {
    const notes: Note[] = [
      { pitch: 'C', octave: 5, duration: 'w' },
      { pitch: 'E', octave: 4, duration: 'w' },
      { pitch: 'G', octave: 3, duration: 'w' },
      { pitch: 'C', octave: 3, duration: 'w' },
    ];
    
    chords.push({
      notes,
      romanNumeral: 'I',
      inversion: 0,
    });
  }
  
  return {
    chords,
    key: 'C major',
  };
}

// 辅助函数：创建测试规则
function createTestRule(
  id: string,
  chapter: number,
  priority: number,
  shouldFail: boolean = false
): ValidationRule {
  return {
    id,
    name: `Test Rule ${id}`,
    chapter,
    priority,
    description: `Test rule for chapter ${chapter}`,
    validate: (progression, chordIndex) => {
      if (shouldFail && chordIndex > 0) {
        return createFailureResult([
          createValidationError(
            id,
            `Test Rule ${id}`,
            `Error from rule ${id}`,
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

describe('RuleEngine', () => {
  let engine: RuleEngine;
  
  beforeEach(() => {
    engine = new RuleEngine();
  });
  
  describe('规则注册', () => {
    test('应该能够注册单个规则', () => {
      const rule = createTestRule('test-1', 1, RulePriority.STRUCTURE);
      engine.registerRule(rule);
      
      expect(engine.getRuleCount()).toBe(1);
      expect(engine.getRule('test-1')).toBe(rule);
    });
    
    test('应该能够批量注册多个规则', () => {
      const rules = [
        createTestRule('test-1', 1, RulePriority.STRUCTURE),
        createTestRule('test-2', 1, RulePriority.VOICE_LEADING),
        createTestRule('test-3', 2, RulePriority.CHORD),
      ];
      
      engine.registerRules(rules);
      
      expect(engine.getRuleCount()).toBe(3);
      expect(engine.getRule('test-1')).toBe(rules[0]);
      expect(engine.getRule('test-2')).toBe(rules[1]);
      expect(engine.getRule('test-3')).toBe(rules[2]);
    });
    
    test('注册相同ID的规则应该替换旧规则', () => {
      const rule1 = createTestRule('test-1', 1, RulePriority.STRUCTURE);
      const rule2 = createTestRule('test-1', 1, RulePriority.VOICE_LEADING);
      
      engine.registerRule(rule1);
      engine.registerRule(rule2);
      
      expect(engine.getRuleCount()).toBe(1);
      expect(engine.getRule('test-1')).toBe(rule2);
    });
  });
  
  describe('按章节获取规则', () => {
    test('应该返回指定章节的规则', () => {
      engine.registerRule(createTestRule('ch1-rule1', 1, RulePriority.STRUCTURE));
      engine.registerRule(createTestRule('ch1-rule2', 1, RulePriority.VOICE_LEADING));
      
      const rules = engine.getRulesForChapter(1);
      
      expect(rules.length).toBe(2);
      expect(rules[0].id).toBe('ch1-rule1');
      expect(rules[1].id).toBe('ch1-rule2');
    });
    
    test('应该包含之前章节的所有规则（规则累积性）', () => {
      engine.registerRule(createTestRule('ch1-rule', 1, RulePriority.STRUCTURE));
      engine.registerRule(createTestRule('ch2-rule', 2, RulePriority.VOICE_LEADING));
      engine.registerRule(createTestRule('ch3-rule', 3, RulePriority.CHORD));
      
      const rulesForChapter3 = engine.getRulesForChapter(3);
      
      expect(rulesForChapter3.length).toBe(3);
      expect(rulesForChapter3.map(r => r.id)).toContain('ch1-rule');
      expect(rulesForChapter3.map(r => r.id)).toContain('ch2-rule');
      expect(rulesForChapter3.map(r => r.id)).toContain('ch3-rule');
    });
    
    test('应该按优先级排序规则', () => {
      engine.registerRule(createTestRule('style', 1, RulePriority.STYLE));
      engine.registerRule(createTestRule('structure', 1, RulePriority.STRUCTURE));
      engine.registerRule(createTestRule('chord', 1, RulePriority.CHORD));
      engine.registerRule(createTestRule('voice', 1, RulePriority.VOICE_LEADING));
      
      const rules = engine.getRulesForChapter(1);
      
      expect(rules[0].id).toBe('structure');  // priority 100
      expect(rules[1].id).toBe('voice');      // priority 200
      expect(rules[2].id).toBe('chord');      // priority 300
      expect(rules[3].id).toBe('style');      // priority 400
    });
    
    test('空章节应该返回空数组', () => {
      const rules = engine.getRulesForChapter(10);
      expect(rules.length).toBe(0);
    });
  });
  
  describe('验证和弦进行', () => {
    test('没有规则时应该返回成功', () => {
      const progression = createTestProgression(2);
      const result = engine.validate(progression, 1);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
    
    test('空和弦进行应该返回成功', () => {
      engine.registerRule(createTestRule('test', 1, RulePriority.STRUCTURE));
      
      const progression: ChordProgression = {
        chords: [],
        key: 'C major',
      };
      
      const result = engine.validate(progression, 1);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
    
    test('单个和弦应该返回成功', () => {
      engine.registerRule(createTestRule('test', 1, RulePriority.STRUCTURE));
      
      const progression = createTestProgression(1);
      const result = engine.validate(progression, 1);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
    
    test('所有规则通过时应该返回成功', () => {
      engine.registerRule(createTestRule('test-1', 1, RulePriority.STRUCTURE, false));
      engine.registerRule(createTestRule('test-2', 1, RulePriority.VOICE_LEADING, false));
      
      const progression = createTestProgression(2);
      const result = engine.validate(progression, 1);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
    
    test('规则失败时应该返回错误', () => {
      engine.registerRule(createTestRule('test-fail', 1, RulePriority.STRUCTURE, true));
      
      const progression = createTestProgression(2);
      const result = engine.validate(progression, 1);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].ruleId).toBe('test-fail');
    });
    
    test('应该收集所有规则的错误', () => {
      engine.registerRule(createTestRule('fail-1', 1, RulePriority.STRUCTURE, true));
      engine.registerRule(createTestRule('fail-2', 1, RulePriority.VOICE_LEADING, true));
      
      const progression = createTestProgression(2);
      const result = engine.validate(progression, 1);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      
      const ruleIds = result.errors.map(e => e.ruleId);
      expect(ruleIds).toContain('fail-1');
      expect(ruleIds).toContain('fail-2');
    });
    
    test('应该按优先级排序错误', () => {
      engine.registerRule(createTestRule('style-fail', 1, RulePriority.STYLE, true));
      engine.registerRule(createTestRule('structure-fail', 1, RulePriority.STRUCTURE, true));
      engine.registerRule(createTestRule('chord-fail', 1, RulePriority.CHORD, true));
      
      const progression = createTestProgression(2);
      const result = engine.validate(progression, 1);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // 第一个错误应该是优先级最高的（数值最小）
      expect(result.errors[0].ruleId).toBe('structure-fail');
    });
    
    test('应该对每个和弦应用规则', () => {
      let callCount = 0;
      const countingRule: ValidationRule = {
        id: 'counting',
        name: 'Counting Rule',
        chapter: 1,
        priority: RulePriority.STRUCTURE,
        description: 'Counts validation calls',
        validate: () => {
          callCount++;
          return createSuccessResult();
        },
      };
      
      engine.registerRule(countingRule);
      
      const progression = createTestProgression(3);
      engine.validate(progression, 1);
      
      // 应该为每个和弦调用一次规则
      expect(callCount).toBe(3);
    });
  });
  
  describe('规则累积性验证', () => {
    test('章节2应该包含章节1的规则', () => {
      engine.registerRule(createTestRule('ch1', 1, RulePriority.STRUCTURE));
      engine.registerRule(createTestRule('ch2', 2, RulePriority.VOICE_LEADING));
      
      const rulesForChapter2 = engine.getRulesForChapter(2);
      
      expect(rulesForChapter2.length).toBe(2);
      expect(rulesForChapter2.map(r => r.id)).toContain('ch1');
      expect(rulesForChapter2.map(r => r.id)).toContain('ch2');
    });
    
    test('章节N应该包含章节1到N-1的所有规则', () => {
      for (let i = 1; i <= 5; i++) {
        engine.registerRule(createTestRule(`ch${i}`, i, RulePriority.STRUCTURE + i));
      }
      
      const rulesForChapter5 = engine.getRulesForChapter(5);
      
      expect(rulesForChapter5.length).toBe(5);
      for (let i = 1; i <= 5; i++) {
        expect(rulesForChapter5.map(r => r.id)).toContain(`ch${i}`);
      }
    });
    
    test('验证时应该应用累积的规则', () => {
      engine.registerRule(createTestRule('ch1-fail', 1, RulePriority.STRUCTURE, true));
      engine.registerRule(createTestRule('ch2-fail', 2, RulePriority.VOICE_LEADING, true));
      
      const progression = createTestProgression(2);
      const result = engine.validate(progression, 2);
      
      expect(result.isValid).toBe(false);
      
      const ruleIds = result.errors.map(e => e.ruleId);
      expect(ruleIds).toContain('ch1-fail');
      expect(ruleIds).toContain('ch2-fail');
    });
  });
  
  describe('辅助方法', () => {
    test('getRule 应该返回指定的规则', () => {
      const rule = createTestRule('test', 1, RulePriority.STRUCTURE);
      engine.registerRule(rule);
      
      expect(engine.getRule('test')).toBe(rule);
    });
    
    test('getRule 对不存在的规则应该返回undefined', () => {
      expect(engine.getRule('nonexistent')).toBeUndefined();
    });
    
    test('getAllRules 应该返回所有规则', () => {
      const rules = [
        createTestRule('test-1', 1, RulePriority.STRUCTURE),
        createTestRule('test-2', 2, RulePriority.VOICE_LEADING),
      ];
      
      engine.registerRules(rules);
      
      const allRules = engine.getAllRules();
      expect(allRules.length).toBe(2);
    });
    
    test('clearRules 应该清除所有规则', () => {
      engine.registerRule(createTestRule('test', 1, RulePriority.STRUCTURE));
      expect(engine.getRuleCount()).toBe(1);
      
      engine.clearRules();
      
      expect(engine.getRuleCount()).toBe(0);
      expect(engine.getRule('test')).toBeUndefined();
    });
    
    test('hasRulesForChapter 应该正确检测章节是否有规则', () => {
      engine.registerRule(createTestRule('test', 1, RulePriority.STRUCTURE));
      
      expect(engine.hasRulesForChapter(1)).toBe(true);
      expect(engine.hasRulesForChapter(2)).toBe(false);
    });
  });
});
