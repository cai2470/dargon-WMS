# 小神龙仓库管理系统 - Android PDA应用

## 项目简介
这是小神龙仓库管理系统的Android原生PDA应用，专门为手持安卓设备设计，支持条形码扫描、入库出库等仓库操作。

## 技术栈
- **开发语言**: Java/Kotlin
- **最低支持**: Android 7.0 (API 24)
- **目标版本**: Android 13 (API 33)
- **架构**: MVVM + Repository Pattern
- **网络库**: Retrofit2 + OkHttp3
- **图像处理**: CameraX
- **条码扫描**: ZXing
- **本地存储**: Room Database
- **依赖注入**: Hilt

## 主要功能

### 1. 用户认证
- 登录/登出
- 记住密码
- 自动登录

### 2. 条码扫描
- 摄像头扫描Code128条码
- 手动输入条码
- 扫描历史记录
- 离线缓存扫描数据

### 3. 商品管理
- 商品信息查询
- 商品条码绑定
- 商品图片查看

### 4. 入库功能
- 扫码入库
- 批量入库
- 入库单据查看
- 质检记录

### 5. 出库功能
- 扫码出库
- 拣货任务
- 出库确认
- 出库单据

### 6. 库存查询
- 实时库存查询
- 库位信息显示
- 库存预警提醒

### 7. 同步功能
- 数据自动同步
- 离线模式支持
- 冲突解决

## 项目结构

```
android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/xiaoshenlong/wms/
│   │   │   │   ├── data/          # 数据层
│   │   │   │   │   ├── api/       # API接口
│   │   │   │   │   ├── database/  # 本地数据库
│   │   │   │   │   ├── repository/ # 仓库层
│   │   │   │   │   └── model/     # 数据模型
│   │   │   │   ├── ui/            # UI层
│   │   │   │   │   ├── login/     # 登录模块
│   │   │   │   │   ├── scan/      # 扫描模块
│   │   │   │   │   ├── inbound/   # 入库模块
│   │   │   │   │   ├── outbound/  # 出库模块
│   │   │   │   │   └── inventory/ # 库存模块
│   │   │   │   ├── utils/         # 工具类
│   │   │   │   ├── di/            # 依赖注入
│   │   │   │   └── MainActivity.java
│   │   │   ├── res/               # 资源文件
│   │   │   └── AndroidManifest.xml
│   │   └── test/                  # 测试代码
│   ├── build.gradle
│   └── proguard-rules.pro
├── build.gradle
├── gradle.properties
├── settings.gradle
└── README.md
```

## 开发环境搭建

### 1. 安装Android Studio
- 下载并安装Android Studio Arctic Fox或更高版本
- 配置Android SDK (API 24-33)
- 安装模拟器或连接真机

### 2. 克隆项目
```bash
git clone <repository-url>
cd xiaoshenlong-wms/android
```

### 3. 配置项目
- 在`local.properties`中配置SDK路径
- 在`app/src/main/res/values/config.xml`中配置服务器地址

### 4. 编译运行
```bash
# 清理项目
./gradlew clean

# 编译调试版本
./gradlew assembleDebug

# 安装到设备
./gradlew installDebug
```

## 关键特性

### 条码扫描
- 使用ZXing库进行条码识别
- 支持Code128格式
- 自动对焦和闪光灯控制
- 扫描结果自动解析

### 离线支持
- 本地SQLite数据库存储
- 网络状态检测
- 数据同步策略
- 冲突解决机制

### 用户体验
- 简洁的PDA友好界面
- 大按钮设计
- 声音和震动反馈
- 快捷操作支持

## API接口
与后端Django应用通过REST API通信：
- 基础URL: `http://your-server:8000/api/v1/`
- 认证方式: JWT Token
- 数据格式: JSON

主要接口：
- 用户登录: `POST /users/users/login/`
- 商品查询: `GET /products/products/by_barcode/`
- 扫码入库: `POST /inbound/scan/`
- 扫码出库: `POST /outbound/scan/`
- 库存查询: `GET /inventory/stock/`

## 部署说明

### 调试版本
1. 连接测试设备
2. 运行`./gradlew installDebug`
3. 在设备上启动应用

### 发布版本
1. 配置签名证书
2. 运行`./gradlew assembleRelease`
3. 生成APK文件分发

## 注意事项

### 权限要求
- 摄像头权限（条码扫描）
- 网络权限（数据同步）
- 存储权限（图片缓存）
- 震动权限（操作反馈）

### 设备要求
- Android 7.0+
- 摄像头支持
- 网络连接
- 建议2GB RAM

### 性能优化
- 图片压缩和缓存
- 数据分页加载
- 后台任务管理
- 内存泄漏防护

## 测试
- 单元测试：使用JUnit
- UI测试：使用Espresso
- 集成测试：使用MockWebServer

## 联系方式
如有问题请联系开发团队。