/**
 * ExerciseRepository 单元测试
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { ExerciseRepository } from './ExerciseRepository';
import { ExerciseDataFile, Exercise, ChapterData } from '../types/exercise';

describe('ExerciseRepository', () => {
  let repository: ExerciseRepository;
  
  const mockExercise1: Exercise = {
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
  
  const mockExercise2: Exercise = {
    ...mockExercise1,
    id: '1-2',
    number: 2,
    instructions: '完成以下和弦进行：I - V - I',
    expectedLength: 3,
    solution: {
      ...mockExercise1.solution,
      chords: mockExercise1.solution.chords.slice(0, 3),
    },
  };
  
  const mockChapter1: ChapterData = {
    chapter: 1,
    title: '三和弦的原位',
    exercises: [mockExercise1, mockExercise2],
  };
  
  const mockChapter2: ChapterData = {
    chapter: 2,
    title: '三和弦的转位',
    exercises: [
      { ...mockExercise1, id: '2-1', chapter: 2 },
      { ...mockExercise2, id: '2-2', chapter: 2 },
    ],
  };
  
  const mockData: ExerciseDataFile = {
    version: '1.0.0',
    chapters: [mockChapter1, mockChapter2],
  };
  
  beforeEach(() => {
    repository = new ExerciseRepository();
  });
  
  describe('数据加载', () => {
    test('应该能够从数据对象加载', () => {
      repository.loadFromData(mockData);
      
      expect(repository.isLoaded()).toBe(true);
      expect(repository.getChapterCount()).toBe(2);
      expect(repository.getExerciseCount()).toBe(4);
    });
    
    test('应该拒绝无效的数据', () => {
      const invalidData: ExerciseDataFile = {
        version: '1.0.0',
        chapters: [
          {
            chapter: 1,
            title: '测试章节',
            exercises: [mockExercise1], // 只有1个练习题，应该有2个
          },
        ],
      };
      
      expect(() => repository.loadFromData(invalidData)).toThrow();
    });
    
    test('加载新数据应该清空旧数据', () => {
      repository.loadFromData(mockData);
      expect(repository.getChapterCount()).toBe(2);
      
      const newData: ExerciseDataFile = {
        version: '1.0.0',
        chapters: [mockChapter1],
      };
      
      repository.loadFromData(newData);
      expect(repository.getChapterCount()).toBe(1);
    });
  });
  
  describe('获取章节数据', () => {
    beforeEach(() => {
      repository.loadFromData(mockData);
    });
    
    test('应该能够获取指定章节', () => {
      const chapter = repository.getChapter(1);
      
      expect(chapter).toBeDefined();
      expect(chapter?.chapter).toBe(1);
      expect(chapter?.title).toBe('三和弦的原位');
    });
    
    test('应该对不存在的章节返回undefined', () => {
      const chapter = repository.getChapter(99);
      
      expect(chapter).toBeUndefined();
    });
    
    test('应该能够获取所有章节', () => {
      const chapters = repository.getAllChapters();
      
      expect(chapters).toHaveLength(2);
      expect(chapters[0].chapter).toBe(1);
      expect(chapters[1].chapter).toBe(2);
    });
    
    test('应该能够检查章节是否存在', () => {
      expect(repository.hasChapter(1)).toBe(true);
      expect(repository.hasChapter(2)).toBe(true);
      expect(repository.hasChapter(3)).toBe(false);
    });
  });

  describe('获取练习题', () => {
    beforeEach(() => {
      repository.loadFromData(mockData);
    });
    
    test('应该能够按章节获取练习题', () => {
      const exercises = repository.getExercisesForChapter(1);
      
      expect(exercises).toHaveLength(2);
      expect(exercises[0].id).toBe('1-1');
      expect(exercises[1].id).toBe('1-2');
    });
    
    test('应该对不存在的章节返回空数组', () => {
      const exercises = repository.getExercisesForChapter(99);
      
      expect(exercises).toHaveLength(0);
    });
    
    test('应该能够按章节号和编号获取练习题', () => {
      const exercise = repository.getExercise(1, 1);
      
      expect(exercise).toBeDefined();
      expect(exercise?.id).toBe('1-1');
      expect(exercise?.chapter).toBe(1);
      expect(exercise?.number).toBe(1);
    });
    
    test('应该能够按ID获取练习题', () => {
      const exercise = repository.getExerciseById('1-1');
      
      expect(exercise).toBeDefined();
      expect(exercise?.id).toBe('1-1');
    });
    
    test('应该对不存在的练习题返回undefined', () => {
      const exercise1 = repository.getExercise(99, 1);
      expect(exercise1).toBeUndefined();
      
      const exercise2 = repository.getExerciseById('99-1');
      expect(exercise2).toBeUndefined();
    });
    
    test('应该能够获取所有练习题', () => {
      const exercises = repository.getAllExercises();
      
      expect(exercises).toHaveLength(4);
    });
    
    test('应该能够检查练习题是否存在', () => {
      expect(repository.hasExercise('1-1')).toBe(true);
      expect(repository.hasExercise('1-2')).toBe(true);
      expect(repository.hasExercise('99-1')).toBe(false);
    });
  });
  
  describe('数据管理', () => {
    test('初始状态应该是未加载', () => {
      expect(repository.isLoaded()).toBe(false);
      expect(repository.getChapterCount()).toBe(0);
      expect(repository.getExerciseCount()).toBe(0);
    });
    
    test('应该能够清空数据', () => {
      repository.loadFromData(mockData);
      expect(repository.isLoaded()).toBe(true);
      
      repository.clear();
      expect(repository.isLoaded()).toBe(false);
      expect(repository.getChapterCount()).toBe(0);
      expect(repository.getExerciseCount()).toBe(0);
    });
    
    test('应该能够验证所有数据', () => {
      repository.loadFromData(mockData);
      
      const result = repository.validateAll();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
  
  describe('边界情况', () => {
    test('应该处理空数据', () => {
      const emptyData: ExerciseDataFile = {
        version: '1.0.0',
        chapters: [],
      };
      
      repository.loadFromData(emptyData);
      
      expect(repository.isLoaded()).toBe(true);
      expect(repository.getChapterCount()).toBe(0);
      expect(repository.getAllChapters()).toHaveLength(0);
    });
    
    test('获取练习题应该返回副本而不是引用', () => {
      repository.loadFromData(mockData);
      
      const exercises1 = repository.getExercisesForChapter(1);
      const exercises2 = repository.getExercisesForChapter(1);
      
      // 应该是不同的数组实例
      expect(exercises1).not.toBe(exercises2);
      // 但内容应该相同
      expect(exercises1).toEqual(exercises2);
    });
  });
});
