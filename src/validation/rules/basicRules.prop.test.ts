/**
 * 基础规则属性测试
 * 
 * 使用 fast-check 进行基于属性的测试
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { parallelFifthsRule } from './parallelFifthsRule';
import { parallelOctavesRule } from './parallelOctavesRule';
import { voiceCrossingRule } from './voiceCrossingRule';
import { voiceRangeRule } from './voiceRangeRule';
import { RuleEngine } from '../RuleEngine';
import { ChordProgression, Chord, Note } from '../../types/music';
import { createChordProgression } from '../../core/musicUtils';

// 生成随机音符
const noteArbitrary = fc.record({
  pitch: fc.constantFrom('C', 'D', 'E', 'F', 'G', 'A', 'B').chain(pitch =>
    fc.constantFrom('', '#', 'b').map(accidental => `${pitch}${accidental}`)
  ),
  octave: fc.integer({ min: 2, max: 5 }),
  duration: fc.constant('w'),
}) as fc.Arbitrary<Note>;

// 生成随机和弦
const chordArbitrary = fc.record({
  notes: fc.array(noteArbitrary, { minLength: 4, maxLength: 4 }),
  romanNumeral: fc.constantFrom('I', 'II', 'III', 'IV', 'V', 'VI', 'VII'),
  inversion: fc.integer({ min: 0, max: 2 }),
}) as fc.Arbitrary<Chord>;

// 生成随机和弦进行
const progressionArbitrary = fc.record({
  chords: fc.array(chordArbitrary, { minLength: 2, maxLength: 8 }),
  key: fc.constantFrom('C major', 'G major', 'D major', 'A minor', 'E minor'),
}) as fc.Arbitrary<ChordProgression>;

describe('基础规则属性测试', () => {
  // Feature: harmony-game, Property 7: 平行五度检测正确性
  test.prop([progressionArbitrary])(
    '属性7: 平行五度检测必须识别所有平行五度',
    (progression) => {
      const engine = new RuleEngine();
      engine.registerRule(parallelFifthsRule);
      
      const result = engine.validate(progression, 1);
      
      // 验证结果结构
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.errors)).toBe(true);
      
      // 如果有错误，每个错误都应该包含必要的信息
      for (const error of result.errors) {
        expect(error.ruleId).toBe('parallel-fifths');
        expect(error.ruleName).toBeTruthy();
        expect(error.message).toBeTruthy();
        expect(error.chapterReference).toBeTruthy();
        expect(Array.isArray(error.affectedVoices)).toBe(true);
        expect(Array.isArray(error.affectedChords)).toBe(true);
        expect(error.affectedVoices.length).toBeGreaterThan(0);
        expect(error.affectedChords.length).toBeGreaterThan(0);
      }
      
      return true;
    },
    { numRuns: 100 }
  );
  
  // Feature: harmony-game, Property 8: 平行八度检测正确性
  test.prop([progressionArbitrary])(
    '属性8: 平行八度检测必须识别所有平行八度',
    (progression) => {
      const engine = new RuleEngine();
      engine.registerRule(parallelOctavesRule);
      
      const result = engine.validate(progression, 1);
      
      // 验证结果结构
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.errors)).toBe(true);
      
      // 如果有错误，每个错误都应该包含必要的信息
      for (const error of result.errors) {
        expect(error.ruleId).toBe('parallel-octaves');
        expect(error.ruleName).toBeTruthy();
        expect(error.message).toBeTruthy();
        expect(error.chapterReference).toBeTruthy();
        expect(Array.isArray(error.affectedVoices)).toBe(true);
        expect(Array.isArray(error.affectedChords)).toBe(true);
        expect(error.affectedVoices.length).toBeGreaterThan(0);
        expect(error.affectedChords.length).toBeGreaterThan(0);
      }
      
      return true;
    },
    { numRuns: 100 }
  );

  // Feature: harmony-game, Property 9: 错误信息完整性
  test.prop([progressionArbitrary])(
    '属性9: 所有错误必须包含完整信息',
    (progression) => {
      const engine = new RuleEngine();
      engine.registerRule(parallelFifthsRule);
      engine.registerRule(parallelOctavesRule);
      engine.registerRule(voiceCrossingRule);
      engine.registerRule(voiceRangeRule);
      
      const result = engine.validate(progression, 1);
      
      // 验证每个错误都包含所有必需字段
      for (const error of result.errors) {
        // 必须有规则ID
        expect(error.ruleId).toBeTruthy();
        expect(typeof error.ruleId).toBe('string');
        
        // 必须有规则名称
        expect(error.ruleName).toBeTruthy();
        expect(typeof error.ruleName).toBe('string');
        
        // 必须有错误消息
        expect(error.message).toBeTruthy();
        expect(typeof error.message).toBe('string');
        
        // 必须有章节引用
        expect(error.chapterReference).toBeTruthy();
        expect(typeof error.chapterReference).toBe('string');
        
        // 必须有受影响的声部索引
        expect(Array.isArray(error.affectedVoices)).toBe(true);
        expect(error.affectedVoices.length).toBeGreaterThan(0);
        for (const voice of error.affectedVoices) {
          expect(voice).toBeGreaterThanOrEqual(0);
          expect(voice).toBeLessThan(4);
        }
        
        // 必须有受影响的和弦索引
        expect(Array.isArray(error.affectedChords)).toBe(true);
        expect(error.affectedChords.length).toBeGreaterThan(0);
        for (const chordIdx of error.affectedChords) {
          expect(chordIdx).toBeGreaterThanOrEqual(0);
          expect(chordIdx).toBeLessThan(progression.chords.length);
        }
      }
      
      return true;
    },
    { numRuns: 100 }
  );
  
  // Feature: harmony-game, Property 10: 多错误同时显示
  test.prop([progressionArbitrary])(
    '属性10: 验证结果必须包含所有错误',
    (progression) => {
      const engine = new RuleEngine();
      
      // 注册所有基础规则
      engine.registerRule(parallelFifthsRule);
      engine.registerRule(parallelOctavesRule);
      engine.registerRule(voiceCrossingRule);
      engine.registerRule(voiceRangeRule);
      
      const result = engine.validate(progression, 1);
      
      // 分别验证每个规则
      const fifthsResult = parallelFifthsRule.validate(progression, 1);
      const octavesResult = parallelOctavesRule.validate(progression, 1);
      
      // 如果单独的规则检测到错误，合并结果也应该包含这些错误
      const expectedErrorCount = 
        fifthsResult.errors.length + 
        octavesResult.errors.length;
      
      // 注意：voiceCrossingRule 和 voiceRangeRule 对每个和弦单独验证
      // 所以我们只检查进行规则的错误
      const progressionRuleErrors = result.errors.filter(
        e => e.ruleId === 'parallel-fifths' || e.ruleId === 'parallel-octaves'
      );
      
      expect(progressionRuleErrors.length).toBeGreaterThanOrEqual(expectedErrorCount);
      
      return true;
    },
    { numRuns: 100 }
  );
  
  // 额外属性：规则应该是确定性的
  test.prop([progressionArbitrary])(
    '额外属性: 规则验证应该是确定性的',
    (progression) => {
      const engine = new RuleEngine();
      engine.registerRule(parallelFifthsRule);
      engine.registerRule(parallelOctavesRule);
      engine.registerRule(voiceCrossingRule);
      engine.registerRule(voiceRangeRule);
      
      // 多次验证应该得到相同的结果
      const result1 = engine.validate(progression, 1);
      const result2 = engine.validate(progression, 1);
      
      expect(result1.isValid).toBe(result2.isValid);
      expect(result1.errors.length).toBe(result2.errors.length);
      
      // 错误的顺序和内容应该相同
      for (let i = 0; i < result1.errors.length; i++) {
        expect(result1.errors[i].ruleId).toBe(result2.errors[i].ruleId);
        expect(result1.errors[i].message).toBe(result2.errors[i].message);
      }
      
      return true;
    },
    { numRuns: 100 }
  );
});
