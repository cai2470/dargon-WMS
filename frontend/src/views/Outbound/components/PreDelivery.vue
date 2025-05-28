<template>
  <div class="pre-delivery">
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
        <el-form-item label="客户名称">
          <el-input 
            v-model="filterForm.customer_name" 
            placeholder="请输入客户名称"
            clearable
            style="width: 120px"
          />
        </el-form-item>
        <el-form-item label="出库仓库">
          <el-select 
            v-model="filterForm.warehouse_id" 
            placeholder="请选择仓库"
            clearable
            style="width: 120px"
          >
            <el-option 
              v-for="warehouse in warehouses" 
              :key="warehouse.id"
              :label="warehouse.name" 
              :value="warehouse.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select 
            v-model="filterForm.priority" 
            placeholder="请选择优先级"
            clearable
            style="width: 100px"
          >
            <el-option 
              v-for="priority in priorityOptions" 
              :key="priority.value"
              :label="priority.label" 
              :value="priority.value" 
            />
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
        <h3>预发货列表</h3>
        <div class="header-actions">
          <el-button type="success" @click="batchStartPicking" :disabled="selectedRows.length === 0">
            <el-icon><Box /></el-icon>
            批量开始拣货
          </el-button>
          <el-button type="primary" @click="autoAssignPickers" :disabled="selectedRows.length === 0">
            <el-icon><User /></el-icon>
            自动分配拣货员
          </el-button>
        </div>
      </div>
      
      <el-table :data="tableData" stripe v-loading="loading" size="small" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column label="#" type="index" width="50" />
        <el-table-column prop="order_no" label="出库单号" width="130" />
        <el-table-column prop="customer_name" label="客户名称" width="120" />
        <el-table-column prop="warehouse_name" label="出库仓库" width="100" />
        <el-table-column prop="outbound_type" label="出库类型" width="100">
          <template #default="scope">
            <el-tag size="small" :type="getTypeColor(scope.row.outbound_type)">
              {{ getTypeText(scope.row.outbound_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_quantity" label="总数量" width="80" align="right" />
        <el-table-column prop="total_amount" label="总金额" width="100" align="right">
          <template #default="scope">
            ¥{{ (scope.row.total_amount || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="scope">
            <el-tag 
              :type="getPriorityColor(scope.row.priority)"
              effect="plain"
              size="small"
            >
              {{ getPriorityText(scope.row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="expected_date" label="预计出库时间" width="130" />
        <el-table-column prop="confirmed_at" label="确认时间" width="130" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button 
              size="small" 
              type="primary" 
              @click="startPicking(scope.row)"
            >
              开始拣货
            </el-button>
            <el-button 
              size="small" 
              type="info" 
              @click="viewDetails(scope.row)"
            >
              查看详情
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

    <!-- 开始拣货对话框 -->
    <el-dialog 
      title="开始拣货" 
      v-model="pickingDialogVisible" 
      width="800px"
    >
      <div v-if="currentOrder">
        <div class="order-info">
          <h4>出库单信息</h4>
          <el-row :gutter="20">
            <el-col :span="6">出库单号：{{ currentOrder.order_no }}</el-col>
            <el-col :span="6">客户名称：{{ currentOrder.customer_name }}</el-col>
            <el-col :span="6">出库仓库：{{ currentOrder.warehouse_name }}</el-col>
            <el-col :span="6">出库类型：{{ getTypeText(currentOrder.outbound_type) }}</el-col>
          </el-row>
        </div>
        
        <el-form :model="pickingForm" label-width="120px" style="margin-top: 20px;">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="拣货人员">
                <el-select 
                  v-model="pickingForm.picker_staff" 
                  multiple 
                  placeholder="请选择拣货人员" 
                  style="width: 100%"
                  filterable
                >
                  <el-option 
                    v-for="staff in staffList" 
                    :key="staff.id"
                    :label="`${staff.name} (${staff.staff_no}) - ${getDepartmentText(staff.department)}`" 
                    :value="staff.id"
                  >
                    <span style="float: left">{{ staff.name }} ({{ staff.staff_no }})</span>
                    <span style="float: right; color: #8492a6; font-size: 12px">
                      {{ getPositionText(staff.position) }}
                    </span>
                  </el-option>
                </el-select>
                <div style="margin-top: 5px; font-size: 12px; color: #999;">
                  当前可选拣货人员 {{ staffList.length }} 人
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="拣货策略">
                <el-radio-group v-model="pickingForm.picking_strategy">
                  <el-radio label="zone">按库区拣货</el-radio>
                  <el-radio label="batch">批量拣货</el-radio>
                  <el-radio label="wave">波次拣货</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="预计拣货时间">
                <el-input-number 
                  v-model="pickingForm.estimated_time" 
                  :min="0.5" 
                  :step="0.5"
                  placeholder="小时"
                  style="width: 100%"
                />
                <span style="margin-left: 8px; color: #666;">小时</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="拣货优先级">
                <el-select v-model="pickingForm.picking_priority" placeholder="请选择优先级" style="width: 100%">
                  <el-option label="紧急" value="urgent" />
                  <el-option label="高" value="high" />
                  <el-option label="中" value="medium" />
                  <el-option label="低" value="low" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="拣货备注">
            <el-input 
              v-model="pickingForm.remark" 
              type="textarea" 
              :rows="3"
              placeholder="请输入拣货备注"
            />
          </el-form-item>
        </el-form>

        <!-- 商品拣货明细 -->
        <div class="product-picking" style="margin-top: 20px;">
          <h4>商品拣货明细</h4>
          <el-table :data="currentOrder.products" border size="small">
            <el-table-column prop="product_code" label="商品编码" width="120" />
            <el-table-column prop="product_name" label="商品名称" min-width="140" />
            <el-table-column prop="isku" label="iSKU" width="100" />
            <el-table-column prop="quantity" label="需拣数量" width="100" align="right" />
            <el-table-column prop="unit" label="单位" width="60" />
            <el-table-column prop="available_stock" label="可用库存" width="100" align="right" />
            <el-table-column label="建议库位" width="120">
              <template #default="scope">
                <el-tag size="small" type="info">{{ getRecommendedLocation(scope.row) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="拣货数量" width="120">
              <template #default="scope">
                <el-input-number 
                  v-model="scope.row.picking_quantity" 
                  :min="0" 
                  :max="scope.row.quantity"
                  size="small"
                  style="width: 100%"
                />
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="120">
              <template #default="scope">
                <el-input 
                  v-model="scope.row.picking_remark" 
                  size="small"
                  placeholder="备注"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="pickingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStartPicking" :loading="picking">开始拣货</el-button>
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
const picking = ref(false)
const pickingDialogVisible = ref(false)
const currentOrder = ref(null)
const selectedRows = ref([])

// 筛选表单
const filterForm = reactive({
  order_no: '',
  customer_name: '',
  warehouse_id: null,
  priority: ''
})

// 拣货表单
const pickingForm = reactive({
  picker_staff: [],
  picking_strategy: 'zone',
  estimated_time: 1,
  picking_priority: 'medium',
  remark: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 数据列表
const tableData = ref([])
const warehouses = ref([])
const staffList = ref([])

// 选项数据
const priorityOptions = ref([
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' }
])

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
    
    // 加载仓库列表
    const warehouseData = JSON.parse(localStorage.getItem('wms_warehouses') || '[]')
    warehouses.value = warehouseData.filter(w => {
      const status = w.status
      return status === '启用' || status === 1 || status === 'active' || status === '正常'
    }).map(w => ({
      id: w.id,
      name: w.name,
      code: w.code
    }))
    
  } catch (error) {
    console.error('加载基础数据失败:', error)
    ElMessage.error('加载基础数据失败')
  }
}

// 加载预发货列表
const loadTableData = async () => {
  loading.value = true
  try {
    // 从localStorage获取出库单数据
    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    console.log('PreDelivery - 所有出库单数据:', orders)
    
    // 筛选预发货状态的订单
    let preDeliveryOrders = orders.filter(order => order.status === 'pre_delivery')
    console.log('PreDelivery - 筛选出的预发货订单:', preDeliveryOrders)
    
    // 补充仓库名称
    preDeliveryOrders = preDeliveryOrders.map(order => {
      const warehouse = warehouses.value.find(w => w.id === order.warehouse_id)
      return {
        ...order,
        warehouse_name: warehouse ? warehouse.name : '未知仓库',
        total_quantity: order.products ? order.products.reduce((sum, p) => sum + (p.quantity || 0), 0) : 0,
        total_amount: order.products ? order.products.reduce((sum, p) => sum + (p.amount || 0), 0) : 0
      }
    })
    
    // 应用筛选条件
    if (filterForm.order_no) {
      preDeliveryOrders = preDeliveryOrders.filter(order => 
        order.order_no.toLowerCase().includes(filterForm.order_no.toLowerCase())
      )
    }
    if (filterForm.customer_name) {
      preDeliveryOrders = preDeliveryOrders.filter(order => 
        order.customer_name.toLowerCase().includes(filterForm.customer_name.toLowerCase())
      )
    }
    if (filterForm.warehouse_id) {
      preDeliveryOrders = preDeliveryOrders.filter(order => order.warehouse_id === filterForm.warehouse_id)
    }
    if (filterForm.priority) {
      preDeliveryOrders = preDeliveryOrders.filter(order => order.priority === filterForm.priority)
    }
    
    tableData.value = preDeliveryOrders
    pagination.total = preDeliveryOrders.length
    
  } catch (error) {
    ElMessage.error('加载预发货列表失败')
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
    customer_name: '',
    warehouse_id: null,
    priority: ''
  })
  loadTableData()
}

// 选择行变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 开始拣货
const startPicking = (order) => {
  currentOrder.value = {
    ...order,
    products: order.products.map(p => ({
      ...p,
      picking_quantity: p.quantity, // 默认拣货数量等于需求数量
      picking_remark: ''
    }))
  }
  
  // 重置表单
  Object.assign(pickingForm, {
    picker_staff: [],
    picking_strategy: 'zone',
    estimated_time: 1,
    picking_priority: order.priority || 'medium',
    remark: ''
  })
  
  pickingDialogVisible.value = true
}

// 批量开始拣货
const batchStartPicking = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要批量开始拣货 ${selectedRows.value.length} 个出库单吗？`,
      '批量操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 批量更新状态为拣货中
    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    selectedRows.value.forEach(selectedOrder => {
      const index = orders.findIndex(order => order.id === selectedOrder.id)
      if (index !== -1) {
        orders[index] = {
          ...orders[index],
          status: 'picking',
          picking_start_time: new Date().toLocaleString(),
          updated_at: new Date().toLocaleString()
        }
      }
    })
    
    localStorage.setItem('outbound_orders', JSON.stringify(orders))
    ElMessage.success(`已批量开始拣货 ${selectedRows.value.length} 个出库单`)
    loadTableData()
    emit('refresh')
  } catch {
    // 用户取消操作
  }
}

// 自动分配拣货员
const autoAssignPickers = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要为 ${selectedRows.value.length} 个出库单自动分配拣货员吗？`,
      '自动分配',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    // 模拟自动分配拣货员逻辑
    ElMessage.success('拣货员自动分配完成')
  } catch {
    // 用户取消操作
  }
}

// 提交开始拣货
const submitStartPicking = async () => {
  try {
    picking.value = true
    
    // 更新订单状态为拣货中
    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    const index = orders.findIndex(order => order.id === currentOrder.value.id)
    if (index !== -1) {
      orders[index] = {
        ...orders[index],
        status: 'picking',
        picker_staff: pickingForm.picker_staff,
        picking_strategy: pickingForm.picking_strategy,
        estimated_picking_time: pickingForm.estimated_time,
        picking_priority: pickingForm.picking_priority,
        picking_remark: pickingForm.remark,
        products: currentOrder.value.products,
        picking_start_time: new Date().toLocaleString(),
        updated_at: new Date().toLocaleString()
      }
    }
    
    localStorage.setItem('outbound_orders', JSON.stringify(orders))
    ElMessage.success(`出库单 ${currentOrder.value.order_no} 已开始拣货`)
    pickingDialogVisible.value = false
    loadTableData()
    emit('refresh')
  } catch (error) {
    ElMessage.error('开始拣货失败')
  } finally {
    picking.value = false
  }
}

// 查看详情
const viewDetails = (order) => {
  const productList = order.products ? order.products.map(p => 
    `${p.product_name} (${p.product_code}) - 数量: ${p.quantity}${p.unit}`
  ).join('\n') : '无商品'

  ElMessageBox.alert(
    `出库单号：${order.order_no}
客户名称：${order.customer_name}
出库仓库：${order.warehouse_name}
出库类型：${getTypeText(order.outbound_type)}
总数量：${order.total_quantity}
总金额：¥${(order.total_amount || 0).toFixed(2)}
优先级：${getPriorityText(order.priority)}
预计出库时间：${order.expected_date || '未设置'}
确认时间：${order.confirmed_at}

商品明细：
${productList}`,
    '出库单详情',
    {
      confirmButtonText: '确定',
      type: 'info'
    }
  )
}

// 获取建议库位
const getRecommendedLocation = (product) => {
  // 简单的库位推荐逻辑
  const locations = ['A001', 'A002', 'B001', 'B002', 'C001']
  return locations[Math.floor(Math.random() * locations.length)]
}

// 获取类型颜色
const getTypeColor = (type) => {
  const colorMap = {
    'sale': 'success',
    'transfer': 'primary',
    'return': 'warning',
    'other': 'info'
  }
  return colorMap[type] || 'info'
}

// 获取类型文本
const getTypeText = (type) => {
  const textMap = {
    'sale': '销售出库',
    'transfer': '调拨出库',
    'return': '退货出库',
    'other': '其他出库'
  }
  return textMap[type] || '未知'
}

// 获取优先级颜色
const getPriorityColor = (priority) => {
  const colorMap = {
    'high': 'danger',
    'medium': 'warning',
    'low': 'success'
  }
  return colorMap[priority] || 'info'
}

// 获取优先级文本
const getPriorityText = (priority) => {
  const textMap = {
    'high': '高',
    'medium': '中',
    'low': '低'
  }
  return textMap[priority] || '未知'
}

// 获取部门文本
const getDepartmentText = (department) => {
  const departmentMap = {
    'warehouse': '仓储部',
    'transport': '运输部',
    'quality': '质检部',
    'service': '客服部',
    'management': '管理部',
    'finance': '财务部'
  }
  return departmentMap[department] || department
}

// 获取职位文本
const getPositionText = (position) => {
  const positionMap = {
    'warehouse_manager': '仓库管理员',
    'unloader': '卸货人员',
    'picker': '拣货人员',
    'packer': '打包人员',
    'inspector': '质检员',
    'driver': '司机',
    'service_agent': '客服专员',
    'accountant': '财务专员',
    'supervisor': '主管',
    'manager': '经理'
  }
  return positionMap[position] || position
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
.pre-delivery {
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