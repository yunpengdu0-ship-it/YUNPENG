# 快速部署步骤

## 🚀 最简单的方法（推荐）

### 1. 安装 Vercel CLI
打开 CMD，运行：
```cmd
npm install -g vercel
```

### 2. 登录 Vercel
```cmd
vercel login
```
- 会打开浏览器
- 选择用 GitHub 登录（最方便）
- 如果没有账号会自动创建

### 3. 部署
在项目文件夹中运行：
```cmd
vercel
```

按提示操作：
- `Set up and deploy?` → 按 **Y**
- `Which scope?` → 选择你的账号（按回车）
- `Link to existing project?` → 按 **N**
- `What's your project's name?` → 输入 **harmony-game**（或其他名字）
- `In which directory is your code located?` → 直接按**回车**
- `Want to override the settings?` → 按 **N**

### 4. 完成！
等待 1-2 分钟，会显示：
```
✅  Production: https://harmony-game-xxx.vercel.app
```

把这个网址发给朋友就可以玩了！

---

## 📝 后续更新

修改代码后，重新部署：
```cmd
vercel --prod
```

---

## ⚠️ 如果遇到问题

### 问题1：npm 命令不可用
**解决**：需要先安装 Node.js
- 下载：https://nodejs.org/
- 安装后重启 CMD

### 问题2：vercel 命令不可用
**解决**：重新安装
```cmd
npm install -g vercel
```

### 问题3：部署后页面空白
**解决**：
1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签的错误
3. 通常是因为构建失败，运行 `npm run build` 检查

---

## 🎯 测试部署是否成功

1. 打开部署的网址
2. 应该能看到"和声游戏"标题
3. 能看到关卡选择界面
4. 点击关卡1能进入游戏

---

## 💡 提示

- Vercel 免费版完全够用
- 每次 git push 会自动部署（如果连接了 GitHub）
- 可以在 vercel.com 查看部署历史和日志
