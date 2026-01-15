/**
 * ExerciseRepository 属性测试
 * 
 * 使用 fast-check 进行基于属性的测试
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { ExerciseRepository } from './ExerciseRepository';
import { ExerciseDataFile, ChapterData, Exercise } from '../types/exercise';
import { Note, Chord } from '../types/music';

// 生成随机音符
const noteArbitrary = fc.record({
  pitch: fc.constantFrom('C', 'D', 'E', 'F', 'G', 'A', 'B').chain(pitch =>
    fc.constantFrom('', '#', 'b').map(accidental =>
      fc.integer({ min: 2, max: 5 }).map(octave => `${pitch}${accidental}${octave}`)
    )
  ).chain(x => x),
  octave: fc.integer({ min: 2, max: 5 }),
  duration: fc.constant('w'),
}) as fc.Arbitrary<Note>;

// 生成随机和弦
const chordArbitrary = fc.record({
  notes: fc.array(noteArbitrary, { minLength: 4, maxLength: 4 }),
  romanNumeral: fc.constantFrom('I', 'II', 'III', 'IV', 'V', 'VI', 'VII'),
  inversion: fc.integer({ min: 0, max: 2 }),
}) as fc.Arbitrary<Chord>;

// 生成随机练习题
const exerciseArbitrary = (chapter: number, number: number) => fc.record({
  id: fc.constant(`${chapter}-${number}`),
  chapter: fc.constant(chapter),
  number: fc.constant(number),
  instructions: fc.string({ minLength: 10, maxLength: 100 }),
  key: fc.constantFrom('C major', 'G major', 'D major', 'A minor', 'E minor'),
  startingChords: fc.array(chordArbitrary, { minLength: 1, maxLength: 2 }),
  expectedLength: fc.integer({ min: 2, max: 8 }),
  solution: fc.record({
    chords: fc.array(chordArbitrary, { minLength: 2, maxLength: 8 }),
    key: fc.constantFrom('C major', 'G major', 'D major', 'A minor', 'E minor'),
  }),
}) as fc.Arbitrary<Exercise>;

// 生成随机章节数据
const chapterArbitrary = (chapter: number) => fc.record({
  chapter: fc.constant(chapter),
  title: fc.string({ minLength: 5, maxLength: 50 }),
  exercises: fc.tuple(
    exerciseArbitrary(chapter, 1),
    exerciseArbitrary(chapter, 2)
  ),
}) as fc.Arbitrary<ChapterData>;

describe('ExerciseRepository 属性测试', () => {
  // Feature: harmony-game, Property 11: 练习题数据完整性
  test.prop([fc.integer({ min: 1, max: 60 }), chapterArbitrary(1)])(
    '属性11: 每个章节必须恰好有2个练习题',
    (chapterNum, chapterData) => {
      const repository = new ExerciseRepository();
      
      // 使用生成的章节号更新章节数据
      const updatedChapterData = {
        ...chapterData,
        chapter: chapterNum,
        exercises: [
          { ...chapterData.exercises[0], id: `${chapterNum}-1`, chapter: chapterNum, number: 1 },
          { ...chapterData.exercises[1], id: `${chapterNum}-2`, chapter: chapterNum, number: 2 },
        ],
      };
      
      const data: ExerciseDataFile = {
        version: '1.0.0',
        chapters: [updatedChapterData],
      };
      
      repository.loadFromData(data);
      
      // 验证章节存在
      expect(repository.hasChapter(chapterNum)).toBe(true);
      
      // 验证恰好有2个练习题
      const exercises = repository.getExercisesForChapter(chapterNum);
      expect(exercises).toHaveLength(2);
      
      // 验证练习题编号正确
      expect(exercises[0].number).toBe(1);
      expect(exercises[1].number).toBe(2);
      
      // 验证练习题ID格式正确
      expect(exercises[0].id).toBe(`${chapterNum}-1`);
      expect(exercises[1].id).toBe(`${chapterNum}-2`);
      
      // 验证每个练习题都包含必需字段
      for (const exercise of exercises) {
        expect(exercise.id).toBeTruthy();
        expect(exercise.chapter).toBe(chapterNum);
        expect(exercise.instructions).toBeTruthy();
        expect(exercise.key).toBeTruthy();
        expect(exercise.startingChords).toBeDefined();
        expect(exercise.startingChords.length).toBeGreaterThan(0);
        expect(exercise.expectedLength).toBeGreaterThanOrEqual(2);
        expect(exercise.solution).toBeDefined();
        expect(exercise.solution.chords).toBeDefined();
        expect(exercise.solution.chords.length).toBeGreaterThan(0);
      }
    },
    { numRuns: 100 }
  );
  
  // 额外属性：数据加载的幂等性
  test.prop([fc.integer({ min: 1, max: 10 }), chapterArbitrary(1)])(
    '额外属性: 多次加载相同数据应该得到相同结果',
    (chapterNum, chapterData) => {
      const repository1 = new ExerciseRepository();
      const repository2 = new ExerciseRepository();
      
      // 使用生成的章节号更新章节数据
      const updatedChapterData = {
        ...chapterData,
        chapter: chapterNum,
        exercises: [
          { ...chapterData.exercises[0], id: `${chapterNum}-1`, chapter: chapterNum, number: 1 },
          { ...chapterData.exercises[1], id: `${chapterNum}-2`, chapter: chapterNum, number: 2 },
        ],
      };
      
      const data: ExerciseDataFile = {
        version: '1.0.0',
        chapters: [updatedChapterData],
      };
      
      // 加载两次
      repository1.loadFromData(data);
      repository2.loadFromData(data);
      
      // 验证结果相同
      expect(repository1.getChapterCount()).toBe(repository2.getChapterCount());
      expect(repository1.getExerciseCount()).toBe(repository2.getExerciseCount());
      
      const exercises1 = repository1.getExercisesForChapter(chapterNum);
      const exercises2 = repository2.getExercisesForChapter(chapterNum);
      
      expect(exercises1.length).toBe(exercises2.length);
      expect(exercises1[0].id).toBe(exercises2[0].id);
      expect(exercises1[1].id).toBe(exercises2[1].id);
    },
    { numRuns: 100 }
  );
  
  // 额外属性：查询的一致性
  test.prop([fc.integer({ min: 1, max: 10 }), chapterArbitrary(1)])(
    '额外属性: 不同查询方式应该返回相同的练习题',
    (chapterNum, chapterData) => {
      const repository = new ExerciseRepository();
      
      // 使用生成的章节号更新章节数据
      const updatedChapterData = {
        ...chapterData,
        chapter: chapterNum,
        exercises: [
          { ...chapterData.exercises[0], id: `${chapterNum}-1`, chapter: chapterNum, number: 1 },
          { ...chapterData.exercises[1], id: `${chapterNum}-2`, chapter: chapterNum, number: 2 },
        ],
      };
      
      const data: ExerciseDataFile = {
        version: '1.0.0',
        chapters: [updatedChapterData],
      };
      
      repository.loadFromData(data);
      
      // 通过不同方式获取练习题
      const byChapter = repository.getExercisesForChapter(chapterNum);
      const byId1 = repository.getExerciseById(`${chapterNum}-1`);
      const byId2 = repository.getExerciseById(`${chapterNum}-2`);
      const byChapterAndNumber1 = repository.getExercise(chapterNum, 1);
      const byChapterAndNumber2 = repository.getExercise(chapterNum, 2);
      
      // 验证结果一致
      expect(byChapter).toHaveLength(2);
      expect(byId1).toBeDefined();
      expect(byId2).toBeDefined();
      expect(byChapterAndNumber1).toBeDefined();
      expect(byChapterAndNumber2).toBeDefined();
      
      expect(byChapter[0].id).toBe(byId1!.id);
      expect(byChapter[1].id).toBe(byId2!.id);
      expect(byChapter[0].id).toBe(byChapterAndNumber1!.id);
      expect(byChapter[1].id).toBe(byChapterAndNumber2!.id);
    },
    { numRuns: 100 }
  );
});
