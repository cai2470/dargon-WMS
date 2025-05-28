<template>
  <div class="system-settings-page">
    <div class="page-header">
      <h1>系统设置</h1>
      <div class="header-actions">
        <el-button type="primary" @click="saveAllSettings" :loading="saving">
          <el-icon><Check /></el-icon>
          保存设置
        </el-button>
        <el-button type="info" @click="resetSettings">
          <el-icon><Refresh /></el-icon>
          重置设置
        </el-button>
      </div>
    </div>

    <div class="settings-container">
      <!-- 设置导航 -->
      <div class="settings-nav">
        <el-menu
          :default-active="activeTab"
          mode="vertical"
          @select="handleTabChange"
          class="settings-menu"
        >
          <el-menu-item index="basic">
            <el-icon><Setting /></el-icon>
            <span>基本设置</span>
          </el-menu-item>
          <el-menu-item index="warehouse">
            <el-icon><OfficeBuilding /></el-icon>
            <span>仓库设置</span>
          </el-menu-item>
          <el-menu-item index="notification">
            <el-icon><Bell /></el-icon>
            <span>通知设置</span>
          </el-menu-item>
          <el-menu-item index="security">
            <el-icon><Lock /></el-icon>
            <span>安全设置</span>
          </el-menu-item>
          <el-menu-item index="backup">
            <el-icon><FolderOpened /></el-icon>
            <span>备份设置</span>
          </el-menu-item>
          <el-menu-item index="about">
            <el-icon><InfoFilled /></el-icon>
            <span>关于系统</span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 设置内容 -->
      <div class="settings-content">
        <!-- 基本设置 -->
        <el-card v-show="activeTab === 'basic'" class="setting-card">
          <template #header>
            <div class="card-header">
              <span>基本设置</span>
            </div>
          </template>
          
          <el-form :model="basicSettings" label-width="150px">
            <el-form-item label="系统名称">
              <el-input v-model="basicSettings.systemName" placeholder="请输入系统名称" />
            </el-form-item>
            
            <el-form-item label="公司名称">
              <el-input v-model="basicSettings.companyName" placeholder="请输入公司名称" />
            </el-form-item>
            
            <el-form-item label="系统Logo">
              <el-upload
                class="logo-uploader"
                action="#"
                :show-file-list="false"
                :before-upload="beforeLogoUpload"
                :on-success="handleLogoSuccess"
              >
                <img v-if="basicSettings.logoUrl" :src="basicSettings.logoUrl" class="logo" />
                <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            
            <el-form-item label="默认语言">
              <el-select v-model="basicSettings.defaultLanguage" placeholder="请选择默认语言">
                <el-option label="简体中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
                <el-option label="繁體中文" value="zh-TW" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="时区设置">
              <el-select v-model="basicSettings.timezone" placeholder="请选择时区">
                <el-option label="北京时间 (UTC+8)" value="Asia/Shanghai" />
                <el-option label="东京时间 (UTC+9)" value="Asia/Tokyo" />
                <el-option label="纽约时间 (UTC-5)" value="America/New_York" />
                <el-option label="伦敦时间 (UTC+0)" value="Europe/London" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="日期格式">
              <el-select v-model="basicSettings.dateFormat" placeholder="请选择日期格式">
                <el-option label="YYYY-MM-DD" value="YYYY-MM-DD" />
                <el-option label="MM/DD/YYYY" value="MM/DD/YYYY" />
                <el-option label="DD/MM/YYYY" value="DD/MM/YYYY" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="货币单位">
              <el-select v-model="basicSettings.currency" placeholder="请选择货币单位">
                <el-option label="人民币 (¥)" value="CNY" />
                <el-option label="美元 ($)" value="USD" />
                <el-option label="欧元 (€)" value="EUR" />
                <el-option label="日元 (¥)" value="JPY" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 仓库设置 -->
        <el-card v-show="activeTab === 'warehouse'" class="setting-card">
          <template #header>
            <div class="card-header">
              <span>仓库设置</span>
            </div>
          </template>
          
          <el-form :model="warehouseSettings" label-width="150px">
            <el-form-item label="默认仓库">
              <el-select v-model="warehouseSettings.defaultWarehouse" placeholder="请选择默认仓库">
                <el-option 
                  v-for="warehouse in warehouses" 
                  :key="warehouse.id"
                  :label="warehouse.name" 
                  :value="warehouse.id" 
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="库存预警阈值">
              <el-input-number 
                v-model="warehouseSettings.stockWarningThreshold" 
                :min="0" 
                :max="100"
                placeholder="库存预警百分比"
              />
              <span class="form-tip">当库存低于此百分比时发出预警</span>
            </el-form-item>
            
            <el-form-item label="自动补货">
              <el-switch v-model="warehouseSettings.autoReplenishment" />
              <span class="form-tip">启用后系统将自动生成补货建议</span>
            </el-form-item>
            
            <el-form-item label="库位编码规则">
              <el-input v-model="warehouseSettings.locationCodeRule" placeholder="如：{仓库代码}-{库区}-{货架}-{层}-{位}" />
            </el-form-item>
            
            <el-form-item label="条码类型">
              <el-select v-model="warehouseSettings.barcodeType" placeholder="请选择条码类型">
                <el-option label="Code128" value="code128" />
                <el-option label="Code39" value="code39" />
                <el-option label="EAN13" value="ean13" />
                <el-option label="QR Code" value="qrcode" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="启用批次管理">
              <el-switch v-model="warehouseSettings.enableBatchManagement" />
            </el-form-item>
            
            <el-form-item label="启用序列号管理">
              <el-switch v-model="warehouseSettings.enableSerialNumber" />
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 通知设置 -->
        <el-card v-show="activeTab === 'notification'" class="setting-card">
          <template #header>
            <div class="card-header">
              <span>通知设置</span>
            </div>
          </template>
          
          <el-form :model="notificationSettings" label-width="150px">
            <el-form-item label="邮件通知">
              <el-switch v-model="notificationSettings.emailEnabled" />
            </el-form-item>
            
            <el-form-item label="SMTP服务器" v-if="notificationSettings.emailEnabled">
              <el-input v-model="notificationSettings.smtpServer" placeholder="smtp.example.com" />
            </el-form-item>
            
            <el-form-item label="SMTP端口" v-if="notificationSettings.emailEnabled">
              <el-input-number v-model="notificationSettings.smtpPort" :min="1" :max="65535" />
            </el-form-item>
            
            <el-form-item label="发件人邮箱" v-if="notificationSettings.emailEnabled">
              <el-input v-model="notificationSettings.senderEmail" placeholder="noreply@example.com" />
            </el-form-item>
            
            <el-form-item label="短信通知">
              <el-switch v-model="notificationSettings.smsEnabled" />
            </el-form-item>
            
            <el-form-item label="微信通知">
              <el-switch v-model="notificationSettings.wechatEnabled" />
            </el-form-item>
            
            <el-form-item label="通知事件">
              <el-checkbox-group v-model="notificationSettings.notificationEvents">
                <el-checkbox label="stock_warning">库存预警</el-checkbox>
                <el-checkbox label="order_created">订单创建</el-checkbox>
                <el-checkbox label="order_completed">订单完成</el-checkbox>
                <el-checkbox label="inventory_count">库存盘点</el-checkbox>
                <el-checkbox label="system_error">系统错误</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 安全设置 -->
        <el-card v-show="activeTab === 'security'" class="setting-card">
          <template #header>
            <div class="card-header">
              <span>安全设置</span>
            </div>
          </template>
          
          <el-form :model="securitySettings" label-width="150px">
            <el-form-item label="密码策略">
              <el-checkbox-group v-model="securitySettings.passwordPolicy">
                <el-checkbox label="min_length">最少8位字符</el-checkbox>
                <el-checkbox label="uppercase">包含大写字母</el-checkbox>
                <el-checkbox label="lowercase">包含小写字母</el-checkbox>
                <el-checkbox label="number">包含数字</el-checkbox>
                <el-checkbox label="special">包含特殊字符</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            
            <el-form-item label="密码有效期">
              <el-input-number v-model="securitySettings.passwordExpireDays" :min="0" :max="365" />
              <span class="form-tip">天（0表示永不过期）</span>
            </el-form-item>
            
            <el-form-item label="登录失败锁定">
              <el-switch v-model="securitySettings.loginLockEnabled" />
            </el-form-item>
            
            <el-form-item label="最大失败次数" v-if="securitySettings.loginLockEnabled">
              <el-input-number v-model="securitySettings.maxLoginAttempts" :min="3" :max="10" />
            </el-form-item>
            
            <el-form-item label="锁定时间" v-if="securitySettings.loginLockEnabled">
              <el-input-number v-model="securitySettings.lockDuration" :min="5" :max="1440" />
              <span class="form-tip">分钟</span>
            </el-form-item>
            
            <el-form-item label="会话超时">
              <el-input-number v-model="securitySettings.sessionTimeout" :min="30" :max="1440" />
              <span class="form-tip">分钟</span>
            </el-form-item>
            
            <el-form-item label="启用双因子认证">
              <el-switch v-model="securitySettings.twoFactorEnabled" />
            </el-form-item>
            
            <el-form-item label="IP白名单">
              <el-input 
                v-model="securitySettings.ipWhitelist" 
                type="textarea" 
                :rows="3"
                placeholder="每行一个IP地址或IP段，如：192.168.1.1 或 192.168.1.0/24"
              />
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 备份设置 -->
        <el-card v-show="activeTab === 'backup'" class="setting-card">
          <template #header>
            <div class="card-header">
              <span>备份设置</span>
            </div>
          </template>
          
          <el-form :model="backupSettings" label-width="150px">
            <el-form-item label="自动备份">
              <el-switch v-model="backupSettings.autoBackupEnabled" />
            </el-form-item>
            
            <el-form-item label="备份频率" v-if="backupSettings.autoBackupEnabled">
              <el-select v-model="backupSettings.backupFrequency" placeholder="请选择备份频率">
                <el-option label="每天" value="daily" />
                <el-option label="每周" value="weekly" />
                <el-option label="每月" value="monthly" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="备份时间" v-if="backupSettings.autoBackupEnabled">
              <el-time-picker v-model="backupSettings.backupTime" format="HH:mm" />
            </el-form-item>
            
            <el-form-item label="保留备份数">
              <el-input-number v-model="backupSettings.retainBackups" :min="1" :max="30" />
              <span class="form-tip">个</span>
            </el-form-item>
            
            <el-form-item label="备份路径">
              <el-input v-model="backupSettings.backupPath" placeholder="/backup/wms" />
            </el-form-item>
            
            <el-form-item label="备份内容">
              <el-checkbox-group v-model="backupSettings.backupContent">
                <el-checkbox label="database">数据库</el-checkbox>
                <el-checkbox label="files">文件</el-checkbox>
                <el-checkbox label="logs">日志</el-checkbox>
                <el-checkbox label="config">配置</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="createBackup" :loading="backuping">
                立即备份
              </el-button>
              <el-button type="info" @click="viewBackupHistory">
                备份历史
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 关于系统 -->
        <el-card v-show="activeTab === 'about'" class="setting-card">
          <template #header>
            <div class="card-header">
              <span>关于系统</span>
            </div>
          </template>
          
          <div class="about-content">
            <div class="system-info">
              <div class="logo-section">
                <img src="/logo.png" alt="系统Logo" class="system-logo" />
                <h2>小神龙仓库管理系统</h2>
                <p class="version">版本 v1.0.0</p>
              </div>
              
              <el-descriptions title="系统信息" :column="2" border>
                <el-descriptions-item label="系统版本">v1.0.0</el-descriptions-item>
                <el-descriptions-item label="发布日期">2024-01-15</el-descriptions-item>
                <el-descriptions-item label="技术栈">Vue 3 + Django + SQLite</el-descriptions-item>
                <el-descriptions-item label="开发者">小神龙团队</el-descriptions-item>
                <el-descriptions-item label="许可证">MIT License</el-descriptions-item>
                <el-descriptions-item label="官网">https://xiaoshenlong-wms.com</el-descriptions-item>
              </el-descriptions>
              
              <div class="feature-list">
                <h3>主要功能</h3>
                <ul>
                  <li>✅ 商品管理 - 支持分类、品牌、供应商管理</li>
                  <li>✅ 仓库管理 - 多仓库、多库区、多储位管理</li>
                  <li>✅ 入库管理 - 采购入库、退货入库、调拨入库</li>
                  <li>✅ 出库管理 - 销售出库、调拨出库、其他出库</li>
                  <li>✅ 库存管理 - 实时库存、库存预警、库存盘点</li>
                  <li>✅ 报表中心 - 入库报表、出库报表、库存报表</li>
                  <li>✅ 用户管理 - 角色权限、操作日志</li>
                  <li>✅ 移动端支持 - PDA扫码、移动操作</li>
                </ul>
              </div>
              
              <div class="contact-info">
                <h3>技术支持</h3>
                <p>📧 邮箱：support@xiaoshenlong-wms.com</p>
                <p>📞 电话：400-123-4567</p>
                <p>🌐 官网：https://xiaoshenlong-wms.com</p>
                <p>📖 文档：https://docs.xiaoshenlong-wms.com</p>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const saving = ref(false)
const backuping = ref(false)
const activeTab = ref('basic')

// 基础数据
const warehouses = ref([])

// 基本设置
const basicSettings = reactive({
  systemName: '小神龙仓库管理系统',
  companyName: '小神龙科技有限公司',
  logoUrl: '',
  defaultLanguage: 'zh-CN',
  timezone: 'Asia/Shanghai',
  dateFormat: 'YYYY-MM-DD',
  currency: 'CNY'
})

// 仓库设置
const warehouseSettings = reactive({
  defaultWarehouse: null,
  stockWarningThreshold: 20,
  autoReplenishment: false,
  locationCodeRule: '{仓库代码}-{库区}-{货架}-{层}-{位}',
  barcodeType: 'code128',
  enableBatchManagement: false,
  enableSerialNumber: false
})

// 通知设置
const notificationSettings = reactive({
  emailEnabled: false,
  smtpServer: '',
  smtpPort: 587,
  senderEmail: '',
  smsEnabled: false,
  wechatEnabled: false,
  notificationEvents: ['stock_warning', 'order_created']
})

// 安全设置
const securitySettings = reactive({
  passwordPolicy: ['min_length', 'number'],
  passwordExpireDays: 90,
  loginLockEnabled: true,
  maxLoginAttempts: 5,
  lockDuration: 30,
  sessionTimeout: 120,
  twoFactorEnabled: false,
  ipWhitelist: ''
})

// 备份设置
const backupSettings = reactive({
  autoBackupEnabled: true,
  backupFrequency: 'daily',
  backupTime: new Date(),
  retainBackups: 7,
  backupPath: '/backup/wms',
  backupContent: ['database', 'files']
})

// 加载基础数据
const loadBasicData = async () => {
  try {
    // 模拟加载仓库数据
    warehouses.value = [
      { id: 1, name: '主仓库', code: 'WH001' },
      { id: 2, name: '北京仓库', code: 'WH002' },
      { id: 3, name: '上海仓库', code: 'WH003' },
      { id: 4, name: '广州仓库', code: 'WH004' }
    ]
  } catch (error) {
    ElMessage.error('加载基础数据失败')
  }
}

// 切换标签
const handleTabChange = (key) => {
  activeTab.value = key
}

// Logo上传前验证
const beforeLogoUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('Logo只能是 JPG/PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('Logo大小不能超过 2MB!')
  }
  return isJPG && isLt2M
}

// Logo上传成功
const handleLogoSuccess = (response, file) => {
  basicSettings.logoUrl = URL.createObjectURL(file.raw)
}

// 保存所有设置
const saveAllSettings = async () => {
  saving.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    ElMessage.success('设置保存成功')
  } catch (error) {
    ElMessage.error('保存设置失败')
  } finally {
    saving.value = false
  }
}

// 重置设置
const resetSettings = async () => {
  try {
    await ElMessageBox.confirm('确定要重置所有设置吗？此操作不可恢复。', '确认重置', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    ElMessage.success('设置已重置')
  } catch (error) {
    // 用户取消
  }
}

// 创建备份
const createBackup = async () => {
  backuping.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    ElMessage.success('备份创建成功')
  } catch (error) {
    ElMessage.error('备份创建失败')
  } finally {
    backuping.value = false
  }
}

// 查看备份历史
const viewBackupHistory = () => {
  ElMessage.info('备份历史功能开发中...')
}

onMounted(() => {
  loadBasicData()
})
</script>

<style lang="scss" scoped>
.system-settings-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h1 {
    margin: 0;
    color: #303133;
    font-size: 24px;
    font-weight: 600;
  }
  
  .header-actions {
    display: flex;
    gap: 10px;
  }
}

.settings-container {
  display: flex;
  gap: 20px;
  height: calc(100vh - 140px);
}

.settings-nav {
  width: 200px;
  flex-shrink: 0;
  
  .settings-menu {
    border-right: none;
    
    .el-menu-item {
      height: 50px;
      line-height: 50px;
      
      .el-icon {
        margin-right: 8px;
      }
    }
  }
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  
  .setting-card {
    .card-header {
      font-weight: 600;
      font-size: 16px;
    }
    
    .el-form {
      max-width: 600px;
      
      .form-tip {
        margin-left: 10px;
        color: #909399;
        font-size: 12px;
      }
    }
  }
}

.logo-uploader {
  .logo {
    width: 100px;
    height: 100px;
    display: block;
    object-fit: contain;
  }
  
  :deep(.el-upload) {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: 0.2s;
    
    &:hover {
      border-color: #409EFF;
    }
  }
  
  .logo-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 100px;
    height: 100px;
    line-height: 100px;
    text-align: center;
  }
}

.about-content {
  .system-info {
    .logo-section {
      text-align: center;
      margin-bottom: 30px;
      
      .system-logo {
        width: 80px;
        height: 80px;
        margin-bottom: 15px;
      }
      
      h2 {
        margin: 0 0 10px 0;
        color: #303133;
      }
      
      .version {
        color: #909399;
        margin: 0;
      }
    }
    
    .feature-list {
      margin: 30px 0;
      
      h3 {
        color: #303133;
        margin-bottom: 15px;
      }
      
      ul {
        list-style: none;
        padding: 0;
        
        li {
          padding: 5px 0;
          color: #606266;
        }
      }
    }
    
    .contact-info {
      margin-top: 30px;
      
      h3 {
        color: #303133;
        margin-bottom: 15px;
      }
      
      p {
        margin: 8px 0;
        color: #606266;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .system-settings-page {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    
    h1 {
      font-size: 20px;
    }
    
    .header-actions {
      width: 100%;
      justify-content: center;
      flex-wrap: wrap;
    }
  }
  
  .settings-container {
    flex-direction: column;
    height: auto;
  }
  
  .settings-nav {
    width: 100%;
    
    .settings-menu {
      display: flex;
      overflow-x: auto;
      
      .el-menu-item {
        flex-shrink: 0;
        white-space: nowrap;
      }
    }
  }
  
  .settings-content {
    .setting-card {
      .el-form {
        max-width: 100%;
      }
    }
  }
}
</style> 