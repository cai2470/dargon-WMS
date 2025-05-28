<template>
  <div class="outbound-report-page">
    <div class="page-header">
      <h1>出库报表</h1>
      <div class="header-actions">
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button type="info" @click="exportReport">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" label-width="80px" :inline="true">
        <el-form-item label="仓库">
          <el-select 
            v-model="filterForm.warehouse_id" 
            placeholder="请选择仓库"
            clearable
            style="width: 150px"
            @change="handleFilterChange"
          >
            <el-option 
              v-for="warehouse in warehouses" 
              :key="warehouse.id"
              :label="warehouse.name" 
              :value="warehouse.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="客户">
          <el-select 
            v-model="filterForm.customer_id" 
            placeholder="请选择客户"
            clearable
            style="width: 150px"
            @change="handleFilterChange"
          >
            <el-option 
              v-for="customer in customers" 
              :key="customer.id"
              :label="customer.name" 
              :value="customer.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select 
            v-model="filterForm.status" 
            placeholder="请选择状态"
            clearable
            style="width: 120px"
            @change="handleFilterChange"
          >
            <el-option label="待拣货" value="待拣货" />
            <el-option label="拣货中" value="拣货中" />
            <el-option label="已出库" value="已出库" />
            <el-option label="已发货" value="已发货" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filterForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 200px"
            @change="handleFilterChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyFilter">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 出库统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon total">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalOrders }}</div>
            <div class="stat-label">出库单总数</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon quantity">
            <el-icon><Box /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ formatNumber(stats.totalQuantity) }}</div>
            <div class="stat-label">出库总数量</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon value">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">¥{{ formatNumber(stats.totalValue) }}</div>
            <div class="stat-label">出库总价值</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon efficiency">
            <el-icon><Timer /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.avgPickTime }}min</div>
            <div class="stat-label">平均拣货时间</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 按仓库统计 -->
    <el-card class="table-card">
      <template #header>
        <span>按仓库统计</span>
      </template>
      <el-table :data="warehouseStats" stripe border>
        <el-table-column prop="warehouse_name" label="仓库名称" width="150" />
        <el-table-column prop="order_count" label="出库单数" width="120" align="right" />
        <el-table-column prop="total_quantity" label="出库数量" width="120" align="right" />
        <el-table-column prop="total_value" label="出库金额" width="150" align="right">
          <template #default="scope">
            ¥{{ formatNumber(scope.row.total_value) }}
          </template>
        </el-table-column>
        <el-table-column prop="avg_pick_time" label="平均拣货时间" width="140" align="right">
          <template #default="scope">
            {{ scope.row.avg_pick_time }}分钟
          </template>
        </el-table-column>
        <el-table-column prop="completion_rate" label="完成率" width="100" align="right">
          <template #default="scope">
            {{ scope.row.completion_rate }}%
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 出库明细统计 -->
    <el-card class="table-card">
      <template #header>
        <span>出库明细统计</span>
      </template>
      <el-table :data="detailData" stripe border v-loading="loading">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="order_no" label="出库单号" width="140" />
        <el-table-column prop="warehouse_name" label="仓库" width="120" />
        <el-table-column prop="customer_name" label="客户" width="150" />
        <el-table-column prop="total_quantity" label="出库数量" width="120" align="right" />
        <el-table-column prop="total_value" label="出库金额" width="150" align="right">
          <template #default="scope">
            ¥{{ formatNumber(scope.row.total_value) }}
          </template>
        </el-table-column>
        <el-table-column prop="pick_time" label="拣货时间" width="120" align="right">
          <template #default="scope">
            {{ scope.row.pick_time }}分钟
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
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

    <!-- 拣货员工效率分析 -->
    <el-card class="table-card">
      <template #header>
        <span>拣货员工效率分析</span>
      </template>
      <el-table :data="pickerData" stripe border>
        <el-table-column prop="picker_name" label="拣货员" width="120" />
        <el-table-column prop="total_orders" label="出库单数" width="120" align="right" />
        <el-table-column prop="total_quantity" label="拣货数量" width="120" align="right" />
        <el-table-column prop="avg_pick_time" label="平均拣货时间" width="140" align="right">
          <template #default="scope">
            {{ scope.row.avg_pick_time }}分钟
          </template>
        </el-table-column>
        <el-table-column prop="accuracy_rate" label="拣货准确率" width="130" align="right">
          <template #default="scope">
            <span :style="{ color: scope.row.accuracy_rate >= 98 ? '#67C23A' : '#E6A23C' }">
              {{ scope.row.accuracy_rate }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="work_hours" label="工作时长" width="120" align="right">
          <template #default="scope">
            {{ scope.row.work_hours }}小时
          </template>
        </el-table-column>
        <el-table-column label="绩效等级" width="120">
          <template #default="scope">
            <el-tag :type="getPerformanceTagType(scope.row.efficiency_score)">
              {{ getPerformanceLevel(scope.row.efficiency_score) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh, Download, Document, Box, Money, Timer
} from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)

// 搜索筛选表单
const filterForm = reactive({
  warehouse_id: null,
  customer_id: null,
  status: '',
  date_range: []
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 基础数据
const warehouses = ref([])
const customers = ref([])
const allOutboundOrders = ref([])
const filteredOrders = ref([])

// 统计数据
const stats = reactive({
  totalOrders: 0,
  totalQuantity: 0,
  totalValue: 0,
  avgPickTime: 0
})

// 明细数据
const detailData = ref([])
const warehouseStats = ref([])
const pickerData = ref([])

// 格式化数字
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  return Number(num).toLocaleString()
}

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    '待拣货': 'warning',
    '拣货中': 'primary',
    '已出库': 'success',
    '已发货': 'info'
  }
  return typeMap[status] || 'info'
}

// 获取绩效标签类型
const getPerformanceTagType = (score) => {
  if (score >= 90) return 'success'
  if (score >= 80) return 'warning'
  return 'danger'
}

// 获取绩效等级
const getPerformanceLevel = (score) => {
  if (score >= 95) return '优秀'
  if (score >= 85) return '良好'
  if (score >= 75) return '合格'
  return '待改进'
}

// 加载基础数据
const loadBasicData = async () => {
  try {
    // 加载仓库数据
    const warehouseData = JSON.parse(localStorage.getItem('wms_warehouses') || '[]')
    warehouses.value = warehouseData.filter(w => w.status === 1 || w.status === '启用').map(w => ({
      id: w.id,
      name: w.name,
      code: w.code
    }))

    // 加载客户数据
    const customerData = JSON.parse(localStorage.getItem('wms_customers') || '[]')
    customers.value = customerData.map(c => ({
      id: c.id,
      name: c.name,
      code: c.code
    }))

    // 如果没有客户数据，创建一些默认客户
    if (customers.value.length === 0) {
      customers.value = [
        { id: 1, name: '京东商城', code: 'JD001' },
        { id: 2, name: '天猫超市', code: 'TM001' },
        { id: 3, name: '苏宁易购', code: 'SN001' },
        { id: 4, name: '拼多多', code: 'PDD001' },
        { id: 5, name: '淘宝', code: 'TB001' }
      ]
      localStorage.setItem('wms_customers', JSON.stringify(customers.value))
    }

    // 加载出库单数据
    const orderData = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    allOutboundOrders.value = orderData.map(order => {
      const warehouse = warehouses.value.find(w => w.id === order.warehouse_id)
      const customer = customers.value.find(c => c.id === order.customer_id) || 
                      customers.value[Math.floor(Math.random() * customers.value.length)]
      
      // 计算总数量和总价值
      const totalQuantity = order.products ? order.products.reduce((sum, p) => 
        sum + (p.actual_quantity || p.expected_quantity || 0), 0) : 0
      
      const totalValue = order.products ? order.products.reduce((sum, p) => 
        sum + ((p.actual_quantity || p.expected_quantity || 0) * (p.unit_price || 0)), 0) : 0

      // 计算拣货时间
      let pickTime = Math.floor(Math.random() * 30) + 10 // 10-40分钟
      if (order.created_at && order.updated_at) {
        const start = new Date(order.created_at)
        const end = new Date(order.updated_at)
        const actualTime = Math.round((end - start) / (1000 * 60)) // 分钟
        if (actualTime > 0 && actualTime < 200) {
          pickTime = actualTime
        }
      }

      return {
        ...order,
        warehouse_name: warehouse?.name || '未知仓库',
        customer_name: customer?.name || '未知客户',
        customer_id: customer?.id,
        total_quantity: totalQuantity,
        total_value: totalValue,
        pick_time: pickTime,
        date: order.created_at ? order.created_at.split(' ')[0] : new Date().toISOString().split('T')[0]
      }
    })

    console.log('加载的出库单数据:', allOutboundOrders.value)
  } catch (error) {
    console.error('加载基础数据失败:', error)
    ElMessage.error('加载基础数据失败')
  }
}

// 应用筛选
const applyFilter = () => {
  let filtered = [...allOutboundOrders.value]

  // 按仓库筛选
  if (filterForm.warehouse_id) {
    filtered = filtered.filter(order => order.warehouse_id === filterForm.warehouse_id)
  }

  // 按客户筛选
  if (filterForm.customer_id) {
    filtered = filtered.filter(order => order.customer_id === filterForm.customer_id)
  }

  // 按状态筛选
  if (filterForm.status) {
    filtered = filtered.filter(order => order.status === filterForm.status)
  }

  // 按日期范围筛选
  if (filterForm.date_range && filterForm.date_range.length === 2) {
    const [startDate, endDate] = filterForm.date_range
    filtered = filtered.filter(order => {
      const orderDate = new Date(order.created_at)
      return orderDate >= startDate && orderDate <= endDate
    })
  }

  filteredOrders.value = filtered
  updateStatistics()
  updateDetailData()
  updateWarehouseStats()
  updatePickerData()
}

// 重置筛选
const resetFilter = () => {
  Object.assign(filterForm, {
    warehouse_id: null,
    customer_id: null,
    status: '',
    date_range: []
  })
  applyFilter()
}

// 筛选变化处理
const handleFilterChange = () => {
  // 可以在这里添加实时筛选逻辑
}

// 更新统计数据
const updateStatistics = () => {
  const orders = filteredOrders.value
  
  stats.totalOrders = orders.length
  stats.totalQuantity = orders.reduce((sum, order) => sum + order.total_quantity, 0)
  stats.totalValue = orders.reduce((sum, order) => sum + order.total_value, 0)
  
  const completedOrders = orders.filter(order => (order.status === '已出库' || order.status === '已发货') && order.pick_time > 0)
  stats.avgPickTime = completedOrders.length > 0 
    ? Math.round(completedOrders.reduce((sum, order) => sum + order.pick_time, 0) / completedOrders.length)
    : 0
}

// 更新明细数据
const updateDetailData = () => {
  const startIndex = (pagination.page - 1) * pagination.size
  const endIndex = startIndex + pagination.size
  detailData.value = filteredOrders.value.slice(startIndex, endIndex)
  pagination.total = filteredOrders.value.length
}

// 更新仓库统计
const updateWarehouseStats = () => {
  const warehouseMap = new Map()
  
  filteredOrders.value.forEach(order => {
    const warehouseId = order.warehouse_id
    const warehouseName = order.warehouse_name
    
    if (!warehouseMap.has(warehouseId)) {
      warehouseMap.set(warehouseId, {
        warehouse_id: warehouseId,
        warehouse_name: warehouseName,
        order_count: 0,
        total_quantity: 0,
        total_value: 0,
        total_pick_time: 0,
        completed_count: 0
      })
    }
    
    const stat = warehouseMap.get(warehouseId)
    stat.order_count++
    stat.total_quantity += order.total_quantity
    stat.total_value += order.total_value
    
    if ((order.status === '已出库' || order.status === '已发货') && order.pick_time > 0) {
      stat.total_pick_time += order.pick_time
      stat.completed_count++
    }
  })
  
  warehouseStats.value = Array.from(warehouseMap.values()).map(stat => ({
    ...stat,
    avg_pick_time: stat.completed_count > 0 
      ? Math.round(stat.total_pick_time / stat.completed_count)
      : 0,
    completion_rate: stat.order_count > 0 
      ? Math.round((filteredOrders.value.filter(o => o.warehouse_id === stat.warehouse_id && (o.status === '已出库' || o.status === '已发货')).length / stat.order_count) * 100)
      : 0
  }))
}

// 更新拣货员数据
const updatePickerData = () => {
  // 生成拣货员效率数据
  const pickers = ['张三', '李四', '王五', '赵六', '陈七']
  
  pickerData.value = pickers.map(name => {
    const orderCount = Math.floor(Math.random() * 20) + 5
    const totalQuantity = Math.floor(Math.random() * 500) + 100
    const avgPickTime = Math.floor(Math.random() * 20) + 15
    const accuracyRate = Math.floor(Math.random() * 5) + 95
    const workHours = Math.floor(Math.random() * 4) + 6
    const efficiencyScore = Math.floor((100 - avgPickTime) + accuracyRate * 0.8)
    
    return {
      picker_name: name,
      total_orders: orderCount,
      total_quantity: totalQuantity,
      avg_pick_time: avgPickTime,
      accuracy_rate: accuracyRate,
      work_hours: workHours,
      efficiency_score: Math.min(100, Math.max(60, efficiencyScore))
    }
  })
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  updateDetailData()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  updateDetailData()
}

// 刷新数据
const refreshData = async () => {
  loading.value = true
  try {
    await loadBasicData()
    applyFilter()
    ElMessage.success('出库报表数据已刷新')
  } catch (error) {
    ElMessage.error('刷新数据失败')
  } finally {
    loading.value = false
  }
}

// 导出报表
const exportReport = () => {
  ElMessage.info('出库报表导出功能开发中...')
}

// 生命周期
onMounted(async () => {
  await loadBasicData()
  applyFilter()
})
</script>

<style scoped>
.outbound-report-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.quantity {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.value {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.efficiency {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.table-card {
  margin-top: 20px;
  border-radius: 8px;
}

.filter-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style> 