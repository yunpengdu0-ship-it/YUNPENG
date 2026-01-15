/**
 * 音乐理论工具函数
 * 
 * 提供创建和操作音乐数据类型的辅助函数
 */

import { Note, Chord, ChordProgression } from '../types/music';

/**
 * 创建一个音符
 */
export function createNote(pitch: string, octave: number, duration: string = 'w'): Note {
  return { pitch, octave, duration };
}

/**
 * 创建一个和弦
 */
export function createChord(
  notes: Note[],
  romanNumeral: string,
  inversion: number = 0
): Chord {
  if (notes.length !== 4) {
    throw new Error('和弦必须包含恰好4个音符（四个声部）');
  }
  return { notes, romanNumeral, inversion };
}

/**
 * 创建一个和弦进行
 */
export function createChordProgression(
  chords: Chord[],
  key: string
): ChordProgression {
  if (chords.length === 0) {
    throw new Error('和弦进行必须至少包含一个和弦');
  }
  return { chords, key };
}

/**
 * 复制一个音符
 */
export function cloneNote(note: Note): Note {
  return { ...note };
}

/**
 * 复制一个和弦
 */
export function cloneChord(chord: Chord): Chord {
  return {
    ...chord,
    notes: chord.notes.map(cloneNote),
  };
}

/**
 * 复制一个和弦进行
 */
export function cloneChordProgression(progression: ChordProgression): ChordProgression {
  return {
    ...progression,
    chords: progression.chords.map(cloneChord),
  };
}

/**
 * 比较两个音符是否相等
 */
export function notesEqual(a: Note, b: Note): boolean {
  return a.pitch === b.pitch && a.octave === b.octave && a.duration === b.duration;
}

/**
 * 比较两个音符是否相等（别名）
 */
export const areNotesEqual = notesEqual;

/**
 * 比较两个和弦是否相等
 */
export function chordsEqual(a: Chord, b: Chord): boolean {
  if (a.romanNumeral !== b.romanNumeral || a.inversion !== b.inversion) {
    return false;
  }
  if (a.notes.length !== b.notes.length) {
    return false;
  }
  return a.notes.every((note, i) => notesEqual(note, b.notes[i]));
}

/**
 * 比较两个和弦进行是否相等
 */
export function progressionsEqual(a: ChordProgression, b: ChordProgression): boolean {
  if (a.key !== b.key || a.chords.length !== b.chords.length) {
    return false;
  }
  return a.chords.every((chord, i) => chordsEqual(chord, b.chords[i]));
}
