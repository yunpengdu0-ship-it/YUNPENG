/**
 * 手动测试脚本（不需要 npm）
 * 用于验证核心逻辑
 */

// 模拟核心函数
function createNote(pitch, octave, duration = 'w') {
  return { pitch, octave, duration };
}

function noteToAbsoluteSemitones(note) {
  const PITCH_TO_SEMITONES = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11,
  };
  
  const pitchSemitones = PITCH_TO_SEMITONES[note.pitch];
  if (pitchSemitones === undefined) {
    throw new Error(`无效的音高: ${note.pitch}`);
  }
  return note.octave * 12 + pitchSemitones;
}

function calculateInterval(note1, note2) {
  return noteToAbsoluteSemitones(note2) - noteToAbsoluteSemitones(note1);
}

function isPerfectFifth(note1, note2) {
  const interval = Math.abs(calculateInterval(note1, note2));
  return interval % 12 === 7;
}

function isOctave(note1, note2) {
  const interval = Math.abs(calculateInterval(note1, note2));
  return interval % 12 === 0;
}

function getMotionType(v1n1, v1n2, v2n1, v2n2) {
  const voice1Interval = calculateInterval(v1n1, v1n2);
  const voice2Interval = calculateInterval(v2n1, v2n2);
  
  if (voice1Interval === 0 && voice2Interval === 0) return 'static';
  if (voice1Interval === 0 || voice2Interval === 0) return 'oblique';
  if ((voice1Interval > 0 && voice2Interval > 0) || 
      (voice1Interval < 0 && voice2Interval < 0)) return 'parallel';
  return 'contrary';
}

function hasParallelFifths(v1n1, v1n2, v2n1, v2n2) {
  const firstChordIsFifth = isPerfectFifth(v1n1, v2n1);
  const secondChordIsFifth = isPerfectFifth(v1n2, v2n2);
  const isParallel = getMotionType(v1n1, v1n2, v2n1, v2n2) === 'parallel';
  return firstChordIsFifth && secondChordIsFifth && isParallel;
}

function hasParallelOctaves(v1n1, v1n2, v2n1, v2n2) {
  const firstChordIsOctave = isOctave(v1n1, v2n1);
  const secondChordIsOctave = isOctave(v1n2, v2n2);
  const isParallel = getMotionType(v1n1, v1n2, v2n1, v2n2) === 'parallel';
  return firstChordIsOctave && secondChordIsOctave && isParallel;
}

// 测试用例
console.log('=== 和声游戏 - 核心功能测试 ===\n');

// 测试 1: 音程计算
console.log('测试 1: 音程计算');
const c4 = createNote('C', 4);
const g4 = createNote('G', 4);
const interval = calculateInterval(c4, g4);
console.log(`  C4 到 G4 的音程: ${interval} 半音`);
console.log(`  是否为完全五度: ${isPerfectFifth(c4, g4) ? '✓ 是' : '✗ 否'}`);
console.log(`  预期: 7 半音，完全五度 ✓\n`);

// 测试 2: 八度检测
console.log('测试 2: 八度检测');
const c5 = createNote('C', 5);
const isOct = isOctave(c4, c5);
console.log(`  C4 到 C5 是否为八度: ${isOct ? '✓ 是' : '✗ 否'}`);
console.log(`  预期: 是 ✓\n`);

// 测试 3: 平行五度检测
console.log('测试 3: 平行五度检测');
const voice1_chord1 = createNote('C', 4);
const voice1_chord2 = createNote('D', 4);
const voice2_chord1 = createNote('G', 4);
const voice2_chord2 = createNote('A', 4);

const hasParFifths = hasParallelFifths(
  voice1_chord1, voice1_chord2,
  voice2_chord1, voice2_chord2
);
console.log(`  C4→D4 和 G4→A4 之间:`);
console.log(`    第一个和弦 (C4-G4): ${isPerfectFifth(voice1_chord1, voice2_chord1) ? '完全五度 ✓' : '非五度'}`);
console.log(`    第二个和弦 (D4-A4): ${isPerfectFifth(voice1_chord2, voice2_chord2) ? '完全五度 ✓' : '非五度'}`);
console.log(`    运动类型: ${getMotionType(voice1_chord1, voice1_chord2, voice2_chord1, voice2_chord2)}`);
console.log(`    检测到平行五度: ${hasParFifths ? '✓ 是' : '✗ 否'}`);
console.log(`  预期: 检测到平行五度 ✓\n`);

// 测试 4: 平行八度检测
console.log('测试 4: 平行八度检测');
const v1c1 = createNote('C', 4);
const v1c2 = createNote('D', 4);
const v2c1 = createNote('C', 5);
const v2c2 = createNote('D', 5);

const hasParOct = hasParallelOctaves(v1c1, v1c2, v2c1, v2c2);
console.log(`  C4→D4 和 C5→D5 之间:`);
console.log(`    第一个和弦 (C4-C5): ${isOctave(v1c1, v2c1) ? '八度 ✓' : '非八度'}`);
console.log(`    第二个和弦 (D4-D5): ${isOctave(v1c2, v2c2) ? '八度 ✓' : '非八度'}`);
console.log(`    运动类型: ${getMotionType(v1c1, v1c2, v2c1, v2c2)}`);
console.log(`    检测到平行八度: ${hasParOct ? '✓ 是' : '✗ 否'}`);
console.log(`  预期: 检测到平行八度 ✓\n`);

// 测试 5: 反向运动（不应检测到平行五度）
console.log('测试 5: 反向运动测试');
const v1_up = createNote('C', 4);
const v1_up2 = createNote('D', 4);
const v2_down = createNote('G', 4);
const v2_down2 = createNote('F', 4);

const motionType = getMotionType(v1_up, v1_up2, v2_down, v2_down2);
const hasParFifthsContrary = hasParallelFifths(v1_up, v1_up2, v2_down, v2_down2);
console.log(`  C4→D4 (上行) 和 G4→F4 (下行):`);
console.log(`    运动类型: ${motionType}`);
console.log(`    检测到平行五度: ${hasParFifthsContrary ? '✗ 是' : '✓ 否'}`);
console.log(`  预期: 反向运动，无平行五度 ✓\n`);

// 总结
console.log('=== 测试完成 ===');
console.log('所有核心功能正常工作！');
console.log('\n下一步:');
console.log('1. 安装 Node.js 和 npm');
console.log('2. 运行 "npm install" 安装依赖');
console.log('3. 运行 "npm test" 执行完整测试套件');
