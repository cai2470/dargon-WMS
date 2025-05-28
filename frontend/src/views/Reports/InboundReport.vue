<template>
  <div class="inbound-report-page">
    <div class="page-header">
      <h1>入库报表</h1>
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
        <el-form-item label="供应商">
          <el-select 
            v-model="filterForm.supplier_id" 
            placeholder="请选择供应商"
            clearable
            style="width: 150px"
            @change="handleFilterChange"
          >
            <el-option 
              v-for="supplier in suppliers" 
              :key="supplier.id"
              :label="supplier.name" 
              :value="supplier.id" 
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
            <el-option label="待收货" value="pending" />
            <el-option label="收货中" value="receiving" />
            <el-option label="待上架" value="shelving" />
            <el-option label="已完成" value="completed" />
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

    <!-- 入库统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon total">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalOrders }}</div>
            <div class="stat-label">入库单总数</div>
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
            <div class="stat-label">入库总数量</div>
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
            <div class="stat-label">入库总价值</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon efficiency">
            <el-icon><Timer /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.avgProcessTime }}h</div>
            <div class="stat-label">平均处理时间</div>
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
        <el-table-column prop="order_count" label="入库单数" width="120" align="right" />
        <el-table-column prop="total_quantity" label="入库数量" width="120" align="right" />
        <el-table-column prop="total_value" label="入库金额" width="150" align="right">
          <template #default="scope">
            ¥{{ formatNumber(scope.row.total_value) }}
          </template>
        </el-table-column>
        <el-table-column prop="avg_process_time" label="平均处理时间" width="140" align="right">
          <template #default="scope">
            {{ scope.row.avg_process_time }}小时
          </template>
        </el-table-column>
        <el-table-column prop="completion_rate" label="完成率" width="100" align="right">
          <template #default="scope">
            {{ scope.row.completion_rate }}%
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 入库明细统计 -->
    <el-card class="table-card">
      <template #header>
        <span>入库明细统计</span>
      </template>
      <el-table :data="detailData" stripe border v-loading="loading">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="order_no" label="入库单号" width="140" />
        <el-table-column prop="warehouse_name" label="仓库" width="120" />
        <el-table-column prop="supplier_name" label="供应商" width="150" />
        <el-table-column prop="total_quantity" label="入库数量" width="120" align="right" />
        <el-table-column prop="total_value" label="入库金额" width="150" align="right">
          <template #default="scope">
            ¥{{ formatNumber(scope.row.total_value) }}
          </template>
        </el-table-column>
        <el-table-column prop="process_time" label="处理时间" width="120" align="right">
          <template #default="scope">
            {{ scope.row.process_time }}小时
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh, Download, Document, Box, Money, Timer
} from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)

// 搜索筛选表单
const filterForm = reactive({
  warehouse_id: null,
  supplier_id: null,
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
const suppliers = ref([])
const allInboundOrders = ref([])
const filteredOrders = ref([])

// 统计数据
const stats = reactive({
  totalOrders: 0,
  totalQuantity: 0,
  totalValue: 0,
  avgProcessTime: 0
})

// 明细数据
const detailData = ref([])
const warehouseStats = ref([])

// 格式化数字
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  return Number(num).toLocaleString()
}

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    'pending': 'warning',
    'receiving': 'primary',
    'shelving': 'info',
    'completed': 'success'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'pending': '待收货',
    'receiving': '收货中',
    'shelving': '待上架',
    'completed': '已完成'
  }
  return textMap[status] || '未知'
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

    // 加载供应商数据
    const supplierData = JSON.parse(localStorage.getItem('wms_suppliers') || '[]')
    suppliers.value = supplierData.map(s => ({
      id: s.id,
      name: s.name,
      code: s.code
    }))
    
    // 如果没有供应商数据，创建一些默认供应商
    if (suppliers.value.length === 0) {
      suppliers.value = [
        { id: 1, name: '华为供应商', code: 'SUP001' },
        { id: 2, name: '小米供应商', code: 'SUP002' },
        { id: 3, name: '苹果供应商', code: 'SUP003' },
        { id: 4, name: '联想供应商', code: 'SUP004' },
        { id: 5, name: '戴尔供应商', code: 'SUP005' }
      ]
      localStorage.setItem('wms_suppliers', JSON.stringify(suppliers.value))
    }

    // 加载入库单数据
    const orderData = JSON.parse(localStorage.getItem('inbound_orders') || '[]')
    allInboundOrders.value = orderData.map(order => {
      const warehouse = warehouses.value.find(w => w.id === order.warehouse_id)
      const supplier = suppliers.value.find(s => s.id === order.supplier_id)
      
      // 计算总数量和总价值
      const totalQuantity = order.products ? order.products.reduce((sum, p) => 
        sum + (p.actual_quantity || p.expected_quantity || 0), 0) : 0
      
      const totalValue = order.products ? order.products.reduce((sum, p) => 
        sum + ((p.actual_quantity || p.expected_quantity || 0) * (p.unit_price || 0)), 0) : 0

      // 计算处理时间
      let processTime = 0
      if (order.created_at && order.shelving_end_time) {
        const start = new Date(order.created_at)
        const end = new Date(order.shelving_end_time)
        processTime = Math.round((end - start) / (1000 * 60 * 60) * 10) / 10 // 小时
      }

      return {
        ...order,
        warehouse_name: warehouse?.name || '未知仓库',
        supplier_name: supplier?.name || '未知供应商',
        total_quantity: totalQuantity,
        total_value: totalValue,
        process_time: processTime,
        date: order.created_at ? order.created_at.split(' ')[0] : new Date().toISOString().split('T')[0]
      }
    })

    console.log('加载的入库单数据:', allInboundOrders.value)
  } catch (error) {
    console.error('加载基础数据失败:', error)
    ElMessage.error('加载基础数据失败')
  }
}

// 应用筛选
const applyFilter = () => {
  let filtered = [...allInboundOrders.value]

  // 按仓库筛选
  if (filterForm.warehouse_id) {
    filtered = filtered.filter(order => order.warehouse_id === filterForm.warehouse_id)
  }

  // 按供应商筛选
  if (filterForm.supplier_id) {
    filtered = filtered.filter(order => order.supplier_id === filterForm.supplier_id)
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
}

// 重置筛选
const resetFilter = () => {
  Object.assign(filterForm, {
    warehouse_id: null,
    supplier_id: null,
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
  
  const completedOrders = orders.filter(order => order.status === 'completed' && order.process_time > 0)
  stats.avgProcessTime = completedOrders.length > 0 
    ? Math.round(completedOrders.reduce((sum, order) => sum + order.process_time, 0) / completedOrders.length * 10) / 10
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
        total_process_time: 0,
        completed_count: 0
      })
    }
    
    const stat = warehouseMap.get(warehouseId)
    stat.order_count++
    stat.total_quantity += order.total_quantity
    stat.total_value += order.total_value
    
    if (order.status === 'completed' && order.process_time > 0) {
      stat.total_process_time += order.process_time
      stat.completed_count++
    }
  })
  
  warehouseStats.value = Array.from(warehouseMap.values()).map(stat => ({
    ...stat,
    avg_process_time: stat.completed_count > 0 
      ? Math.round(stat.total_process_time / stat.completed_count * 10) / 10 
      : 0,
    completion_rate: stat.order_count > 0 
      ? Math.round((filteredOrders.value.filter(o => o.warehouse_id === stat.warehouse_id && o.status === 'completed').length / stat.order_count) * 100)
      : 0
  }))
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
    ElMessage.success('入库报表数据已刷新')
  } catch (error) {
    ElMessage.error('刷新数据失败')
  } finally {
    loading.value = false
  }
}

// 导出报表
const exportReport = () => {
  ElMessage.info('入库报表导出功能开发中...')
}

// 生命周期
onMounted(async () => {
  await loadBasicData()
  applyFilter()
})
</script>

<style scoped>
.inbound-report-page {
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

.filter-card {
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card .stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.stat-icon .el-icon {
  font-size: 24px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(45deg, #409EFF, #67C23A);
}

.stat-icon.quantity {
  background: linear-gradient(45deg, #67C23A, #85CE61);
}

.stat-icon.value {
  background: linear-gradient(45deg, #E6A23C, #EEBE77);
}

.stat-icon.efficiency {
  background: linear-gradient(45deg, #F56C6C, #F78989);
}

.stat-info .stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-info .stat-label {
  font-size: 13px;
  color: #909399;
}

.table-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style> 