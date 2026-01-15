/**
 * 和弦有效性检查模块
 * 
 * 验证四个音符是否构成有效的和弦
 */

import { Note, Chord } from '../types/music';
import { calculateAbsoluteInterval, isPerfectFifth, isMajorThird, isMinorThird } from './intervals';
import { noteToAbsoluteSemitones } from './intervals';

/**
 * 和弦验证结果
 */
export interface ChordValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 检查四个音符是否构成有效的三和弦（原位或转位）
 * 
 * 三和弦由根音、三度音和五度音组成
 * 在四声部和声中，通常会重复一个音（最常见的是重复根音）
 */
export function isValidTriad(notes: Note[]): ChordValidationResult {
  const result: ChordValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (notes.length !== 4) {
    result.isValid = false;
    result.errors.push('和弦必须包含恰好4个音符（四声部）');
    return result;
  }

  // 获取所有音符的半音数
  const semitones = notes.map(noteToAbsoluteSemitones);
  
  // 获取唯一的音高类（pitch class），忽略八度
  const pitchClasses = new Set(semitones.map(s => s % 12));
  
  // 三和弦应该有3个不同的音高类（因为有一个音会重复）
  if (pitchClasses.size < 2) {
    result.isValid = false;
    result.errors.push('和弦音符过于单一，至少需要2个不同的音高');
    return result;
  }
  
  if (pitchClasses.size > 4) {
    result.isValid = false;
    result.errors.push('和弦包含过多不同的音高，三和弦应该只有3个不同的音高类');
    return result;
  }

  // 如果有3个不同的音高类，检查它们是否形成三和弦结构
  if (pitchClasses.size === 3) {
    const sortedPitches = Array.from(pitchClasses).sort((a, b) => a - b);
    
    // 检查是否形成三度叠置结构
    const interval1 = (sortedPitches[1] - sortedPitches[0] + 12) % 12;
    const interval2 = (sortedPitches[2] - sortedPitches[1] + 12) % 12;
    
    // 三和弦的两个音程应该都是三度（大三度=4，小三度=3）
    const isThird1 = interval1 === 3 || interval1 === 4;
    const isThird2 = interval2 === 3 || interval2 === 4;
    
    if (!isThird1 || !isThird2) {
      result.warnings.push('和弦结构不是标准的三度叠置，可能不是常规三和弦');
    }
  }

  return result;
}

/**
 * 检查和弦中的音符是否有合理的声部排列
 * 
 * 检查项：
 * 1. 声部之间的间距是否合理
 * 2. 是否有过大的跳跃
 */
export function validateVoiceSpacing(notes: Note[]): ChordValidationResult {
  const result: ChordValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (notes.length !== 4) {
    result.isValid = false;
    result.errors.push('和弦必须包含恰好4个音符');
    return result;
  }

  const semitones = notes.map(noteToAbsoluteSemitones);
  
  // 检查相邻声部之间的间距
  for (let i = 0; i < 3; i++) {
    const interval = Math.abs(semitones[i] - semitones[i + 1]);
    
    // 上三个声部（Soprano, Alto, Tenor）之间的间距不应超过一个八度（12个半音）
    if (i < 2 && interval > 12) {
      result.warnings.push(`声部 ${i} 和 ${i + 1} 之间的间距过大（${interval}个半音）`);
    }
    
    // Bass 和 Tenor 之间可以有更大的间距，但超过两个八度也不太常见
    if (i === 2 && interval > 24) {
      result.warnings.push(`男低音和男高音之间的间距过大（${interval}个半音）`);
    }
  }

  return result;
}

/**
 * 检查和弦中是否有重复音，以及重复音是否合理
 */
export function validateDoubling(notes: Note[]): ChordValidationResult {
  const result: ChordValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (notes.length !== 4) {
    result.isValid = false;
    result.errors.push('和弦必须包含恰好4个音符');
    return result;
  }

  // 获取音高类（忽略八度）
  const pitchClasses = notes.map(note => noteToAbsoluteSemitones(note) % 12);
  
  // 统计每个音高类出现的次数
  const counts = new Map<number, number>();
  pitchClasses.forEach(pc => {
    counts.set(pc, (counts.get(pc) || 0) + 1);
  });

  // 检查是否有音符出现3次或更多
  for (const [pc, count] of counts.entries()) {
    if (count >= 3) {
      result.warnings.push(`音高类 ${pc} 出现了 ${count} 次，这在四声部和声中较为少见`);
    }
  }

  // 如果只有2个不同的音高类，说明有两个音各重复一次
  if (counts.size === 2) {
    result.warnings.push('和弦只包含2个不同的音高，这是不完整的和弦');
  }

  return result;
}

/**
 * 综合验证和弦的有效性
 * 
 * 包括：
 * 1. 三和弦结构验证
 * 2. 声部间距验证
 * 3. 重复音验证
 */
export function validateChord(notes: Note[]): ChordValidationResult {
  const triadResult = isValidTriad(notes);
  const spacingResult = validateVoiceSpacing(notes);
  const doublingResult = validateDoubling(notes);

  // 合并所有验证结果
  const combinedResult: ChordValidationResult = {
    isValid: triadResult.isValid && spacingResult.isValid && doublingResult.isValid,
    errors: [
      ...triadResult.errors,
      ...spacingResult.errors,
      ...doublingResult.errors,
    ],
    warnings: [
      ...triadResult.warnings,
      ...spacingResult.warnings,
      ...doublingResult.warnings,
    ],
  };

  return combinedResult;
}

/**
 * 检查新输入的音符是否能与现有音符构成有效和弦
 * 
 * 这个函数用于实时验证用户输入
 * 
 * @param existingNotes 已经输入的音符（可能少于4个）
 * @param newNote 新输入的音符
 * @param voiceIndex 新音符的声部索引
 */
export function canAddNoteToChord(
  existingNotes: (Note | null)[],
  newNote: Note,
  voiceIndex: number
): ChordValidationResult {
  const result: ChordValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (voiceIndex < 0 || voiceIndex >= 4) {
    result.isValid = false;
    result.errors.push('声部索引必须在 0-3 之间');
    return result;
  }

  // 创建一个临时的音符数组
  const tempNotes = [...existingNotes];
  tempNotes[voiceIndex] = newNote;

  // 检查已输入的音符之间的关系
  const filledNotes = tempNotes.filter((n): n is Note => n !== null);
  
  if (filledNotes.length < 2) {
    // 如果只有一个音符，总是有效的
    return result;
  }

  // 检查声部间距（只检查已填充的相邻声部）
  for (let i = 0; i < tempNotes.length - 1; i++) {
    if (tempNotes[i] && tempNotes[i + 1]) {
      const interval = Math.abs(
        noteToAbsoluteSemitones(tempNotes[i]!) - 
        noteToAbsoluteSemitones(tempNotes[i + 1]!)
      );
      
      if (i < 2 && interval > 12) {
        result.warnings.push(`声部 ${i} 和 ${i + 1} 之间的间距较大（${interval}个半音）`);
      }
    }
  }

  // 如果所有4个音符都已填充，进行完整验证
  if (filledNotes.length === 4) {
    const fullValidation = validateChord(filledNotes);
    result.isValid = fullValidation.isValid;
    result.errors.push(...fullValidation.errors);
    result.warnings.push(...fullValidation.warnings);
  }

  return result;
}

/**
 * 获取和弦的根音（简化版本，基于最低音）
 * 
 * 注意：这是一个简化的实现，实际的根音判断需要考虑和弦的转位
 */
export function getChordRoot(notes: Note[]): Note {
  if (notes.length === 0) {
    throw new Error('无法从空数组中获取根音');
  }
  
  // 找到最低的音符
  let lowestNote = notes[0];
  let lowestSemitones = noteToAbsoluteSemitones(notes[0]);
  
  for (let i = 1; i < notes.length; i++) {
    const semitones = noteToAbsoluteSemitones(notes[i]);
    if (semitones < lowestSemitones) {
      lowestNote = notes[i];
      lowestSemitones = semitones;
    }
  }
  
  return lowestNote;
}
