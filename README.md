# 小神龙仓库管理系统 (XiaoShenLong WMS)

## 🚀 项目简介
小神龙仓库管理系统是一个基于Vue 3 + Django的现代化仓库管理系统，支持多用户协作、权限管理、批量数据导入导出等企业级功能。

## ✨ 技术栈
- **前端**: Vue 3 + Element Plus + Vue Router + Pinia
- **后端**: Django 4.2 + Django REST Framework + JWT认证
- **数据库**: SQLite (开发环境) / PostgreSQL (生产环境)
- **移动端**: 响应式Web应用 (APP开发就绪)

## 🎯 核心功能

### ✅ 已完成功能

#### 1. 用户管理与权限
- JWT身份认证系统
- 基于角色的权限控制
- 多用户协作支持
- 用户信息管理

#### 2. 仓库管理
- 多仓库、多库区、多库位管理
- 仓库状态监控
- 分仓库库存隔离

#### 3. 商品管理
- 商品信息录入与管理
- iSKU属性管理
- 供应商管理
- **批量导入/导出功能**

#### 4. 库存管理
- 实时库存查询
- 多维度库存统计
- 库存预警设置
- **数据导出功能**

#### 5. 入库管理
- 入库计划制定
- 质检流程管理
- 入库上架操作
- 入库历史记录

#### 6. 出库管理
- 出库计划制定
- 拣货任务分配
- 出库确认操作
- 出库历史追踪

#### 7. 报表与统计
- 库存变动报表
- 出入库统计
- 工作台数据看板
- 数据导出功能

### 🔄 数据持久化
- **双模式运行**: API模式 + 离线模式
- **数据迁移工具**: localStorage数据自动迁移到数据库
- **无缝切换**: API不可用时自动降级到本地模式

## 📁 项目结构
```
xiaoshenlong-wms/
├── backend/                    # Django后端服务
│   ├── apps/                   # 业务应用模块
│   │   ├── users/              # 用户管理
│   │   ├── warehouse/          # 仓库管理
│   │   ├── products/           # 商品管理
│   │   ├── inventory/          # 库存管理
│   │   ├── inbound/            # 入库管理
│   │   ├── outbound/           # 出库管理
│   │   ├── reports/            # 报表统计
│   │   └── system/             # 系统管理
│   ├── xiaoshenlong_wms/       # Django项目配置
│   ├── requirements.txt        # Python依赖
│   ├── start_backend.py        # 一键启动脚本
│   └── manage.py               # Django管理脚本
├── frontend/                   # Vue3前端应用
│   ├── src/
│   │   ├── api/                # API接口封装
│   │   ├── components/         # 公共组件
│   │   ├── views/              # 页面组件
│   │   ├── router/             # 路由配置
│   │   ├── stores/             # 状态管理
│   │   └── utils/              # 工具函数
│   ├── package.json            # Node.js依赖
│   └── vite.config.js          # 构建配置
├── android/                    # Android项目目录
├── mobile/                     # 移动端项目目录
├── docs/                       # 项目文档
├── .gitignore                  # Git忽略配置
└── README.md                   # 项目说明
```

## 🛠️ 快速开始

### 环境要求
- Python 3.8+
- Node.js 16+
- Git

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd xiaoshenlong-wms
```

### 2. 启动后端服务
```bash
cd backend
pip install -r requirements.txt
python start_backend.py
```

### 3. 启动前端服务
```bash
cd frontend
npm install
npm run dev
```

### 4. 访问系统
- **前端**: http://localhost:5173
- **后端API**: http://127.0.0.1:8000/api/
- **管理后台**: http://127.0.0.1:8000/admin/

### 5. 默认账号
```
用户名: admin
密码: admin123
```

## 📊 开发进度

### ✅ 已完成 (100%)
- [x] 项目基础架构搭建
- [x] 后端API接口开发
- [x] 前端页面开发
- [x] 用户权限系统
- [x] 仓库管理功能
- [x] 商品管理功能
- [x] 库存管理功能
- [x] 出入库流程
- [x] 数据导入导出
- [x] 数据持久化改进

### 🔄 进行中
- [ ] 移动端APP开发
- [ ] 高级报表系统
- [ ] 实时通知功能

### 📱 移动端开发就绪
系统已具备完整的API基础设施，可以直接开始移动端APP开发：
- ✅ 完整的REST API
- ✅ JWT认证系统
- ✅ 标准化数据格式
- ✅ 详细的API文档

## 🤝 贡献指南
1. Fork本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📄 许可证
本项目采用MIT许可证 - 查看[LICENSE](LICENSE)文件了解详情

## 📞 联系方式
如有问题或建议，请通过以下方式联系：
- 项目Issues: [GitHub Issues](../../issues)
- 邮箱: support@xiaoshenlong.com