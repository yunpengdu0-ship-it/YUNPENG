/**
 * 基础规则单元测试
 */

import { describe, test, expect } from 'vitest';
import { parallelFifthsRule } from './parallelFifthsRule';
import { parallelOctavesRule } from './parallelOctavesRule';
import { voiceCrossingRule } from './voiceCrossingRule';
import { voiceRangeRule } from './voiceRangeRule';
import { createChordProgression } from '../../core/musicUtils';
import { Chord } from '../../types/music';

describe('基础和声规则', () => {
  describe('平行五度检测规则', () => {
    test('应该检测到平行五度', () => {
      // C4→D4 和 G4→A4 形成平行五度
      const progression = createChordProgression([
        {
          notes: [
            { pitch: 'G', octave: 4, duration: 'w' },
            { pitch: 'E', octave: 4, duration: 'w' },
            { pitch: 'C', octave: 4, duration: 'w' },
            { pitch: 'C', octave: 3, duration: 'w' },
          ],
          romanNumeral: 'I',
          inversion: 0,
        },
        {
          notes: [
            { pitch: 'A', octave: 4, duration: 'w' },  // G4→A4
            { pitch: 'F', octave: 4, duration: 'w' },
            { pitch: 'D', octave: 4, duration: 'w' },  // C4→D4 (平行五度)
            { pitch: 'D', octave: 3, duration: 'w' },
          ],
          romanNumeral: 'V',
          inversion: 0,
        },
      ], 'C major');
      
      const result = parallelFifthsRule.validate(progression, 1);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].ruleId).toBe('parallel-fifths');
    });
    
    test('应该对没有平行五度的进行返回成功', () => {
      const progression = createChordProgression([
        {
          notes: [
            { pitch: 'G', octave: 4, duration: 'w' },
            { pitch: 'E', octave: 4, duration: 'w' },
            { pitch: 'C', octave: 4, duration: 'w' },
            { pitch: 'C', octave: 3, duration: 'w' },
          ],
          romanNumeral: 'I',
          inversion: 0,
        },
        {
          notes: [
            { pitch: 'A', octave: 4, duration: 'w' },
            { pitch: 'F', octave: 4, duration: 'w' },
            { pitch: 'C', octave: 4, duration: 'w' },
            { pitch: 'F', octave: 3, duration: 'w' },
          ],
          romanNumeral: 'IV',
          inversion: 0,
        },
      ], 'C major');
      
      const result = parallelFifthsRule.validate(progression, 1);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('应该对第一个和弦返回成功', () => {
      const progression = createChordProgression([
        {
          notes: [
            { pitch: 'G', octave: 4, duration: 'w' },
            { pitch: 'E', octave: 4, duration: 'w' },
            { pitch: 'C', octave: 4, duration: 'w' },
            { pitch: 'C', octave: 3, duration: 'w' },
          ],
          romanNumeral: 'I',
          inversion: 0,
        },
      ], 'C major');
      
      const result = parallelFifthsRule.validate(progression, 0);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('平行八度检测规则', () => {
    test('应该检测到平行八度', () => {
      // C3→D3 和 C4→D4 形成平行八度
      const progression = createChordProgression([
        {
          notes: [
            { pitch: 'G', octave: 4, duration: 'w' },
            { pitch: 'E', octave: 4, duration: 'w' },
            { pitch: 'C', octave: 4, duration: 'w' },
            { pitch: 'C', octave: 3, duration: 'w' },
          ],
          romanNumeral: 'I',
          inversion: 0,
        },
        {
          notes: [
            { pitch: 'A', octave: 4, duration: 'w' },
            { pitch: 'F', octave: 4, duration: 'w' },
            { pitch: 'D', octave: 4, duration: 'w' },  // C4→D4
            { pitch: 'D', octave: 3, duration: 'w' },  // C3→D3 (平行八度)
          ],
          romanNumeral: 'V',
          inversion: 0,
        },
      ], 'C major');
      
      const result = parallelOctavesRule.validate(progression, 1);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].ruleId).toBe('parallel-octaves');
    });
    
    test('应该对没有平行八度的进行返回成功', () => {
      const progression = createChordProgression([
        {
          notes: [
            { pitch: 'G', octave: 4, duration: 'w' },
            { pitch: 'E', octave: 4, duration: 'w' },
            { pitch: 'C', octave: 4, duration: 'w' },
            { pitch: 'C', octave: 3, duration: 'w' },
          ],
          romanNumeral: 'I',
          inversion: 0,
        },
        {
          notes: [
            { pitch: 'A', octave: 4, duration: 'w' },
            { pitch: 'F', octave: 4, duration: 'w' },
            { pitch: 'C', octave: 4, duration: 'w' },
            { pitch: 'F', octave: 3, duration: 'w' },
          ],
          romanNumeral: 'IV',
          inversion: 0,
        },
      ], 'C major');
      
      const result = parallelOctavesRule.validate(progression, 1);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
  
  describe('声部交叉检测规则', () => {
    test('应该检测到声部交叉', () => {
      // 女低音高于女高音
      const progression = createChordProgression([
        {
          notes: [
            { pitch: 'E', octave: 4, duration: 'w' },  // 女高音
            { pitch: 'G', octave: 4, duration: 'w' },  // 女低音（高于女高音！）
            { pitch: 'C', octave: 4, duration: 'w' },  // 男高音
            { pitch: 'C', octave: 3, duration: 'w' },  // 男低音
          ],
          romanNumeral: 'I',
          inversion: 0,
        },
      ], 'C major');
      
      const result = voiceCrossingRule.validate(progression, 0);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].ruleId).toBe('voice-crossing');
    });
    
    test('应该对没有声部交叉的和弦返回成功', () => {
      const progression = createChordProgression([
        {
          notes: [
            { pitch: 'G', octave: 4, duration: 'w' },  // 女高音
            { pitch: 'E', octave: 4, duration: 'w' },  // 女低音
            { pitch: 'C', octave: 4, duration: 'w' },  // 男高音
            { pitch: 'C', octave: 3, duration: 'w' },  // 男低音
          ],
          romanNumeral: 'I',
          inversion: 0,
        },
      ], 'C major');
      
      const result = voiceCrossingRule.validate(progression, 0);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('声部音域检测规则', () => {
    test('应该检测到超出音域的音符', () => {
      // 女高音超出范围（太高）
      const progression = createChordProgression([
        {
          notes: [
            { pitch: 'C', octave: 6, duration: 'w' },  // 女高音（超出范围）
            { pitch: 'E', octave: 4, duration: 'w' },  // 女低音
            { pitch: 'C', octave: 4, duration: 'w' },  // 男高音
            { pitch: 'C', octave: 3, duration: 'w' },  // 男低音
          ],
          romanNumeral: 'I',
          inversion: 0,
        },
      ], 'C major');
      
      const result = voiceRangeRule.validate(progression, 0);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].ruleId).toBe('voice-range');
    });
    
    test('应该对音域内的音符返回成功', () => {
      const progression = createChordProgression([
        {
          notes: [
            { pitch: 'G', octave: 4, duration: 'w' },  // 女高音（C4-A5范围内）
            { pitch: 'E', octave: 4, duration: 'w' },  // 女低音（G3-E5范围内）
            { pitch: 'C', octave: 4, duration: 'w' },  // 男高音（C3-G4范围内）
            { pitch: 'C', octave: 3, duration: 'w' },  // 男低音（E2-D4范围内）
          ],
          romanNumeral: 'I',
          inversion: 0,
        },
      ], 'C major');
      
      const result = voiceRangeRule.validate(progression, 0);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('应该检测到男低音超出范围（太低）', () => {
      const progression = createChordProgression([
        {
          notes: [
            { pitch: 'G', octave: 4, duration: 'w' },
            { pitch: 'E', octave: 4, duration: 'w' },
            { pitch: 'C', octave: 4, duration: 'w' },
            { pitch: 'C', octave: 2, duration: 'w' },  // 男低音（太低）
          ],
          romanNumeral: 'I',
          inversion: 0,
        },
      ], 'C major');
      
      const result = voiceRangeRule.validate(progression, 0);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0].ruleId).toBe('voice-range');
    });
  });
  
  describe('规则元数据', () => {
    test('所有规则应该有正确的元数据', () => {
      const rules = [
        parallelFifthsRule,
        parallelOctavesRule,
        voiceCrossingRule,
        voiceRangeRule,
      ];
      
      for (const rule of rules) {
        expect(rule.id).toBeTruthy();
        expect(rule.name).toBeTruthy();
        expect(rule.chapter).toBeGreaterThan(0);
        expect(rule.priority).toBeGreaterThan(0);
        expect(rule.description).toBeTruthy();
        expect(typeof rule.validate).toBe('function');
      }
    });
    
    test('结构规则应该有更高的优先级（更小的数值）', () => {
      // 结构规则（声部范围、声部交叉）应该优先于进行规则（平行五八度）
      expect(voiceRangeRule.priority).toBeLessThan(parallelFifthsRule.priority);
      expect(voiceCrossingRule.priority).toBeLessThan(parallelFifthsRule.priority);
      expect(voiceRangeRule.priority).toBeLessThan(parallelOctavesRule.priority);
      expect(voiceCrossingRule.priority).toBeLessThan(parallelOctavesRule.priority);
    });
  });
});
