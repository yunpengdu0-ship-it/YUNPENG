/**
 * 音乐理论核心数据类型
 * 
 * 这些类型定义了和声游戏的基础音乐理论模型
 */

/**
 * 音符
 * 表示一个单独的音符，包含音高、八度和时值
 */
export interface Note {
  /** 音高，如 "C", "D#", "Eb" */
  pitch: string;
  /** 八度，如 3, 4, 5 */
  octave: number;
  /** 时值，如 "w"（全音符）, "h"（二分音符）, "q"（四分音符） */
  duration: string;
}

/**
 * 和弦
 * 表示一个四声部和弦
 */
export interface Chord {
  /** 四个声部的音符 [soprano, alto, tenor, bass] */
  notes: Note[];
  /** 罗马数字标记，如 "I", "V7", "ii" */
  romanNumeral: string;
  /** 转位：0=原位，1=第一转位，2=第二转位 */
  inversion: number;
}

/**
 * 和弦进行
 * 表示一系列和弦的连接
 */
export interface ChordProgression {
  /** 和弦序列 */
  chords: Chord[];
  /** 调性，如 "C major", "A minor" */
  key: string;
}

/**
 * 声部枚举
 * 用于标识四个声部
 */
export enum Voice {
  Soprano = 0,  // 女高音
  Alto = 1,     // 女低音
  Tenor = 2,    // 男高音
  Bass = 3      // 男低音
}

/**
 * 声部名称映射
 */
export const VoiceNames: Record<Voice, string> = {
  [Voice.Soprano]: '女高音',
  [Voice.Alto]: '女低音',
  [Voice.Tenor]: '男高音',
  [Voice.Bass]: '男低音',
};
