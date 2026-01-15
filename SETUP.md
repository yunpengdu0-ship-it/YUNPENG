# 和声游戏 - 安装和运行指南

## 📋 系统要求

- Node.js 18+ 
- npm 或 yarn

## 🚀 快速开始

### 1. 安装 Node.js

如果您的系统还没有安装 Node.js，请访问：
- 官方网站: https://nodejs.org/
- 推荐下载 LTS（长期支持）版本

### 2. 安装项目依赖

在项目根目录运行：

```bash
npm install
```

### 3. 运行测试

验证所有功能正常：

```bash
npm test
```

### 4. 启动开发服务器

```bash
npm run dev
```

然后在浏览器中打开显示的地址（通常是 http://localhost:5173）

## 📦 项目依赖

### 核心依赖
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **VexFlow 4** - 音乐记谱渲染

### 开发依赖
- **Vite** - 构建工具
- **Vitest** - 测试框架
- **fast-check** - 属性测试库

## 🧪 测试命令

```bash
# 运行所有测试
npm test

# 运行测试并显示覆盖率
npm run test:coverage

# 监视模式（文件改变时自动运行测试）
npm run test:watch
```

## 🏗️ 构建命令

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 📁 项目结构

```
harmony-game/
├── src/
│   ├── types/          # 类型定义
│   ├── core/           # 核心音乐理论模块
│   ├── validation/     # 规则验证引擎
│   ├── App.tsx         # 主应用组件
│   └── main.tsx        # 应用入口
├── .kiro/
│   └── specs/          # 规范文档
├── package.json        # 项目配置
├── tsconfig.json       # TypeScript 配置
└── vite.config.ts      # Vite 配置
```

## 🔧 开发工具推荐

- **VS Code** - 推荐的代码编辑器
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化

## 📚 文档

- [需求文档](.kiro/specs/harmony-game/requirements.md)
- [设计文档](.kiro/specs/harmony-game/design.md)
- [任务计划](.kiro/specs/harmony-game/tasks.md)
- [进度更新](PROGRESS_UPDATE.md)
- [代码审查](CODE_REVIEW.md)

## ❓ 常见问题

### Q: 测试失败怎么办？
A: 确保已经运行 `npm install` 安装了所有依赖。

### Q: 如何查看测试覆盖率？
A: 运行 `npm run test:coverage`

### Q: 如何添加新的测试？
A: 在相应的 `.test.ts` 文件中添加新的测试用例。

## 🎯 当前进度

✅ 任务 1: 项目初始化和核心数据模型  
✅ 任务 2: 实现音乐理论工具函数  
✅ 任务 3: 实现规则验证引擎核心  
⏳ 任务 4: 实现基础和声规则（下一步）

详细进度请查看 [PROGRESS_UPDATE.md](PROGRESS_UPDATE.md)

## 💡 贡献指南

1. 遵循现有的代码风格
2. 为新功能编写测试
3. 更新相关文档
4. 确保所有测试通过

## 📞 获取帮助

如有问题，请查看：
- 项目文档
- 代码注释
- 测试用例示例
