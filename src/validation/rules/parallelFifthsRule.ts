/**
 * 平行五度检测规则
 * 
 * 检测任意两个声部之间的平行五度运动
 * 这是和声学中最重要的禁止规则之一
 */

import { ValidationRule, RulePriority, createSuccessResult, createFailureResult, createValidationError } from '../types';
import { ChordProgression } from '../../types/music';
import { hasParallelFifths } from '../../core/intervals';

/**
 * 平行五度检测规则
 * 
 * 检查和弦进行中是否存在平行五度
 * 平行五度是指两个声部以相同方向移动，且在两个和弦中都形成完全五度音程
 */
export const parallelFifthsRule: ValidationRule = {
  id: 'parallel-fifths',
  name: '平行五度检测',
  chapter: 1,
  priority: RulePriority.VOICE_LEADING,
  description: '检测任意两个声部之间的平行五度运动。平行五度会削弱声部的独立性，在传统和声中是被禁止的。',
  
  validate: (progression: ChordProgression, chordIndex: number) => {
    // 如果是第一个和弦，无法检查连接
    if (chordIndex === 0) {
      return createSuccessResult();
    }
    
    const currentChord = progression.chords[chordIndex];
    const previousChord = progression.chords[chordIndex - 1];
    
    // 检查所有声部对之间是否存在平行五度
    const errors = [];
    const voiceNames = ['女高音', '女低音', '男高音', '男低音'];
    
    for (let voice1 = 0; voice1 < 4; voice1++) {
      for (let voice2 = voice1 + 1; voice2 < 4; voice2++) {
        const note1Prev = previousChord.notes[voice1];
        const note1Curr = currentChord.notes[voice1];
        const note2Prev = previousChord.notes[voice2];
        const note2Curr = currentChord.notes[voice2];
        
        // 检查是否存在平行五度
        if (hasParallelFifths(note1Prev, note1Curr, note2Prev, note2Curr)) {
          errors.push(
            createValidationError(
              'parallel-fifths',
              '平行五度检测',
              `${voiceNames[voice1]}和${voiceNames[voice2]}之间存在平行五度（${note1Prev.pitch} → ${note1Curr.pitch} 与 ${note2Prev.pitch} → ${note2Curr.pitch}）`,
              '第1章：和弦连接基础',
              [voice1, voice2],
              [chordIndex - 1, chordIndex]
            )
          );
        }
      }
    }
    
    if (errors.length > 0) {
      return createFailureResult(errors);
    }
    
    return createSuccessResult();
  },
};
