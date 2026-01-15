/**
 * 规则使用示例
 * 
 * 展示如何使用RuleEngine和基础规则
 */

import { RuleEngine } from '../RuleEngine';
import { basicRules } from './index';
import { createChordProgression } from '../../core/musicUtils';

/**
 * 示例：验证一个简单的和弦进行
 */
export function exampleValidation() {
  // 创建规则引擎
  const engine = new RuleEngine();
  
  // 注册所有基础规则
  engine.registerRules(basicRules);
  
  // 创建一个和弦进行：I - IV - V - I
  const progression = createChordProgression([
    {
      notes: [
        { pitch: 'G4', octave: 4, duration: 'w' },  // 女高音
        { pitch: 'E4', octave: 4, duration: 'w' },  // 女低音
        { pitch: 'C4', octave: 4, duration: 'w' },  // 男高音
        { pitch: 'C3', octave: 3, duration: 'w' },  // 男低音
      ],
      romanNumeral: 'I',
      inversion: 0,
    },
    {
      notes: [
        { pitch: 'A4', octave: 4, duration: 'w' },
        { pitch: 'F4', octave: 4, duration: 'w' },
        { pitch: 'C4', octave: 4, duration: 'w' },
        { pitch: 'F3', octave: 3, duration: 'w' },
      ],
      romanNumeral: 'IV',
      inversion: 0,
    },
    {
      notes: [
        { pitch: 'G4', octave: 4, duration: 'w' },
        { pitch: 'F4', octave: 4, duration: 'w' },
        { pitch: 'D4', octave: 4, duration: 'w' },
        { pitch: 'G3', octave: 3, duration: 'w' },
      ],
      romanNumeral: 'V',
      inversion: 0,
    },
    {
      notes: [
        { pitch: 'G4', octave: 4, duration: 'w' },
        { pitch: 'E4', octave: 4, duration: 'w' },
        { pitch: 'C4', octave: 4, duration: 'w' },
        { pitch: 'C3', octave: 3, duration: 'w' },
      ],
      romanNumeral: 'I',
      inversion: 0,
    },
  ], 'C major');
  
  // 验证和弦进行
  const result = engine.validate(progression, 1);
  
  // 输出结果
  console.log('验证结果:', result.isValid ? '通过' : '失败');
  
  if (!result.isValid) {
    console.log('\n发现以下错误:');
    for (const error of result.errors) {
      console.log(`- [${error.ruleName}] ${error.message}`);
      console.log(`  章节引用: ${error.chapterReference}`);
      console.log(`  受影响的声部: ${error.affectedVoices.join(', ')}`);
      console.log(`  受影响的和弦: ${error.affectedChords.join(', ')}`);
      console.log();
    }
  }
  
  return result;
}

/**
 * 示例：创建一个包含错误的和弦进行
 */
export function exampleWithErrors() {
  const engine = new RuleEngine();
  engine.registerRules(basicRules);
  
  // 创建一个包含平行五度的和弦进行
  const progression = createChordProgression([
    {
      notes: [
        { pitch: 'G4', octave: 4, duration: 'w' },
        { pitch: 'E4', octave: 4, duration: 'w' },
        { pitch: 'C4', octave: 4, duration: 'w' },
        { pitch: 'C3', octave: 3, duration: 'w' },
      ],
      romanNumeral: 'I',
      inversion: 0,
    },
    {
      notes: [
        { pitch: 'A4', octave: 4, duration: 'w' },  // G4→A4
        { pitch: 'F4', octave: 4, duration: 'w' },
        { pitch: 'D4', octave: 4, duration: 'w' },  // C4→D4 (与G4→A4形成平行五度)
        { pitch: 'D3', octave: 3, duration: 'w' },
      ],
      romanNumeral: 'V',
      inversion: 0,
    },
  ], 'C major');
  
  const result = engine.validate(progression, 1);
  
  console.log('包含错误的和弦进行验证结果:');
  console.log('是否有效:', result.isValid);
  console.log('错误数量:', result.errors.length);
  
  return result;
}

// 如果直接运行此文件，执行示例
if (require.main === module) {
  console.log('=== 示例1: 正确的和弦进行 ===\n');
  exampleValidation();
  
  console.log('\n=== 示例2: 包含错误的和弦进行 ===\n');
  exampleWithErrors();
}
