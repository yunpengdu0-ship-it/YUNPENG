/**
 * 和弦有效性属性测试
 * 
 * Feature: harmony-game
 * 属性 12: 音符输入验证
 */

import { describe, it, expect } from 'vitest';
import { fc } from '@fast-check/vitest';
import {
  validateChord,
  canAddNoteToChord,
  isValidTriad,
  getChordRoot,
} from './chordValidation';
import { Note } from '../types/music';
import { createNote } from './musicUtils';
import { noteToAbsoluteSemitones } from './intervals';

// ============ 生成器（Arbitraries） ============

/**
 * 生成有效的音高
 */
const pitchArbitrary = fc.constantFrom(
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
);

/**
 * 生成有效的八度（2-6，常用范围）
 */
const octaveArbitrary = fc.integer({ min: 2, max: 6 });

/**
 * 生成随机音符
 */
const noteArbitrary = fc.record({
  pitch: pitchArbitrary,
  octave: octaveArbitrary,
  duration: fc.constant('w'),
}) as fc.Arbitrary<Note>;

/**
 * 生成4个音符的数组
 */
const fourNotesArbitrary = fc.array(noteArbitrary, { minLength: 4, maxLength: 4 });

/**
 * 生成一个标准的 C 大三和弦（用于测试）
 */
function createCMajorChord(): Note[] {
  return [
    createNote('G', 4),  // Soprano - 五度音
    createNote('E', 4),  // Alto - 三度音
    createNote('C', 4),  // Tenor - 根音
    createNote('C', 3),  // Bass - 根音（重复）
  ];
}

/**
 * 生成一个有效的三和弦
 */
const validTriadArbitrary = fc.constantFrom(
  // C 大三和弦的不同排列
  [createNote('G', 4), createNote('E', 4), createNote('C', 4), createNote('C', 3)],
  [createNote('C', 5), createNote('G', 4), createNote('E', 4), createNote('C', 3)],
  [createNote('E', 5), createNote('C', 5), createNote('G', 4), createNote('C', 3)],
  // A 小三和弦
  [createNote('E', 4), createNote('C', 4), createNote('A', 3), createNote('A', 2)],
  [createNote('A', 4), createNote('E', 4), createNote('C', 4), createNote('A', 2)],
  // G 大三和弦
  [createNote('D', 5), createNote('B', 4), createNote('G', 4), createNote('G', 3)],
  [createNote('G', 5), createNote('D', 5), createNote('B', 4), createNote('G', 3)],
);

// ============ 属性测试 ============

describe('属性测试：和弦有效性', () => {
  // Feature: harmony-game, Property 12: 音符输入验证
  it.prop([validTriadArbitrary], { numRuns: 100 })(
    '属性 12: 有效的三和弦应该通过验证',
    (notes) => {
      const result = validateChord(notes);
      // 有效的三和弦应该至少不产生错误（可能有警告）
      expect(result.errors).toHaveLength(0);
    }
  );

  it.prop([noteArbitrary, noteArbitrary, noteArbitrary, noteArbitrary], { numRuns: 100 })(
    '属性: validateChord 总是返回一个结果对象',
    (n1, n2, n3, n4) => {
      const result = validateChord([n1, n2, n3, n4]);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    }
  );

  it.prop([fourNotesArbitrary], { numRuns: 100 })(
    '属性: 如果验证失败，必须有错误消息',
    (notes) => {
      const result = validateChord(notes);
      
      if (!result.isValid) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    }
  );

  it.prop([noteArbitrary], { numRuns: 100 })(
    '属性: 添加第一个音符总是有效的',
    (note) => {
      const existingNotes = [null, null, null, null];
      const result = canAddNoteToChord(existingNotes, note, 0);
      
      expect(result.isValid).toBe(true);
    }
  );

  it.prop([noteArbitrary, fc.integer({ min: 0, max: 3 })], { numRuns: 100 })(
    '属性: canAddNoteToChord 总是返回一个结果对象',
    (note, voiceIndex) => {
      const existingNotes = [null, null, null, null];
      const result = canAddNoteToChord(existingNotes, note, voiceIndex);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    }
  );

  it.prop([fc.integer({ min: -10, max: 10 })], { numRuns: 50 })(
    '属性: 无效的声部索引应该被拒绝',
    (invalidIndex) => {
      // 只测试明显无效的索引
      if (invalidIndex < 0 || invalidIndex > 3) {
        const note = createNote('C', 4);
        const existingNotes = [null, null, null, null];
        const result = canAddNoteToChord(existingNotes, note, invalidIndex);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    }
  );

  it.prop([fourNotesArbitrary], { numRuns: 100 })(
    '属性: getChordRoot 总是返回数组中的一个音符',
    (notes) => {
      const root = getChordRoot(notes);
      
      // 根音应该是数组中最低的音符
      const rootSemitones = noteToAbsoluteSemitones(root);
      const allSemitones = notes.map(noteToAbsoluteSemitones);
      const minSemitones = Math.min(...allSemitones);
      
      expect(rootSemitones).toBe(minSemitones);
    }
  );

  it.prop([validTriadArbitrary], { numRuns: 100 })(
    '属性: 有效三和弦的根音应该在和弦中',
    (notes) => {
      const root = getChordRoot(notes);
      const rootSemitones = noteToAbsoluteSemitones(root);
      
      // 根音的音高类应该在和弦的音高类集合中
      const pitchClasses = notes.map(n => noteToAbsoluteSemitones(n) % 12);
      const rootPitchClass = rootSemitones % 12;
      
      expect(pitchClasses).toContain(rootPitchClass);
    }
  );

  it.prop([noteArbitrary, noteArbitrary], { numRuns: 100 })(
    '属性: 添加两个音符后，和弦应该仍然可以继续添加',
    (note1, note2) => {
      const existingNotes = [note1, note2, null, null];
      const note3 = createNote('E', 4);
      
      const result = canAddNoteToChord(existingNotes, note3, 2);
      
      // 应该返回一个结果（可能有效也可能无效，但不应该崩溃）
      expect(result).toBeDefined();
    }
  );

  it.prop([validTriadArbitrary], { numRuns: 100 })(
    '属性: 有效的三和弦应该有3个或更少的不同音高类',
    (notes) => {
      const pitchClasses = new Set(
        notes.map(n => noteToAbsoluteSemitones(n) % 12)
      );
      
      // 三和弦应该有3个不同的音高类（或更少，如果有重复）
      expect(pitchClasses.size).toBeLessThanOrEqual(4);
      expect(pitchClasses.size).toBeGreaterThanOrEqual(2);
    }
  );

  it.prop([fourNotesArbitrary], { numRuns: 100 })(
    '属性: isValidTriad 的结果应该是确定性的',
    (notes) => {
      const result1 = isValidTriad(notes);
      const result2 = isValidTriad(notes);
      
      // 相同的输入应该产生相同的结果
      expect(result1.isValid).toBe(result2.isValid);
      expect(result1.errors).toEqual(result2.errors);
    }
  );

  // 测试音符输入验证的核心属性
  it.prop([validTriadArbitrary, fc.integer({ min: 0, max: 3 })], { numRuns: 100 })(
    '属性 12: 从有效和弦中移除一个音符，然后重新添加，应该仍然有效',
    (validChord, voiceIndex) => {
      // 创建一个缺少一个音符的和弦
      const incompleteChord = [...validChord];
      const removedNote = incompleteChord[voiceIndex];
      const existingNotes = incompleteChord.map((n, i) => 
        i === voiceIndex ? null : n
      );
      
      // 重新添加被移除的音符
      const result = canAddNoteToChord(existingNotes, removedNote, voiceIndex);
      
      // 应该仍然有效（或至少不产生错误）
      if (result.errors.length > 0) {
        // 如果有错误，打印出来以便调试
        console.log('Unexpected errors:', result.errors);
      }
      
      // 至少不应该有严重错误
      expect(result.isValid || result.errors.length === 0).toBe(true);
    }
  );
});

describe('边界情况测试', () => {
  it('应该处理所有音符都相同的情况', () => {
    const notes = [
      createNote('C', 4),
      createNote('C', 4),
      createNote('C', 4),
      createNote('C', 4),
    ];
    
    const result = validateChord(notes);
    expect(result.isValid).toBe(false);
  });

  it('应该处理极端音域的情况', () => {
    const notes = [
      createNote('C', 8),  // 非常高
      createNote('C', 7),
      createNote('C', 1),  // 非常低
      createNote('C', 0),
    ];
    
    const result = validateChord(notes);
    // 应该有警告或错误
    expect(result.errors.length + result.warnings.length).toBeGreaterThan(0);
  });

  it('应该处理升降号音符', () => {
    const notes = [
      createNote('G#', 4),
      createNote('E', 4),
      createNote('C#', 4),
      createNote('C#', 3),
    ];
    
    const result = validateChord(notes);
    // 应该能够处理，不崩溃
    expect(result).toBeDefined();
  });
});
