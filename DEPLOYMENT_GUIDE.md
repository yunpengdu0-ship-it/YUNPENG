# Vercel 部署指南

## 准备工作

### 1. 确保项目可以正常构建

在 CMD 中运行：
```cmd
npm run build
```

如果构建成功，会在项目中生成 `dist` 文件夹。

## 方法一：使用 Vercel CLI（命令行）

### 步骤 1：安装 Vercel CLI

打开 CMD，运行：
```cmd
npm install -g vercel
```

### 步骤 2：登录 Vercel

```cmd
vercel login
```

这会打开浏览器，让你选择登录方式：
- GitHub（推荐）
- GitLab
- Bitbucket
- Email

选择一个方式登录或注册。

### 步骤 3：部署项目

在项目目录中运行：
```cmd
vercel
```

按照提示操作：
1. **Set up and deploy?** → 按 `Y` (Yes)
2. **Which scope?** → 选择你的账号
3. **Link to existing project?** → 按 `N` (No)
4. **What's your project's name?** → 输入项目名称（比如 `harmony-game`）
5. **In which directory is your code located?** → 直接按回车（使用当前目录 `./`）
6. **Want to override the settings?** → 按 `N` (No)

等待部署完成，会显示：
```
✅  Production: https://harmony-game-xxx.vercel.app
```

### 步骤 4：后续更新

每次修改代码后，只需运行：
```cmd
vercel --prod
```

就会自动部署最新版本。

## 方法二：使用 Vercel 网站（图形界面）

### 步骤 1：初始化 Git 仓库

如果还没有 Git 仓库，在 CMD 中运行：
```cmd
git init
git add .
git commit -m "Initial commit"
```

### 步骤 2：推送到 GitHub

1. 在 GitHub 上创建一个新仓库
2. 按照 GitHub 的提示推送代码：
```cmd
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

### 步骤 3：在 Vercel 导入项目

1. 访问 [vercel.com](https://vercel.com)
2. 点击 "Sign Up" 或 "Log In"（使用 GitHub 账号登录）
3. 点击 "Add New..." → "Project"
4. 选择你的 GitHub 仓库
5. 点击 "Import"
6. Vercel 会自动检测到这是 Vite 项目，配置如下：
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
7. 点击 "Deploy"

等待几分钟，部署完成后会得到一个网址！

### 步骤 4：自动部署

以后每次 `git push` 到 GitHub，Vercel 会自动重新部署。

## 配置自定义域名（可选）

部署成功后，在 Vercel 项目设置中：
1. 点击 "Settings" → "Domains"
2. 添加你的自定义域名
3. 按照提示配置 DNS

## 环境变量（如果需要）

如果项目需要环境变量：
1. 在 Vercel 项目中点击 "Settings" → "Environment Variables"
2. 添加需要的环境变量
3. 重新部署

## 常见问题

### Q: 部署后页面空白？
A: 检查浏览器控制台是否有错误。通常是路径问题，确保 `vite.config.ts` 中的 `base` 配置正确。

### Q: 如何查看部署日志？
A: 在 Vercel 项目页面点击 "Deployments"，然后点击具体的部署查看日志。

### Q: 如何回滚到之前的版本？
A: 在 "Deployments" 页面找到之前的部署，点击 "..." → "Promote to Production"。

## 分享给朋友

部署成功后，你会得到一个网址，比如：
```
https://harmony-game-xxx.vercel.app
```

直接把这个网址发给朋友就可以了！

## 性能优化建议

1. **启用 Gzip 压缩**（Vercel 默认启用）
2. **使用 CDN**（Vercel 自动使用全球 CDN）
3. **配置缓存策略**（在 `vercel.json` 中配置）

## 监控和分析

Vercel 提供免费的：
- 访问统计
- 性能监控
- 错误追踪

在项目页面的 "Analytics" 标签查看。
