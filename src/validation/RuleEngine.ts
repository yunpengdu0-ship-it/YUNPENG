/**
 * 规则验证引擎
 * 
 * 负责管理和应用和声规则，验证和弦进行的正确性
 */

import { ChordProgression } from '../types/music';
import {
  ValidationRule,
  ValidationResult,
  ValidationError,
  createSuccessResult,
  mergeValidationResults,
  sortErrorsByPriority,
} from './types';

/**
 * 规则引擎类
 * 
 * 管理所有验证规则，并提供验证和弦进行的功能
 */
export class RuleEngine {
  /** 按章节组织的规则映射 */
  private rulesByChapter: Map<number, ValidationRule[]>;
  
  /** 所有规则的映射（按规则ID索引） */
  private rulesById: Map<string, ValidationRule>;
  
  constructor() {
    this.rulesByChapter = new Map();
    this.rulesById = new Map();
  }
  
  /**
   * 注册一个新规则
   * 
   * @param rule 要注册的规则
   */
  registerRule(rule: ValidationRule): void {
    // 添加到按ID索引的映射
    this.rulesById.set(rule.id, rule);
    
    // 添加到按章节索引的映射
    if (!this.rulesByChapter.has(rule.chapter)) {
      this.rulesByChapter.set(rule.chapter, []);
    }
    
    const chapterRules = this.rulesByChapter.get(rule.chapter)!;
    
    // 检查是否已存在相同ID的规则
    const existingIndex = chapterRules.findIndex(r => r.id === rule.id);
    if (existingIndex >= 0) {
      // 替换现有规则
      chapterRules[existingIndex] = rule;
    } else {
      // 添加新规则
      chapterRules.push(rule);
    }
    
    // 按优先级排序
    chapterRules.sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * 批量注册多个规则
   * 
   * @param rules 要注册的规则数组
   */
  registerRules(rules: ValidationRule[]): void {
    for (const rule of rules) {
      this.registerRule(rule);
    }
  }
  
  /**
   * 获取指定章节的所有规则（包括之前章节的规则）
   * 
   * 根据设计文档的属性6（规则累积性），章节N的规则集包含：
   * - 所有前面章节（1到N-1）的规则
   * - 章节N新引入的规则
   * 
   * @param chapter 章节号（1-60）
   * @returns 该章节应用的所有规则，按优先级排序
   */
  getRulesForChapter(chapter: number): ValidationRule[] {
    const allRules: ValidationRule[] = [];
    
    // 收集从第1章到指定章节的所有规则
    for (let ch = 1; ch <= chapter; ch++) {
      const chapterRules = this.rulesByChapter.get(ch);
      if (chapterRules) {
        allRules.push(...chapterRules);
      }
    }
    
    // 按优先级排序
    allRules.sort((a, b) => a.priority - b.priority);
    
    return allRules;
  }
  
  /**
   * 验证和弦进行
   * 
   * 应用指定章节的所有规则（包括之前章节的规则）来验证和弦进行
   * 规则按优先级顺序应用：
   * 1. 结构规则 (priority 100-199)
   * 2. 进行规则 (priority 200-299)
   * 3. 和弦规则 (priority 300-399)
   * 4. 风格规则 (priority 400-499)
   * 
   * @param progression 要验证的和弦进行
   * @param chapter 当前章节号（1-60）
   * @returns 验证结果，包含所有错误
   */
  validate(progression: ChordProgression, chapter: number): ValidationResult {
    // 获取该章节的所有规则（包括累积的规则）
    const rules = this.getRulesForChapter(chapter);
    
    // 如果没有规则，返回成功
    if (rules.length === 0) {
      return createSuccessResult();
    }
    
    // 如果和弦进行为空或只有一个和弦，返回成功
    if (!progression.chords || progression.chords.length <= 1) {
      return createSuccessResult();
    }
    
    const allResults: ValidationResult[] = [];
    
    // 对每个和弦应用规则
    // 注意：chordIndex 表示当前和弦，规则可以检查它与前一个和弦的关系
    for (let i = 0; i < progression.chords.length; i++) {
      // 对每个规则进行验证
      for (const rule of rules) {
        const result = rule.validate(progression, i);
        allResults.push(result);
      }
    }
    
    // 合并所有验证结果
    const mergedResult = mergeValidationResults(allResults);
    
    // 按优先级排序错误
    if (mergedResult.errors.length > 0) {
      mergedResult.errors = sortErrorsByPriority(mergedResult.errors, this.rulesById);
    }
    
    return mergedResult;
  }
  
  /**
   * 获取指定规则
   * 
   * @param ruleId 规则ID
   * @returns 规则对象，如果不存在则返回undefined
   */
  getRule(ruleId: string): ValidationRule | undefined {
    return this.rulesById.get(ruleId);
  }
  
  /**
   * 获取所有已注册的规则
   * 
   * @returns 所有规则的数组
   */
  getAllRules(): ValidationRule[] {
    return Array.from(this.rulesById.values());
  }
  
  /**
   * 清除所有规则
   * 
   * 主要用于测试
   */
  clearRules(): void {
    this.rulesByChapter.clear();
    this.rulesById.clear();
  }
  
  /**
   * 获取已注册规则的数量
   * 
   * @returns 规则总数
   */
  getRuleCount(): number {
    return this.rulesById.size;
  }
  
  /**
   * 检查是否已注册指定章节的规则
   * 
   * @param chapter 章节号
   * @returns 如果该章节有规则则返回true
   */
  hasRulesForChapter(chapter: number): boolean {
    return this.rulesByChapter.has(chapter) && 
           this.rulesByChapter.get(chapter)!.length > 0;
  }
}
