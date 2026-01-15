/**
 * 声部超出音域检测规则
 * 
 * 检测音符是否超出声部的合理范围
 */

import { ValidationRule, RulePriority, createSuccessResult, createFailureResult, createValidationError } from '../types';
import { ChordProgression } from '../../types/music';
import { Voice } from '../../types/music';
import { isNoteInVoiceRange, VOICE_RANGES, hasVoiceCrossingDetailed } from '../../core/voiceRanges';

/**
 * 声部超出音域检测规则
 * 
 * 检查每个声部的音符是否在其合理的音域范围内
 */
export const voiceRangeRule: ValidationRule = {
  id: 'voice-range',
  name: '声部音域检测',
  chapter: 1,
  priority: RulePriority.STRUCTURE,
  description: '检测音符是否超出声部的合理范围。每个声部都有其自然的音域，超出范围会导致演唱或演奏困难。',
  
  validate: (progression: ChordProgression, chordIndex: number) => {
    const chord = progression.chords[chordIndex];
    const errors = [];
    
    const voiceNames = ['女高音', '女低音', '男高音', '男低音'];
    const voices = [Voice.Soprano, Voice.Alto, Voice.Tenor, Voice.Bass];
    
    // 检查每个声部的音符是否在范围内
    for (let i = 0; i < 4; i++) {
      const note = chord.notes[i];
      const voice = voices[i];
      
      // 检查音符是否存在且有效
      if (!note || !note.pitch) {
        continue;
      }
      
      if (!isNoteInVoiceRange(note, voice)) {
        const range = VOICE_RANGES[voice];
        // 将半音数转换为音符名称
        const minNote = getSemitoneName(range.min);
        const maxNote = getSemitoneName(range.max);
        
        errors.push(
          createValidationError(
            'voice-range',
            '声部音域检测',
            `${voiceNames[i]}的音符${note.pitch}${note.octave}超出了合理音域范围（${minNote} - ${maxNote}）`,
            '第1章：和弦连接基础',
            [i],
            [chordIndex]
          )
        );
      }
    }
    
    if (errors.length > 0) {
      return createFailureResult(errors);
    }
    
    return createSuccessResult();
  },
};

/**
 * 将半音数转换为音符名称（用于显示）
 */
function getSemitoneName(semitones: number): string {
  const octave = Math.floor(semitones / 12);
  const pitchIndex = semitones % 12;
  const pitches = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return `${pitches[pitchIndex]}${octave}`;
}
