/**
 * 声部范围验证测试
 */

import { describe, it, expect } from 'vitest';
import {
  isNoteInVoiceRange,
  getVoiceRangeViolation,
  hasVoiceCrossing,
  validateChordVoiceRanges,
  findVoiceCrossings,
  VOICE_RANGES,
  getVoiceRangeDescription,
} from './voiceRanges';
import { Voice } from '../types/music';
import { createNote } from './musicUtils';

describe('isNoteInVoiceRange', () => {
  it('应该接受女高音范围内的音符', () => {
    const c4 = createNote('C', 4); // 女高音最低音
    const a5 = createNote('A', 5); // 女高音最高音
    const e5 = createNote('E', 5); // 女高音中间音
    
    expect(isNoteInVoiceRange(c4, Voice.Soprano)).toBe(true);
    expect(isNoteInVoiceRange(a5, Voice.Soprano)).toBe(true);
    expect(isNoteInVoiceRange(e5, Voice.Soprano)).toBe(true);
  });

  it('应该拒绝女高音范围外的音符', () => {
    const b3 = createNote('B', 3); // 低于女高音范围
    const b5 = createNote('B', 5); // 高于女高音范围
    
    expect(isNoteInVoiceRange(b3, Voice.Soprano)).toBe(false);
    expect(isNoteInVoiceRange(b5, Voice.Soprano)).toBe(false);
  });

  it('应该接受男低音范围内的音符', () => {
    const e2 = createNote('E', 2); // 男低音最低音
    const d4 = createNote('D', 4); // 男低音最高音
    const a3 = createNote('A', 3); // 男低音中间音
    
    expect(isNoteInVoiceRange(e2, Voice.Bass)).toBe(true);
    expect(isNoteInVoiceRange(d4, Voice.Bass)).toBe(true);
    expect(isNoteInVoiceRange(a3, Voice.Bass)).toBe(true);
  });
});

describe('getVoiceRangeViolation', () => {
  it('应该返回 null 对于范围内的音符', () => {
    const c4 = createNote('C', 4);
    expect(getVoiceRangeViolation(c4, Voice.Soprano)).toBeNull();
  });

  it('应该检测过低的音符', () => {
    const b3 = createNote('B', 3); // 低于女高音范围
    const violation = getVoiceRangeViolation(b3, Voice.Soprano);
    
    expect(violation).not.toBeNull();
    expect(violation?.direction).toBe('too_low');
    expect(violation?.semitones).toBeGreaterThan(0);
  });

  it('应该检测过高的音符', () => {
    const b5 = createNote('B', 5); // 高于女高音范围
    const violation = getVoiceRangeViolation(b5, Voice.Soprano);
    
    expect(violation).not.toBeNull();
    expect(violation?.direction).toBe('too_high');
    expect(violation?.semitones).toBeGreaterThan(0);
  });
});

describe('hasVoiceCrossing', () => {
  it('应该检测声部交叉', () => {
    // 女低音（Alto）高于女高音（Soprano）
    const altoNote = createNote('G', 4);
    const sopranoNote = createNote('E', 4);
    
    expect(hasVoiceCrossing(Voice.Alto, altoNote, Voice.Soprano, sopranoNote)).toBe(true);
  });

  it('应该接受正常的声部排列', () => {
    // 女高音高于女低音
    const sopranoNote = createNote('G', 4);
    const altoNote = createNote('E', 4);
    
    expect(hasVoiceCrossing(Voice.Alto, altoNote, Voice.Soprano, sopranoNote)).toBe(false);
  });

  it('应该检测同音高的声部（边界情况）', () => {
    // 两个声部同音高也算交叉
    const altoNote = createNote('G', 4);
    const sopranoNote = createNote('G', 4);
    
    expect(hasVoiceCrossing(Voice.Alto, altoNote, Voice.Soprano, sopranoNote)).toBe(true);
  });

  it('应该在参数顺序错误时抛出错误', () => {
    const note1 = createNote('C', 4);
    const note2 = createNote('E', 4);
    
    // Soprano (0) < Alto (1)，所以这个顺序是错的
    expect(() => hasVoiceCrossing(Voice.Soprano, note1, Voice.Alto, note2)).toThrow();
  });
});

describe('validateChordVoiceRanges', () => {
  it('应该接受所有声部都在范围内的和弦', () => {
    const notes = [
      createNote('G', 4),  // Soprano
      createNote('E', 4),  // Alto
      createNote('C', 4),  // Tenor
      createNote('C', 3),  // Bass
    ];
    
    const violations = validateChordVoiceRanges(notes);
    expect(violations).toHaveLength(0);
  });

  it('应该检测超出范围的声部', () => {
    const notes = [
      createNote('C', 6),  // Soprano - 过高
      createNote('E', 4),  // Alto - 正常
      createNote('C', 4),  // Tenor - 正常
      createNote('C', 1),  // Bass - 过低
    ];
    
    const violations = validateChordVoiceRanges(notes);
    expect(violations.length).toBeGreaterThan(0);
    
    // 检查是否包含女高音的违规
    const sopranoViolation = violations.find(v => v.voice === Voice.Soprano);
    expect(sopranoViolation).toBeDefined();
    expect(sopranoViolation?.violation.direction).toBe('too_high');
    
    // 检查是否包含男低音的违规
    const bassViolation = violations.find(v => v.voice === Voice.Bass);
    expect(bassViolation).toBeDefined();
    expect(bassViolation?.violation.direction).toBe('too_low');
  });

  it('应该在音符数量不是4时抛出错误', () => {
    const notes = [
      createNote('G', 4),
      createNote('E', 4),
    ];
    
    expect(() => validateChordVoiceRanges(notes)).toThrow('和弦必须包含恰好4个音符');
  });
});

describe('findVoiceCrossings', () => {
  it('应该检测多个声部交叉', () => {
    const notes = [
      createNote('C', 4),  // Soprano - 最低
      createNote('E', 4),  // Alto
      createNote('G', 4),  // Tenor
      createNote('C', 5),  // Bass - 最高（完全颠倒）
    ];
    
    const crossings = findVoiceCrossings(notes);
    expect(crossings.length).toBeGreaterThan(0);
  });

  it('应该接受正常排列的和弦', () => {
    const notes = [
      createNote('G', 4),  // Soprano - 最高
      createNote('E', 4),  // Alto
      createNote('C', 4),  // Tenor
      createNote('C', 3),  // Bass - 最低
    ];
    
    const crossings = findVoiceCrossings(notes);
    expect(crossings).toHaveLength(0);
  });

  it('应该在音符数量不是4时抛出错误', () => {
    const notes = [
      createNote('G', 4),
      createNote('E', 4),
    ];
    
    expect(() => findVoiceCrossings(notes)).toThrow('和弦必须包含恰好4个音符');
  });
});

describe('getVoiceRangeDescription', () => {
  it('应该返回声部范围的描述', () => {
    const desc = getVoiceRangeDescription(Voice.Soprano);
    expect(desc).toContain('女高音');
    expect(desc).toContain('C4');
    expect(desc).toContain('A5');
  });
});

describe('VOICE_RANGES', () => {
  it('应该定义所有四个声部的范围', () => {
    expect(VOICE_RANGES[Voice.Soprano]).toBeDefined();
    expect(VOICE_RANGES[Voice.Alto]).toBeDefined();
    expect(VOICE_RANGES[Voice.Tenor]).toBeDefined();
    expect(VOICE_RANGES[Voice.Bass]).toBeDefined();
  });

  it('声部范围应该按从高到低排列', () => {
    // Soprano 应该是最高的
    expect(VOICE_RANGES[Voice.Soprano].min).toBeGreaterThan(VOICE_RANGES[Voice.Alto].min);
    expect(VOICE_RANGES[Voice.Alto].min).toBeGreaterThan(VOICE_RANGES[Voice.Tenor].min);
    expect(VOICE_RANGES[Voice.Tenor].min).toBeGreaterThan(VOICE_RANGES[Voice.Bass].min);
  });
});
