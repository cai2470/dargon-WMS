<template>
  <div class="movements-page">
    <div class="page-header">
      <h1>库存变动</h1>
      <div class="header-actions">
        <el-button type="success" @click="exportMovements">
          <el-icon><Download /></el-icon>
          导出记录
        </el-button>
        <el-button type="primary" @click="refreshMovements">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 变动统计 -->
    <div class="movement-stats">
      <el-card class="stat-card inbound">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Plus /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ movementStats.inbound }}</div>
            <div class="stat-label">今日入库</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card outbound">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Minus /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ movementStats.outbound }}</div>
            <div class="stat-label">今日出库</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card adjustment">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Edit /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ movementStats.adjustment }}</div>
            <div class="stat-label">今日调整</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card transfer">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Sort /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ movementStats.transfer }}</div>
            <div class="stat-label">今日调拨</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 筛选区域 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" label-width="80px" :inline="true">
        <el-form-item label="变动类型">
          <el-select 
            v-model="filterForm.movement_type" 
            placeholder="请选择变动类型"
            clearable
            style="width: 150px"
          >
            <el-option 
              v-for="type in movementTypeOptions" 
              :key="type.value"
              :label="type.label" 
              :value="type.value" 
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
              v-for="warehouse in warehouses" 
              :key="warehouse.id"
              :label="warehouse.name" 
              :value="warehouse.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="商品名称">
          <el-input 
            v-model="filterForm.product_name" 
            placeholder="请输入商品名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="商品编码">
          <el-input 
            v-model="filterForm.product_code" 
            placeholder="请输入商品编码"
            clearable
            style="width: 120px"
          />
        </el-form-item>
        
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        
        <el-form-item label="操作人">
          <el-input 
            v-model="filterForm.operator" 
            placeholder="请输入操作人"
            clearable
            style="width: 120px"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="searchMovements">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 变动记录列表 -->
    <el-card class="table-card">
      <el-table :data="movementList" stripe v-loading="loading" max-height="600" size="small">
        <el-table-column prop="movement_type" label="类型" width="80">
          <template #default="scope">
            <el-tag :type="getMovementTypeColor(scope.row.movement_type)" size="small">
              {{ getMovementTypeText(scope.row.movement_type) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="product_code" label="编码" width="100" />
        <el-table-column prop="product_name" label="商品名称" min-width="160" />
        <el-table-column prop="warehouse_name" label="仓库" width="80" />
        <el-table-column prop="location_name" label="库位" width="80" />
        
        <el-table-column prop="before_quantity" label="变动前" width="80" align="right">
          <template #default="scope">
            <span class="quantity-text">{{ scope.row.before_quantity }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="change_quantity" label="变动量" width="80" align="right">
          <template #default="scope">
            <span :class="getChangeQuantityClass(scope.row)">
              {{ scope.row.change_quantity > 0 ? '+' : '' }}{{ scope.row.change_quantity }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column prop="after_quantity" label="变动后" width="80" align="right">
          <template #default="scope">
            <span class="quantity-text"><strong>{{ scope.row.after_quantity }}</strong></span>
          </template>
        </el-table-column>
        
        <el-table-column prop="unit" label="单位" width="60" />
        <el-table-column prop="reason" label="原因" width="100" />
        <el-table-column prop="reference_no" label="关联单号" width="130">
          <template #default="scope">
            <el-link v-if="scope.row.reference_no" type="primary" @click="viewReference(scope.row)">
              {{ scope.row.reference_no }}
            </el-link>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="operator" label="操作人" width="80" />
        <el-table-column prop="created_time" label="变动时间" width="130" />
        <el-table-column prop="remark" label="备注" min-width="120">
          <template #default="scope">
            <el-tooltip v-if="scope.row.remark" :content="scope.row.remark" placement="top">
              <span class="remark-text">{{ scope.row.remark }}</span>
            </el-tooltip>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="scope">
            <el-button size="small" type="info" @click="viewDetails(scope.row)">
              详情
            </el-button>
            <el-button 
              v-if="scope.row.movement_type === 'adjustment'" 
              size="small" 
              type="warning" 
              @click="reverseMovement(scope.row)"
            >
              撤销
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteMovement(scope.row)"
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

    <!-- 变动详情对话框 -->
    <el-dialog 
      title="变动详情" 
      v-model="detailDialogVisible" 
      width="600px"
    >
      <div v-if="currentMovement" class="movement-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="变动类型">
            <el-tag :type="getMovementTypeColor(currentMovement.movement_type)">
              {{ getMovementTypeText(currentMovement.movement_type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="变动时间">
            {{ currentMovement.created_time }}
          </el-descriptions-item>
          <el-descriptions-item label="商品编码">
            {{ currentMovement.product_code }}
          </el-descriptions-item>
          <el-descriptions-item label="商品名称">
            {{ currentMovement.product_name }}
          </el-descriptions-item>
          <el-descriptions-item label="仓库">
            {{ currentMovement.warehouse_name }}
          </el-descriptions-item>
          <el-descriptions-item label="库位">
            {{ currentMovement.location_name }}
          </el-descriptions-item>
          <el-descriptions-item label="变动前库存">
            {{ currentMovement.before_quantity }} {{ currentMovement.unit }}
          </el-descriptions-item>
          <el-descriptions-item label="变动数量">
            <span :class="getChangeQuantityClass(currentMovement)">
              {{ currentMovement.change_quantity > 0 ? '+' : '' }}{{ currentMovement.change_quantity }} {{ currentMovement.unit }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="变动后库存">
            {{ currentMovement.after_quantity }} {{ currentMovement.unit }}
          </el-descriptions-item>
          <el-descriptions-item label="变动原因">
            {{ currentMovement.reason }}
          </el-descriptions-item>
          <el-descriptions-item label="关联单号">
            {{ currentMovement.reference_no || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="操作人">
            {{ currentMovement.operator }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">
            {{ currentMovement.remark || '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 撤销变动对话框 -->
    <el-dialog 
      title="撤销变动" 
      v-model="reverseDialogVisible" 
      width="500px"
      @close="resetReverseForm"
    >
      <el-form :model="reverseForm" :rules="reverseRules" ref="reverseFormRef" label-width="100px">
        <el-form-item label="变动信息">
          <div v-if="currentMovement" class="movement-info">
            <div><strong>{{ currentMovement.product_name }}</strong></div>
            <div class="text-muted">变动数量：{{ currentMovement.change_quantity }} {{ currentMovement.unit }}</div>
            <div class="text-muted">变动时间：{{ currentMovement.created_time }}</div>
          </div>
        </el-form-item>
        
        <el-form-item label="撤销原因" prop="reason">
          <el-select v-model="reverseForm.reason" placeholder="请选择撤销原因" style="width: 100%">
            <el-option label="操作错误" value="操作错误" />
            <el-option label="数据错误" value="数据错误" />
            <el-option label="业务变更" value="业务变更" />
            <el-option label="其他原因" value="其他原因" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="备注" prop="remark">
          <el-input 
            v-model="reverseForm.remark" 
            type="textarea" 
            :rows="3"
            placeholder="请输入撤销备注"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="reverseDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="submitReverse" :loading="reversing">确定撤销</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getWarehouseOptions, getMovementTypeOptions } from '@/utils/filterOptions'

// 响应式数据
const loading = ref(false)
const reversing = ref(false)
const detailDialogVisible = ref(false)
const reverseDialogVisible = ref(false)
const reverseFormRef = ref()
const currentMovement = ref(null)

// 筛选表单
const filterForm = reactive({
  movement_type: '',
  warehouse_id: null,
  product_name: '',
  product_code: '',
  date_range: [],
  operator: ''
})

// 撤销表单
const reverseForm = reactive({
  reason: '',
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
const movementList = ref([])

// 选项数据
const movementTypeOptions = ref([])

// 变动统计
const movementStats = reactive({
  inbound: 0,
  outbound: 0,
  adjustment: 0,
  transfer: 0
})

// 验证规则
const reverseRules = {
  reason: [
    { required: true, message: '请选择撤销原因', trigger: 'change' }
  ],
  remark: [
    { required: true, message: '请输入撤销备注', trigger: 'blur' }
  ]
}

// 获取变动类型颜色
const getMovementTypeColor = (type) => {
  const colorMap = {
    'inbound': 'success',
    'outbound': 'warning',
    'adjustment': 'primary',
    'transfer': 'info',
    'count': 'purple',
    'loss': 'danger'
  }
  return colorMap[type] || 'info'
}

// 获取变动类型文本
const getMovementTypeText = (type) => {
  const textMap = {
    'inbound': '入库',
    'outbound': '出库',
    'adjustment': '调整',
    'transfer': '调拨',
    'count': '盘点',
    'loss': '损耗'
  }
  return textMap[type] || '未知'
}

// 获取变动数量样式
const getChangeQuantityClass = (row) => {
  if (row.change_quantity > 0) return 'quantity-positive'
  if (row.change_quantity < 0) return 'quantity-negative'
  return 'quantity-zero'
}

// 创建示例库存变动数据
const createSampleMovements = () => {
  const now = new Date()
  const movements = []
  
  // 模拟一些库存变动记录
  const sampleData = [
    {
      id: '1',
      product_id: '1',
        product_code: 'HW001',
        product_name: '华为P50 Pro',
      movement_type: 'inbound',
      quantity: 20,
      before_quantity: 25,
      after_quantity: 45,
      warehouse_id: '1',
      location_id: '1',
        location_name: 'A001',
      order_no: 'IB2024010001',
      remark: '采购入库',
      created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2小时前
      created_by: '仓库管理员'
    },
    {
      id: '2',
      product_id: '2',
      product_code: 'IP001',
      product_name: 'iPhone 14 Pro',
        movement_type: 'outbound',
      quantity: -5,
      before_quantity: 13,
      after_quantity: 8,
      warehouse_id: '1',
      location_id: '2',
        location_name: 'A002',
      order_no: 'OB2024010001',
      remark: '销售出库',
      created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1小时前
      created_by: '销售人员'
    },
    {
      id: '3',
      product_id: '3',
      product_code: 'XM001',
      product_name: '小米13 Pro',
        movement_type: 'adjustment',
      quantity: 5,
        before_quantity: 0,
        after_quantity: 5,
      warehouse_id: '2',
      location_id: '3',
      location_name: 'B001',
      order_no: '',
      remark: '盘点调整',
      created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30分钟前
      created_by: '系统管理员'
    }
  ]
  
  return sampleData
}

// 加载仓库列表
const loadWarehouses = async () => {
  try {
    const warehouseOptions = getWarehouseOptions()
    warehouses.value = warehouseOptions.map(w => ({
      id: w.value,
      name: w.label,
      code: w.code
    }))
  } catch (error) {
    ElMessage.error('加载仓库列表失败')
  }
}

// 加载变动记录
const loadMovementData = async () => {
  loading.value = true
  try {
    // 从localStorage读取库存变动记录
    let stockMovements = JSON.parse(localStorage.getItem('wms_stock_movements') || '[]')
    
    // 如果没有库存变动记录，创建一些示例数据
    if (stockMovements.length === 0) {
      stockMovements = createSampleMovements()
      localStorage.setItem('wms_stock_movements', JSON.stringify(stockMovements))
    }
    
    // 获取仓库信息用于名称映射
    const warehousesData = JSON.parse(localStorage.getItem('wms_warehouses') || '[]')
    const getWarehouseName = (warehouseId) => {
      const warehouse = warehousesData.find(w => w.id === warehouseId)
      return warehouse ? warehouse.name : '未知仓库'
    }
    
    // 获取产品信息用于补充数据
    const productsData = JSON.parse(localStorage.getItem('wms_products') || '[]')
    const getProductInfo = (productId) => {
      const product = productsData.find(p => p.id === productId)
      return product ? {
        code: product.code,
        name: product.name,
        unit: product.unit || '台'
      } : {
        code: 'UNKNOWN',
        name: '未知商品',
        unit: '台'
      }
    }
    
    // 转换数据格式以适配页面显示
    let movements = stockMovements.map(movement => {
      const productInfo = getProductInfo(movement.product_id)
      
      return {
        id: movement.id,
        movement_type: movement.movement_type,
        product_code: movement.product_code || productInfo.code,
        product_name: movement.product_name || productInfo.name,
        warehouse_name: getWarehouseName(movement.warehouse_id) || '主仓库',
        location_name: movement.location_name || 'A001',
        before_quantity: movement.before_quantity || 0,
        change_quantity: movement.quantity || 0,
        after_quantity: movement.after_quantity || 0,
        unit: productInfo.unit,
        reason: movement.movement_type === 'inbound' ? '采购入库' : 
               movement.movement_type === 'outbound' ? '销售出库' : '其他',
        reference_no: movement.order_no || '',
        operator: movement.created_by || '系统',
        created_time: new Date(movement.created_at).toLocaleString() || new Date().toLocaleString(),
        remark: movement.remark || ''
      }
    })
    
    // 应用筛选条件
    if (filterForm.movement_type) {
      movements = movements.filter(item => item.movement_type === filterForm.movement_type)
    }
    if (filterForm.warehouse_id) {
      movements = movements.filter(item => {
        // 通过仓库名称匹配
        const selectedWarehouse = warehouses.value.find(w => w.id === filterForm.warehouse_id)
        return selectedWarehouse ? item.warehouse_name === selectedWarehouse.name : false
      })
    }
    if (filterForm.product_name) {
      movements = movements.filter(item => 
        item.product_name.toLowerCase().includes(filterForm.product_name.toLowerCase())
      )
    }
    if (filterForm.product_code) {
      movements = movements.filter(item => 
        item.product_code.toLowerCase().includes(filterForm.product_code.toLowerCase())
      )
    }
    if (filterForm.operator) {
      movements = movements.filter(item => 
        item.operator.includes(filterForm.operator)
      )
    }
    if (filterForm.date_range && filterForm.date_range.length === 2) {
      const startDate = new Date(filterForm.date_range[0]).getTime()
      const endDate = new Date(filterForm.date_range[1]).getTime() + 24 * 60 * 60 * 1000 // 包含结束日期
      movements = movements.filter(item => {
        const itemDate = new Date(item.created_time).getTime()
        return itemDate >= startDate && itemDate <= endDate
      })
    }
    
    // 按创建时间倒序排序（最新的在前面）
    movements.sort((a, b) => new Date(b.created_time) - new Date(a.created_time))
    
    movementList.value = movements
    pagination.total = movements.length
    
    // 更新统计数据（今日数据）
    const today = new Date().toISOString().split('T')[0]
    const todayMovements = stockMovements.filter(item => {
      const itemDate = new Date(item.created_at).toISOString().split('T')[0]
      return itemDate === today
    })
    
    movementStats.inbound = todayMovements.filter(item => item.movement_type === 'inbound').length
    movementStats.outbound = todayMovements.filter(item => item.movement_type === 'outbound').length
    movementStats.adjustment = todayMovements.filter(item => item.movement_type === 'adjustment').length
    movementStats.transfer = todayMovements.filter(item => item.movement_type === 'transfer').length
    
  } catch (error) {
    console.error('加载变动记录失败:', error)
    ElMessage.error('加载变动记录失败')
  } finally {
    loading.value = false
  }
}

// 搜索变动记录
const searchMovements = () => {
  loadMovementData()
}

// 重置筛选
const resetFilter = () => {
  Object.assign(filterForm, {
    movement_type: '',
    warehouse_id: null,
    product_name: '',
    product_code: '',
    date_range: [],
    operator: ''
  })
  loadMovementData()
}

// 刷新变动记录
const refreshMovements = () => {
  ElMessage.success('变动记录已刷新')
  loadMovementData()
}

// 导出变动记录
const exportMovements = () => {
  ElMessage.info('变动记录导出功能开发中...')
}

// 查看变动详情
const viewDetails = (movement) => {
  currentMovement.value = movement
  detailDialogVisible.value = true
}

// 查看关联单据
const viewReference = (movement) => {
  if (movement.reference_no) {
    ElMessage.info(`查看关联单据: ${movement.reference_no}`)
  }
}

// 撤销变动
const reverseMovement = async (movement) => {
  try {
    await ElMessageBox.confirm(
      '撤销变动将会恢复变动前的库存数量，此操作不可恢复，是否继续？',
      '确认撤销',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    currentMovement.value = movement
    reverseDialogVisible.value = true
    
  } catch {
    // 用户取消
  }
}

// 提交撤销
const submitReverse = async () => {
  if (!reverseFormRef.value) return
  
  try {
    await reverseFormRef.value.validate()
    reversing.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('变动撤销成功')
    reverseDialogVisible.value = false
    loadMovementData()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('变动撤销失败')
    }
  } finally {
    reversing.value = false
  }
}

// 重置撤销表单
const resetReverseForm = () => {
  if (reverseFormRef.value) {
    reverseFormRef.value.resetFields()
  }
  Object.assign(reverseForm, {
    reason: '',
    remark: ''
  })
  currentMovement.value = null
}

// 删除变动记录
const deleteMovement = async (movement) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这条库存变动记录吗？\n商品：${movement.product_name}\n变动时间：${movement.created_time}\n\n删除后将无法恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 从localStorage中删除该记录
    let movements = JSON.parse(localStorage.getItem('wms_stock_movements') || '[]')
    const index = movements.findIndex(m => m.id === movement.id)
    
    if (index !== -1) {
      movements.splice(index, 1)
      localStorage.setItem('wms_stock_movements', JSON.stringify(movements))
      
      ElMessage.success('库存变动记录已删除')
      await loadMovementData() // 重新加载数据
    } else {
      ElMessage.error('未找到要删除的记录')
    }
  } catch (error) {
    // 用户取消删除或其他错误
    if (error !== 'cancel') {
      console.error('删除库存变动记录失败:', error)
      ElMessage.error('删除记录失败')
    }
  }
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  loadMovementData()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadMovementData()
}

onMounted(async () => {
  try {
    await loadWarehouses()
    // 加载变动类型选项
    movementTypeOptions.value = getMovementTypeOptions()
    
    // 首先检查是否有入库完成记录，自动生成库存变动
    generateMovementsFromInbound()
    
    await loadMovementData()
  } catch (error) {
    console.error('初始化失败:', error)
    ElMessage.error('页面初始化失败，请刷新重试')
  }
})

// 从入库记录生成库存变动数据
const generateMovementsFromInbound = () => {
  try {
    const inboundOrders = JSON.parse(localStorage.getItem('inbound_orders') || '[]')
    const outboundOrders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    const existingMovements = JSON.parse(localStorage.getItem('wms_stock_movements') || '[]')
    
    // 处理入库完成的订单
    const completedInboundOrders = inboundOrders.filter(order => order.status === 'completed')
    
    completedInboundOrders.forEach(order => {
      if (order.products && order.products.length > 0) {
        order.products.forEach(product => {
          // 检查是否已经生成过变动记录
          const existingMovement = existingMovements.find(movement => 
            movement.reference_order === order.id && 
            movement.product_id === product.product_id &&
            movement.movement_type === 'inbound'
          )
          
          if (!existingMovement) {
            const qualifiedQty = product.qualified_quantity || product.actual_quantity || product.expected_quantity || 0
            if (qualifiedQty > 0) {
              // 生成入库变动记录
              const movement = {
                id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                product_id: product.product_id || product.id,
                product_code: product.product_code,
                product_name: product.product_name,
                movement_type: 'inbound',
                quantity: qualifiedQty,
                before_quantity: 0, // 假设之前为0
                after_quantity: qualifiedQty,
                warehouse_id: order.target_warehouse || order.warehouse_id || '1',
                location_id: product.location_id || '1',
                location_name: product.location_name || 'A001',
                order_no: order.order_no,
                reference_order: order.id,
                remark: `入库完成 - ${order.order_no}`,
                created_at: order.shelving_end_time || order.updated_at || new Date().toISOString(),
                created_by: order.operator || '系统'
              }
              
              existingMovements.push(movement)
            }
          }
        })
      }
    })
    
    // 处理出库完成的订单
    const completedOutboundOrders = outboundOrders.filter(order => order.status === '已出库')
    
    completedOutboundOrders.forEach(order => {
      if (order.products && order.products.length > 0) {
        order.products.forEach(product => {
          // 检查是否已经生成过变动记录
          const existingMovement = existingMovements.find(movement => 
            movement.reference_order === order.id && 
            movement.product_id === product.product_id &&
            movement.movement_type === 'outbound'
          )
          
          if (!existingMovement) {
            const outboundQty = product.actual_quantity || product.expected_quantity || 0
            if (outboundQty > 0) {
              // 生成出库变动记录
              const movement = {
                id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                product_id: product.product_id || product.id,
                product_code: product.product_code,
                product_name: product.product_name,
                movement_type: 'outbound',
                quantity: -outboundQty, // 出库为负数
                before_quantity: outboundQty, // 假设之前有库存
                after_quantity: 0, // 假设出库后为0
                warehouse_id: order.warehouse_id || '1',
                location_id: product.location_id || '1',
                location_name: product.location_name || 'A001',
                order_no: order.order_no,
                reference_order: order.id,
                remark: `出库完成 - ${order.order_no}`,
                created_at: order.updated_at || new Date().toISOString(),
                created_by: order.operator || '系统'
              }
              
              existingMovements.push(movement)
            }
          }
        })
      }
    })
    
    // 保存更新后的变动记录
    localStorage.setItem('wms_stock_movements', JSON.stringify(existingMovements))
  } catch (error) {
    console.error('生成库存变动记录失败:', error)
  }
}
</script>

<style lang="scss" scoped>
.movements-page {
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

.movement-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
  
  .stat-card {
    &.inbound {
      border-left: 4px solid #67C23A;
      
      .stat-icon {
        background: linear-gradient(45deg, #67C23A, #85CE61);
      }
    }
    
    &.outbound {
      border-left: 4px solid #E6A23C;
      
      .stat-icon {
        background: linear-gradient(45deg, #E6A23C, #EEBE77);
      }
    }
    
    &.adjustment {
      border-left: 4px solid #409EFF;
      
      .stat-icon {
        background: linear-gradient(45deg, #409EFF, #66B1FF);
      }
    }
    
    &.transfer {
      border-left: 4px solid #909399;
      
      .stat-icon {
        background: linear-gradient(45deg, #909399, #B1B3B8);
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

// 数量变化样式
.quantity-positive {
  color: #67C23A;
  font-weight: 600;
}

.quantity-negative {
  color: #F56C6C;
  font-weight: 600;
}

.quantity-zero {
  color: #909399;
  font-weight: 600;
}

.quantity-text {
  color: #303133;
  font-weight: 500;
}

.text-muted {
  color: #909399;
  font-size: 13px;
}

.remark-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
  display: inline-block;
}

.movement-detail {
  .el-descriptions {
    margin-top: 20px;
  }
}

.movement-info {
  .text-muted {
    margin-top: 4px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .movements-page {
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
    }
  }
  
  .movement-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  :deep(.el-form--inline .el-form-item) {
    margin-right: 0;
    margin-bottom: 15px;
    width: 100%;
    
    .el-form-item__content {
      width: 100%;
      
      .el-input, .el-select, .el-date-picker {
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