/**
 * 音乐工具函数单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  createNote,
  createChord,
  createChordProgression,
  cloneNote,
  cloneChord,
  cloneChordProgression,
  notesEqual,
  chordsEqual,
  progressionsEqual,
} from './musicUtils';
import { Note, Chord, ChordProgression } from '../types/music';

describe('createNote', () => {
  it('应该创建一个有效的音符', () => {
    const note = createNote('C', 4, 'q');
    expect(note.pitch).toBe('C');
    expect(note.octave).toBe(4);
    expect(note.duration).toBe('q');
  });

  it('应该使用默认时值', () => {
    const note = createNote('D', 5);
    expect(note.duration).toBe('w');
  });
});

describe('createChord', () => {
  it('应该创建一个有效的和弦', () => {
    const notes: Note[] = [
      createNote('G', 4),
      createNote('E', 4),
      createNote('C', 4),
      createNote('C', 3),
    ];
    const chord = createChord(notes, 'I', 0);
    
    expect(chord.notes).toHaveLength(4);
    expect(chord.romanNumeral).toBe('I');
    expect(chord.inversion).toBe(0);
  });

  it('应该在音符数量不是4时抛出错误', () => {
    const notes: Note[] = [
      createNote('C', 4),
      createNote('E', 4),
    ];
    
    expect(() => createChord(notes, 'I')).toThrow('和弦必须包含恰好4个音符');
  });

  it('应该使用默认转位', () => {
    const notes: Note[] = [
      createNote('G', 4),
      createNote('E', 4),
      createNote('C', 4),
      createNote('C', 3),
    ];
    const chord = createChord(notes, 'I');
    expect(chord.inversion).toBe(0);
  });
});

describe('createChordProgression', () => {
  it('应该创建一个有效的和弦进行', () => {
    const chord1 = createChord([
      createNote('G', 4),
      createNote('E', 4),
      createNote('C', 4),
      createNote('C', 3),
    ], 'I');
    
    const chord2 = createChord([
      createNote('G', 4),
      createNote('D', 4),
      createNote('B', 3),
      createNote('G', 2),
    ], 'V');
    
    const progression = createChordProgression([chord1, chord2], 'C major');
    
    expect(progression.chords).toHaveLength(2);
    expect(progression.key).toBe('C major');
  });

  it('应该在和弦数组为空时抛出错误', () => {
    expect(() => createChordProgression([], 'C major')).toThrow('和弦进行必须至少包含一个和弦');
  });
});

describe('cloneNote', () => {
  it('应该创建音符的深拷贝', () => {
    const original = createNote('C', 4, 'q');
    const cloned = cloneNote(original);
    
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
  });

  it('修改克隆不应影响原始对象', () => {
    const original = createNote('C', 4, 'q');
    const cloned = cloneNote(original);
    
    cloned.pitch = 'D';
    expect(original.pitch).toBe('C');
  });
});

describe('cloneChord', () => {
  it('应该创建和弦的深拷贝', () => {
    const original = createChord([
      createNote('G', 4),
      createNote('E', 4),
      createNote('C', 4),
      createNote('C', 3),
    ], 'I');
    
    const cloned = cloneChord(original);
    
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.notes).not.toBe(original.notes);
  });

  it('修改克隆的音符不应影响原始和弦', () => {
    const original = createChord([
      createNote('G', 4),
      createNote('E', 4),
      createNote('C', 4),
      createNote('C', 3),
    ], 'I');
    
    const cloned = cloneChord(original);
    cloned.notes[0].pitch = 'A';
    
    expect(original.notes[0].pitch).toBe('G');
  });
});

describe('cloneChordProgression', () => {
  it('应该创建和弦进行的深拷贝', () => {
    const chord = createChord([
      createNote('G', 4),
      createNote('E', 4),
      createNote('C', 4),
      createNote('C', 3),
    ], 'I');
    
    const original = createChordProgression([chord], 'C major');
    const cloned = cloneChordProgression(original);
    
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.chords).not.toBe(original.chords);
  });
});

describe('notesEqual', () => {
  it('应该识别相等的音符', () => {
    const note1 = createNote('C', 4, 'q');
    const note2 = createNote('C', 4, 'q');
    
    expect(notesEqual(note1, note2)).toBe(true);
  });

  it('应该识别不同音高的音符', () => {
    const note1 = createNote('C', 4, 'q');
    const note2 = createNote('D', 4, 'q');
    
    expect(notesEqual(note1, note2)).toBe(false);
  });

  it('应该识别不同八度的音符', () => {
    const note1 = createNote('C', 4, 'q');
    const note2 = createNote('C', 5, 'q');
    
    expect(notesEqual(note1, note2)).toBe(false);
  });

  it('应该识别不同时值的音符', () => {
    const note1 = createNote('C', 4, 'q');
    const note2 = createNote('C', 4, 'h');
    
    expect(notesEqual(note1, note2)).toBe(false);
  });
});

describe('chordsEqual', () => {
  it('应该识别相等的和弦', () => {
    const chord1 = createChord([
      createNote('G', 4),
      createNote('E', 4),
      createNote('C', 4),
      createNote('C', 3),
    ], 'I');
    
    const chord2 = createChord([
      createNote('G', 4),
      createNote('E', 4),
      createNote('C', 4),
      createNote('C', 3),
    ], 'I');
    
    expect(chordsEqual(chord1, chord2)).toBe(true);
  });

  it('应该识别不同罗马数字的和弦', () => {
    const chord1 = createChord([
      createNote('G', 4),
      createNote('E', 4),
      createNote('C', 4),
      createNote('C', 3),
    ], 'I');
    
    const chord2 = createChord([
      createNote('G', 4),
      createNote('E', 4),
      createNote('C', 4),
      createNote('C', 3),
    ], 'V');
    
    expect(chordsEqual(chord1, chord2)).toBe(false);
  });

  it('应该识别不同音符的和弦', () => {
    const chord1 = createChord([
      createNote('G', 4),
      createNote('E', 4),
      createNote('C', 4),
      createNote('C', 3),
    ], 'I');
    
    const chord2 = createChord([
      createNote('A', 4),
      createNote('E', 4),
      createNote('C', 4),
      createNote('C', 3),
    ], 'I');
    
    expect(chordsEqual(chord1, chord2)).toBe(false);
  });
});

describe('progressionsEqual', () => {
  it('应该识别相等的和弦进行', () => {
    const chord = createChord([
      createNote('G', 4),
      createNote('E', 4),
      createNote('C', 4),
      createNote('C', 3),
    ], 'I');
    
    const prog1 = createChordProgression([chord], 'C major');
    const prog2 = createChordProgression([chord], 'C major');
    
    expect(progressionsEqual(prog1, prog2)).toBe(true);
  });

  it('应该识别不同调性的和弦进行', () => {
    const chord = createChord([
      createNote('G', 4),
      createNote('E', 4),
      createNote('C', 4),
      createNote('C', 3),
    ], 'I');
    
    const prog1 = createChordProgression([chord], 'C major');
    const prog2 = createChordProgression([chord], 'G major');
    
    expect(progressionsEqual(prog1, prog2)).toBe(false);
  });

  it('应该识别不同长度的和弦进行', () => {
    const chord1 = createChord([
      createNote('G', 4),
      createNote('E', 4),
      createNote('C', 4),
      createNote('C', 3),
    ], 'I');
    
    const chord2 = createChord([
      createNote('G', 4),
      createNote('D', 4),
      createNote('B', 3),
      createNote('G', 2),
    ], 'V');
    
    const prog1 = createChordProgression([chord1], 'C major');
    const prog2 = createChordProgression([chord1, chord2], 'C major');
    
    expect(progressionsEqual(prog1, prog2)).toBe(false);
  });
});
