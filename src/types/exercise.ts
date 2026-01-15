/**
 * 练习题数据类型定义
 * 
 * 定义练习题、约束条件和章节数据的数据结构
 */

import { Chord, ChordProgression } from './music';

/**
 * 练习题约束条件
 * 
 * 定义练习题的特定要求和限制
 */
export interface ExerciseConstraints {
  /** 必须使用的和弦（罗马数字标记） */
  requiredChords?: string[];
  
  /** 禁止使用的和弦（罗马数字标记） */
  forbiddenChords?: string[];
  
  /** 特定规则ID列表（允许练习题指定验证哪些规则） */
  specificRules?: string[];
  
  /** 最小和弦数量 */
  minLength?: number;
  
  /** 最大和弦数量 */
  maxLength?: number;
}

/**
 * 练习题
 * 
 * 表示一个具体的和声练习题
 */
export interface Exercise {
  /** 练习题唯一标识符，格式："{chapter}-{number}"，如 "1-1" */
  id: string;
  
  /** 对应的教材章节号（1-60） */
  chapter: number;
  
  /** 练习题编号（每章两题：1或2） */
  number: number;
  
  /** 题目说明，描述练习要求 */
  instructions: string;
  
  /** 调性，如 "C major", "A minor" */
  key: string;
  
  /** 给定的起始和弦（可能有多个） */
  startingChords: Chord[];
  
  /** 期望的和弦总数量（包括起始和弦） */
  expectedLength: number;
  
  /** 练习题的约束条件（可选） */
  constraints?: ExerciseConstraints;
  
  /** 参考答案（完整的和弦进行） */
  solution: ChordProgression;
  
  /** 难度等级（1-5，可选） */
  difficulty?: number;
  
  /** 提示信息（可选） */
  hints?: string[];
}

/**
 * 章节数据
 * 
 * 包含一个章节的所有练习题
 */
export interface ChapterData {
  /** 章节号（1-60） */
  chapter: number;
  
  /** 章节标题 */
  title: string;
  
  /** 章节描述（可选） */
  description?: string;
  
  /** 该章节的所有练习题（应该恰好2题） */
  exercises: Exercise[];
  
  /** 该章节引入的新概念（可选） */
  concepts?: string[];
}

/**
 * 练习题数据文件格式
 * 
 * 用于从JSON文件加载练习题数据
 */
export interface ExerciseDataFile {
  /** 数据文件版本 */
  version: string;
  
  /** 所有章节的数据 */
  chapters: ChapterData[];
}

/**
 * 练习题验证结果
 * 
 * 用于验证练习题数据的完整性
 */
export interface ExerciseValidationResult {
  /** 是否有效 */
  isValid: boolean;
  
  /** 错误列表 */
  errors: string[];
  
  /** 警告列表 */
  warnings: string[];
}

/**
 * 创建练习题ID
 * 
 * @param chapter 章节号
 * @param number 练习题编号
 * @returns 练习题ID，格式："{chapter}-{number}"
 */
export function createExerciseId(chapter: number, number: number): string {
  return `${chapter}-${number}`;
}

/**
 * 解析练习题ID
 * 
 * @param id 练习题ID
 * @returns 包含章节号和练习题编号的对象，如果格式无效则返回null
 */
export function parseExerciseId(id: string): { chapter: number; number: number } | null {
  const match = id.match(/^(\d+)-(\d+)$/);
  if (!match) {
    return null;
  }
  
  return {
    chapter: parseInt(match[1], 10),
    number: parseInt(match[2], 10),
  };
}

/**
 * 验证练习题数据
 * 
 * @param exercise 练习题数据
 * @returns 验证结果
 */
export function validateExercise(exercise: Exercise): ExerciseValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 验证必需字段
  if (!exercise.id) {
    errors.push('练习题缺少ID');
  }
  
  if (!exercise.chapter || exercise.chapter < 1 || exercise.chapter > 60) {
    errors.push('章节号必须在1-60之间');
  }
  
  if (!exercise.number || (exercise.number !== 1 && exercise.number !== 2)) {
    errors.push('练习题编号必须是1或2');
  }
  
  if (!exercise.instructions) {
    errors.push('练习题缺少说明');
  }
  
  if (!exercise.key) {
    errors.push('练习题缺少调性');
  }
  
  if (!exercise.startingChords || exercise.startingChords.length === 0) {
    errors.push('练习题缺少起始和弦');
  }
  
  if (!exercise.expectedLength || exercise.expectedLength < 2) {
    errors.push('期望的和弦数量必须至少为2');
  }
  
  if (!exercise.solution || !exercise.solution.chords || exercise.solution.chords.length === 0) {
    errors.push('练习题缺少参考答案');
  }
  
  // 验证ID格式
  const parsedId = parseExerciseId(exercise.id);
  if (!parsedId) {
    errors.push(`练习题ID格式无效: ${exercise.id}`);
  } else if (parsedId.chapter !== exercise.chapter || parsedId.number !== exercise.number) {
    errors.push(`练习题ID与章节号/编号不匹配: ${exercise.id}`);
  }
  
  // 验证起始和弦数量
  if (exercise.startingChords && exercise.startingChords.length > exercise.expectedLength) {
    errors.push('起始和弦数量不能超过期望的总和弦数量');
  }
  
  // 验证参考答案长度
  if (exercise.solution && exercise.solution.chords) {
    if (exercise.solution.chords.length !== exercise.expectedLength) {
      warnings.push(`参考答案的和弦数量(${exercise.solution.chords.length})与期望数量(${exercise.expectedLength})不匹配`);
    }
  }
  
  // 验证约束条件
  if (exercise.constraints) {
    if (exercise.constraints.requiredChords && exercise.constraints.forbiddenChords) {
      const required = new Set(exercise.constraints.requiredChords);
      const forbidden = new Set(exercise.constraints.forbiddenChords);
      
      for (const chord of required) {
        if (forbidden.has(chord)) {
          errors.push(`和弦${chord}同时出现在必需和禁止列表中`);
        }
      }
    }
    
    if (exercise.constraints.minLength && exercise.constraints.maxLength) {
      if (exercise.constraints.minLength > exercise.constraints.maxLength) {
        errors.push('最小长度不能大于最大长度');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 验证章节数据
 * 
 * @param chapter 章节数据
 * @returns 验证结果
 */
export function validateChapter(chapter: ChapterData): ExerciseValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 验证章节号
  if (!chapter.chapter || chapter.chapter < 1 || chapter.chapter > 60) {
    errors.push('章节号必须在1-60之间');
  }
  
  // 验证章节标题
  if (!chapter.title) {
    errors.push('章节缺少标题');
  }
  
  // 验证练习题数量
  if (!chapter.exercises || chapter.exercises.length !== 2) {
    errors.push(`每章必须恰好有2个练习题，当前有${chapter.exercises?.length || 0}个`);
  }
  
  // 验证每个练习题
  if (chapter.exercises) {
    for (const exercise of chapter.exercises) {
      const result = validateExercise(exercise);
      errors.push(...result.errors.map(e => `练习题${exercise.id}: ${e}`));
      warnings.push(...result.warnings.map(w => `练习题${exercise.id}: ${w}`));
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
