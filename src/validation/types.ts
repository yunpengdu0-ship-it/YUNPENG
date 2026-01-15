/**
 * 规则验证引擎类型定义
 * 
 * 定义验证规则、验证结果和错误的数据结构
 */

import { ChordProgression } from '../types/music';

/**
 * 验证错误
 * 包含错误的详细信息，用于向用户显示
 */
export interface ValidationError {
  /** 规则ID，用于唯一标识规则 */
  ruleId: string;
  
  /** 规则名称，用于显示 */
  ruleName: string;
  
  /** 错误消息，解释违反了什么规则 */
  message: string;
  
  /** 教材章节引用，如 "第3章：和弦连接" */
  chapterReference: string;
  
  /** 受影响的声部索引（0=Soprano, 1=Alto, 2=Tenor, 3=Bass） */
  affectedVoices: number[];
  
  /** 受影响的和弦索引（在和弦进行中的位置） */
  affectedChords: number[];
}

/**
 * 验证结果
 * 包含验证是否通过以及所有错误信息
 */
export interface ValidationResult {
  /** 验证是否通过（无错误） */
  isValid: boolean;
  
  /** 所有验证错误的列表 */
  errors: ValidationError[];
}

/**
 * 规则优先级
 * 用于确定规则应用的顺序
 * 
 * 优先级越低，越先执行
 */
export enum RulePriority {
  /** 结构规则 (100-199): 声部范围、声部交叉等基础结构问题 */
  STRUCTURE = 100,
  
  /** 进行规则 (200-299): 平行五八度、反向进行等声部运动规则 */
  VOICE_LEADING = 200,
  
  /** 和弦规则 (300-399): 重复音、省略音等和弦内部规则 */
  CHORD = 300,
  
  /** 风格规则 (400-499): 特定风格或高级规则 */
  STYLE = 400,
}

/**
 * 验证规则
 * 定义一个具体的和声规则
 */
export interface ValidationRule {
  /** 规则的唯一标识符，如 "parallel-fifths" */
  id: string;
  
  /** 规则的显示名称，如 "平行五度检测" */
  name: string;
  
  /** 规则对应的教材章节号（1-60） */
  chapter: number;
  
  /** 规则优先级，用于确定应用顺序 */
  priority: number;
  
  /** 规则的详细描述 */
  description: string;
  
  /**
   * 验证函数
   * 
   * @param progression 要验证的和弦进行
   * @param chordIndex 当前检查的和弦索引（用于检查和弦之间的连接）
   * @returns 验证结果，包含是否有效和错误列表
   */
  validate: (progression: ChordProgression, chordIndex: number) => ValidationResult;
}

/**
 * 规则类别
 * 用于组织和分类规则
 */
export enum RuleCategory {
  /** 声部范围规则 */
  VOICE_RANGE = 'voice-range',
  
  /** 声部交叉规则 */
  VOICE_CROSSING = 'voice-crossing',
  
  /** 平行运动规则 */
  PARALLEL_MOTION = 'parallel-motion',
  
  /** 隐伏平行规则 */
  HIDDEN_PARALLEL = 'hidden-parallel',
  
  /** 重复音规则 */
  DOUBLING = 'doubling',
  
  /** 省略音规则 */
  OMISSION = 'omission',
  
  /** 声部进行规则 */
  VOICE_LEADING_GENERAL = 'voice-leading',
  
  /** 和弦连接规则 */
  CHORD_CONNECTION = 'chord-connection',
}

/**
 * 规则元数据
 * 用于描述规则的额外信息
 */
export interface RuleMetadata {
  /** 规则类别 */
  category: RuleCategory;
  
  /** 规则是否为警告（而非错误） */
  isWarning: boolean;
  
  /** 规则的严重程度（1-10，10最严重） */
  severity: number;
  
  /** 规则的示例（用于教学） */
  examples?: string[];
  
  /** 相关规则的ID列表 */
  relatedRules?: string[];
}

/**
 * 创建一个验证错误
 */
export function createValidationError(
  ruleId: string,
  ruleName: string,
  message: string,
  chapterReference: string,
  affectedVoices: number[],
  affectedChords: number[]
): ValidationError {
  return {
    ruleId,
    ruleName,
    message,
    chapterReference,
    affectedVoices,
    affectedChords,
  };
}

/**
 * 创建一个成功的验证结果（无错误）
 */
export function createSuccessResult(): ValidationResult {
  return {
    isValid: true,
    errors: [],
  };
}

/**
 * 创建一个失败的验证结果（包含错误）
 */
export function createFailureResult(errors: ValidationError[]): ValidationResult {
  return {
    isValid: false,
    errors,
  };
}

/**
 * 合并多个验证结果
 * 如果任何一个结果无效，则合并后的结果也无效
 */
export function mergeValidationResults(results: ValidationResult[]): ValidationResult {
  const allErrors: ValidationError[] = [];
  
  for (const result of results) {
    allErrors.push(...result.errors);
  }
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * 按优先级排序验证错误
 * 优先级高的错误（数值小）排在前面
 */
export function sortErrorsByPriority(
  errors: ValidationError[],
  rules: Map<string, ValidationRule>
): ValidationError[] {
  return errors.sort((a, b) => {
    const ruleA = rules.get(a.ruleId);
    const ruleB = rules.get(b.ruleId);
    
    if (!ruleA || !ruleB) return 0;
    
    return ruleA.priority - ruleB.priority;
  });
}
