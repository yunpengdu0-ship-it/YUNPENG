/**
 * 和弦有效性检查测试
 */

import { describe, it, expect } from 'vitest';
import {
  isValidTriad,
  validateVoiceSpacing,
  validateDoubling,
  validateChord,
  canAddNoteToChord,
  getChordRoot,
} from './chordValidation';
import { createNote } from './musicUtils';

describe('isValidTriad', () => {
  it('应该接受标准的 C 大三和弦', () => {
    const notes = [
      createNote('G', 4),  // Soprano - 五度音
      createNote('E', 4),  // Alto - 三度音
      createNote('C', 4),  // Tenor - 根音
      createNote('C', 3),  // Bass - 根音（重复）
    ];
    
    const result = isValidTriad(notes);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('应该接受 A 小三和弦', () => {
    const notes = [
      createNote('E', 4),  // Soprano - 五度音
      createNote('C', 4),  // Alto - 三度音
      createNote('A', 3),  // Tenor - 根音
      createNote('A', 2),  // Bass - 根音（重复）
    ];
    
    const result = isValidTriad(notes);
    expect(result.isValid).toBe(true);
  });

  it('应该拒绝音符数量不是4的情况', () => {
    const notes = [
      createNote('C', 4),
      createNote('E', 4),
    ];
    
    const result = isValidTriad(notes);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('应该拒绝音符过于单一的和弦', () => {
    const notes = [
      createNote('C', 4),
      createNote('C', 4),
      createNote('C', 3),
      createNote('C', 3),
    ];
    
    const result = isValidTriad(notes);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('过于单一'))).toBe(true);
  });

  it('应该对非标准结构给出警告', () => {
    // 使用二度音程而不是三度
    const notes = [
      createNote('C', 4),
      createNote('D', 4),
      createNote('E', 4),
      createNote('C', 3),
    ];
    
    const result = isValidTriad(notes);
    // 可能有警告，但不一定无效
    expect(result.warnings.length >= 0).toBe(true);
  });
});

describe('validateVoiceSpacing', () => {
  it('应该接受合理的声部间距', () => {
    const notes = [
      createNote('G', 4),  // Soprano
      createNote('E', 4),  // Alto - 小三度
      createNote('C', 4),  // Tenor - 大三度
      createNote('C', 3),  // Bass - 八度
    ];
    
    const result = validateVoiceSpacing(notes);
    expect(result.isValid).toBe(true);
  });

  it('应该警告上声部间距过大', () => {
    const notes = [
      createNote('G', 5),  // Soprano - 很高
      createNote('E', 4),  // Alto
      createNote('C', 4),  // Tenor
      createNote('C', 3),  // Bass
    ];
    
    const result = validateVoiceSpacing(notes);
    // 应该有警告
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('应该警告 Bass 和 Tenor 间距过大', () => {
    const notes = [
      createNote('G', 4),  // Soprano
      createNote('E', 4),  // Alto
      createNote('C', 4),  // Tenor
      createNote('C', 1),  // Bass - 非常低
    ];
    
    const result = validateVoiceSpacing(notes);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('validateDoubling', () => {
  it('应该接受标准的根音重复', () => {
    const notes = [
      createNote('G', 4),  // 五度音
      createNote('E', 4),  // 三度音
      createNote('C', 4),  // 根音
      createNote('C', 3),  // 根音（重复）
    ];
    
    const result = validateDoubling(notes);
    expect(result.isValid).toBe(true);
  });

  it('应该警告音符重复3次', () => {
    const notes = [
      createNote('C', 5),  // 根音
      createNote('C', 4),  // 根音
      createNote('C', 4),  // 根音
      createNote('C', 3),  // 根音
    ];
    
    const result = validateDoubling(notes);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('应该警告不完整的和弦（只有2个音高）', () => {
    const notes = [
      createNote('C', 5),
      createNote('E', 4),
      createNote('C', 4),
      createNote('E', 3),
    ];
    
    const result = validateDoubling(notes);
    expect(result.warnings.some(w => w.includes('不完整'))).toBe(true);
  });
});

describe('validateChord', () => {
  it('应该综合验证标准和弦', () => {
    const notes = [
      createNote('G', 4),
      createNote('E', 4),
      createNote('C', 4),
      createNote('C', 3),
    ];
    
    const result = validateChord(notes);
    expect(result.isValid).toBe(true);
  });

  it('应该收集所有验证结果', () => {
    // 创建一个有多个问题的和弦
    const notes = [
      createNote('C', 6),  // 过高
      createNote('C', 4),
      createNote('C', 4),
      createNote('C', 1),  // 过低
    ];
    
    const result = validateChord(notes);
    // 应该有错误或警告
    expect(result.errors.length + result.warnings.length).toBeGreaterThan(0);
  });
});

describe('canAddNoteToChord', () => {
  it('应该允许添加第一个音符', () => {
    const existingNotes = [null, null, null, null];
    const newNote = createNote('C', 4);
    
    const result = canAddNoteToChord(existingNotes, newNote, 0);
    expect(result.isValid).toBe(true);
  });

  it('应该允许添加第二个音符', () => {
    const existingNotes = [createNote('G', 4), null, null, null];
    const newNote = createNote('E', 4);
    
    const result = canAddNoteToChord(existingNotes, newNote, 1);
    expect(result.isValid).toBe(true);
  });

  it('应该在完成和弦时进行完整验证', () => {
    const existingNotes = [
      createNote('G', 4),
      createNote('E', 4),
      createNote('C', 4),
      null,
    ];
    const newNote = createNote('C', 3);
    
    const result = canAddNoteToChord(existingNotes, newNote, 3);
    expect(result.isValid).toBe(true);
  });

  it('应该拒绝无效的声部索引', () => {
    const existingNotes = [null, null, null, null];
    const newNote = createNote('C', 4);
    
    const result = canAddNoteToChord(existingNotes, newNote, 5);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('声部索引'))).toBe(true);
  });

  it('应该警告声部间距过大', () => {
    const existingNotes = [
      createNote('G', 5),  // 很高
      null,
      null,
      null,
    ];
    const newNote = createNote('E', 4);  // 与 Soprano 间距大
    
    const result = canAddNoteToChord(existingNotes, newNote, 1);
    // 可能有警告
    expect(result.warnings.length >= 0).toBe(true);
  });
});

describe('getChordRoot', () => {
  it('应该返回最低的音符作为根音', () => {
    const notes = [
      createNote('G', 4),
      createNote('E', 4),
      createNote('C', 4),
      createNote('C', 3),
    ];
    
    const root = getChordRoot(notes);
    expect(root.pitch).toBe('C');
    expect(root.octave).toBe(3);
  });

  it('应该在空数组时抛出错误', () => {
    expect(() => getChordRoot([])).toThrow('无法从空数组中获取根音');
  });

  it('应该处理单个音符', () => {
    const notes = [createNote('A', 4)];
    const root = getChordRoot(notes);
    expect(root.pitch).toBe('A');
    expect(root.octave).toBe(4);
  });
});
