<template>
  <div class="picking-goods">
    <!-- 筛选区域 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" label-width="80px" :inline="true">
        <el-form-item label="出库单号">
          <el-input 
            v-model="filterForm.order_no" 
            placeholder="请输入单号"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="拣货人员">
          <el-select 
            v-model="filterForm.picker_staff" 
            placeholder="请选择拣货人员"
            clearable
            style="width: 120px"
          >
            <el-option 
              v-for="staff in staffList" 
              :key="staff.id"
              :label="staff.name" 
              :value="staff.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="拣货策略">
          <el-select 
            v-model="filterForm.picking_strategy" 
            placeholder="请选择策略"
            clearable
            style="width: 120px"
          >
            <el-option label="按库区拣货" value="zone" />
            <el-option label="批量拣货" value="batch" />
            <el-option label="波次拣货" value="wave" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchData">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card">
      <div class="table-header">
        <h3>拣货任务列表</h3>
        <div class="header-actions">
          <el-button type="success" @click="batchCompletePicking" :disabled="selectedRows.length === 0">
            <el-icon><Check /></el-icon>
            批量完成拣货
          </el-button>
          <el-button type="warning" @click="printPickingList" :disabled="selectedRows.length === 0">
            <el-icon><Printer /></el-icon>
            打印拣货单
          </el-button>
        </div>
      </div>
      
      <el-table :data="tableData" stripe v-loading="loading" size="small" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column label="#" type="index" width="50" />
        <el-table-column prop="order_no" label="出库单号" width="130" />
        <el-table-column prop="customer_name" label="客户名称" width="120" />
        <el-table-column prop="warehouse_name" label="出库仓库" width="100" />
        <el-table-column prop="picker_names" label="拣货人员" width="120">
          <template #default="scope">
            <el-tag 
              v-for="name in scope.row.picker_names" 
              :key="name"
              size="small"
              style="margin-right: 5px;"
            >
              {{ name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="picking_strategy" label="拣货策略" width="100">
          <template #default="scope">
            <el-tag size="small" :type="getStrategyColor(scope.row.picking_strategy)">
              {{ getStrategyText(scope.row.picking_strategy) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_quantity" label="总数量" width="80" align="right" />
        <el-table-column prop="picked_quantity" label="已拣数量" width="80" align="right" />
        <el-table-column prop="picking_progress" label="拣货进度" width="120">
          <template #default="scope">
            <el-progress 
              :percentage="scope.row.picking_progress" 
              :color="getProgressColor(scope.row.picking_progress)"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column prop="picking_start_time" label="开始时间" width="130" />
        <el-table-column prop="estimated_picking_time" label="预计用时" width="80" align="center">
          <template #default="scope">
            {{ scope.row.estimated_picking_time }}h
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button 
              size="small" 
              type="primary" 
              @click="startPicking(scope.row)"
            >
              拣货操作
            </el-button>
            <el-button 
              size="small" 
              type="success" 
              @click="completePicking(scope.row)"
            >
              完成拣货
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 拣货操作对话框 -->
    <el-dialog 
      title="拣货操作" 
      v-model="pickingDialogVisible" 
      width="1000px"
    >
      <div v-if="currentOrder">
        <div class="order-info">
          <h4>出库单信息</h4>
          <el-row :gutter="20">
            <el-col :span="6">出库单号：{{ currentOrder.order_no }}</el-col>
            <el-col :span="6">客户名称：{{ currentOrder.customer_name }}</el-col>
            <el-col :span="6">拣货人员：{{ currentOrder.picker_names?.join(', ') }}</el-col>
            <el-col :span="6">拣货策略：{{ getStrategyText(currentOrder.picking_strategy) }}</el-col>
          </el-row>
        </div>

        <!-- 商品拣货明细 -->
        <div class="product-picking" style="margin-top: 20px;">
          <h4>商品拣货明细</h4>
          <el-table :data="currentOrder.products" border size="small">
            <el-table-column prop="product_code" label="商品编码" width="120" />
            <el-table-column prop="product_name" label="商品名称" min-width="140" />
            <el-table-column prop="isku" label="iSKU" width="100" />
            <el-table-column prop="quantity" label="需拣数量" width="100" align="right" />
            <el-table-column prop="unit" label="单位" width="60" />
            <el-table-column label="建议库位" width="120">
              <template #default="scope">
                <el-tag size="small" type="info">{{ getRecommendedLocation(scope.row) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="实际拣货数量" width="140">
              <template #default="scope">
                <el-input-number 
                  v-model="scope.row.actual_picked_quantity" 
                  :min="0" 
                  :max="scope.row.quantity"
                  size="small"
                  style="width: 100%"
                />
              </template>
            </el-table-column>
            <el-table-column label="拣货状态" width="100">
              <template #default="scope">
                <el-tag 
                  :type="getPickingStatusColor(scope.row)"
                  size="small"
                >
                  {{ getPickingStatusText(scope.row) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="拣货备注" min-width="120">
              <template #default="scope">
                <el-input 
                  v-model="scope.row.actual_picking_remark" 
                  size="small"
                  placeholder="拣货备注"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="pickingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePickingProgress">保存进度</el-button>
        <el-button type="success" @click="submitCompletePicking">完成拣货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const emit = defineEmits(['refresh'])

// 响应式数据
const loading = ref(false)
const pickingDialogVisible = ref(false)
const currentOrder = ref(null)
const selectedRows = ref([])

// 筛选表单
const filterForm = reactive({
  order_no: '',
  picker_staff: null,
  picking_strategy: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 数据列表
const tableData = ref([])
const staffList = ref([])

// 加载基础数据
const loadBasicData = async () => {
  try {
    // 从员工管理系统加载拣货人员
    const staffData = JSON.parse(localStorage.getItem('wms_staff') || '[]')
    staffList.value = staffData
      .filter(staff => 
        staff.status === 'active' && 
        (staff.position === 'picker' || 
         staff.position === 'warehouse_manager' ||
         staff.roles.includes('operator'))
      )
      .map(staff => ({
        id: staff.id,
        name: staff.name,
        staff_no: staff.staff_no,
        department: staff.department,
        position: staff.position,
        phone: staff.phone
      }))
    
    console.log('加载拣货人员:', staffList.value.length, '人')
  } catch (error) {
    ElMessage.error('加载基础数据失败')
    console.error('加载基础数据失败:', error)
  }
}

// 加载拣货任务列表
const loadTableData = async () => {
  loading.value = true
  try {
    // 从localStorage获取出库单数据
    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    console.log('PickingGoods - 所有出库单数据:', orders)
    console.log('PickingGoods - 员工列表:', staffList.value)
    
    // 筛选拣货中状态的订单
    let pickingOrders = orders.filter(order => order.status === 'picking')
    console.log('PickingGoods - 筛选出的拣货订单:', pickingOrders)
    
    // 处理数据
    pickingOrders = pickingOrders.map(order => {
      const totalQuantity = order.products ? order.products.reduce((sum, p) => sum + (p.quantity || 0), 0) : 0
      const pickedQuantity = order.products ? order.products.reduce((sum, p) => sum + (p.actual_picked_quantity || 0), 0) : 0
      const pickingProgress = totalQuantity > 0 ? Math.round((pickedQuantity / totalQuantity) * 100) : 0
      
      // 获取拣货人员姓名
      const pickerNames = order.picker_staff ? 
        order.picker_staff.map(staffId => {
          const staff = staffList.value.find(s => s.id === staffId)
          return staff ? staff.name : '未知'
        }) : []
      
      return {
        ...order,
        total_quantity: totalQuantity,
        picked_quantity: pickedQuantity,
        picking_progress: pickingProgress,
        picker_names: pickerNames
      }
    })
    
    // 应用筛选条件
    if (filterForm.order_no) {
      pickingOrders = pickingOrders.filter(order => 
        order.order_no.toLowerCase().includes(filterForm.order_no.toLowerCase())
      )
    }
    if (filterForm.picker_staff) {
      pickingOrders = pickingOrders.filter(order => 
        order.picker_staff && order.picker_staff.includes(filterForm.picker_staff)
      )
    }
    if (filterForm.picking_strategy) {
      pickingOrders = pickingOrders.filter(order => order.picking_strategy === filterForm.picking_strategy)
    }
    
    tableData.value = pickingOrders
    pagination.total = pickingOrders.length
    
  } catch (error) {
    ElMessage.error('加载拣货任务列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索数据
const searchData = () => {
  loadTableData()
}

// 重置筛选
const resetFilter = () => {
  Object.assign(filterForm, {
    order_no: '',
    picker_staff: null,
    picking_strategy: ''
  })
  loadTableData()
}

// 选择行变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 开始拣货操作
const startPicking = (order) => {
  currentOrder.value = {
    ...order,
    products: order.products.map(p => ({
      ...p,
      actual_picked_quantity: p.actual_picked_quantity || 0,
      actual_picking_remark: p.actual_picking_remark || ''
    }))
  }
  
  pickingDialogVisible.value = true
}

// 完成拣货
const completePicking = async (order) => {
  try {
    await ElMessageBox.confirm(
      `确定要完成出库单 "${order.order_no}" 的拣货吗？`,
      '完成拣货',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 更新订单状态为待打包
    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    const index = orders.findIndex(o => o.id === order.id)
    if (index !== -1) {
      orders[index] = {
        ...orders[index],
        status: 'packing',
        picking_completed_time: new Date().toLocaleString(),
        updated_at: new Date().toLocaleString()
      }
    }
    
    localStorage.setItem('outbound_orders', JSON.stringify(orders))
    ElMessage.success(`出库单 ${order.order_no} 拣货已完成，进入打包环节`)
    loadTableData()
    emit('refresh')
  } catch {
    // 用户取消操作
  }
}

// 批量完成拣货
const batchCompletePicking = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要批量完成 ${selectedRows.value.length} 个出库单的拣货吗？`,
      '批量操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 批量更新状态为待打包
    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    selectedRows.value.forEach(selectedOrder => {
      const index = orders.findIndex(order => order.id === selectedOrder.id)
      if (index !== -1) {
        orders[index] = {
          ...orders[index],
          status: 'packing',
          picking_completed_time: new Date().toLocaleString(),
          updated_at: new Date().toLocaleString()
        }
      }
    })
    
    localStorage.setItem('outbound_orders', JSON.stringify(orders))
    ElMessage.success(`已批量完成 ${selectedRows.value.length} 个出库单的拣货`)
    loadTableData()
    emit('refresh')
  } catch {
    // 用户取消操作
  }
}

// 打印拣货单
const printPickingList = () => {
  ElMessage.info('打印拣货单功能开发中...')
}

// 保存拣货进度
const savePickingProgress = () => {
  try {
    // 更新拣货进度
    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    const index = orders.findIndex(order => order.id === currentOrder.value.id)
    if (index !== -1) {
      orders[index] = {
        ...orders[index],
        products: currentOrder.value.products,
        updated_at: new Date().toLocaleString()
      }
    }
    
    localStorage.setItem('outbound_orders', JSON.stringify(orders))
    ElMessage.success('拣货进度已保存')
    loadTableData()
  } catch (error) {
    ElMessage.error('保存拣货进度失败')
  }
}

// 提交完成拣货
const submitCompletePicking = async () => {
  try {
    // 检查是否所有商品都已拣货
    const unfinishedProducts = currentOrder.value.products.filter(p => 
      (p.actual_picked_quantity || 0) < p.quantity
    )
    
    if (unfinishedProducts.length > 0) {
      const result = await ElMessageBox.confirm(
        `还有 ${unfinishedProducts.length} 个商品未完成拣货，确定要完成拣货吗？`,
        '确认完成',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    }
    
    // 更新订单状态为待打包
    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    const index = orders.findIndex(order => order.id === currentOrder.value.id)
    if (index !== -1) {
      orders[index] = {
        ...orders[index],
        status: 'packing',
        products: currentOrder.value.products,
        picking_completed_time: new Date().toLocaleString(),
        updated_at: new Date().toLocaleString()
      }
    }
    
    localStorage.setItem('outbound_orders', JSON.stringify(orders))
    ElMessage.success(`出库单 ${currentOrder.value.order_no} 拣货已完成`)
    pickingDialogVisible.value = false
    loadTableData()
    emit('refresh')
  } catch {
    // 用户取消操作
  }
}

// 获取建议库位
const getRecommendedLocation = (product) => {
  const locations = ['A001', 'A002', 'B001', 'B002', 'C001']
  return locations[Math.floor(Math.random() * locations.length)]
}

// 获取策略颜色
const getStrategyColor = (strategy) => {
  const colorMap = {
    'zone': 'primary',
    'batch': 'success',
    'wave': 'warning'
  }
  return colorMap[strategy] || 'info'
}

// 获取策略文本
const getStrategyText = (strategy) => {
  const textMap = {
    'zone': '按库区',
    'batch': '批量',
    'wave': '波次'
  }
  return textMap[strategy] || '未知'
}

// 获取进度颜色
const getProgressColor = (percentage) => {
  if (percentage < 30) return '#f56c6c'
  if (percentage < 70) return '#e6a23c'
  return '#67c23a'
}

// 获取拣货状态颜色
const getPickingStatusColor = (product) => {
  const picked = product.actual_picked_quantity || 0
  const required = product.quantity || 0
  
  if (picked === 0) return 'info'
  if (picked < required) return 'warning'
  return 'success'
}

// 获取拣货状态文本
const getPickingStatusText = (product) => {
  const picked = product.actual_picked_quantity || 0
  const required = product.quantity || 0
  
  if (picked === 0) return '未拣货'
  if (picked < required) return '部分拣货'
  return '已完成'
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  loadTableData()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadTableData()
}

// 暴露方法给父组件调用
defineExpose({
  loadTableData,
  loadBasicData
})

onMounted(async () => {
  try {
    await loadBasicData()
    await loadTableData()
  } catch (error) {
    console.error('初始化数据加载失败:', error)
    ElMessage.error('页面数据加载失败')
  }
})
</script>

<style lang="scss" scoped>
.picking-goods {
  .filter-card, .table-card {
    margin-bottom: 20px;
  }
  
  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    
    h3 {
      margin: 0;
      color: #303133;
      font-size: 16px;
      font-weight: 600;
    }
    
    .header-actions {
      display: flex;
      gap: 10px;
    }
  }
  
  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
  
  .order-info {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;
    
    h4 {
      margin: 0 0 10px 0;
      color: #303133;
      font-size: 14px;
    }
  }
  
  .product-picking {
    h4 {
      margin: 0 0 15px 0;
      color: #303133;
      font-size: 14px;
    }
  }
}
</style> 