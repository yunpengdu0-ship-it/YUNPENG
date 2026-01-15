/**
 * 音程计算模块
 * 
 * 提供计算两个音符之间音程的功能，用于和声规则验证
 */

import { Note } from '../types/music';

/**
 * 音符到半音数的映射
 * C = 0, C# = 1, D = 2, D# = 3, E = 4, F = 5, F# = 6, G = 7, G# = 8, A = 9, A# = 10, B = 11
 * 包含所有异名同音（enharmonic equivalents）
 */
const PITCH_TO_SEMITONES: Record<string, number> = {
  'B#': 0, 'C': 0, 'Dbb': 0,
  'C#': 1, 'Db': 1, 'B##': 1,
  'D': 2, 'C##': 2, 'Ebb': 2,
  'D#': 3, 'Eb': 3, 'Fbb': 3,
  'E': 4, 'Fb': 4, 'D##': 4,
  'E#': 5, 'F': 5, 'Gbb': 5,
  'F#': 6, 'Gb': 6, 'E##': 6,
  'G': 7, 'F##': 7, 'Abb': 7,
  'G#': 8, 'Ab': 8,
  'A': 9, 'G##': 9, 'Bbb': 9,
  'A#': 10, 'Bb': 10, 'Cbb': 10,
  'B': 11, 'Cb': 11, 'A##': 11,
};

/**
 * 将音符转换为绝对半音数（从 C0 开始计算）
 */
export function noteToAbsoluteSemitones(note: Note): number {
  const pitchSemitones = PITCH_TO_SEMITONES[note.pitch];
  if (pitchSemitones === undefined) {
    throw new Error(`无效的音高: ${note.pitch}`);
  }
  return note.octave * 12 + pitchSemitones;
}

/**
 * 计算两个音符之间的半音数（音程）
 * 返回值为正数表示 note2 高于 note1，负数表示 note2 低于 note1
 */
export function calculateInterval(note1: Note, note2: Note): number {
  return noteToAbsoluteSemitones(note2) - noteToAbsoluteSemitones(note1);
}

/**
 * 计算两个音符之间的绝对音程（不考虑方向）
 */
export function calculateAbsoluteInterval(note1: Note, note2: Note): number {
  return Math.abs(calculateInterval(note1, note2));
}

/**
 * 检查两个音符是否形成完全五度（7个半音）
 */
export function isPerfectFifth(note1: Note, note2: Note): boolean {
  const interval = calculateAbsoluteInterval(note1, note2);
  // 完全五度是7个半音，或者7 + 12n（跨八度）
  return interval % 12 === 7;
}

/**
 * 检查两个音符是否形成八度（12个半音的倍数）
 */
export function isOctave(note1: Note, note2: Note): boolean {
  const interval = calculateAbsoluteInterval(note1, note2);
  // 八度是12个半音的倍数（包括同度，即0个半音）
  return interval % 12 === 0;
}

/**
 * 检查两个音符是否形成完全四度（5个半音）
 */
export function isPerfectFourth(note1: Note, note2: Note): boolean {
  const interval = calculateAbsoluteInterval(note1, note2);
  return interval % 12 === 5;
}

/**
 * 检查两个音符是否形成大三度（4个半音）
 */
export function isMajorThird(note1: Note, note2: Note): boolean {
  const interval = calculateAbsoluteInterval(note1, note2);
  return interval % 12 === 4;
}

/**
 * 检查两个音符是否形成小三度（3个半音）
 */
export function isMinorThird(note1: Note, note2: Note): boolean {
  const interval = calculateAbsoluteInterval(note1, note2);
  return interval % 12 === 3;
}

/**
 * 检查两个音符是否形成大六度（9个半音）
 */
export function isMajorSixth(note1: Note, note2: Note): boolean {
  const interval = calculateAbsoluteInterval(note1, note2);
  return interval % 12 === 9;
}

/**
 * 检查两个音符是否形成小六度（8个半音）
 */
export function isMinorSixth(note1: Note, note2: Note): boolean {
  const interval = calculateAbsoluteInterval(note1, note2);
  return interval % 12 === 8;
}

/**
 * 获取音程的名称
 */
export function getIntervalName(semitones: number): string {
  const interval = Math.abs(semitones) % 12;
  const octaves = Math.floor(Math.abs(semitones) / 12);
  
  const names: Record<number, string> = {
    0: '同度',
    1: '小二度',
    2: '大二度',
    3: '小三度',
    4: '大三度',
    5: '完全四度',
    6: '增四度/减五度',
    7: '完全五度',
    8: '小六度',
    9: '大六度',
    10: '小七度',
    11: '大七度',
  };
  
  const baseName = names[interval] || '未知音程';
  return octaves > 0 ? `${baseName} + ${octaves}个八度` : baseName;
}

/**
 * 检查两个声部之间的运动方向
 * 返回值：
 * - 'parallel': 平行运动（两个声部同方向移动）
 * - 'contrary': 反向运动（两个声部反方向移动）
 * - 'oblique': 斜向运动（一个声部移动，另一个保持不变）
 * - 'static': 静止（两个声部都不移动）
 */
export function getMotionType(
  voice1Note1: Note,
  voice1Note2: Note,
  voice2Note1: Note,
  voice2Note2: Note
): 'parallel' | 'contrary' | 'oblique' | 'static' {
  const voice1Interval = calculateInterval(voice1Note1, voice1Note2);
  const voice2Interval = calculateInterval(voice2Note1, voice2Note2);
  
  // 两个声部都不移动
  if (voice1Interval === 0 && voice2Interval === 0) {
    return 'static';
  }
  
  // 一个声部移动，另一个不移动
  if (voice1Interval === 0 || voice2Interval === 0) {
    return 'oblique';
  }
  
  // 两个声部同方向移动
  if ((voice1Interval > 0 && voice2Interval > 0) || 
      (voice1Interval < 0 && voice2Interval < 0)) {
    return 'parallel';
  }
  
  // 两个声部反方向移动
  return 'contrary';
}

/**
 * 检查两个声部是否存在平行五度
 * 平行五度：两个声部在第一个和弦中形成完全五度，
 * 并且以平行运动到第二个和弦中仍形成完全五度
 */
export function hasParallelFifths(
  voice1Note1: Note,
  voice1Note2: Note,
  voice2Note1: Note,
  voice2Note2: Note
): boolean {
  // 检查第一个和弦是否形成完全五度
  const firstChordIsFifth = isPerfectFifth(voice1Note1, voice2Note1);
  
  // 检查第二个和弦是否形成完全五度
  const secondChordIsFifth = isPerfectFifth(voice1Note2, voice2Note2);
  
  // 检查是否为平行运动
  const isParallel = getMotionType(voice1Note1, voice1Note2, voice2Note1, voice2Note2) === 'parallel';
  
  // 只有当两个和弦都形成五度且为平行运动时，才是平行五度
  return firstChordIsFifth && secondChordIsFifth && isParallel;
}

/**
 * 检查两个声部是否存在平行八度
 * 平行八度：两个声部在第一个和弦中形成八度，
 * 并且以平行运动到第二个和弦中仍形成八度
 */
export function hasParallelOctaves(
  voice1Note1: Note,
  voice1Note2: Note,
  voice2Note1: Note,
  voice2Note2: Note
): boolean {
  // 检查第一个和弦是否形成八度
  const firstChordIsOctave = isOctave(voice1Note1, voice2Note1);
  
  // 检查第二个和弦是否形成八度
  const secondChordIsOctave = isOctave(voice1Note2, voice2Note2);
  
  // 检查是否为平行运动
  const isParallel = getMotionType(voice1Note1, voice1Note2, voice2Note1, voice2Note2) === 'parallel';
  
  // 只有当两个和弦都形成八度且为平行运动时，才是平行八度
  return firstChordIsOctave && secondChordIsOctave && isParallel;
}
