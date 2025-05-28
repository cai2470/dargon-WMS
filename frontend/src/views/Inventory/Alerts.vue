<template>
  <div class="alerts-page">
    <div class="page-header">
      <h1>库存预警</h1>
      <div class="header-actions">
        <el-button type="warning" @click="processAllAlerts">
          <el-icon><Warning /></el-icon>
          批量处理
        </el-button>
        <el-button type="success" @click="exportAlerts">
          <el-icon><Download /></el-icon>
          导出预警
        </el-button>
        <el-button type="primary" @click="refreshAlerts">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 预警统计 -->
    <div class="alert-stats">
      <el-card class="stat-card critical">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><CircleCloseFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ alertStats.critical }}</div>
            <div class="stat-label">严重缺货</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card warning">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><WarningFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ alertStats.warning }}</div>
            <div class="stat-label">库存预警</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card expired">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ alertStats.expired }}</div>
            <div class="stat-label">即将过期</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card processed">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><CircleCheckFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ alertStats.processed }}</div>
            <div class="stat-label">已处理</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 筛选区域 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" label-width="80px" :inline="true">
        <el-form-item label="预警类型">
          <el-select 
            v-model="filterForm.alert_type" 
            placeholder="请选择预警类型"
            clearable
            style="width: 150px"
          >
            <el-option 
              v-for="type in alertTypeOptions" 
              :key="type.value"
              :label="type.label" 
              :value="type.value" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="预警级别">
          <el-select 
            v-model="filterForm.priority" 
            placeholder="预警级别"
            clearable
            style="width: 120px"
          >
            <el-option 
              v-for="priority in priorityOptions" 
              :key="priority.value"
              :label="priority.label" 
              :value="priority.value" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="仓库">
          <el-select 
            v-model="filterForm.warehouse_id" 
            placeholder="请选择仓库"
            clearable
            style="width: 150px"
          >
            <el-option 
              v-for="warehouse in warehouseOptions" 
              :key="warehouse.id"
              :label="warehouse.label" 
              :value="warehouse.value" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="处理状态">
          <el-select 
            v-model="filterForm.status" 
            placeholder="处理状态"
            clearable
            style="width: 120px"
          >
            <el-option 
              v-for="status in alertStatusOptions" 
              :key="status.value"
              :label="status.label" 
              :value="status.value" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="searchAlerts">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 预警列表 -->
    <el-card class="table-card">
      <el-table 
        :data="alertList" 
        stripe 
        v-loading="loading" 
        @selection-change="handleSelectionChange"
        max-height="600"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="alert_type" label="预警类型" width="120">
          <template #default="scope">
            <el-tag :type="getAlertTypeColor(scope.row.alert_type)">
              {{ getAlertTypeText(scope.row.alert_type) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="priority" label="级别" width="80">
          <template #default="scope">
            <el-tag :type="getPriorityColor(scope.row.priority)" size="small">
              {{ getPriorityText(scope.row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="product_name" label="商品名称" min-width="200" />
        <el-table-column prop="product_code" label="商品编码" width="120" />
        <el-table-column prop="warehouse_name" label="仓库" width="120" />
        <el-table-column prop="location_name" label="库位" width="100" />
        
        <el-table-column prop="current_stock" label="当前库存" width="100" align="right">
          <template #default="scope">
            <span :class="getStockClass(scope.row)">
              {{ scope.row.current_stock }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column prop="min_stock" label="最低库存" width="100" align="right" />
        <el-table-column prop="alert_threshold" label="预警阈值" width="100" align="right" />
        
        <el-table-column prop="status" label="处理状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusColor(scope.row.status)" size="small">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_time" label="预警时间" width="150" />
        <el-table-column prop="processed_time" label="处理时间" width="150" />
        
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="scope">
            <el-button 
              v-if="scope.row.status === 'pending'" 
              size="small" 
              type="primary" 
              @click="processAlert(scope.row)"
            >
              处理
            </el-button>
            <el-button 
              v-if="scope.row.status === 'pending'" 
              size="small" 
              type="warning" 
              @click="ignoreAlert(scope.row)"
            >
              忽略
            </el-button>
            <el-button 
              size="small" 
              type="info" 
              @click="viewDetails(scope.row)"
            >
              详情
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteAlert(scope.row)"
            >
              删除
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

    <!-- 处理预警对话框 -->
    <el-dialog 
      title="处理预警" 
      v-model="processDialogVisible" 
      width="500px"
      @close="resetProcessForm"
    >
      <el-form :model="processForm" :rules="processRules" ref="processFormRef" label-width="100px">
        <el-form-item label="预警信息">
          <div class="alert-info">
            <div><strong>{{ currentAlert?.product_name }}</strong></div>
            <div class="text-muted">{{ getAlertTypeText(currentAlert?.alert_type) }}</div>
            <div class="text-muted">当前库存：{{ currentAlert?.current_stock }} 件</div>
            <div class="text-muted">预警阈值：{{ currentAlert?.alert_threshold }} 件</div>
          </div>
        </el-form-item>
        
        <el-form-item label="处理动作" prop="action">
          <el-radio-group v-model="processForm.action">
            <el-radio label="replenish">安排补货</el-radio>
            <el-radio label="adjust">调整阈值</el-radio>
            <el-radio label="ignore">忽略预警</el-radio>
            <el-radio label="resolve">标记已解决</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item 
          v-if="processForm.action === 'replenish'" 
          label="补货数量" 
          prop="replenish_quantity"
        >
          <el-input-number 
            v-model="processForm.replenish_quantity" 
            :min="1"
            placeholder="请输入补货数量"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item 
          v-if="processForm.action === 'adjust'" 
          label="新阈值" 
          prop="new_threshold"
        >
          <el-input-number 
            v-model="processForm.new_threshold" 
            :min="0"
            placeholder="请输入新的预警阈值"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="处理说明" prop="remark">
          <el-input 
            v-model="processForm.remark" 
            type="textarea" 
            :rows="3"
            placeholder="请输入处理说明"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="processDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProcess" :loading="processing">确定处理</el-button>
      </template>
    </el-dialog>

    <!-- 补货对话框 -->
    <el-dialog 
      title="安排补货" 
      v-model="replenishDialogVisible" 
      width="600px"
      @close="resetReplenishForm"
    >
      <el-form :model="replenishForm" :rules="replenishRules" ref="replenishFormRef" label-width="100px">
        <el-form-item label="商品信息">
          <div class="product-info">
            <div><strong>{{ currentAlert?.product_name }}</strong></div>
            <div class="text-muted">编码：{{ currentAlert?.product_code }}</div>
            <div class="text-muted">当前库存：{{ currentAlert?.current_stock }} 件</div>
            <div class="text-muted">建议补货：{{ suggestedQuantity }} 件</div>
          </div>
        </el-form-item>
        
        <el-form-item label="供应商" prop="supplier_id">
          <el-select v-model="replenishForm.supplier_id" placeholder="请选择供应商" style="width: 100%">
            <el-option 
              v-for="supplier in suppliers" 
              :key="supplier.id"
              :label="supplier.name" 
              :value="supplier.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="补货数量" prop="quantity">
          <el-input-number 
            v-model="replenishForm.quantity" 
            :min="1"
            placeholder="请输入补货数量"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="预计到货" prop="expected_date">
          <el-date-picker
            v-model="replenishForm.expected_date"
            type="date"
            placeholder="请选择预计到货日期"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="紧急程度" prop="urgency">
          <el-radio-group v-model="replenishForm.urgency">
            <el-radio label="normal">正常</el-radio>
            <el-radio label="urgent">紧急</el-radio>
            <el-radio label="critical">极急</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input 
            v-model="replenishForm.remark" 
            type="textarea" 
            :rows="3"
            placeholder="请输入补货备注"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="replenishDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReplenish" :loading="replenishing">创建补货单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getWarehouseOptions, getAlertTypeOptions, getAlertStatusOptions, getPriorityOptions } from '@/utils/filterOptions'

// 响应式数据
const loading = ref(false)
const processing = ref(false)
const replenishing = ref(false)
const processDialogVisible = ref(false)
const replenishDialogVisible = ref(false)
const processFormRef = ref()
const replenishFormRef = ref()
const currentAlert = ref(null)
const selectedAlerts = ref([])

// 筛选表单
const filterForm = reactive({
  alert_type: '',
  priority: '',
  warehouse_id: null,
  status: ''
})

// 处理表单
const processForm = reactive({
  action: 'replenish',
  replenish_quantity: 1,
  new_threshold: 0,
  remark: ''
})

// 补货表单
const replenishForm = reactive({
  supplier_id: null,
  quantity: 1,
  expected_date: '',
  urgency: 'normal',
  remark: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 基础数据
const warehouses = ref([])
const suppliers = ref([])
const alertList = ref([])

// 筛选选项
const warehouseOptions = ref([])
const alertTypeOptions = ref([])
const alertStatusOptions = ref([])
const priorityOptions = ref([])

// 预警统计
const alertStats = reactive({
  critical: 0,
  warning: 0,
  expired: 0,
  processed: 0
})

// 验证规则
const processRules = {
  action: [
    { required: true, message: '请选择处理动作', trigger: 'change' }
  ],
  remark: [
    { required: true, message: '请输入处理说明', trigger: 'blur' }
  ]
}

const replenishRules = {
  supplier_id: [
    { required: true, message: '请选择供应商', trigger: 'change' }
  ],
  quantity: [
    { required: true, message: '请输入补货数量', trigger: 'blur' }
  ],
  expected_date: [
    { required: true, message: '请选择预计到货日期', trigger: 'change' }
  ]
}

// 计算建议补货数量
const suggestedQuantity = computed(() => {
  if (!currentAlert.value) return 0
  const deficit = currentAlert.value.min_stock - currentAlert.value.current_stock
  return Math.max(deficit, currentAlert.value.min_stock)
})

// 获取预警类型颜色
const getAlertTypeColor = (type) => {
  const colorMap = {
    'out_of_stock': 'danger',
    'low_stock': 'warning',
    'expiry': 'info',
    'slow_moving': 'success'
  }
  return colorMap[type] || 'info'
}

// 获取预警类型文本
const getAlertTypeText = (type) => {
  const textMap = {
    'out_of_stock': '缺货预警',
    'low_stock': '低库存预警',
    'expiry': '过期预警',
    'slow_moving': '滞销预警'
  }
  return textMap[type] || '未知类型'
}

// 获取优先级颜色
const getPriorityColor = (priority) => {
  const colorMap = {
    'critical': 'danger',
    'warning': 'warning',
    'info': 'info'
  }
  return colorMap[priority] || 'info'
}

// 获取优先级文本
const getPriorityText = (priority) => {
  const textMap = {
    'critical': '严重',
    'warning': '警告',
    'info': '提醒'
  }
  return textMap[priority] || '未知'
}

// 获取状态颜色
const getStatusColor = (status) => {
  const colorMap = {
    'pending': 'warning',
    'processing': 'primary',
    'resolved': 'success',
    'ignored': 'info'
  }
  return colorMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'pending': '未处理',
    'processing': '处理中',
    'resolved': '已处理',
    'ignored': '已忽略'
  }
  return textMap[status] || '未知状态'
}

// 获取库存样式
const getStockClass = (row) => {
  if (row.current_stock === 0) return 'stock-empty'
  if (row.current_stock <= row.alert_threshold) return 'stock-warning'
  return 'stock-normal'
}

// 加载基础数据
const loadBasicData = async () => {
  try {
    // 加载筛选选项
    warehouseOptions.value = getWarehouseOptions()
    alertTypeOptions.value = getAlertTypeOptions()
    alertStatusOptions.value = getAlertStatusOptions()
    priorityOptions.value = getPriorityOptions()

    // 加载仓库列表（为了向后兼容）
    warehouses.value = JSON.parse(localStorage.getItem('wms_warehouses') || '[]')
    if (warehouses.value.length === 0) {
      warehouses.value = [
        { id: 1, name: '主仓库', code: 'WH001' },
        { id: 2, name: '北京仓库', code: 'WH002' },
        { id: 3, name: '上海仓库', code: 'WH003' }
      ]
    }

    // 加载供应商列表
    suppliers.value = JSON.parse(localStorage.getItem('wms_suppliers') || '[]')
    if (suppliers.value.length === 0) {
      suppliers.value = [
        { id: 1, name: '华为供应商', code: 'SUP001' },
        { id: 2, name: '小米供应商', code: 'SUP002' },
        { id: 3, name: '苹果供应商', code: 'SUP003' }
      ]
    }
  } catch (error) {
    console.error('加载基础数据失败:', error)
  }
}

// 加载预警数据
const loadAlertData = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800))

    // 从真实库存数据生成预警
    const inventoryStock = JSON.parse(localStorage.getItem('inventory_stock') || '[]')
    const products = JSON.parse(localStorage.getItem('wms_products') || '[]')
    const warehousesData = JSON.parse(localStorage.getItem('wms_warehouses') || '[]')
    
    const alerts = []
    let alertId = 1
    
    // 遍历库存数据生成预警
    for (const stock of inventoryStock) {
      const product = products.find(p => p.id === stock.id || p.code === stock.product_code)
      const currentStock = parseInt(stock.current_stock || stock.qualified_stock || 0)
      const minStock = parseInt(stock.min_stock || product?.min_stock || 10)
      const alertThreshold = Math.ceil(minStock * 1.5) // 预警阈值为最低库存的1.5倍
      
      let alertType = ''
      let priority = ''
      let status = 'pending'
      
      // 判断预警类型和级别
      if (currentStock === 0) {
        alertType = 'out_of_stock'
        priority = 'critical'
      } else if (currentStock <= alertThreshold) {
        alertType = 'low_stock'
        priority = currentStock <= minStock ? 'critical' : 'warning'
      }
      
      // 只有需要预警的才加入列表
      if (alertType) {
        // 随机生成一些已处理的预警
        if (Math.random() > 0.7) {
          status = ['processing', 'resolved', 'ignored'][Math.floor(Math.random() * 3)]
        }
        
        alerts.push({
          id: alertId++,
          alert_type: alertType,
          priority: priority,
          product_name: stock.product_name || product?.name || '未知商品',
          product_code: stock.product_code || product?.code || 'UNKNOWN',
          warehouse_name: stock.warehouse_name || '主仓库',
          location_name: stock.location_name || 'A001',
          current_stock: currentStock,
          min_stock: minStock,
          alert_threshold: alertThreshold,
          status: status,
          created_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString(),
          processed_time: status !== 'pending' ? new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toLocaleString() : '',
          supplier_id: Math.floor(Math.random() * 3) + 1
        })
      }
    }
    
    // 如果没有真实库存数据，使用一些示例预警
    if (alerts.length === 0) {
      alerts.push(
        {
          id: 1,
          alert_type: 'low_stock',
          priority: 'warning',
          product_name: '华为P50 Pro',
          product_code: 'HW001',
          warehouse_name: '主仓库',
          location_name: 'A001',
          current_stock: 8,
          min_stock: 20,
          alert_threshold: 30,
          status: 'pending',
          created_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString(),
          processed_time: '',
          supplier_id: 1
        },
        {
          id: 2,
          alert_type: 'out_of_stock',
          priority: 'critical',
          product_name: 'ThinkPad X1 Carbon',
          product_code: 'LP001',
          warehouse_name: '北京仓库',
          location_name: 'A001',
          current_stock: 0,
          min_stock: 5,
          alert_threshold: 8,
          status: 'pending',
          created_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleString(),
          processed_time: '',
          supplier_id: 3
        }
      )
    }
    
    // 应用筛选条件
    let filteredAlerts = alerts
    
    if (filterForm.alert_type) {
      filteredAlerts = filteredAlerts.filter(alert => alert.alert_type === filterForm.alert_type)
    }
    if (filterForm.priority) {
      filteredAlerts = filteredAlerts.filter(alert => alert.priority === filterForm.priority)
    }
    if (filterForm.warehouse_id) {
      const selectedWarehouse = warehouseOptions.value.find(w => w.value === filterForm.warehouse_id)
      if (selectedWarehouse) {
        filteredAlerts = filteredAlerts.filter(alert => alert.warehouse_name === selectedWarehouse.label)
      }
    }
    if (filterForm.status) {
      filteredAlerts = filteredAlerts.filter(alert => alert.status === filterForm.status)
    }
    
    // 按创建时间倒序排序
    filteredAlerts.sort((a, b) => new Date(b.created_time) - new Date(a.created_time))
    
    alertList.value = filteredAlerts
    pagination.total = filteredAlerts.length

    // 更新统计数据（基于所有预警，不是筛选后的）
    alertStats.critical = alerts.filter(item => item.priority === 'critical' && item.status === 'pending').length
    alertStats.warning = alerts.filter(item => item.priority === 'warning' && item.status === 'pending').length
    alertStats.expired = alerts.filter(item => item.alert_type === 'expiry').length
    alertStats.processed = alerts.filter(item => item.status === 'resolved').length

  } catch (error) {
    console.error('加载预警数据失败:', error)
    ElMessage.error('加载预警数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索预警
const searchAlerts = () => {
  loadAlertData()
}

// 重置筛选
const resetFilter = () => {
  Object.assign(filterForm, {
    alert_type: '',
    priority: '',
    warehouse_id: null,
    status: ''
  })
  loadAlertData()
}

// 刷新预警
const refreshAlerts = () => {
  ElMessage.success('预警数据已刷新')
  loadAlertData()
}

// 导出预警
const exportAlerts = () => {
  ElMessage.info('预警导出功能开发中...')
}

// 批量处理预警
const processAllAlerts = () => {
  if (selectedAlerts.value.length === 0) {
    ElMessage.warning('请先选择要处理的预警')
    return
  }
  ElMessage.info(`批量处理 ${selectedAlerts.value.length} 条预警`)
}

// 处理预警
const processAlert = (alert) => {
  currentAlert.value = alert
  processDialogVisible.value = true
}

// 补货
const adjustStock = (alert) => {
  currentAlert.value = alert
  replenishForm.quantity = suggestedQuantity.value
  replenishDialogVisible.value = true
}

// 查看预警详情
const viewDetails = (alert) => {
  ElMessageBox.alert(
    `
📊 预警详细信息

🏷️ 商品信息：
• 商品名称：${alert.product_name}
• 商品编码：${alert.product_code}
• 仓库位置：${alert.warehouse_name}

📦 库存状态：
• 当前库存：${alert.current_stock} 件
• 最低库存：${alert.min_stock} 件
• 预警阈值：${alert.alert_threshold} 件

⚠️ 预警信息：
• 预警类型：${getAlertTypeText(alert.alert_type)}
• 优先级：${getPriorityText(alert.priority)}
• 预警状态：${getStatusText(alert.status)}
• 创建时间：${alert.created_time}

💡 建议操作：
${alert.alert_type === 'out_of_stock' ? 
  '• 立即安排紧急补货\n• 检查是否有其他仓库库存可调拨\n• 通知相关业务部门' :
  '• 安排常规补货\n• 检查历史销售数据调整最低库存\n• 优化库存管理策略'
}
    `,
    '预警详情',
    {
      confirmButtonText: '知道了',
      type: 'info',
      dangerouslyUseHTMLString: false
    }
  )
}

// 忽略预警
const ignoreAlert = async (alert) => {
  try {
    await ElMessageBox.confirm(
      `确定要忽略这条预警吗？\n商品：${alert.product_name}\n当前库存：${alert.current_stock}`,
      '忽略预警',
      {
        confirmButtonText: '确定忽略',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 更新预警状态为已忽略
    const alertIndex = alertList.value.findIndex(item => item.id === alert.id)
    if (alertIndex !== -1) {
      alertList.value[alertIndex].status = 'ignored'
      alertList.value[alertIndex].processed_time = new Date().toLocaleString()
    }
    
    ElMessage.success('预警已忽略')
    
  } catch {
    // 用户取消
  }
}

// 删除预警
const deleteAlert = async (alert) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这条预警吗？\n商品：${alert.product_name}\n预警类型：${getAlertTypeText(alert.alert_type)}\n\n此操作不可恢复！`,
      '删除预警',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 从列表中删除预警
    const alertIndex = alertList.value.findIndex(item => item.id === alert.id)
    if (alertIndex !== -1) {
      alertList.value.splice(alertIndex, 1)
      pagination.total = alertList.value.length
      
      // 更新统计数据
      if (alert.priority === 'critical' && alert.status === 'pending') {
        alertStats.critical = Math.max(0, alertStats.critical - 1)
      } else if (alert.priority === 'warning' && alert.status === 'pending') {
        alertStats.warning = Math.max(0, alertStats.warning - 1)
      } else if (alert.status === 'resolved') {
        alertStats.processed = Math.max(0, alertStats.processed - 1)
      }
      
      ElMessage.success('预警已删除')
    } else {
      ElMessage.error('未找到要删除的预警')
    }
    
  } catch {
    // 用户取消
  }
}

// 提交处理
const submitProcess = async () => {
  if (!processFormRef.value) return
  
  try {
    await processFormRef.value.validate()
    processing.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('预警处理成功')
    processDialogVisible.value = false
    loadAlertData()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('预警处理失败')
    }
  } finally {
    processing.value = false
  }
}

// 提交补货
const submitReplenish = async () => {
  if (!replenishFormRef.value) return
  
  try {
    await replenishFormRef.value.validate()
    replenishing.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('补货单创建成功')
    replenishDialogVisible.value = false
    loadAlertData()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('补货单创建失败')
    }
  } finally {
    replenishing.value = false
  }
}

// 重置表单
const resetProcessForm = () => {
  if (processFormRef.value) {
    processFormRef.value.resetFields()
  }
  Object.assign(processForm, {
    action: 'replenish',
    replenish_quantity: 1,
    new_threshold: 0,
    remark: ''
  })
  currentAlert.value = null
}

const resetReplenishForm = () => {
  if (replenishFormRef.value) {
    replenishFormRef.value.resetFields()
  }
  Object.assign(replenishForm, {
    supplier_id: null,
    quantity: 1,
    expected_date: '',
    urgency: 'normal',
    remark: ''
  })
  currentAlert.value = null
}

// 表格选择变化
const handleSelectionChange = (selection) => {
  selectedAlerts.value = selection
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  loadAlertData()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadAlertData()
}

onMounted(() => {
  loadBasicData()
  loadAlertData()
})
</script>

<style lang="scss" scoped>
.alerts-page {
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

.alert-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
  
  .stat-card {
    &.critical {
      border-left: 4px solid #F56C6C;
      
      .stat-icon {
        background: linear-gradient(45deg, #F56C6C, #F78989);
      }
    }
    
    &.warning {
      border-left: 4px solid #E6A23C;
      
      .stat-icon {
        background: linear-gradient(45deg, #E6A23C, #EEBE77);
      }
    }
    
    &.expired {
      border-left: 4px solid #909399;
      
      .stat-icon {
        background: linear-gradient(45deg, #909399, #B1B3B8);
      }
    }
    
    &.processed {
      border-left: 4px solid #67C23A;
      
      .stat-icon {
        background: linear-gradient(45deg, #67C23A, #85CE61);
      }
    }
    
    .stat-content {
      display: flex;
      align-items: center;
      
      .stat-icon {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 15px;
        
        .el-icon {
          font-size: 24px;
          color: white;
        }
      }
      
      .stat-info {
        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #303133;
          line-height: 1;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 13px;
          color: #909399;
        }
      }
    }
  }
}

.filter-card, .table-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

// 库存状态样式
.stock-normal {
  color: #67C23A;
  font-weight: 600;
}

.stock-warning {
  color: #E6A23C;
  font-weight: 600;
}

.stock-empty {
  color: #F56C6C;
  font-weight: 600;
}

.alert-info, .product-info {
  .text-muted {
    color: #909399;
    font-size: 13px;
    margin-top: 4px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .alerts-page {
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
  
  .alert-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  :deep(.el-form--inline .el-form-item) {
    margin-right: 0;
    margin-bottom: 15px;
    width: 100%;
    
    .el-form-item__content {
      width: 100%;
      
      .el-input, .el-select {
        width: 100% !important;
      }
    }
  }
  
  :deep(.el-table) {
    font-size: 12px;
    
    .el-button {
      padding: 5px 8px;
      font-size: 11px;
      margin: 2px;
    }
  }
}
</style>