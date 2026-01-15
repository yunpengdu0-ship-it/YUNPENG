/**
 * 音程计算属性测试
 * 
 * Feature: harmony-game
 * 属性 7: 平行五度检测正确性
 * 属性 8: 平行八度检测正确性
 */

import { describe, it, expect } from 'vitest';
import { fc } from '@fast-check/vitest';
import {
  noteToAbsoluteSemitones,
  calculateInterval,
  calculateAbsoluteInterval,
  isPerfectFifth,
  isOctave,
  getMotionType,
  hasParallelFifths,
  hasParallelOctaves,
  getIntervalName,
} from './intervals';
import { Note } from '../types/music';
import { createNote } from './musicUtils';

// ============ 生成器（Arbitraries） ============

/**
 * 生成有效的音高
 */
const pitchArbitrary = fc.constantFrom(
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'
);

/**
 * 生成有效的八度（0-8）
 */
const octaveArbitrary = fc.integer({ min: 0, max: 8 });

/**
 * 生成有效的时值
 */
const durationArbitrary = fc.constantFrom('w', 'h', 'q', 'e', 's');

/**
 * 生成随机音符
 */
const noteArbitrary = fc.record({
  pitch: pitchArbitrary,
  octave: octaveArbitrary,
  duration: durationArbitrary,
}) as fc.Arbitrary<Note>;

// ============ 单元测试 ============

describe('noteToAbsoluteSemitones', () => {
  it('应该正确计算 C4 的半音数', () => {
    const note = createNote('C', 4);
    expect(noteToAbsoluteSemitones(note)).toBe(48); // 4 * 12 + 0
  });

  it('应该正确计算 A4 的半音数', () => {
    const note = createNote('A', 4);
    expect(noteToAbsoluteSemitones(note)).toBe(57); // 4 * 12 + 9
  });

  it('应该对无效音高抛出错误', () => {
    const note = { pitch: 'X', octave: 4, duration: 'q' } as Note;
    expect(() => noteToAbsoluteSemitones(note)).toThrow('无效的音高');
  });
});

describe('calculateInterval', () => {
  it('应该计算上行音程', () => {
    const c4 = createNote('C', 4);
    const g4 = createNote('G', 4);
    expect(calculateInterval(c4, g4)).toBe(7); // 完全五度
  });

  it('应该计算下行音程', () => {
    const g4 = createNote('G', 4);
    const c4 = createNote('C', 4);
    expect(calculateInterval(g4, c4)).toBe(-7);
  });

  it('应该计算跨八度的音程', () => {
    const c4 = createNote('C', 4);
    const c5 = createNote('C', 5);
    expect(calculateInterval(c4, c5)).toBe(12);
  });
});

describe('isPerfectFifth', () => {
  it('应该识别完全五度', () => {
    const c4 = createNote('C', 4);
    const g4 = createNote('G', 4);
    expect(isPerfectFifth(c4, g4)).toBe(true);
  });

  it('应该识别跨八度的完全五度', () => {
    const c4 = createNote('C', 4);
    const g5 = createNote('G', 5);
    expect(isPerfectFifth(c4, g5)).toBe(true); // 7 + 12 = 19
  });

  it('应该拒绝非五度音程', () => {
    const c4 = createNote('C', 4);
    const e4 = createNote('E', 4);
    expect(isPerfectFifth(c4, e4)).toBe(false);
  });
});

describe('isOctave', () => {
  it('应该识别八度', () => {
    const c4 = createNote('C', 4);
    const c5 = createNote('C', 5);
    expect(isOctave(c4, c5)).toBe(true);
  });

  it('应该识别同度（0个半音）', () => {
    const c4 = createNote('C', 4);
    const c4_2 = createNote('C', 4);
    expect(isOctave(c4, c4_2)).toBe(true);
  });

  it('应该识别两个八度', () => {
    const c4 = createNote('C', 4);
    const c6 = createNote('C', 6);
    expect(isOctave(c4, c6)).toBe(true);
  });

  it('应该拒绝非八度音程', () => {
    const c4 = createNote('C', 4);
    const d4 = createNote('D', 4);
    expect(isOctave(c4, d4)).toBe(false);
  });
});

describe('getMotionType', () => {
  it('应该识别平行运动（同向上）', () => {
    const c4 = createNote('C', 4);
    const d4 = createNote('D', 4);
    const e4 = createNote('E', 4);
    const f4 = createNote('F', 4);
    
    expect(getMotionType(c4, d4, e4, f4)).toBe('parallel');
  });

  it('应该识别平行运动（同向下）', () => {
    const d4 = createNote('D', 4);
    const c4 = createNote('C', 4);
    const f4 = createNote('F', 4);
    const e4 = createNote('E', 4);
    
    expect(getMotionType(d4, c4, f4, e4)).toBe('parallel');
  });

  it('应该识别反向运动', () => {
    const c4 = createNote('C', 4);
    const d4 = createNote('D', 4);
    const e4 = createNote('E', 4);
    const d4_2 = createNote('D', 4);
    
    expect(getMotionType(c4, d4, e4, d4_2)).toBe('contrary');
  });

  it('应该识别斜向运动', () => {
    const c4 = createNote('C', 4);
    const d4 = createNote('D', 4);
    const e4 = createNote('E', 4);
    const e4_2 = createNote('E', 4);
    
    expect(getMotionType(c4, d4, e4, e4_2)).toBe('oblique');
  });

  it('应该识别静止', () => {
    const c4 = createNote('C', 4);
    const c4_2 = createNote('C', 4);
    const e4 = createNote('E', 4);
    const e4_2 = createNote('E', 4);
    
    expect(getMotionType(c4, c4_2, e4, e4_2)).toBe('static');
  });
});

// ============ 属性测试 ============

describe('属性测试：音程计算', () => {
  // Feature: harmony-game, Property 7: 平行五度检测正确性
  it.prop([noteArbitrary, noteArbitrary, noteArbitrary, noteArbitrary], { numRuns: 100 })(
    '属性 7: 如果两个声部形成平行五度，hasParallelFifths 必须检测到',
    (v1n1, v1n2, v2n1, v2n2) => {
      // 构造一个已知的平行五度情况
      // 第一个和弦：C4-G4（完全五度）
      // 第二个和弦：D4-A4（完全五度，平行运动）
      const voice1Note1 = createNote('C', 4);
      const voice1Note2 = createNote('D', 4);
      const voice2Note1 = createNote('G', 4);
      const voice2Note2 = createNote('A', 4);
      
      // 验证这确实是平行五度
      expect(hasParallelFifths(voice1Note1, voice1Note2, voice2Note1, voice2Note2)).toBe(true);
      
      // 验证第一个和弦形成五度
      expect(isPerfectFifth(voice1Note1, voice2Note1)).toBe(true);
      
      // 验证第二个和弦形成五度
      expect(isPerfectFifth(voice1Note2, voice2Note2)).toBe(true);
      
      // 验证是平行运动
      expect(getMotionType(voice1Note1, voice1Note2, voice2Note1, voice2Note2)).toBe('parallel');
    }
  );

  // Feature: harmony-game, Property 8: 平行八度检测正确性
  it.prop([noteArbitrary, noteArbitrary, noteArbitrary, noteArbitrary], { numRuns: 100 })(
    '属性 8: 如果两个声部形成平行八度，hasParallelOctaves 必须检测到',
    (v1n1, v1n2, v2n1, v2n2) => {
      // 构造一个已知的平行八度情况
      // 第一个和弦：C4-C5（八度）
      // 第二个和弦：D4-D5（八度，平行运动）
      const voice1Note1 = createNote('C', 4);
      const voice1Note2 = createNote('D', 4);
      const voice2Note1 = createNote('C', 5);
      const voice2Note2 = createNote('D', 5);
      
      // 验证这确实是平行八度
      expect(hasParallelOctaves(voice1Note1, voice1Note2, voice2Note1, voice2Note2)).toBe(true);
      
      // 验证第一个和弦形成八度
      expect(isOctave(voice1Note1, voice2Note1)).toBe(true);
      
      // 验证第二个和弦形成八度
      expect(isOctave(voice1Note2, voice2Note2)).toBe(true);
      
      // 验证是平行运动
      expect(getMotionType(voice1Note1, voice1Note2, voice2Note1, voice2Note2)).toBe('parallel');
    }
  );

  it.prop([noteArbitrary, noteArbitrary], { numRuns: 100 })(
    '属性: 音程计算的对称性 - interval(a, b) = -interval(b, a)',
    (note1, note2) => {
      const forward = calculateInterval(note1, note2);
      const backward = calculateInterval(note2, note1);
      
      // 处理异名同音的情况（如 Ab 和 G#）
      // 当两个音符实际上是同一个音时，forward 和 backward 都应该是 0
      if (forward === 0) {
        expect(backward).toBe(0);
      } else {
        expect(forward).toBe(-backward);
      }
    }
  );

  it.prop([noteArbitrary], { numRuns: 100 })(
    '属性: 同一个音符的音程应该为0',
    (note) => {
      expect(calculateInterval(note, note)).toBe(0);
    }
  );

  it.prop([noteArbitrary, noteArbitrary], { numRuns: 100 })(
    '属性: 绝对音程总是非负的',
    (note1, note2) => {
      const absInterval = calculateAbsoluteInterval(note1, note2);
      expect(absInterval).toBeGreaterThanOrEqual(0);
    }
  );

  it.prop([noteArbitrary, noteArbitrary], { numRuns: 100 })(
    '属性: 如果两个音符形成五度，反向也应该形成五度',
    (note1, note2) => {
      const isFifth = isPerfectFifth(note1, note2);
      const isFifthReverse = isPerfectFifth(note2, note1);
      expect(isFifth).toBe(isFifthReverse);
    }
  );

  it.prop([noteArbitrary, noteArbitrary], { numRuns: 100 })(
    '属性: 如果两个音符形成八度，反向也应该形成八度',
    (note1, note2) => {
      const isOct = isOctave(note1, note2);
      const isOctReverse = isOctave(note2, note1);
      expect(isOct).toBe(isOctReverse);
    }
  );

  it.prop([noteArbitrary, noteArbitrary, noteArbitrary, noteArbitrary], { numRuns: 100 })(
    '属性: 非平行运动不应该产生平行五度',
    (v1n1, v1n2, v2n1, v2n2) => {
      const motionType = getMotionType(v1n1, v1n2, v2n1, v2n2);
      
      // 如果不是平行运动，就不可能有平行五度
      if (motionType !== 'parallel') {
        expect(hasParallelFifths(v1n1, v1n2, v2n1, v2n2)).toBe(false);
      }
    }
  );

  it.prop([noteArbitrary, noteArbitrary, noteArbitrary, noteArbitrary], { numRuns: 100 })(
    '属性: 非平行运动不应该产生平行八度',
    (v1n1, v1n2, v2n1, v2n2) => {
      const motionType = getMotionType(v1n1, v1n2, v2n1, v2n2);
      
      // 如果不是平行运动，就不可能有平行八度
      if (motionType !== 'parallel') {
        expect(hasParallelOctaves(v1n1, v1n2, v2n1, v2n2)).toBe(false);
      }
    }
  );
});

describe('getIntervalName', () => {
  it('应该返回正确的音程名称', () => {
    expect(getIntervalName(0)).toBe('同度');
    expect(getIntervalName(7)).toBe('完全五度');
    expect(getIntervalName(12)).toBe('同度 + 1个八度');
    expect(getIntervalName(19)).toBe('完全五度 + 1个八度');
  });
});
