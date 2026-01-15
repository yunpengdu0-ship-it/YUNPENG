/**
 * 声部范围验证模块
 * 
 * 定义每个声部的合理音域并提供验证功能
 */

import { Note, Voice } from '../types/music';
import { noteToAbsoluteSemitones } from './intervals';

/**
 * 声部音域范围（以半音数表示）
 * 基于标准四声部合唱的音域
 */
export interface VoiceRange {
  min: number;  // 最低音（半音数）
  max: number;  // 最高音（半音数）
  name: string; // 声部名称
}

/**
 * 标准声部音域定义
 * 
 * 女高音（Soprano）: C4 - A5
 * 女低音（Alto）: G3 - E5
 * 男高音（Tenor）: C3 - G4
 * 男低音（Bass）: E2 - D4
 */
export const VOICE_RANGES: Record<Voice, VoiceRange> = {
  [Voice.Soprano]: {
    min: 48,  // C4 = 4 * 12 + 0
    max: 69,  // A5 = 5 * 12 + 9
    name: '女高音',
  },
  [Voice.Alto]: {
    min: 43,  // G3 = 3 * 12 + 7
    max: 64,  // E5 = 5 * 12 + 4
    name: '女低音',
  },
  [Voice.Tenor]: {
    min: 36,  // C3 = 3 * 12 + 0
    max: 55,  // G4 = 4 * 12 + 7
    name: '男高音',
  },
  [Voice.Bass]: {
    min: 28,  // E2 = 2 * 12 + 4
    max: 50,  // D4 = 4 * 12 + 2
    name: '男低音',
  },
};

/**
 * 检查音符是否在指定声部的合理范围内
 */
export function isNoteInVoiceRange(note: Note, voice: Voice): boolean {
  const semitones = noteToAbsoluteSemitones(note);
  const range = VOICE_RANGES[voice];
  return semitones >= range.min && semitones <= range.max;
}

/**
 * 获取音符超出声部范围的信息
 * 如果音符在范围内，返回 null
 * 如果超出范围，返回超出的方向和半音数
 */
export function getVoiceRangeViolation(
  note: Note,
  voice: Voice
): { direction: 'too_low' | 'too_high'; semitones: number } | null {
  const semitones = noteToAbsoluteSemitones(note);
  const range = VOICE_RANGES[voice];
  
  if (semitones < range.min) {
    return {
      direction: 'too_low',
      semitones: range.min - semitones,
    };
  }
  
  if (semitones > range.max) {
    return {
      direction: 'too_high',
      semitones: semitones - range.max,
    };
  }
  
  return null;
}

/**
 * 检查两个相邻声部是否发生交叉
 * 声部交叉：较低的声部音高高于较高的声部
 * 
 * @param lowerVoice 较低的声部（如 Alto）
 * @param lowerNote 较低声部的音符
 * @param higherVoice 较高的声部（如 Soprano）
 * @param higherNote 较高声部的音符
 */
export function hasVoiceCrossing(
  lowerVoice: Voice,
  lowerNote: Note,
  higherVoice: Voice,
  higherNote: Note
): boolean {
  // 确保 lowerVoice 确实比 higherVoice 低
  if (lowerVoice <= higherVoice) {
    throw new Error('lowerVoice 必须比 higherVoice 的数值更大（更低的声部）');
  }
  
  const lowerSemitones = noteToAbsoluteSemitones(lowerNote);
  const higherSemitones = noteToAbsoluteSemitones(higherNote);
  
  // 如果较低声部的音高高于或等于较高声部，则发生交叉
  return lowerSemitones >= higherSemitones;
}

/**
 * 检查和弦中所有声部是否都在合理范围内
 * 返回所有超出范围的声部信息
 */
export function validateChordVoiceRanges(notes: Note[]): Array<{
  voice: Voice;
  violation: { direction: 'too_low' | 'too_high'; semitones: number };
}> {
  if (notes.length !== 4) {
    throw new Error('和弦必须包含恰好4个音符');
  }
  
  const violations: Array<{
    voice: Voice;
    violation: { direction: 'too_low' | 'too_high'; semitones: number };
  }> = [];
  
  notes.forEach((note, index) => {
    const voice = index as Voice;
    const violation = getVoiceRangeViolation(note, voice);
    if (violation) {
      violations.push({ voice, violation });
    }
  });
  
  return violations;
}

/**
 * 检查和弦中是否存在声部交叉
 * 返回所有交叉的声部对
 */
export function findVoiceCrossings(notes: Note[]): Array<{
  lowerVoice: Voice;
  higherVoice: Voice;
}> {
  if (notes.length !== 4) {
    throw new Error('和弦必须包含恰好4个音符');
  }
  
  const crossings: Array<{
    lowerVoice: Voice;
    higherVoice: Voice;
  }> = [];
  
  // 检查所有相邻声部对
  const voicePairs: Array<[Voice, Voice]> = [
    [Voice.Alto, Voice.Soprano],
    [Voice.Tenor, Voice.Alto],
    [Voice.Bass, Voice.Tenor],
  ];
  
  voicePairs.forEach(([lowerVoice, higherVoice]) => {
    const lowerNote = notes[lowerVoice];
    const higherNote = notes[higherVoice];
    
    // 检查音符是否存在且有效
    if (lowerNote && higherNote && lowerNote.pitch && higherNote.pitch) {
      if (hasVoiceCrossing(lowerVoice, lowerNote, higherVoice, higherNote)) {
        crossings.push({ lowerVoice, higherVoice });
      }
    }
  });
  
  return crossings;
}

/**
 * 检查和弦中是否存在声部交叉（返回详细信息）
 */
export function hasVoiceCrossingDetailed(notes: Note[]): {
  hasCrossing: boolean;
  crossings: Array<{ lowerVoice: Voice; higherVoice: Voice }>;
} {
  const crossings = findVoiceCrossings(notes);
  return {
    hasCrossing: crossings.length > 0,
    crossings,
  };
}

/**
 * 获取声部的推荐音域中心（用于生成测试数据）
 */
export function getVoiceCenter(voice: Voice): number {
  const range = VOICE_RANGES[voice];
  return Math.floor((range.min + range.max) / 2);
}

/**
 * 获取声部范围的描述文本
 */
export function getVoiceRangeDescription(voice: Voice): string {
  const range = VOICE_RANGES[voice];
  return `${range.name}: ${getSemitoneName(range.min)} - ${getSemitoneName(range.max)}`;
}

/**
 * 将半音数转换为音符名称（用于显示）
 */
function getSemitoneName(semitones: number): string {
  const octave = Math.floor(semitones / 12);
  const pitchIndex = semitones % 12;
  const pitches = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return `${pitches[pitchIndex]}${octave}`;
}
