/**
 * 声部交叉检测规则
 * 
 * 检测相邻声部是否交叉
 * 例如：女低音的音高不应该高于女高音
 */

import { ValidationRule, RulePriority, createSuccessResult, createFailureResult, createValidationError } from '../types';
import { ChordProgression } from '../../types/music';
import { hasVoiceCrossingDetailed } from '../../core/voiceRanges';

/**
 * 声部交叉检测规则
 * 
 * 检查和弦中是否存在声部交叉
 * 声部交叉是指较低的声部音高超过了较高的声部
 */
export const voiceCrossingRule: ValidationRule = {
  id: 'voice-crossing',
  name: '声部交叉检测',
  chapter: 1,
  priority: RulePriority.STRUCTURE,
  description: '检测相邻声部是否交叉。声部交叉会导致声部混乱，影响和声的清晰度。',
  
  validate: (progression: ChordProgression, chordIndex: number) => {
    const chord = progression.chords[chordIndex];
    
    // 检查是否存在声部交叉
    const crossingInfo = hasVoiceCrossingDetailed(chord.notes);
    
    if (crossingInfo.hasCrossing) {
      const errors = [];
      const voiceNames = ['女高音', '女低音', '男高音', '男低音'];
      
      // 为每个交叉的声部对创建错误
      for (const crossing of crossingInfo.crossings) {
        const higherVoice = crossing.higherVoice;
        const lowerVoice = crossing.lowerVoice;
        
        const lowerNote = chord.notes[lowerVoice];
        const higherNote = chord.notes[higherVoice];
        
        errors.push(
          createValidationError(
            'voice-crossing',
            '声部交叉检测',
            `${voiceNames[lowerVoice]}（${lowerNote?.pitch || '?'}）的音高超过了${voiceNames[higherVoice]}（${higherNote?.pitch || '?'}）`,
            '第1章：和弦连接基础',
            [higherVoice, lowerVoice],
            [chordIndex]
          )
        );
      }
      
      return createFailureResult(errors);
    }
    
    return createSuccessResult();
  },
};
