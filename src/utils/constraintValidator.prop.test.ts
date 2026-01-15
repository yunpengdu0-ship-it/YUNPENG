import { describe, it, expect } from 'vitest';
import { fc } from '@fast-check/vitest';
import { validateConstraints, canSubmitProgression } from './constraintValidator';
import { ChordProgression, Chord } from '../types/music';
import { ExerciseConstraints } from '../types/exercise';
import { createNote } from '../core/musicUtils';

/**
 * 属性测试：练习题约束执行
 * 
 * 这些测试验证 Property 14: 练习题约束执行
 * 对于任意带有约束条件的练习题和玩家输入，如果输入违反了练习题的约束，
 * 则系统必须拒绝该输入
 */

/**
 * 生成罗马数字和弦标记
 */
const romanNumeralArbitrary = fc.constantFrom(
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII',
  'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii',
  'I6', 'IV6', 'V6', 'I64', 'V64'
);

/**
 * 生成和弦
 */
const chordArbitrary: fc.Arbitrary<Chord> = fc.record({
  notes: fc.constant([
    createNote('C', 5),
    createNote('G', 4),
    createNote('E', 4),
    createNote('C', 3)
  ]),
  romanNumeral: fc.option(romanNumeralArbitrary, { nil: undefined }),
  inversion: fc.constantFrom(0, 1, 2)
});

/**
 * 生成和弦进行
 */
const progressionArbitrary: fc.Arbitrary<ChordProgression> = fc.record({
  chords: fc.array(chordArbitrary, { minLength: 1, maxLength: 10 }),
  key: fc.constantFrom('C major', 'G major', 'D major', 'A minor')
});

/**
 * 生成约束条件
 */
const constraintsArbitrary: fc.Arbitrary<ExerciseConstraints> = fc.record({
  requiredChords: fc.option(
    fc.array(romanNumeralArbitrary, { minLength: 1, maxLength: 3 }),
    { nil: undefined }
  ),
  forbiddenChords: fc.option(
    fc.array(romanNumeralArbitrary, { minLength: 1, maxLength: 3 }),
    { nil: undefined }
  ),
  minLength: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
  maxLength: fc.option(fc.integer({ min: 5, max: 10 }), { nil: undefined })
});

describe('constraintValidator 属性测试 - Property 14: 练习题约束执行', () => {
  it.prop([progressionArbitrary, constraintsArbitrary], { numRuns: 100 })(
    '如果和弦进行违反约束，验证结果必须标记为无效',
    (progression, constraints) => {
      const result = validateConstraints(progression, constraints);

      // 如果有违规，isValid 必须为 false
      if (result.violations.length > 0) {
        expect(result.isValid).toBe(false);
      }

      // 如果 isValid 为 true，violations 必须为空
      if (result.isValid) {
        expect(result.violations).toHaveLength(0);
      }
    }
  );

  it.prop([progressionArbitrary], { numRuns: 100 })(
    '没有约束时，所有和弦进行都应该有效',
    (progression) => {
      const result = validateConstraints(progression, undefined);

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    }
  );

  it.prop([romanNumeralArbitrary], { numRuns: 100 })(
    '如果和弦进行包含所有必需的和弦，必需和弦约束应该满足',
    (requiredChord) => {
      const progression: ChordProgression = {
        chords: [
          {
            notes: [
              createNote('C', 5),
              createNote('G', 4),
              createNote('E', 4),
              createNote('C', 3)
            ],
            romanNumeral: requiredChord
          }
        ],
        key: 'C major'
      };

      const constraints: ExerciseConstraints = {
        requiredChords: [requiredChord]
      };

      const result = validateConstraints(progression, constraints);

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    }
  );

  it.prop([romanNumeralArbitrary], { numRuns: 100 })(
    '如果和弦进行包含禁止的和弦，禁止和弦约束应该违反',
    (forbiddenChord) => {
      const progression: ChordProgression = {
        chords: [
          {
            notes: [
              createNote('C', 5),
              createNote('G', 4),
              createNote('E', 4),
              createNote('C', 3)
            ],
            romanNumeral: forbiddenChord
          }
        ],
        key: 'C major'
      };

      const constraints: ExerciseConstraints = {
        forbiddenChords: [forbiddenChord]
      };

      const result = validateConstraints(progression, constraints);

      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].type).toBe('forbidden');
    }
  );

  it.prop([fc.integer({ min: 2, max: 10 })], { numRuns: 100 })(
    '如果和弦数量小于最小长度，长度约束应该违反',
    (minLength) => {
      // 创建一个长度小于 minLength 的和弦进行
      const actualLength = minLength - 1;
      const chords = Array(actualLength).fill(null).map(() => ({
        notes: [
          createNote('C', 5),
          createNote('G', 4),
          createNote('E', 4),
          createNote('C', 3)
        ]
      }));

      const progression: ChordProgression = {
        chords,
        key: 'C major'
      };

      const constraints: ExerciseConstraints = {
        minLength
      };

      const result = validateConstraints(progression, constraints);

      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.type === 'length')).toBe(true);
    }
  );

  it.prop([fc.integer({ min: 1, max: 10 })], { numRuns: 100 })(
    '如果和弦数量大于最大长度，长度约束应该违反',
    (maxLength) => {
      // 创建一个长度大于 maxLength 的和弦进行
      const actualLength = maxLength + 1;
      const chords = Array(actualLength).fill(null).map(() => ({
        notes: [
          createNote('C', 5),
          createNote('G', 4),
          createNote('E', 4),
          createNote('C', 3)
        ]
      }));

      const progression: ChordProgression = {
        chords,
        key: 'C major'
      };

      const constraints: ExerciseConstraints = {
        maxLength
      };

      const result = validateConstraints(progression, constraints);

      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.type === 'length')).toBe(true);
    }
  );

  it.prop([fc.integer({ min: 2, max: 10 })], { numRuns: 100 })(
    '如果和弦数量在最小和最大长度之间，长度约束应该满足',
    (length) => {
      const chords = Array(length).fill(null).map(() => ({
        notes: [
          createNote('C', 5),
          createNote('G', 4),
          createNote('E', 4),
          createNote('C', 3)
        ]
      }));

      const progression: ChordProgression = {
        chords,
        key: 'C major'
      };

      const constraints: ExerciseConstraints = {
        minLength: length - 1,
        maxLength: length + 1
      };

      const result = validateConstraints(progression, constraints);

      // 不应该有长度违规
      expect(result.violations.every(v => v.type !== 'length')).toBe(true);
    }
  );

  it.prop([progressionArbitrary, constraintsArbitrary, fc.integer({ min: 1, max: 10 })], { numRuns: 100 })(
    'canSubmitProgression 应该在长度不匹配时返回 false',
    (progression, constraints, expectedLength) => {
      // 确保长度不匹配
      if (progression.chords.length === expectedLength) {
        progression.chords.pop();
      }

      const result = canSubmitProgression(progression, constraints, expectedLength);

      expect(result).toBe(false);
    }
  );

  it.prop([romanNumeralArbitrary, fc.integer({ min: 1, max: 5 })], { numRuns: 100 })(
    'canSubmitProgression 应该在满足所有条件时返回 true',
    (chord, length) => {
      const chords = Array(length).fill(null).map(() => ({
        notes: [
          createNote('C', 5),
          createNote('G', 4),
          createNote('E', 4),
          createNote('C', 3)
        ],
        romanNumeral: chord
      }));

      const progression: ChordProgression = {
        chords,
        key: 'C major'
      };

      const constraints: ExerciseConstraints = {
        requiredChords: [chord]
      };

      const result = canSubmitProgression(progression, constraints, length);

      expect(result).toBe(true);
    }
  );

  it.prop([romanNumeralArbitrary, romanNumeralArbitrary], { numRuns: 100 })(
    '违反约束的和弦进行不应该通过验证',
    (requiredChord, actualChord) => {
      // 确保 actualChord 不等于 requiredChord
      if (actualChord === requiredChord) {
        return; // 跳过这个测试用例
      }

      const progression: ChordProgression = {
        chords: [
          {
            notes: [
              createNote('C', 5),
              createNote('G', 4),
              createNote('E', 4),
              createNote('C', 3)
            ],
            romanNumeral: actualChord
          }
        ],
        key: 'C major'
      };

      const constraints: ExerciseConstraints = {
        requiredChords: [requiredChord]
      };

      const result = validateConstraints(progression, constraints);

      // 应该有违规（缺少必需的和弦）
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    }
  );

  it.prop([fc.array(romanNumeralArbitrary, { minLength: 1, maxLength: 5 })], { numRuns: 100 })(
    '包含所有必需和弦的和弦进行应该满足必需和弦约束',
    (requiredChords) => {
      // 创建包含所有必需和弦的和弦进行
      const chords = requiredChords.map(rn => ({
        notes: [
          createNote('C', 5),
          createNote('G', 4),
          createNote('E', 4),
          createNote('C', 3)
        ],
        romanNumeral: rn
      }));

      const progression: ChordProgression = {
        chords,
        key: 'C major'
      };

      const constraints: ExerciseConstraints = {
        requiredChords
      };

      const result = validateConstraints(progression, constraints);

      // 不应该有必需和弦违规
      expect(result.violations.every(v => v.type !== 'required')).toBe(true);
    }
  );
});
