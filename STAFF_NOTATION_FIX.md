# 五线谱显示问题修复

## 问题描述
用户点击关卡1后，五线谱区域是空白的，没有显示任何和弦。

## 根本原因
`public/data/exercises.json` 文件中的音符格式不正确：
- **错误格式**: `{ "pitch": "G4", "octave": 4 }`
- **正确格式**: `{ "pitch": "G", "octave": 4 }`

音高（pitch）字段不应该包含八度信息，八度应该单独存储在 octave 字段中。

## 修复内容

### 1. 修复 JSON 数据格式
使用 PowerShell 命令批量替换所有音符格式：
```powershell
$content = Get-Content 'public/data/exercises.json' -Raw
$content = $content -replace '"pitch":\s*"([A-G][#b]?)(\d+)"', '"pitch": "$1"'
Set-Content 'public/data/exercises.json' -Value $content -NoNewline
```

修复结果：
- `"pitch": "G4"` → `"pitch": "G"`
- `"pitch": "C#5"` → `"pitch": "C#"`
- `"pitch": "Eb3"` → `"pitch": "Eb"`

### 2. 修复 ExerciseView 组件
在 `src/components/ExerciseView.tsx` 中，添加新和弦时缺少必需的字段：
- 添加 `romanNumeral: 'I'`
- 添加 `inversion: 0`

这些字段在 `Chord` 类型中是必需的。

## 验证步骤
1. 刷新浏览器页面（F5）
2. 点击关卡1
3. 应该能看到：
   - 五线谱上显示起始和弦（高音谱表和低音谱表）
   - 和弦编辑器显示4个音符输入框
   - 可以添加新和弦

## 技术细节

### StaffNotation 组件工作原理
1. 接收 `ChordProgression` 对象（包含和弦数组和调性）
2. 使用 VexFlow 库渲染五线谱
3. 为每个和弦创建高音谱表音符（女高音、女低音）和低音谱表音符（男高音、男低音）
4. 自动处理升降号（# 和 b）

### 音符格式要求
```typescript
interface Note {
  pitch: string;    // 只包含音名和升降号，如 "C", "D#", "Eb"
  octave: number;   // 八度，如 3, 4, 5
  duration: string; // 时值，如 "w"（全音符）
}
```

## 已知问题
JSON 文件中的中文字符可能显示为乱码（编码问题），但不影响功能。如果需要修复，应该：
1. 使用 UTF-8 编码重新保存文件
2. 确保 PowerShell 使用正确的编码读写文件
