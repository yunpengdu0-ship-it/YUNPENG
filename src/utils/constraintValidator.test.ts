import { describe, it, expect } from 'vitest';
import {
  validateConstraints,
  isChordForbidden,
  isChordRequired,
  getAvailableChords,
  getConstraintHints,
  canSubmitProgression
} from './constraintValidator';
import { ChordProgression, Chord } from '../types/music';
import { ExerciseConstraints } from '../types/exercise';
import { createNote } from '../core/musicUtils';

describe('constraintValidator', () => {
  const createTestChord = (romanNumeral: string): Chord => ({
    notes: [
      createNote('C', 5),
      createNote('G', 4),
      createNote('E', 4),
      createNote('C', 3)
    ],
    romanNumeral,
    inversion: 0
  });

  describe('validateConstraints', () => {
    it('应该在没有约束时返回有效', () => {
      const progression: ChordProgression = {
        chords: [createTestChord('I'), createTestChord('V')],
        key: 'C major'
      };

      const result = validateConstraints(progression);

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('应该检测缺少必须使用的和弦', () => {
      const progression: ChordProgression = {
        chords: [createTestChord('I'), createTestChord('V')],
        key: 'C major'
      };

      const constraints: ExerciseConstraints = {
        requiredChords: ['IV', 'V']
      };

      const result = validateConstraints(progression, constraints);

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe('required');
      expect(result.violations[0].message).toContain('IV');
    });

    it('应该检测使用了禁止的和弦', () => {
      const progression: ChordProgression = {
        chords: [createTestChord('I'), createTestChord('II')],
        key: 'C major'
      };

      const constraints: ExerciseConstraints = {
        forbiddenChords: ['II']
      };

      const result = validateConstraints(progression, constraints);

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe('forbidden');
      expect(result.violations[0].message).toContain('II');
    });

    it('应该检测和弦数量不足', () => {
      const progression: ChordProgression = {
        chords: [createTestChord('I'), createTestChord('V')],
        key: 'C major'
      };

      const constraints: ExerciseConstraints = {
        minLength: 4
      };

      const result = validateConstraints(progression, constraints);

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe('length');
      expect(result.violations[0].message).toContain('至少需要 4 个');
    });

    it('应该检测和弦数量过多', () => {
      const progression: ChordProgression = {
        chords: [
          createTestChord('I'),
          createTestChord('IV'),
          createTestChord('V'),
          createTestChord('I'),
          createTestChord('I')
        ],
        key: 'C major'
      };

      const constraints: ExerciseConstraints = {
        maxLength: 4
      };

      const result = validateConstraints(progression, constraints);

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe('length');
      expect(result.violations[0].message).toContain('最多允许 4 个');
    });

    it('应该在满足所有约束时返回有效', () => {
      const progression: ChordProgression = {
        chords: [
          createTestChord('I'),
          createTestChord('IV'),
          createTestChord('V'),
          createTestChord('I')
        ],
        key: 'C major'
      };

      const constraints: ExerciseConstraints = {
        requiredChords: ['IV', 'V'],
        forbiddenChords: ['II'],
        minLength: 3,
        maxLength: 5
      };

      const result = validateConstraints(progression, constraints);

      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('应该检测多个违规', () => {
      const progression: ChordProgression = {
        chords: [createTestChord('I'), createTestChord('II')],
        key: 'C major'
      };

      const constraints: ExerciseConstraints = {
        requiredChords: ['IV', 'V'],
        forbiddenChords: ['II'],
        minLength: 4
      };

      const result = validateConstraints(progression, constraints);

      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(1);
    });
  });

  describe('isChordForbidden', () => {
    it('应该识别禁止的和弦', () => {
      const chord = createTestChord('II');
      const constraints: ExerciseConstraints = {
        forbiddenChords: ['II', 'VII']
      };

      expect(isChordForbidden(chord, constraints)).toBe(true);
    });

    it('应该识别允许的和弦', () => {
      const chord = createTestChord('I');
      const constraints: ExerciseConstraints = {
        forbiddenChords: ['II', 'VII']
      };

      expect(isChordForbidden(chord, constraints)).toBe(false);
    });

    it('应该在没有约束时返回false', () => {
      const chord = createTestChord('II');

      expect(isChordForbidden(chord)).toBe(false);
    });

    it('应该在和弦没有罗马数字时返回false', () => {
      const chord: Chord = {
        notes: [
          createNote('C', 5),
          createNote('G', 4),
          createNote('E', 4),
          createNote('C', 3)
        ]
      };

      const constraints: ExerciseConstraints = {
        forbiddenChords: ['II']
      };

      expect(isChordForbidden(chord, constraints)).toBe(false);
    });
  });

  describe('isChordRequired', () => {
    it('应该识别必需的和弦', () => {
      const chord = createTestChord('IV');
      const constraints: ExerciseConstraints = {
        requiredChords: ['IV', 'V']
      };

      expect(isChordRequired(chord, constraints)).toBe(true);
    });

    it('应该识别非必需的和弦', () => {
      const chord = createTestChord('I');
      const constraints: ExerciseConstraints = {
        requiredChords: ['IV', 'V']
      };

      expect(isChordRequired(chord, constraints)).toBe(false);
    });

    it('应该在没有约束时返回false', () => {
      const chord = createTestChord('IV');

      expect(isChordRequired(chord)).toBe(false);
    });
  });

  describe('getAvailableChords', () => {
    it('应该排除禁止的和弦', () => {
      const allChords = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
      const constraints: ExerciseConstraints = {
        forbiddenChords: ['II', 'VII']
      };

      const available = getAvailableChords(allChords, constraints);

      expect(available).toEqual(['I', 'III', 'IV', 'V', 'VI']);
      expect(available).not.toContain('II');
      expect(available).not.toContain('VII');
    });

    it('应该在没有约束时返回所有和弦', () => {
      const allChords = ['I', 'II', 'III', 'IV', 'V'];

      const available = getAvailableChords(allChords);

      expect(available).toEqual(allChords);
    });
  });

  describe('getConstraintHints', () => {
    it('应该生成约束提示', () => {
      const constraints: ExerciseConstraints = {
        requiredChords: ['IV', 'V'],
        forbiddenChords: ['II'],
        minLength: 3,
        maxLength: 5
      };

      const hints = getConstraintHints(constraints);

      expect(hints).toHaveLength(4);
      expect(hints[0]).toContain('必须使用: IV, V');
      expect(hints[1]).toContain('禁止使用: II');
      expect(hints[2]).toContain('最少 3 个和弦');
      expect(hints[3]).toContain('最多 5 个和弦');
    });

    it('应该在没有约束时返回空数组', () => {
      const hints = getConstraintHints();

      expect(hints).toHaveLength(0);
    });

    it('应该只生成存在的约束提示', () => {
      const constraints: ExerciseConstraints = {
        requiredChords: ['IV']
      };

      const hints = getConstraintHints(constraints);

      expect(hints).toHaveLength(1);
      expect(hints[0]).toContain('必须使用: IV');
    });
  });

  describe('canSubmitProgression', () => {
    it('应该在满足所有条件时返回true', () => {
      const progression: ChordProgression = {
        chords: [
          createTestChord('I'),
          createTestChord('IV'),
          createTestChord('V'),
          createTestChord('I')
        ],
        key: 'C major'
      };

      const constraints: ExerciseConstraints = {
        requiredChords: ['IV', 'V']
      };

      expect(canSubmitProgression(progression, constraints, 4)).toBe(true);
    });

    it('应该在长度不匹配时返回false', () => {
      const progression: ChordProgression = {
        chords: [createTestChord('I'), createTestChord('V')],
        key: 'C major'
      };

      expect(canSubmitProgression(progression, undefined, 4)).toBe(false);
    });

    it('应该在违反约束时返回false', () => {
      const progression: ChordProgression = {
        chords: [
          createTestChord('I'),
          createTestChord('II'),
          createTestChord('V'),
          createTestChord('I')
        ],
        key: 'C major'
      };

      const constraints: ExerciseConstraints = {
        forbiddenChords: ['II']
      };

      expect(canSubmitProgression(progression, constraints, 4)).toBe(false);
    });
  });
});
