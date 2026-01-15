/**
 * 规则索引
 * 
 * 导出所有和声规则
 */

export { parallelFifthsRule } from './parallelFifthsRule';
export { parallelOctavesRule } from './parallelOctavesRule';
export { voiceCrossingRule } from './voiceCrossingRule';
export { voiceRangeRule } from './voiceRangeRule';

/**
 * 所有基础规则的数组
 * 可以直接用于批量注册到RuleEngine
 */
import { parallelFifthsRule } from './parallelFifthsRule';
import { parallelOctavesRule } from './parallelOctavesRule';
import { voiceCrossingRule } from './voiceCrossingRule';
import { voiceRangeRule } from './voiceRangeRule';

export const basicRules = [
  voiceRangeRule,        // 结构规则：优先级最高
  voiceCrossingRule,     // 结构规则：优先级最高
  parallelFifthsRule,    // 进行规则
  parallelOctavesRule,   // 进行规则
];
