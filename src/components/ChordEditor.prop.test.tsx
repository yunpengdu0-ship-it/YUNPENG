import { describe, it, expect } from 'vitest';
import { fc } from '@fast-check/vitest';
import { Chord, Note, Voice } from '../types/music';
import { areNotesEqual } from '../core/musicUtils';

/**
 * 属性测试：音符编辑幂等性
 * 
 * 这些测试验证 Property 13: 音符编辑幂等性
 * 对于任意和弦，删除一个音符后再添加相同的音符，应该得到与原始状态等价的和弦
 */

/**
 * 生成有效的音高字符串
 */
const pitchArbitrary = fc.oneof(
  fc.constantFrom('C', 'D', 'E', 'F', 'G', 'A', 'B'),
  fc.constantFrom('C#', 'D#', 'F#', 'G#', 'A#'),
  fc.constantFrom('Db', 'Eb', 'Gb', 'Ab', 'Bb')
);

/**
 * 生成有效的八度数字
 */
const octaveArbitrary = fc.integer({ min: 2, max: 6 });

/**
 * 生成有效的音符
 */
const noteArbitrary: fc.Arbitrary<Note> = fc.record({
  pitch: pitchArbitrary,
  octave: octaveArbitrary,
  duration: fc.constant('w' as const)
});

/**
 * 生成有效的和弦（4个音符）
 */
const chordArbitrary: fc.Arbitrary<Chord> = fc.record({
  notes: fc.tuple(noteArbitrary, noteArbitrary, noteArbitrary, noteArbitrary)
});

/**
 * 生成声部索引
 */
const voiceArbitrary = fc.constantFrom(
  Voice.Soprano,
  Voice.Alto,
  Voice.Tenor,
  Voice.Bass
);

/**
 * 模拟编辑操作：替换指定声部的音符
 */
const editNote = (chord: Chord, voice: Voice, newNote: Note): Chord => {
  const newNotes = [...chord.notes];
  newNotes[voice] = newNote;
  return { notes: newNotes };
};

/**
 * 模拟删除操作：将指定声部的音符替换为默认音符
 */
const deleteNote = (chord: Chord, voice: Voice): Chord => {
  const newNotes = [...chord.notes];
  newNotes[voice] = { pitch: 'C', octave: 4, duration: 'w' };
  return { notes: newNotes };
};

describe('ChordEditor 属性测试 - Property 13: 音符编辑幂等性', () => {
  it.prop([chordArbitrary, voiceArbitrary], { numRuns: 100 })(
    '删除音符后再添加相同音符应该恢复原始状态',
    (originalChord, voice) => {
      // 保存原始音符
      const originalNote = originalChord.notes[voice];

      // 步骤1: 删除音符
      const chordAfterDelete = deleteNote(originalChord, voice);

      // 步骤2: 添加回相同的音符
      const chordAfterRestore = editNote(chordAfterDelete, voice, originalNote);

      // 验证：恢复后的和弦应该与原始和弦相同
      expect(areNotesEqual(
        chordAfterRestore.notes[voice],
        originalChord.notes[voice]
      )).toBe(true);

      // 验证：其他声部不应该受影响
      [Voice.Soprano, Voice.Alto, Voice.Tenor, Voice.Bass].forEach(v => {
        if (v !== voice) {
          expect(areNotesEqual(
            chordAfterRestore.notes[v],
            originalChord.notes[v]
          )).toBe(true);
        }
      });
    }
  );

  it.prop([chordArbitrary, voiceArbitrary, noteArbitrary], { numRuns: 100 })(
    '编辑音符后再编辑回原始音符应该恢复原始状态',
    (originalChord, voice, temporaryNote) => {
      // 保存原始音符
      const originalNote = originalChord.notes[voice];

      // 步骤1: 编辑为临时音符
      const chordAfterEdit = editNote(originalChord, voice, temporaryNote);

      // 步骤2: 编辑回原始音符
      const chordAfterRestore = editNote(chordAfterEdit, voice, originalNote);

      // 验证：恢复后的和弦应该与原始和弦相同
      expect(areNotesEqual(
        chordAfterRestore.notes[voice],
        originalChord.notes[voice]
      )).toBe(true);

      // 验证：其他声部不应该受影响
      [Voice.Soprano, Voice.Alto, Voice.Tenor, Voice.Bass].forEach(v => {
        if (v !== voice) {
          expect(areNotesEqual(
            chordAfterRestore.notes[v],
            originalChord.notes[v]
          )).toBe(true);
        }
      });
    }
  );

  it.prop([chordArbitrary, voiceArbitrary, noteArbitrary], { numRuns: 100 })(
    '多次编辑同一声部，最终状态应该只取决于最后一次编辑',
    (originalChord, voice, finalNote) => {
      // 生成一系列临时音符
      const tempNote1: Note = { pitch: 'D', octave: 4, duration: 'w' };
      const tempNote2: Note = { pitch: 'E', octave: 4, duration: 'w' };
      const tempNote3: Note = { pitch: 'F', octave: 4, duration: 'w' };

      // 进行多次编辑
      let chord = originalChord;
      chord = editNote(chord, voice, tempNote1);
      chord = editNote(chord, voice, tempNote2);
      chord = editNote(chord, voice, tempNote3);
      chord = editNote(chord, voice, finalNote);

      // 验证：最终状态应该只包含最后一次编辑的音符
      expect(areNotesEqual(chord.notes[voice], finalNote)).toBe(true);

      // 验证：其他声部不应该受影响
      [Voice.Soprano, Voice.Alto, Voice.Tenor, Voice.Bass].forEach(v => {
        if (v !== voice) {
          expect(areNotesEqual(
            chord.notes[v],
            originalChord.notes[v]
          )).toBe(true);
        }
      });
    }
  );

  it.prop([chordArbitrary, noteArbitrary], { numRuns: 100 })(
    '编辑不同声部应该相互独立',
    (originalChord, newNote) => {
      // 编辑女高音
      const chordAfterSoprano = editNote(originalChord, Voice.Soprano, newNote);

      // 验证：只有女高音被修改
      expect(areNotesEqual(chordAfterSoprano.notes[Voice.Soprano], newNote)).toBe(true);
      expect(areNotesEqual(chordAfterSoprano.notes[Voice.Alto], originalChord.notes[Voice.Alto])).toBe(true);
      expect(areNotesEqual(chordAfterSoprano.notes[Voice.Tenor], originalChord.notes[Voice.Tenor])).toBe(true);
      expect(areNotesEqual(chordAfterSoprano.notes[Voice.Bass], originalChord.notes[Voice.Bass])).toBe(true);

      // 编辑女低音
      const chordAfterAlto = editNote(chordAfterSoprano, Voice.Alto, newNote);

      // 验证：女高音和女低音都被修改，其他声部不变
      expect(areNotesEqual(chordAfterAlto.notes[Voice.Soprano], newNote)).toBe(true);
      expect(areNotesEqual(chordAfterAlto.notes[Voice.Alto], newNote)).toBe(true);
      expect(areNotesEqual(chordAfterAlto.notes[Voice.Tenor], originalChord.notes[Voice.Tenor])).toBe(true);
      expect(areNotesEqual(chordAfterAlto.notes[Voice.Bass], originalChord.notes[Voice.Bass])).toBe(true);
    }
  );

  it.prop([chordArbitrary, voiceArbitrary], { numRuns: 100 })(
    '编辑操作应该保持和弦结构完整性（始终有4个音符）',
    (originalChord, voice) => {
      const newNote: Note = { pitch: 'A', octave: 4, duration: 'w' };

      // 编辑音符
      const editedChord = editNote(originalChord, voice, newNote);

      // 验证：和弦应该始终有4个音符
      expect(editedChord.notes).toHaveLength(4);

      // 验证：所有音符都应该是有效的
      editedChord.notes.forEach(note => {
        expect(note).toBeDefined();
        expect(note.pitch).toBeDefined();
        expect(note.octave).toBeGreaterThanOrEqual(2);
        expect(note.octave).toBeLessThanOrEqual(6);
        expect(note.duration).toBe('w');
      });
    }
  );

  it.prop([chordArbitrary, voiceArbitrary, noteArbitrary, noteArbitrary], { numRuns: 100 })(
    '编辑操作的顺序不应该影响最终结果（当编辑不同声部时）',
    (originalChord, voice1, note1, note2) => {
      // 选择两个不同的声部
      const voice2 = voice1 === Voice.Soprano ? Voice.Alto : Voice.Soprano;

      // 顺序1: 先编辑 voice1，再编辑 voice2
      let chord1 = originalChord;
      chord1 = editNote(chord1, voice1, note1);
      chord1 = editNote(chord1, voice2, note2);

      // 顺序2: 先编辑 voice2，再编辑 voice1
      let chord2 = originalChord;
      chord2 = editNote(chord2, voice2, note2);
      chord2 = editNote(chord2, voice1, note1);

      // 验证：两种顺序应该得到相同的结果
      expect(areNotesEqual(chord1.notes[voice1], chord2.notes[voice1])).toBe(true);
      expect(areNotesEqual(chord1.notes[voice2], chord2.notes[voice2])).toBe(true);

      // 验证：未编辑的声部应该保持不变
      [Voice.Soprano, Voice.Alto, Voice.Tenor, Voice.Bass].forEach(v => {
        if (v !== voice1 && v !== voice2) {
          expect(areNotesEqual(chord1.notes[v], originalChord.notes[v])).toBe(true);
          expect(areNotesEqual(chord2.notes[v], originalChord.notes[v])).toBe(true);
        }
      });
    }
  );
});
