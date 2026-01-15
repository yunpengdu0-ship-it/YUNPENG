# Cloudflare Pages 部署指南（国内可访问）

## 🎯 目标
将和声游戏部署到 Cloudflare Pages，让国内用户无需 VPN 即可访问。

---

## 📦 准备工作

### 1. 安装 Git

**下载地址**：https://git-scm.com/download/win

1. 下载 Windows 版本
2. 安装时全部选择默认选项
3. 安装完成后，重启 CMD

**验证安装**：
```cmd
git --version
```

---

## 🚀 部署步骤

### 第一步：初始化 Git 仓库

在项目目录（`C:\Users\duwen\Desktop\game`）打开 CMD，运行：

```cmd
git init
git add .
git commit -m "Initial commit"
```

### 第二步：创建 GitHub 仓库

1. 访问 https://github.com
2. 登录你的 GitHub 账号（如果没有，需要先注册）
3. 点击右上角的 **+** → **New repository**
4. 填写信息：
   - **Repository name**: `harmony-game`
   - **Description**: 和声游戏
   - **Public** 或 **Private** 都可以
   - ⚠️ **不要**勾选 "Add a README file"
5. 点击 **Create repository**

### 第三步：推送代码到 GitHub

GitHub 会显示一些命令，复制类似这样的命令：

```cmd
git remote add origin https://github.com/你的用户名/harmony-game.git
git branch -M main
git push -u origin main
```

在 CMD 中运行这些命令。

**如果提示输入用户名和密码**：
- 用户名：你的 GitHub 用户名
- 密码：需要使用 Personal Access Token（不是 GitHub 密码）
  - 获取 Token：https://github.com/settings/tokens
  - 点击 "Generate new token (classic)"
  - 勾选 `repo` 权限
  - 生成后复制 Token（只显示一次！）

### 第四步：部署到 Cloudflare Pages

1. 访问 https://dash.cloudflare.com/
2. 注册/登录 Cloudflare 账号
3. 点击左侧 **Workers & Pages**
4. 点击 **Create application** → **Pages** → **Connect to Git**
5. 选择 **GitHub**，授权 Cloudflare 访问你的 GitHub
6. 选择 `harmony-game` 仓库
7. 配置构建设置：
   - **Project name**: `harmony-game`（或其他名字）
   - **Production branch**: `main`
   - **Framework preset**: 选择 **Vite**
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
8. 点击 **Save and Deploy**

### 第五步：等待部署完成

- 部署需要 2-3 分钟
- 完成后会显示一个网址，比如：`https://harmony-game.pages.dev`
- 这个网址在国内可以直接访问！

---

## 🔄 后续更新

以后修改代码后，只需要：

```cmd
git add .
git commit -m "更新说明"
git push
```

Cloudflare 会自动检测到更新并重新部署！

---

## 🌐 自定义域名（可选）

如果你有自己的域名，可以在 Cloudflare Pages 设置中添加自定义域名。

---

## ⚠️ 常见问题

### Q: Git 命令不可用？
A: 需要先安装 Git，下载地址：https://git-scm.com/download/win

### Q: GitHub 推送失败？
A: 检查是否使用了 Personal Access Token 而不是密码

### Q: Cloudflare 部署失败？
A: 检查构建命令是否正确：`npm run build`，输出目录是否为 `dist`

### Q: 国内访问速度慢？
A: Cloudflare 在国内有 CDN 节点，通常速度很快。如果慢，可以等几分钟让 CDN 缓存生效。

---

## 📞 需要帮助？

如果遇到问题，告诉我具体的错误信息，我会帮你解决！
