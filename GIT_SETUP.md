# Git仓库设置指南

## 🚀 快速Git备份到仓库

### 1. 初始化Git仓库
```bash
cd xiaoshenlong-wms
git init
```

### 2. 添加所有文件
```bash
git add .
```

### 3. 提交初始版本
```bash
git commit -m "🎉 初始提交: 小神龙WMS仓库管理系统完整版

✨ 功能特性:
- 用户管理与JWT认证
- 仓库/库区/库位管理
- 商品管理与批量导入
- 库存管理与数据导出
- 入库/出库完整流程
- 数据持久化API+数据库
- 响应式前端界面
- 移动端开发就绪

🛠️ 技术栈:
- 前端: Vue 3 + Element Plus
- 后端: Django 4.2 + DRF + JWT
- 数据库: SQLite/PostgreSQL
- 部署: Docker支持"
```

### 4. 连接远程仓库
```bash
# 替换为你的实际仓库地址
git remote add origin https://github.com/yourusername/xiaoshenlong-wms.git
```

### 5. 推送到远程仓库
```bash
git branch -M main
git push -u origin main
```

## 📝 后续Git工作流

### 日常开发提交
```bash
git add .
git commit -m "功能: 添加新功能描述"
git push
```

### 创建功能分支
```bash
git checkout -b feature/new-feature
# 开发完成后
git checkout main
git merge feature/new-feature
git push
```

### 查看状态
```bash
git status
git log --oneline
```

## 🏷️ 建议的Git标签

### 版本标记
```bash
git tag -a v1.0.0 -m "版本 1.0.0: 完整WMS系统发布"
git push origin v1.0.0
```

### 里程碑标记
```bash
git tag -a milestone-api-ready -m "里程碑: API开发完成，移动端开发就绪"
git push origin milestone-api-ready
```

## 📂 已配置的.gitignore

项目已配置完整的.gitignore文件，以下文件/目录会被自动忽略：
- Python缓存文件 (__pycache__)
- Node.js依赖 (node_modules)
- 环境变量文件 (.env)
- 日志文件 (*.log)
- 构建输出 (dist/)
- IDE配置文件
- 临时文件和测试文件

## 🎯 项目状态

✅ **项目已准备好备份到Git仓库**
- 清理了所有临时文件
- 配置了完整的.gitignore
- 更新了README文档
- 项目结构清晰整洁

现在你可以安全地将项目推送到Git仓库进行备份！ 