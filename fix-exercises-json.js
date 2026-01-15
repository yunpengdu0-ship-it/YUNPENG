// 修复 exercises.json 中的音符格式
// 将 "pitch": "G4" 转换为 "pitch": "G"

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'data', 'exercises.json');

// 读取文件
const data = fs.readFileSync(filePath, 'utf8');

// 使用正则表达式替换所有的 "pitch": "X#" 格式
// 匹配 "pitch": "C4" 或 "pitch": "D#5" 等格式
const fixed = data.replace(/"pitch":\s*"([A-G][#b]?)(\d+)"/g, '"pitch": "$1"');

// 写回文件
fs.writeFileSync(filePath, fixed, 'utf8');

console.log('✅ 已修复 exercises.json 中的音符格式');
console.log('   将 "pitch": "G4" 转换为 "pitch": "G"');
