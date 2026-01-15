/**
 * 验证类型测试
 */

import { describe, it, expect } from 'vitest';
import {
  createValidationError,
  createSuccessResult,
  createFailureResult,
  mergeValidationResults,
  sortErrorsByPriority,
  RulePriority,
  ValidationRule,
} from './types';
import { createChordProgression, createChord, createNote } from '../core/musicUtils';

describe('createValidationError', () => {
  it('应该创建一个验证错误对象', () => {
    const error = createValidationError(
      'test-rule',
      '测试规则',
      '这是一个测试错误',
      '第1章',
      [0, 1],
      [0, 1]
    );
    
    expect(error.ruleId).toBe('test-rule');
    expect(error.ruleName).toBe('测试规则');
    expect(error.message).toBe('这是一个测试错误');
    expect(error.chapterReference).toBe('第1章');
    expect(error.affectedVoices).toEqual([0, 1]);
    expect(error.affectedChords).toEqual([0, 1]);
  });
});

describe('createSuccessResult', () => {
  it('应该创建一个成功的验证结果', () => {
    const result = createSuccessResult();
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('createFailureResult', () => {
  it('应该创建一个失败的验证结果', () => {
    const error = createValidationError(
      'test-rule',
      '测试规则',
      '错误消息',
      '第1章',
      [],
      []
    );
    
    const result = createFailureResult([error]);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toBe(error);
  });

  it('应该接受多个错误', () => {
    const error1 = createValidationError('rule1', '规则1', '错误1', '第1章', [], []);
    const error2 = createValidationError('rule2', '规则2', '错误2', '第2章', [], []);
    
    const result = createFailureResult([error1, error2]);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });
});

describe('mergeValidationResults', () => {
  it('应该合并多个成功结果为成功', () => {
    const result1 = createSuccessResult();
    const result2 = createSuccessResult();
    
    const merged = mergeValidationResults([result1, result2]);
    
    expect(merged.isValid).toBe(true);
    expect(merged.errors).toHaveLength(0);
  });

  it('应该合并包含错误的结果为失败', () => {
    const error = createValidationError('rule1', '规则1', '错误', '第1章', [], []);
    const result1 = createSuccessResult();
    const result2 = createFailureResult([error]);
    
    const merged = mergeValidationResults([result1, result2]);
    
    expect(merged.isValid).toBe(false);
    expect(merged.errors).toHaveLength(1);
  });

  it('应该合并所有错误', () => {
    const error1 = createValidationError('rule1', '规则1', '错误1', '第1章', [], []);
    const error2 = createValidationError('rule2', '规则2', '错误2', '第2章', [], []);
    const error3 = createValidationError('rule3', '规则3', '错误3', '第3章', [], []);
    
    const result1 = createFailureResult([error1]);
    const result2 = createFailureResult([error2, error3]);
    
    const merged = mergeValidationResults([result1, result2]);
    
    expect(merged.isValid).toBe(false);
    expect(merged.errors).toHaveLength(3);
  });

  it('应该处理空结果数组', () => {
    const merged = mergeValidationResults([]);
    
    expect(merged.isValid).toBe(true);
    expect(merged.errors).toHaveLength(0);
  });
});

describe('sortErrorsByPriority', () => {
  it('应该按优先级排序错误', () => {
    const error1 = createValidationError('rule1', '规则1', '错误1', '第1章', [], []);
    const error2 = createValidationError('rule2', '规则2', '错误2', '第2章', [], []);
    const error3 = createValidationError('rule3', '规则3', '错误3', '第3章', [], []);
    
    // 创建规则映射，优先级不同
    const rules = new Map<string, ValidationRule>();
    
    const chord = createChord([
      createNote('C', 4),
      createNote('E', 4),
      createNote('G', 4),
      createNote('C', 3),
    ], 'I');
    
    const progression = createChordProgression([chord], 'C major');
    
    rules.set('rule1', {
      id: 'rule1',
      name: '规则1',
      chapter: 1,
      priority: RulePriority.CHORD,  // 300
      description: '测试',
      validate: () => createSuccessResult(),
    });
    
    rules.set('rule2', {
      id: 'rule2',
      name: '规则2',
      chapter: 1,
      priority: RulePriority.STRUCTURE,  // 100
      description: '测试',
      validate: () => createSuccessResult(),
    });
    
    rules.set('rule3', {
      id: 'rule3',
      name: '规则3',
      chapter: 1,
      priority: RulePriority.VOICE_LEADING,  // 200
      description: '测试',
      validate: () => createSuccessResult(),
    });
    
    const errors = [error1, error2, error3];
    const sorted = sortErrorsByPriority(errors, rules);
    
    // 应该按优先级排序：rule2 (100) < rule3 (200) < rule1 (300)
    expect(sorted[0].ruleId).toBe('rule2');
    expect(sorted[1].ruleId).toBe('rule3');
    expect(sorted[2].ruleId).toBe('rule1');
  });

  it('应该处理不存在的规则', () => {
    const error = createValidationError('nonexistent', '不存在', '错误', '第1章', [], []);
    const rules = new Map<string, ValidationRule>();
    
    const sorted = sortErrorsByPriority([error], rules);
    
    // 不应该崩溃
    expect(sorted).toHaveLength(1);
  });
});

describe('RulePriority', () => {
  it('应该定义正确的优先级顺序', () => {
    expect(RulePriority.STRUCTURE).toBeLessThan(RulePriority.VOICE_LEADING);
    expect(RulePriority.VOICE_LEADING).toBeLessThan(RulePriority.CHORD);
    expect(RulePriority.CHORD).toBeLessThan(RulePriority.STYLE);
  });

  it('应该有正确的数值', () => {
    expect(RulePriority.STRUCTURE).toBe(100);
    expect(RulePriority.VOICE_LEADING).toBe(200);
    expect(RulePriority.CHORD).toBe(300);
    expect(RulePriority.STYLE).toBe(400);
  });
});
