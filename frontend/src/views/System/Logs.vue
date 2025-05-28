<template>
  <div class="system-logs-page">
    <div class="page-header">
      <h1>系统日志</h1>
      <div class="header-actions">
        <el-button type="warning" @click="clearLogs">
          <el-icon><Delete /></el-icon>
          清理日志
        </el-button>
        <el-button type="info" @click="exportLogs">
          <el-icon><Download /></el-icon>
          导出日志
        </el-button>
      </div>
    </div>

    <!-- 日志类型标签 -->
    <el-card class="tabs-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="操作日志" name="operation">
          <template #label>
            <span>
              <el-icon><Operation /></el-icon>
              操作日志
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="登录日志" name="login">
          <template #label>
            <span>
              <el-icon><User /></el-icon>
              登录日志
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="系统日志" name="system">
          <template #label>
            <span>
              <el-icon><Monitor /></el-icon>
              系统日志
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="错误日志" name="error">
          <template #label>
            <span>
              <el-icon><Warning /></el-icon>
              错误日志
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="用户">
          <el-input 
            v-model="filterForm.username" 
            placeholder="用户名"
            style="width: 150px"
            clearable
          />
        </el-form-item>
        <el-form-item label="操作模块" v-if="activeTab === 'operation'">
          <el-select v-model="filterForm.module" placeholder="选择模块" style="width: 150px" clearable>
            <el-option label="用户管理" value="users" />
            <el-option label="商品管理" value="products" />
            <el-option label="库存管理" value="inventory" />
            <el-option label="入库管理" value="inbound" />
            <el-option label="出库管理" value="outbound" />
            <el-option label="仓库管理" value="warehouse" />
          </el-select>
        </el-form-item>
        <el-form-item label="日志级别" v-if="activeTab === 'system' || activeTab === 'error'">
          <el-select v-model="filterForm.level" placeholder="选择级别" style="width: 120px" clearable>
            <el-option label="DEBUG" value="debug" />
            <el-option label="INFO" value="info" />
            <el-option label="WARNING" value="warning" />
            <el-option label="ERROR" value="error" />
            <el-option label="CRITICAL" value="critical" />
          </el-select>
        </el-form-item>
        <el-form-item label="IP地址" v-if="activeTab === 'login'">
          <el-input 
            v-model="filterForm.ip_address" 
            placeholder="IP地址"
            style="width: 150px"
            clearable
          />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.date_range"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 350px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchLogs">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 日志列表 -->
    <el-card class="table-card">
      <!-- 操作日志 -->
      <el-table 
        v-if="activeTab === 'operation'"
        :data="operationLogs" 
        stripe 
        v-loading="loading"
        max-height="600"
      >
        <el-table-column prop="timestamp" label="时间" width="160" />
        <el-table-column prop="username" label="用户" width="120" />
        <el-table-column prop="module" label="模块" width="120">
          <template #default="scope">
            <el-tag :type="getModuleTagType(scope.row.module)">
              {{ getModuleText(scope.row.module) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作" width="120" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="ip_address" label="IP地址" width="130" />
        <el-table-column prop="user_agent" label="浏览器" min-width="150" show-overflow-tooltip />
        <el-table-column prop="result" label="结果" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.result === 'success' ? 'success' : 'danger'">
              {{ scope.row.result === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <!-- 登录日志 -->
      <el-table 
        v-if="activeTab === 'login'"
        :data="loginLogs" 
        stripe 
        v-loading="loading"
        max-height="600"
      >
        <el-table-column prop="timestamp" label="时间" width="160" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="login_type" label="登录方式" width="120">
          <template #default="scope">
            <el-tag :type="getLoginTypeTagType(scope.row.login_type)">
              {{ getLoginTypeText(scope.row.login_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip_address" label="IP地址" width="130" />
        <el-table-column prop="location" label="登录地点" width="150" />
        <el-table-column prop="device" label="设备信息" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'success' ? 'success' : 'danger'">
              {{ scope.row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="logout_time" label="退出时间" width="160" />
      </el-table>

      <!-- 系统日志 -->
      <el-table 
        v-if="activeTab === 'system'"
        :data="systemLogs" 
        stripe 
        v-loading="loading"
        max-height="600"
      >
        <el-table-column prop="timestamp" label="时间" width="160" />
        <el-table-column prop="level" label="级别" width="100">
          <template #default="scope">
            <el-tag :type="getLevelTagType(scope.row.level)">
              {{ scope.row.level.toUpperCase() }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="150" />
        <el-table-column prop="message" label="消息" min-width="300" show-overflow-tooltip />
        <el-table-column prop="file" label="文件" width="200" show-overflow-tooltip />
        <el-table-column prop="line" label="行号" width="80" />
        <el-table-column label="操作" width="100">
          <template #default="scope">
            <el-button size="small" type="primary" @click="viewLogDetail(scope.row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 错误日志 -->
      <el-table 
        v-if="activeTab === 'error'"
        :data="errorLogs" 
        stripe 
        v-loading="loading"
        max-height="600"
      >
        <el-table-column prop="timestamp" label="时间" width="160" />
        <el-table-column prop="level" label="级别" width="100">
          <template #default="scope">
            <el-tag type="danger">
              {{ scope.row.level.toUpperCase() }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="error_type" label="错误类型" width="150" />
        <el-table-column prop="message" label="错误消息" min-width="250" show-overflow-tooltip />
        <el-table-column prop="file" label="文件" width="200" show-overflow-tooltip />
        <el-table-column prop="line" label="行号" width="80" />
        <el-table-column prop="user" label="用户" width="120" />
        <el-table-column label="操作" width="100">
          <template #default="scope">
            <el-button size="small" type="danger" @click="viewErrorDetail(scope.row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 日志详情对话框 -->
    <el-dialog 
      title="日志详情" 
      v-model="detailDialogVisible" 
      width="800px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="时间">{{ currentLog.timestamp }}</el-descriptions-item>
        <el-descriptions-item label="级别">
          <el-tag :type="getLevelTagType(currentLog.level)">
            {{ currentLog.level?.toUpperCase() }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="模块">{{ currentLog.module }}</el-descriptions-item>
        <el-descriptions-item label="文件">{{ currentLog.file }}</el-descriptions-item>
        <el-descriptions-item label="行号">{{ currentLog.line }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ currentLog.user || '系统' }}</el-descriptions-item>
      </el-descriptions>
      
      <div style="margin-top: 20px;">
        <h4>详细信息</h4>
        <el-input 
          v-model="currentLog.message" 
          type="textarea" 
          :rows="8" 
          readonly
          style="font-family: monospace;"
        />
      </div>
      
      <div v-if="currentLog.stack_trace" style="margin-top: 20px;">
        <h4>堆栈跟踪</h4>
        <el-input 
          v-model="currentLog.stack_trace" 
          type="textarea" 
          :rows="10" 
          readonly
          style="font-family: monospace;"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const loading = ref(false)
const activeTab = ref('operation')
const detailDialogVisible = ref(false)
const currentLog = ref({})

// 筛选表单
const filterForm = reactive({
  username: '',
  module: '',
  level: '',
  ip_address: '',
  date_range: []
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 日志数据
const operationLogs = ref([])
const loginLogs = ref([])
const systemLogs = ref([])
const errorLogs = ref([])

// 加载操作日志
const loadOperationLogs = async () => {
  operationLogs.value = [
    {
      id: 1,
      timestamp: '2024-01-15 10:30:25',
      username: 'admin',
      module: 'users',
      action: '创建用户',
      description: '创建用户"test_user"',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      result: 'success'
    },
    {
      id: 2,
      timestamp: '2024-01-15 10:25:18',
      username: 'zhang_san',
      module: 'products',
      action: '添加商品',
      description: '添加商品"华为P60 Pro"',
      ip_address: '192.168.1.101',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      result: 'success'
    },
    {
      id: 3,
      timestamp: '2024-01-15 10:20:45',
      username: 'li_si',
      module: 'inventory',
      action: '库存调整',
      description: '调整商品"小米13"库存数量',
      ip_address: '192.168.1.102',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      result: 'success'
    },
    {
      id: 4,
      timestamp: '2024-01-15 10:15:32',
      username: 'wang_wu',
      module: 'inbound',
      action: '创建入库单',
      description: '创建入库单"IB202401150001"',
      ip_address: '192.168.1.103',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      result: 'failed'
    }
  ]
}

// 加载登录日志
const loadLoginLogs = async () => {
  loginLogs.value = [
    {
      id: 1,
      timestamp: '2024-01-15 10:30:00',
      username: 'admin',
      login_type: 'web',
      ip_address: '192.168.1.100',
      location: '北京市朝阳区',
      device: 'Windows 10 - Chrome 120.0.0.0',
      status: 'success',
      logout_time: ''
    },
    {
      id: 2,
      timestamp: '2024-01-15 09:15:30',
      username: 'zhang_san',
      login_type: 'mobile',
      ip_address: '192.168.1.101',
      location: '上海市浦东新区',
      device: 'Android 13 - Chrome Mobile 120.0.0.0',
      status: 'success',
      logout_time: '2024-01-15 17:30:00'
    },
    {
      id: 3,
      timestamp: '2024-01-15 08:45:15',
      username: 'li_si',
      login_type: 'web',
      ip_address: '192.168.1.102',
      location: '广州市天河区',
      device: 'Windows 11 - Edge 120.0.0.0',
      status: 'success',
      logout_time: '2024-01-15 18:00:00'
    },
    {
      id: 4,
      timestamp: '2024-01-15 08:30:45',
      username: 'unknown_user',
      login_type: 'web',
      ip_address: '192.168.1.200',
      location: '未知',
      device: 'Windows 10 - Chrome 120.0.0.0',
      status: 'failed',
      logout_time: ''
    }
  ]
}

// 加载系统日志
const loadSystemLogs = async () => {
  systemLogs.value = [
    {
      id: 1,
      timestamp: '2024-01-15 10:30:25',
      level: 'info',
      module: 'django.request',
      message: 'GET /api/products/ HTTP/1.1 200',
      file: 'views.py',
      line: 45,
      user: 'admin'
    },
    {
      id: 2,
      timestamp: '2024-01-15 10:25:18',
      level: 'warning',
      module: 'inventory.models',
      message: '库存数量低于最小库存阈值',
      file: 'models.py',
      line: 128,
      user: 'system'
    },
    {
      id: 3,
      timestamp: '2024-01-15 10:20:45',
      level: 'info',
      module: 'users.views',
      message: '用户登录成功',
      file: 'views.py',
      line: 89,
      user: 'zhang_san'
    },
    {
      id: 4,
      timestamp: '2024-01-15 10:15:32',
      level: 'debug',
      module: 'products.serializers',
      message: '商品数据序列化完成',
      file: 'serializers.py',
      line: 67,
      user: 'system'
    }
  ]
}

// 加载错误日志
const loadErrorLogs = async () => {
  errorLogs.value = [
    {
      id: 1,
      timestamp: '2024-01-15 10:30:25',
      level: 'error',
      error_type: 'ValidationError',
      message: '商品价格不能为负数',
      file: 'products/models.py',
      line: 45,
      user: 'zhang_san',
      stack_trace: `Traceback (most recent call last):
  File "products/models.py", line 45, in clean
    if self.price < 0:
ValidationError: 商品价格不能为负数`
    },
    {
      id: 2,
      timestamp: '2024-01-15 10:25:18',
      level: 'critical',
      error_type: 'DatabaseError',
      message: '数据库连接超时',
      file: 'django/db/backends/base/base.py',
      line: 219,
      user: 'system',
      stack_trace: `Traceback (most recent call last):
  File "django/db/backends/base/base.py", line 219, in ensure_connection
    self.connect()
DatabaseError: 数据库连接超时`
    },
    {
      id: 3,
      timestamp: '2024-01-15 10:20:45',
      level: 'error',
      error_type: 'PermissionDenied',
      message: '用户权限不足',
      file: 'users/views.py',
      line: 156,
      user: 'wang_wu',
      stack_trace: `Traceback (most recent call last):
  File "users/views.py", line 156, in check_permission
    raise PermissionDenied("用户权限不足")
PermissionDenied: 用户权限不足`
    }
  ]
}

// 获取模块标签类型
const getModuleTagType = (module) => {
  const typeMap = {
    'users': 'primary',
    'products': 'success',
    'inventory': 'warning',
    'inbound': 'info',
    'outbound': 'danger',
    'warehouse': ''
  }
  return typeMap[module] || 'info'
}

// 获取模块文本
const getModuleText = (module) => {
  const textMap = {
    'users': '用户管理',
    'products': '商品管理',
    'inventory': '库存管理',
    'inbound': '入库管理',
    'outbound': '出库管理',
    'warehouse': '仓库管理'
  }
  return textMap[module] || module
}

// 获取登录方式标签类型
const getLoginTypeTagType = (type) => {
  const typeMap = {
    'web': 'primary',
    'mobile': 'success',
    'api': 'warning'
  }
  return typeMap[type] || 'info'
}

// 获取登录方式文本
const getLoginTypeText = (type) => {
  const textMap = {
    'web': 'Web端',
    'mobile': '移动端',
    'api': 'API接口'
  }
  return textMap[type] || type
}

// 获取日志级别标签类型
const getLevelTagType = (level) => {
  const typeMap = {
    'debug': 'info',
    'info': 'success',
    'warning': 'warning',
    'error': 'danger',
    'critical': 'danger'
  }
  return typeMap[level] || 'info'
}

// 处理标签页变化
const handleTabChange = (tabName) => {
  activeTab.value = tabName
  resetFilter()
  loadLogs()
}

// 加载日志数据
const loadLogs = async () => {
  loading.value = true
  try {
    switch (activeTab.value) {
      case 'operation':
        await loadOperationLogs()
        pagination.total = operationLogs.value.length
        break
      case 'login':
        await loadLoginLogs()
        pagination.total = loginLogs.value.length
        break
      case 'system':
        await loadSystemLogs()
        pagination.total = systemLogs.value.length
        break
      case 'error':
        await loadErrorLogs()
        pagination.total = errorLogs.value.length
        break
    }
  } catch (error) {
    ElMessage.error('加载日志数据失败')
    console.error('加载日志数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索日志
const searchLogs = () => {
  pagination.page = 1
  loadLogs()
}

// 重置筛选
const resetFilter = () => {
  Object.assign(filterForm, {
    username: '',
    module: '',
    level: '',
    ip_address: '',
    date_range: []
  })
}

// 查看日志详情
const viewLogDetail = (row) => {
  currentLog.value = { ...row }
  detailDialogVisible.value = true
}

// 查看错误详情
const viewErrorDetail = (row) => {
  currentLog.value = { ...row }
  detailDialogVisible.value = true
}

// 清理日志
const clearLogs = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清理所有日志吗？此操作不可恢复。',
      '确认清理',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.success('日志清理成功')
    loadLogs()
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清理日志失败')
    }
  }
}

// 导出日志
const exportLogs = () => {
  ElMessage.info('日志导出功能开发中...')
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  loadLogs()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadLogs()
}

onMounted(() => {
  loadLogs()
})
</script>

<style lang="scss" scoped>
.system-logs-page {
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

.tabs-card, .filter-card, .table-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

// 响应式设计
@media (max-width: 768px) {
  .system-logs-page {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    
    h1 {
      font-size: 20px;
    }
  }
}
</style> 