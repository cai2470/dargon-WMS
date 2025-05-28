<template>
  <div class="receipt-details">
    <!-- 筛选区域 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" label-width="80px" :inline="true">
        <el-form-item label="入库单号">
          <el-input 
            v-model="filterForm.order_no" 
            placeholder="请输入单号"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="供应商">
          <el-select 
            v-model="filterForm.supplier_id" 
            placeholder="请选择供应商"
            clearable
            style="width: 120px"
          >
            <el-option 
              v-for="supplier in suppliers" 
              :key="supplier.id"
              :label="supplier.name" 
              :value="supplier.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标仓库">
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
        <el-form-item label="状态">
          <el-select 
            v-model="filterForm.status" 
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="完成时间">
          <el-date-picker
            v-model="filterForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchData">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计卡片 -->
    <div class="summary-cards">
      <el-card class="summary-card">
        <div class="summary-content">
          <div class="summary-icon completed">
            <el-icon><Check /></el-icon>
          </div>
          <div class="summary-info">
            <div class="summary-value">{{ summaryStats.completed }}</div>
            <div class="summary-label">已完成</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="summary-card">
        <div class="summary-content">
          <div class="summary-icon total-quantity">
            <el-icon><Box /></el-icon>
          </div>
          <div class="summary-info">
            <div class="summary-value">{{ summaryStats.totalQuantity }}</div>
            <div class="summary-label">总收货数量</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="summary-card">
        <div class="summary-content">
          <div class="summary-icon total-amount">
            <el-icon><Money /></el-icon>
          </div>
          <div class="summary-info">
            <div class="summary-value">¥{{ summaryStats.totalAmount.toFixed(2) }}</div>
            <div class="summary-label">总收货金额</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="summary-card">
        <div class="summary-content">
          <div class="summary-icon avg-time">
            <el-icon><Timer /></el-icon>
          </div>
          <div class="summary-info">
            <div class="summary-value">{{ summaryStats.avgTime }}小时</div>
            <div class="summary-label">平均处理时长</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 数据表格 -->
    <el-card class="table-card">
      <div class="table-header">
        <h3>收货明细列表</h3>
        <div class="header-actions">
          <el-button type="success" @click="exportReceipts">
            <el-icon><Download /></el-icon>
            导出明细
          </el-button>
          <el-button type="primary" @click="generateReport">
            <el-icon><Document /></el-icon>
            生成报表
          </el-button>
        </div>
      </div>
      
      <el-table :data="tableData" stripe v-loading="loading" size="small">
        <el-table-column label="#" type="index" width="50" />
        <el-table-column prop="order_no" label="入库单号" width="130" />
        <el-table-column prop="supplier_name" label="供应商" width="120" />
        <el-table-column prop="target_warehouse_name" label="目标仓库" width="100" />
        <el-table-column prop="total_quantity" label="收货数量" width="100" align="right" />
        <el-table-column prop="total_amount" label="收货金额" width="120" align="right">
          <template #default="scope">
            ¥{{ scope.row.total_amount?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="shelving_method" label="处理方式" width="100">
          <template #default="scope">
            <el-tag size="small" :type="getProcessMethodColor(scope.row.shelving_method)">
              {{ getProcessMethodText(scope.row.shelving_method) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="processing_time" label="处理时长" width="100">
          <template #default="scope">
            {{ getProcessingTime(scope.row) }}小时
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="负责人" width="80" />
        <el-table-column prop="shelving_end_time" label="完成时间" width="130" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-tag :type="getStatusColor(scope.row.status)" size="small">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button 
              size="small" 
              type="info" 
              @click="viewDetails(scope.row)"
            >
              查看详情
            </el-button>
            <el-button 
              size="small" 
              type="primary" 
              @click="viewFlowChart(scope.row)"
            >
              流程图
            </el-button>
            <el-button 
              size="small" 
              type="success" 
              @click="printReceipt(scope.row)"
            >
              打印单据
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

    <!-- 收货详情对话框 -->
    <el-dialog 
      title="收货详情" 
      v-model="detailDialogVisible" 
      width="1000px"
    >
      <div v-if="currentOrder" class="receipt-detail">
        <el-descriptions :column="4" border>
          <el-descriptions-item label="入库单号">{{ currentOrder.order_no }}</el-descriptions-item>
          <el-descriptions-item label="供应商">{{ currentOrder.supplier_name }}</el-descriptions-item>
          <el-descriptions-item label="目标仓库">{{ currentOrder.target_warehouse_name }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ currentOrder.operator }}</el-descriptions-item>
          <el-descriptions-item label="预计到货时间">{{ currentOrder.expected_date }}</el-descriptions-item>
          <el-descriptions-item label="实际到货时间">{{ currentOrder.actual_arrival_time }}</el-descriptions-item>
          <el-descriptions-item label="开始卸货时间">{{ currentOrder.unloading_start_time }}</el-descriptions-item>
          <el-descriptions-item label="分拣开始时间">{{ currentOrder.sorting_start_time }}</el-descriptions-item>
          <el-descriptions-item label="上架开始时间">{{ currentOrder.shelving_start_time }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ currentOrder.shelving_end_time }}</el-descriptions-item>
          <el-descriptions-item label="处理时长">{{ getProcessingTime(currentOrder) }}小时</el-descriptions-item>
          <el-descriptions-item label="处理方式">{{ getProcessMethodText(currentOrder.shelving_method) }}</el-descriptions-item>
          <el-descriptions-item label="运输方式">{{ getTransportMethodText(currentOrder.transport_method) }}</el-descriptions-item>
          <el-descriptions-item label="车牌号/运单号">{{ currentOrder.transport_no }}</el-descriptions-item>
          <el-descriptions-item label="司机/配送员">{{ currentOrder.driver_name }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentOrder.contact_phone }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="4">{{ currentOrder.shelving_remark || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 商品明细 -->
        <div style="margin-top: 20px;">
          <h4>商品收货明细</h4>
          <el-table :data="currentOrder.products" border size="small">
            <el-table-column prop="product_code" label="商品编码" width="120" />
            <el-table-column prop="product_name" label="商品名称" min-width="160" />
            <el-table-column prop="unit" label="单位" width="60" />
            <el-table-column prop="expected_quantity" label="预计数量" width="100" align="right" />
            <el-table-column prop="actual_quantity" label="实际数量" width="100" align="right" />
            <el-table-column prop="shelve_quantity" label="上架数量" width="100" align="right" />
            <el-table-column prop="quality_result" label="质检结果" width="100">
              <template #default="scope">
                <el-tag size="small" :type="scope.row.quality_result === 'qualified' ? 'success' : 'danger'">
                  {{ scope.row.quality_result === 'qualified' ? '合格' : '不合格' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="suggested_location" label="存储库位" width="100" />
            <el-table-column prop="unit_price" label="单价" width="100" align="right">
              <template #default="scope">
                ¥{{ scope.row.unit_price?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="120" align="right">
              <template #default="scope">
                ¥{{ scope.row.amount?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="shelve_remark" label="备注" min-width="120" />
          </el-table>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 流程图对话框 -->
    <el-dialog 
      title="入库流程图" 
      v-model="flowChartDialogVisible" 
      width="800px"
    >
      <div v-if="currentOrder" class="flow-chart">
        <div class="flow-timeline">
          <el-timeline>
            <el-timeline-item 
              :timestamp="currentOrder.created_at" 
              color="#409EFF"
            >
              <h4>创建到货通知</h4>
              <p>负责人：{{ currentOrder.operator }}</p>
            </el-timeline-item>
            
            <el-timeline-item 
              v-if="currentOrder.actual_arrival_time"
              :timestamp="currentOrder.actual_arrival_time" 
              color="#67C23A"
            >
              <h4>确认到货</h4>
              <p>运输方式：{{ getTransportMethodText(currentOrder.transport_method) }}</p>
              <p>车牌号：{{ currentOrder.transport_no }}</p>
            </el-timeline-item>
            
            <el-timeline-item 
              v-if="currentOrder.unloading_start_time"
              :timestamp="currentOrder.unloading_start_time" 
              color="#E6A23C"
            >
              <h4>开始卸货</h4>
              <p>卸货区域：{{ currentOrder.unloading_zone_name }}</p>
              <p>预计时长：{{ currentOrder.estimated_unloading_time }}小时</p>
            </el-timeline-item>
            
            <el-timeline-item 
              v-if="currentOrder.sorting_start_time"
              :timestamp="currentOrder.sorting_start_time" 
              color="#F56C6C"
            >
              <h4>开始分拣</h4>
              <p>分拣区域：{{ currentOrder.sorting_zone_name }}</p>
              <p>分拣方式：{{ getSortingMethodText(currentOrder.sorting_method) }}</p>
            </el-timeline-item>
            
            <el-timeline-item 
              v-if="currentOrder.shelving_start_time"
              :timestamp="currentOrder.shelving_start_time" 
              color="#909399"
            >
              <h4>开始上架</h4>
              <p>上架策略：{{ getShelvingStrategyText(currentOrder.shelving_strategy) }}</p>
              <p>目标仓库：{{ currentOrder.target_warehouse_name }}</p>
            </el-timeline-item>
            
            <el-timeline-item 
              v-if="currentOrder.shelving_end_time"
              :timestamp="currentOrder.shelving_end_time" 
              color="#67C23A"
            >
              <h4>入库完成</h4>
              <p>处理时长：{{ getProcessingTime(currentOrder) }}小时</p>
              <p>状态：{{ getStatusText(currentOrder.status) }}</p>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="flowChartDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSupplierOptions, getWarehouseOptions } from '@/utils/filterOptions'
import { getStorageData } from '@/utils/storage'

const emit = defineEmits(['refresh'])

// 响应式数据
const loading = ref(false)
const detailDialogVisible = ref(false)
const flowChartDialogVisible = ref(false)
const currentOrder = ref(null)

// 筛选表单
const filterForm = reactive({
  order_no: '',
  supplier_id: null,
  warehouse_id: null,
  status: '',
  date_range: []
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 数据列表
const tableData = ref([])
const suppliers = ref([])
const warehouses = ref([])

// 统计数据
const summaryStats = reactive({
  completed: 0,
  totalQuantity: 0,
  totalAmount: 0,
  avgTime: 0
})

// 加载基础数据
const loadBasicData = async () => {
  try {
    // 加载供应商选项
    const supplierOptions = getSupplierOptions()
    suppliers.value = supplierOptions.map(s => ({
      id: s.value,
      name: s.label,
      code: s.code
    }))
    
    // 加载仓库选项
    const warehouseOptions = getWarehouseOptions()
    warehouses.value = warehouseOptions.map(w => ({
      id: w.value,
      name: w.label,
      code: w.code
    }))
    
  } catch (error) {
    ElMessage.error('加载基础数据失败')
    console.error('加载基础数据失败:', error)
  }
}

// 加载收货明细列表
const loadTableData = async () => {
  loading.value = true
  try {
    // 从存储中加载入库单数据
    const orders = getStorageData('inbound_orders') || []
    
    // 筛选已完成或已取消状态的订单
    let completedOrders = orders.filter(order => order.status === 'completed' || order.status === 'cancelled')
    
    // 补充供应商和仓库名称
    completedOrders = completedOrders.map(order => {
      const supplier = suppliers.value.find(s => s.id === order.supplier_id)
      const warehouse = warehouses.value.find(w => w.id === order.warehouse_id)
      const targetWarehouse = warehouses.value.find(w => w.id === order.target_warehouse)
      return {
        ...order,
        supplier_name: supplier ? supplier.name : '未知供应商',
        warehouse_name: warehouse ? warehouse.name : '未知仓库',
        target_warehouse_name: targetWarehouse ? targetWarehouse.name : '未知仓库',
        total_quantity: order.products ? order.products.reduce((sum, p) => sum + (p.shelve_quantity || p.actual_quantity || p.expected_quantity || 0), 0) : 0
      }
    })
    
    // 应用筛选条件
    if (filterForm.order_no) {
      completedOrders = completedOrders.filter(order => 
        order.order_no.toLowerCase().includes(filterForm.order_no.toLowerCase())
      )
    }
    if (filterForm.supplier_id) {
      completedOrders = completedOrders.filter(order => order.supplier_id === filterForm.supplier_id)
    }
    if (filterForm.warehouse_id) {
      completedOrders = completedOrders.filter(order => order.warehouse_id === filterForm.warehouse_id)
    }
    if (filterForm.status) {
      completedOrders = completedOrders.filter(order => order.status === filterForm.status)
    }
    
    tableData.value = completedOrders
    pagination.total = completedOrders.length
    
    // 更新统计数据
    updateSummaryStats(completedOrders)
    
  } catch (error) {
    ElMessage.error('加载收货明细列表失败')
  } finally {
    loading.value = false
  }
}

// 更新统计数据
const updateSummaryStats = (orders) => {
  const completedOrders = orders.filter(order => order.status === 'completed')
  
  summaryStats.completed = completedOrders.length
  summaryStats.totalQuantity = completedOrders.reduce((sum, order) => sum + order.total_quantity, 0)
  summaryStats.totalAmount = completedOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
  
  // 计算平均处理时长
  const totalTime = completedOrders.reduce((sum, order) => sum + getProcessingTimeValue(order), 0)
  summaryStats.avgTime = completedOrders.length > 0 ? (totalTime / completedOrders.length).toFixed(1) : 0
}

// 搜索数据
const searchData = () => {
  loadTableData()
}

// 重置筛选
const resetFilter = () => {
  Object.assign(filterForm, {
    order_no: '',
    supplier_id: null,
    warehouse_id: null,
    status: '',
    date_range: []
  })
  loadTableData()
}

// 查看详情
const viewDetails = (order) => {
  currentOrder.value = order
  detailDialogVisible.value = true
}

// 查看流程图
const viewFlowChart = (order) => {
  currentOrder.value = order
  flowChartDialogVisible.value = true
}

// 打印单据
const printReceipt = (order) => {
  ElMessage.info('打印功能开发中...')
}

// 导出明细
const exportReceipts = () => {
  ElMessage.info('导出功能开发中...')
}

// 生成报表
const generateReport = () => {
  ElMessage.info('报表生成功能开发中...')
}

// 获取处理时长
const getProcessingTime = (order) => {
  return getProcessingTimeValue(order).toFixed(1)
}

// 获取处理时长数值
const getProcessingTimeValue = (order) => {
  if (!order.created_at || !order.shelving_end_time) return 0
  
  const startTime = new Date(order.created_at).getTime()
  const endTime = new Date(order.shelving_end_time).getTime()
  const diffHours = (endTime - startTime) / (1000 * 60 * 60)
  
  return Math.max(0, diffHours)
}

// 获取处理方式文本
const getProcessMethodText = (method) => {
  const methodMap = {
    'quick_shelve': '快速上架',
    'manual': '手动上架',
    'auto': '自动上架'
  }
  return methodMap[method] || '标准流程'
}

// 获取处理方式颜色
const getProcessMethodColor = (method) => {
  const colorMap = {
    'quick_shelve': 'success',
    'manual': 'warning',
    'auto': 'primary'
  }
  return colorMap[method] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || '未知'
}

// 获取状态颜色
const getStatusColor = (status) => {
  const colorMap = {
    'completed': 'success',
    'cancelled': 'danger'
  }
  return colorMap[status] || 'info'
}

// 获取运输方式文本
const getTransportMethodText = (method) => {
  const methodMap = {
    'land': '陆运',
    'air': '空运',
    'sea': '海运',
    'express': '快递'
  }
  return methodMap[method] || '未知'
}

// 获取分拣方式文本
const getSortingMethodText = (method) => {
  const methodMap = {
    'by_product': '按商品分拣',
    'by_zone': '按库区分拣',
    'mixed': '混合分拣',
    'quick_sort': '快速分拣'
  }
  return methodMap[method] || '未知'
}

// 获取上架策略文本
const getShelvingStrategyText = (strategy) => {
  const strategyMap = {
    'fifo': '先进先出',
    'nearest': '就近原则',
    'category': '按类别分区',
    'auto_assign': '自动分配',
    'same_zone': '相同区域集中',
    'scattered': '分散存放'
  }
  return strategyMap[strategy] || '默认策略'
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

onMounted(() => {
  loadBasicData()
  loadTableData()
})
</script>

<style lang="scss" scoped>
.receipt-details {
  .filter-card, .table-card {
    margin-bottom: 20px;
  }
  
  .summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
    
    .summary-card {
      transition: all 0.3s;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      }
      
      .summary-content {
        display: flex;
        align-items: center;
        padding: 10px;
        
        .summary-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          
          .el-icon {
            font-size: 22px;
            color: white;
          }
          
          &.completed {
            background: linear-gradient(45deg, #67C23A, #85CE61);
          }
          
          &.total-quantity {
            background: linear-gradient(45deg, #409EFF, #66B1FF);
          }
          
          &.total-amount {
            background: linear-gradient(45deg, #E6A23C, #EEBE77);
          }
          
          &.avg-time {
            background: linear-gradient(45deg, #909399, #B1B3B8);
          }
        }
        
        .summary-info {
          .summary-value {
            font-size: 22px;
            font-weight: 600;
            color: #303133;
            line-height: 1;
            margin-bottom: 4px;
          }
          
          .summary-label {
            font-size: 13px;
            color: #909399;
          }
        }
      }
    }
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
  
  .receipt-detail {
    h4 {
      margin: 20px 0 15px 0;
      color: #303133;
      font-size: 14px;
    }
  }
  
  .flow-chart {
    .flow-timeline {
      h4 {
        margin: 0 0 8px 0;
        color: #303133;
        font-size: 14px;
        font-weight: 600;
      }
      
      p {
        margin: 4px 0;
        color: #666;
        font-size: 13px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .receipt-details {
    .summary-cards {
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    
    .table-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 15px;
      
      .header-actions {
        width: 100%;
        justify-content: center;
      }
    }
  }
}

@media (max-width: 480px) {
  .receipt-details {
    .summary-cards {
      grid-template-columns: 1fr;
    }
  }
}
</style>