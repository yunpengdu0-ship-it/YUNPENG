/**
 * 练习题类型单元测试
 */

import { describe, test, expect } from 'vitest';
import {
  createExerciseId,
  parseExerciseId,
  validateExercise,
  validateChapter,
  Exercise,
  ChapterData,
} from './exercise';

describe('练习题工具函数', () => {
  describe('createExerciseId', () => {
    test('应该创建正确格式的ID', () => {
      expect(createExerciseId(1, 1)).toBe('1-1');
      expect(createExerciseId(10, 2)).toBe('10-2');
      expect(createExerciseId(60, 1)).toBe('60-1');
    });
  });
  
  describe('parseExerciseId', () => {
    test('应该正确解析有效的ID', () => {
      const result1 = parseExerciseId('1-1');
      expect(result1).toEqual({ chapter: 1, number: 1 });
      
      const result2 = parseExerciseId('10-2');
      expect(result2).toEqual({ chapter: 10, number: 2 });
      
      const result3 = parseExerciseId('60-1');
      expect(result3).toEqual({ chapter: 60, number: 1 });
    });
    
    test('应该拒绝无效的ID格式', () => {
      expect(parseExerciseId('invalid')).toBeNull();
      expect(parseExerciseId('1')).toBeNull();
      expect(parseExerciseId('1-')).toBeNull();
      expect(parseExerciseId('-1')).toBeNull();
      expect(parseExerciseId('a-b')).toBeNull();
    });
  });
});

describe('练习题验证', () => {
  const validExercise: Exercise = {
    id: '1-1',
    chapter: 1,
    number: 1,
    instructions: '完成以下和弦进行：I - IV - V - I',
    key: 'C major',
    startingChords: [
      {
        notes: [
          { pitch: 'G', octave: 4, duration: 'w' },
          { pitch: 'E', octave: 4, duration: 'w' },
          { pitch: 'C', octave: 4, duration: 'w' },
          { pitch: 'C', octave: 3, duration: 'w' },
        ],
        romanNumeral: 'I',
        inversion: 0,
      },
    ],
    expectedLength: 4,
    solution: {
      chords: [
        {
          notes: [
            { pitch: 'G', octave: 4, duration: 'w' },
            { pitch: 'E', octave: 4, duration: 'w' },
            { pitch: 'C', octave: 4, duration: 'w' },
            { pitch: 'C', octave: 3, duration: 'w' },
          ],
          romanNumeral: 'I',
          inversion: 0,
        },
        {
          notes: [
            { pitch: 'A', octave: 4, duration: 'w' },
            { pitch: 'F', octave: 4, duration: 'w' },
            { pitch: 'C', octave: 4, duration: 'w' },
            { pitch: 'F', octave: 3, duration: 'w' },
          ],
          romanNumeral: 'IV',
          inversion: 0,
        },
        {
          notes: [
            { pitch: 'G', octave: 4, duration: 'w' },
            { pitch: 'F', octave: 4, duration: 'w' },
            { pitch: 'D', octave: 4, duration: 'w' },
            { pitch: 'G', octave: 3, duration: 'w' },
          ],
          romanNumeral: 'V',
          inversion: 0,
        },
        {
          notes: [
            { pitch: 'G', octave: 4, duration: 'w' },
            { pitch: 'E', octave: 4, duration: 'w' },
            { pitch: 'C', octave: 4, duration: 'w' },
            { pitch: 'C', octave: 3, duration: 'w' },
          ],
          romanNumeral: 'I',
          inversion: 0,
        },
      ],
      key: 'C major',
    },
  };
  
  describe('validateExercise', () => {
    test('应该验证通过有效的练习题', () => {
      const result = validateExercise(validExercise);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('应该检测缺少ID', () => {
      const exercise = { ...validExercise, id: '' };
      const result = validateExercise(exercise);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('练习题缺少ID');
    });
    
    test('应该检测无效的章节号', () => {
      const exercise1 = { ...validExercise, chapter: 0 };
      const result1 = validateExercise(exercise1);
      expect(result1.isValid).toBe(false);
      
      const exercise2 = { ...validExercise, chapter: 61 };
      const result2 = validateExercise(exercise2);
      expect(result2.isValid).toBe(false);
    });
    
    test('应该检测无效的练习题编号', () => {
      const exercise = { ...validExercise, number: 3 };
      const result = validateExercise(exercise);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('练习题编号必须是1或2');
    });
    
    test('应该检测缺少说明', () => {
      const exercise = { ...validExercise, instructions: '' };
      const result = validateExercise(exercise);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('练习题缺少说明');
    });
    
    test('应该检测缺少起始和弦', () => {
      const exercise = { ...validExercise, startingChords: [] };
      const result = validateExercise(exercise);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('练习题缺少起始和弦');
    });
    
    test('应该检测ID格式不匹配', () => {
      const exercise = { ...validExercise, id: '2-1' };
      const result = validateExercise(exercise);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('ID与章节号/编号不匹配'))).toBe(true);
    });
    
    test('应该检测约束条件冲突', () => {
      const exercise: Exercise = {
        ...validExercise,
        constraints: {
          requiredChords: ['I', 'IV'],
          forbiddenChords: ['IV', 'V'],
        },
      };
      const result = validateExercise(exercise);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('同时出现在必需和禁止列表中'))).toBe(true);
    });
  });
  
  describe('validateChapter', () => {
    const validChapter: ChapterData = {
      chapter: 1,
      title: '三和弦的原位',
      exercises: [validExercise, { ...validExercise, id: '1-2', number: 2 }],
    };
    
    test('应该验证通过有效的章节', () => {
      const result = validateChapter(validChapter);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('应该检测无效的章节号', () => {
      const chapter = { ...validChapter, chapter: 0 };
      const result = validateChapter(chapter);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('章节号必须在1-60之间');
    });
    
    test('应该检测缺少标题', () => {
      const chapter = { ...validChapter, title: '' };
      const result = validateChapter(chapter);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('章节缺少标题');
    });
    
    test('应该检测练习题数量不正确', () => {
      const chapter1 = { ...validChapter, exercises: [validExercise] };
      const result1 = validateChapter(chapter1);
      expect(result1.isValid).toBe(false);
      expect(result1.errors.some(e => e.includes('必须恰好有2个练习题'))).toBe(true);
      
      const chapter2 = { ...validChapter, exercises: [] };
      const result2 = validateChapter(chapter2);
      expect(result2.isValid).toBe(false);
    });
  });
});
