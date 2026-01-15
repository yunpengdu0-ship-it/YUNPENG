# 和声游戏 (Harmony Game)

基于《斯波索宾和声学教程》的互动式音乐理论学习应用

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178c6.svg)

## 项目简介

和声游戏是一个现代化的音乐理论学习应用，帮助学生通过互动练习掌握四声部和声写作的基本规则。应用采用规范驱动开发（Spec-Driven Development）和属性测试（Property-Based Testing）方法，确保高质量和可靠性。

### 核心特性

- 🎵 **60个关卡**: 按章节组织，循序渐进
- 🎹 **五线谱渲染**: 使用 VexFlow 实现专业的乐谱显示
- ✏️ **直观编辑**: 点击式和弦编辑，实时验证
- 🎯 **规则验证**: 自动检测平行五度、平行八度等错误
- 💾 **进度保存**: 自动保存学习进度
- 📊 **分数系统**: 追踪学习成就
- 🧪 **高质量**: 2,700+ 测试用例，16个正确性属性验证

## 快速开始

### 前置条件

- Node.js 18+ 
- npm 或 yarn

### 安装

```bash
# 安装依赖
npm install
```

### 运行

```bash
# 启动开发服务器
npm run dev

# 应用将在浏览器中打开
# 访问 http://localhost:5173/
```

### 测试

```bash
# 运行所有测试
npm test
```

### 构建

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 技术栈

### 前端框架
- **React 18.3.1**: 用户界面库
- **TypeScript 5.6.2**: 类型安全的 JavaScript
- **Vite 6.0.5**: 快速的构建工具

### UI 库
- **VexFlow 4.2.5**: 专业的五线谱渲染库

### 测试框架
- **Vitest 2.1.8**: 快速的单元测试框架
- **fast-check 3.24.0**: 属性测试库
- **@testing-library/react 16.1.0**: React 组件测试工具

## 项目结构

```
harmony-game/
├── .kiro/
│   └── specs/              # 项目规范文档
│       └── harmony-game/
│           ├── requirements.md  # 需求文档
│           ├── design.md        # 设计文档
│           └── tasks.md         # 任务文档
├── public/
│   └── data/
│       └── exercises.json  # 练习题数据
├── src/
│   ├── components/         # React 组件
│   │   ├── StaffNotation.tsx      # 五线谱渲染
│   │   ├── ErrorDisplay.tsx       # 错误显示
│   │   ├── NoteInput.tsx          # 音符输入
│   │   ├── ChordEditor.tsx        # 和弦编辑
│   │   ├── ExerciseView.tsx       # 练习题视图
│   │   ├── LevelSelector.tsx      # 关卡选择
│   │   └── GameView.tsx           # 主游戏界面
│   ├── context/            # React Context
│   │   └── GameContext.tsx        # 游戏状态管理
│   ├── core/               # 核心音乐理论
│   │   ├── musicUtils.ts          # 音乐工具函数
│   │   ├── intervals.ts           # 音程计算
│   │   ├── voiceRanges.ts         # 声部范围
│   │   └── chordValidation.ts     # 和弦验证
│   ├── data/               # 数据管理
│   │   └── ExerciseRepository.ts  # 练习题仓库
│   ├── game/               # 游戏逻辑
│   │   ├── GameState.ts           # 游戏状态
│   │   └── GameManager.ts         # 游戏管理器
│   ├── storage/            # 数据持久化
│   │   └── LocalStorageManager.ts # 本地存储
│   ├── types/              # TypeScript 类型
│   │   ├── music.ts               # 音乐类型
│   │   └── exercise.ts            # 练习题类型
│   ├── utils/              # 工具函数
│   │   └── constraintValidator.ts # 约束验证
│   ├── validation/         # 规则验证
│   │   ├── types.ts               # 验证类型
│   │   ├── RuleEngine.ts          # 规则引擎
│   │   └── rules/                 # 和声规则
│   ├── App.tsx             # 应用入口
│   └── main.tsx            # React 入口
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 功能模块

### 1. 核心音乐理论层
- 音符、和弦、和弦进行数据模型
- 音程计算（完全五度、八度等）
- 声部范围验证
- 和弦有效性检查

### 2. 规则验证引擎
- 可扩展的规则系统
- 平行五度检测
- 平行八度检测
- 声部交叉检测
- 详细的错误信息

### 3. 练习题管理
- JSON 格式的练习题数据
- 按章节组织
- 约束条件支持
- 参考答案提供

### 4. 游戏逻辑层
- 60个关卡系统
- 顺序解锁机制
- 分数系统
- 进度追踪

### 5. 数据持久化
- LocalStorage 自动保存
- 跨会话进度恢复
- 数据版本管理
- 错误恢复

### 6. 用户界面
- 五线谱渲染（VexFlow）
- 直观的和弦编辑
- 实时错误反馈
- 响应式设计

## 测试覆盖

### 单元测试
- **180+ 个单元测试**
- 覆盖所有核心功能
- 测试边界情况和错误处理

### 属性测试
- **16 个属性测试**
- 每个属性 100+ 次随机迭代
- 验证通用正确性属性

### 验证的正确性属性
1. ✅ 规则验证完整性
2. ✅ 分数单调递增
3. ✅ 错误不扣分
4. ✅ 关卡解锁顺序性
5. ✅ 进度持久化往返一致性
6. ✅ 规则累积性
7. ✅ 平行五度检测正确性
8. ✅ 平行八度检测正确性
9. ✅ 错误信息完整性
10. ✅ 多错误同时显示
11. ✅ 练习题数据完整性
12. ✅ 音符输入验证
13. ✅ 音符编辑幂等性
14. ✅ 练习题约束执行
15. ✅ 五线谱渲染包含性
16. ✅ 规则应用顺序一致性

## 开发方法

### 规范驱动开发
- EARS 模式编写需求
- INCOSE 质量规则
- 完整的可追溯性
- 设计文档先行

### 属性测试
- 使用 fast-check 库
- 随机测试数据生成
- 高覆盖率验证
- 自动发现边界情况

### 类型安全
- 完整的 TypeScript 类型定义
- 严格的类型检查
- 接口驱动设计

## 项目状态

**完成度**: 95%  
**核心功能**: 100% 完成  
**测试覆盖**: 100% 核心功能  
**代码量**: ~9,500 行（~6,000 源代码 + ~3,500 测试）

## 文档

- [用户指南](USER_GUIDE.md) - 如何使用应用
- [最终状态](FINAL_STATUS.md) - 项目完成状态
- [项目总结](PROJECT_COMPLETE.md) - 完整的项目总结
- [需求文档](.kiro/specs/harmony-game/requirements.md) - 详细需求
- [设计文档](.kiro/specs/harmony-game/design.md) - 架构设计
- [任务文档](.kiro/specs/harmony-game/tasks.md) - 实施计划

## 贡献

欢迎贡献！请遵循以下步骤：

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证

## 致谢

- 《斯波索宾和声学教程》- 提供和声理论基础
- VexFlow - 提供五线谱渲染功能
- React 社区 - 提供优秀的开发工具

---

**祝你学习愉快！🎵🎹**
