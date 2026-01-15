/**
 * 练习题约束验证工具
 * 
 * 提供验证和弦进行是否满足练习题约束条件的功能
 */

import { ChordProgression, Chord } from '../types/music';
import { ExerciseConstraints } from '../types/exercise';

/**
 * 约束验证结果
 */
export interface ConstraintValidationResult {
  /** 是否满足所有约束 */
  isValid: boolean;
  
  /** 违反的约束列表 */
  violations: ConstraintViolation[];
}

/**
 * 约束违反信息
 */
export interface ConstraintViolation {
  /** 违反的约束类型 */
  type: 'required' | 'forbidden' | 'length';
  
  /** 错误消息 */
  message: string;
  
  /** 相关的和弦（如果适用） */
  relatedChords?: string[];
}

/**
 * 验证和弦进行是否满足约束条件
 * 
 * @param progression 和弦进行
 * @param constraints 约束条件
 * @returns 验证结果
 */
export function validateConstraints(
  progression: ChordProgression,
  constraints?: ExerciseConstraints
): ConstraintValidationResult {
  const violations: ConstraintViolation[] = [];

  // 如果没有约束，直接返回有效
  if (!constraints) {
    return { isValid: true, violations: [] };
  }

  // 提取和弦进行中的罗马数字标记
  const usedChords = progression.chords
    .map(chord => chord.romanNumeral)
    .filter((rn): rn is string => rn !== undefined);

  // 验证必须使用的和弦
  if (constraints.requiredChords && constraints.requiredChords.length > 0) {
    const missing = constraints.requiredChords.filter(
      required => !usedChords.includes(required)
    );

    if (missing.length > 0) {
      violations.push({
        type: 'required',
        message: `缺少必须使用的和弦: ${missing.join(', ')}`,
        relatedChords: missing
      });
    }
  }

  // 验证禁止使用的和弦
  if (constraints.forbiddenChords && constraints.forbiddenChords.length > 0) {
    const forbidden = usedChords.filter(
      used => constraints.forbiddenChords!.includes(used)
    );

    if (forbidden.length > 0) {
      violations.push({
        type: 'forbidden',
        message: `使用了禁止的和弦: ${forbidden.join(', ')}`,
        relatedChords: forbidden
      });
    }
  }

  // 验证长度约束
  const length = progression.chords.length;

  if (constraints.minLength && length < constraints.minLength) {
    violations.push({
      type: 'length',
      message: `和弦数量不足，至少需要 ${constraints.minLength} 个，当前 ${length} 个`
    });
  }

  if (constraints.maxLength && length > constraints.maxLength) {
    violations.push({
      type: 'length',
      message: `和弦数量过多，最多允许 ${constraints.maxLength} 个，当前 ${length} 个`
    });
  }

  return {
    isValid: violations.length === 0,
    violations
  };
}

/**
 * 检查单个和弦是否被禁止
 * 
 * @param chord 和弦
 * @param constraints 约束条件
 * @returns 是否被禁止
 */
export function isChordForbidden(
  chord: Chord,
  constraints?: ExerciseConstraints
): boolean {
  if (!constraints || !constraints.forbiddenChords) {
    return false;
  }

  if (!chord.romanNumeral) {
    return false;
  }

  return constraints.forbiddenChords.includes(chord.romanNumeral);
}

/**
 * 检查和弦是否是必需的
 * 
 * @param chord 和弦
 * @param constraints 约束条件
 * @returns 是否是必需的
 */
export function isChordRequired(
  chord: Chord,
  constraints?: ExerciseConstraints
): boolean {
  if (!constraints || !constraints.requiredChords) {
    return false;
  }

  if (!chord.romanNumeral) {
    return false;
  }

  return constraints.requiredChords.includes(chord.romanNumeral);
}

/**
 * 获取可用的和弦列表（排除禁止的和弦）
 * 
 * @param allChords 所有可能的和弦
 * @param constraints 约束条件
 * @returns 可用的和弦列表
 */
export function getAvailableChords(
  allChords: string[],
  constraints?: ExerciseConstraints
): string[] {
  if (!constraints || !constraints.forbiddenChords) {
    return allChords;
  }

  return allChords.filter(
    chord => !constraints.forbiddenChords!.includes(chord)
  );
}

/**
 * 获取约束提示信息
 * 
 * @param constraints 约束条件
 * @returns 提示信息列表
 */
export function getConstraintHints(
  constraints?: ExerciseConstraints
): string[] {
  const hints: string[] = [];

  if (!constraints) {
    return hints;
  }

  if (constraints.requiredChords && constraints.requiredChords.length > 0) {
    hints.push(`必须使用: ${constraints.requiredChords.join(', ')}`);
  }

  if (constraints.forbiddenChords && constraints.forbiddenChords.length > 0) {
    hints.push(`禁止使用: ${constraints.forbiddenChords.join(', ')}`);
  }

  if (constraints.minLength) {
    hints.push(`最少 ${constraints.minLength} 个和弦`);
  }

  if (constraints.maxLength) {
    hints.push(`最多 ${constraints.maxLength} 个和弦`);
  }

  return hints;
}

/**
 * 检查和弦进行是否可以提交
 * 
 * @param progression 和弦进行
 * @param constraints 约束条件
 * @param expectedLength 期望的和弦数量
 * @returns 是否可以提交
 */
export function canSubmitProgression(
  progression: ChordProgression,
  constraints: ExerciseConstraints | undefined,
  expectedLength: number
): boolean {
  // 检查长度
  if (progression.chords.length !== expectedLength) {
    return false;
  }

  // 检查约束
  const result = validateConstraints(progression, constraints);
  return result.isValid;
}
