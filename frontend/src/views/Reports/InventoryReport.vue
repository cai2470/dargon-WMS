<template>
  <div class="inventory-report-page">
    <div class="page-header">
      <h1>库存报表</h1>
      <div class="header-actions">
        <el-button type="primary" @click="exportReport">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
        <el-button type="success" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 筛选区域 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" label-width="80px" :inline="true">
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
        
        <el-form-item label="商品分类">
          <el-select 
            v-model="filterForm.category_id" 
            placeholder="请选择分类"
            clearable
            style="width: 150px"
          >
            <el-option 
              v-for="category in categories" 
              :key="category.id"
              :label="category.name" 
              :value="category.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="库存状态">
          <el-select 
            v-model="filterForm.stock_status" 
            placeholder="库存状态"
            clearable
            style="width: 120px"
          >
            <el-option 
              v-for="status in stockStatusOptions" 
              :key="status.value"
              :label="status.label" 
              :value="status.value" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="商品名称">
          <el-input 
            v-model="filterForm.product_name" 
            placeholder="请输入商品名称"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        
        <el-form-item label="统计时间">
          <el-date-picker
            v-model="filterForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="searchInventory">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card total">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Box /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalProducts }}</div>
            <div class="stat-label">商品种类</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card value">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">${{ stats.totalValue.toFixed(2) }}</div>
            <div class="stat-label">库存总值</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card warning">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.warningProducts }}</div>
            <div class="stat-label">预警商品</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card shortage">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><CircleClose /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.shortageProducts }}</div>
            <div class="stat-label">缺货商品</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <span>库存分布</span>
          </div>
        </template>
        <div ref="inventoryDistributionChart" style="height: 300px;"></div>
      </el-card>
      
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <span>库存趋势</span>
          </div>
        </template>
        <div ref="inventoryTrendChart" style="height: 300px;"></div>
      </el-card>
    </div>

    <!-- 库存明细表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>库存明细</span>
          <div class="header-actions">
            <el-button size="small" type="primary" @click="exportInventory">
              导出明细
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table 
        :data="inventoryList" 
        stripe 
        v-loading="loading" 
        max-height="500"
      >
        <el-table-column prop="product_code" label="商品编码" width="120" />
        <el-table-column prop="product_name" label="商品名称" min-width="200" />
        <el-table-column prop="warehouse_name" label="仓库" width="120" />
        <el-table-column prop="location_code" label="储位" width="100" />
        <el-table-column prop="unit" label="单位" width="80" />
        
        <el-table-column prop="current_stock" label="当前库存" width="120" align="right">
          <template #default="scope">
            <span :class="getStockClass(scope.row)">
              {{ scope.row.current_stock }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column prop="available_stock" label="可用库存" width="120" align="right" />
        <el-table-column prop="reserved_stock" label="预留库存" width="120" align="right" />
        
        <el-table-column prop="unit_cost" label="单位成本($)" width="120" align="right">
          <template #default="scope">
            ${{ parseFloat(scope.row.unit_cost || 0).toFixed(2) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="total_value" label="库存价值($)" width="130" align="right">
          <template #default="scope">
            ${{ parseFloat(scope.row.total_value || 0).toFixed(2) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="min_stock" label="最低库存" width="100" align="right" />
        <el-table-column prop="max_stock" label="最高库存" width="100" align="right" />
        
        <el-table-column prop="stock_status" label="库存状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusColor(scope.row.stock_status)">
              {{ getStatusText(scope.row.stock_status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="last_updated" label="最后更新" width="150" />
        
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button size="small" type="info" @click="viewDetails(scope.row)">
              详情
            </el-button>
            <el-button size="small" type="primary" @click="adjustStock(scope.row)">
              调整
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

    <!-- 库存调整对话框 -->
    <el-dialog 
      title="库存调整" 
      v-model="adjustDialogVisible" 
      width="600px"
      @close="resetAdjustForm"
    >
      <el-form :model="adjustForm" :rules="adjustRules" ref="adjustFormRef" label-width="120px">
        <el-form-item label="商品信息">
          <div class="product-info">
            <p><strong>商品编码：</strong>{{ currentProduct?.product_code }}</p>
            <p><strong>商品名称：</strong>{{ currentProduct?.product_name }}</p>
            <p><strong>当前库存：</strong>{{ currentProduct?.current_stock }} {{ currentProduct?.unit }}</p>
          </div>
        </el-form-item>
        
        <el-form-item label="调整类型" prop="adjust_type">
          <el-radio-group v-model="adjustForm.adjust_type">
            <el-radio label="increase">增加</el-radio>
            <el-radio label="decrease">减少</el-radio>
            <el-radio label="set">设置</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="调整数量" prop="quantity">
          <el-input-number 
            v-model="adjustForm.quantity" 
            :min="1" 
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="调整原因" prop="reason">
          <el-select v-model="adjustForm.reason" placeholder="请选择调整原因" style="width: 100%">
            <el-option label="盘点调整" value="inventory_check" />
            <el-option label="损耗调整" value="loss" />
            <el-option label="系统错误" value="system_error" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input 
            v-model="adjustForm.remark" 
            type="textarea" 
            :rows="3"
            placeholder="请输入调整备注"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdjust" :loading="adjusting">确认调整</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getWarehouseOptions, getAllCategoryOptions, getStockStatusOptions } from '@/utils/filterOptions'
import * as echarts from 'echarts'

// 响应式数据
const loading = ref(false)
const adjusting = ref(false)
const adjustDialogVisible = ref(false)
const adjustFormRef = ref()
const currentProduct = ref(null)

// 图表引用
const inventoryDistributionChart = ref()
const inventoryTrendChart = ref()

// 筛选表单
const filterForm = reactive({
  warehouse_id: null,
  category_id: null,
  stock_status: '',
  product_name: '',
  date_range: []
})

// 调整表单
const adjustForm = reactive({
  adjust_type: 'increase',
  quantity: 1,
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
const categories = ref([])
const stockStatusOptions = ref([])
const inventoryList = ref([])

// 统计数据
const stats = reactive({
  totalProducts: 0,
  totalValue: 0,
  warningProducts: 0,
  shortageProducts: 0
})

// 验证规则
const adjustRules = {
  adjust_type: [
    { required: true, message: '请选择调整类型', trigger: 'change' }
  ],
  quantity: [
    { required: true, message: '请输入调整数量', trigger: 'blur' }
  ],
  reason: [
    { required: true, message: '请选择调整原因', trigger: 'change' }
  ]
}

// 获取库存状态颜色
const getStatusColor = (status) => {
  const colorMap = {
    'normal': 'success',
    'warning': 'warning',
    'shortage': 'danger',
    'overstock': 'info'
  }
  return colorMap[status] || 'info'
}

// 获取库存状态文本
const getStatusText = (status) => {
  const textMap = {
    'normal': '正常',
    'warning': '预警',
    'shortage': '缺货',
    'overstock': '超储'
  }
  return textMap[status] || '未知'
}

// 获取库存数量样式
const getStockClass = (row) => {
  if (row.current_stock <= 0) return 'stock-shortage'
  if (row.current_stock <= row.min_stock) return 'stock-warning'
  if (row.current_stock >= row.max_stock) return 'stock-overstock'
  return 'stock-normal'
}

// 加载基础数据
const loadBasicData = async () => {
  try {
    // 使用统一的选项加载函数
    const warehouseOptions = getWarehouseOptions()
    warehouses.value = warehouseOptions.map(w => ({
      id: w.id,
      name: w.label,
      code: w.code
    }))
    
    // 使用统一的分类选项加载函数
    const categoryOptions = getAllCategoryOptions()
    categories.value = categoryOptions.map(c => ({
      id: c.id || c.value,
      name: c.label
    }))
    
    // 加载库存状态选项
    stockStatusOptions.value = getStockStatusOptions()
  } catch (error) {
    ElMessage.error('加载基础数据失败')
  }
}

// 加载库存数据
const loadInventoryData = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const mockData = [
      {
        id: 1,
        product_code: 'HW001',
        product_name: '华为P50 Pro',
        warehouse_name: '主仓库',
        location_code: 'A01-01',
        unit: '台',
        current_stock: 45,
        available_stock: 40,
        reserved_stock: 5,
        unit_cost: 4500.00,
        total_value: 202500.00,
        min_stock: 10,
        max_stock: 100,
        stock_status: 'normal',
        last_updated: '2024-01-15 14:30:00'
      },
      {
        id: 2,
        product_code: 'IP001',
        product_name: 'iPhone 14 Pro',
        warehouse_name: '主仓库',
        location_code: 'A01-02',
        unit: '台',
        current_stock: 8,
        available_stock: 8,
        reserved_stock: 0,
        unit_cost: 7500.00,
        total_value: 60000.00,
        min_stock: 10,
        max_stock: 80,
        stock_status: 'warning',
        last_updated: '2024-01-15 13:45:00'
      },
      {
        id: 3,
        product_code: 'XM001',
        product_name: '小米13 Pro',
        warehouse_name: '北京仓库',
        location_code: 'B02-01',
        unit: '台',
        current_stock: 0,
        available_stock: 0,
        reserved_stock: 0,
        unit_cost: 3500.00,
        total_value: 0.00,
        min_stock: 5,
        max_stock: 50,
        stock_status: 'shortage',
        last_updated: '2024-01-14 16:20:00'
      },
      {
        id: 4,
        product_code: 'LP001',
        product_name: 'ThinkPad X1 Carbon',
        warehouse_name: '上海仓库',
        location_code: 'C03-01',
        unit: '台',
        current_stock: 85,
        available_stock: 80,
        reserved_stock: 5,
        unit_cost: 8500.00,
        total_value: 722500.00,
        min_stock: 5,
        max_stock: 30,
        stock_status: 'overstock',
        last_updated: '2024-01-15 10:15:00'
      }
    ]
    
    inventoryList.value = mockData
    pagination.total = mockData.length
    
    // 更新统计数据
    stats.totalProducts = mockData.length
    stats.totalValue = mockData.reduce((sum, item) => sum + item.total_value, 0)
    stats.warningProducts = mockData.filter(item => item.stock_status === 'warning').length
    stats.shortageProducts = mockData.filter(item => item.stock_status === 'shortage').length
    
  } catch (error) {
    ElMessage.error('加载库存数据失败')
  } finally {
    loading.value = false
  }
}

// 初始化图表
const initCharts = async () => {
  await nextTick()
  
  // 库存分布饼图
  if (inventoryDistributionChart.value) {
    const distributionChart = echarts.init(inventoryDistributionChart.value)
    const distributionOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          name: '库存分布',
          type: 'pie',
          radius: '50%',
          data: [
            { value: 45, name: '正常库存' },
            { value: 8, name: '预警库存' },
            { value: 0, name: '缺货商品' },
            { value: 85, name: '超储商品' }
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    }
    distributionChart.setOption(distributionOption)
  }
  
  // 库存趋势折线图
  if (inventoryTrendChart.value) {
    const trendChart = echarts.init(inventoryTrendChart.value)
    const trendOption = {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['入库', '出库', '库存']
      },
      xAxis: {
        type: 'category',
        data: ['1月', '2月', '3月', '4月', '5月', '6月']
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '入库',
          type: 'line',
          data: [120, 132, 101, 134, 90, 230]
        },
        {
          name: '出库',
          type: 'line',
          data: [220, 182, 191, 234, 290, 330]
        },
        {
          name: '库存',
          type: 'line',
          data: [150, 232, 201, 154, 190, 330]
        }
      ]
    }
    trendChart.setOption(trendOption)
  }
}

// 搜索库存
const searchInventory = () => {
  loadInventoryData()
}

// 重置筛选
const resetFilter = () => {
  Object.assign(filterForm, {
    warehouse_id: null,
    category_id: null,
    stock_status: '',
    product_name: '',
    date_range: []
  })
  loadInventoryData()
}

// 刷新数据
const refreshData = () => {
  loadInventoryData()
  initCharts()
}

// 导出报表
const exportReport = () => {
  ElMessage.info('库存报表导出功能开发中...')
}

// 导出库存明细
const exportInventory = () => {
  ElMessage.info('库存明细导出功能开发中...')
}

// 查看详情
const viewDetails = (row) => {
  ElMessage.info(`查看商品详情: ${row.product_name}`)
}

// 调整库存
const adjustStock = (row) => {
  currentProduct.value = row
  adjustDialogVisible.value = true
}

// 提交调整
const submitAdjust = async () => {
  if (!adjustFormRef.value) return
  
  try {
    await adjustFormRef.value.validate()
    
    adjusting.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('库存调整成功')
    adjustDialogVisible.value = false
    loadInventoryData()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('调整失败')
    }
  } finally {
    adjusting.value = false
  }
}

// 重置调整表单
const resetAdjustForm = () => {
  if (adjustFormRef.value) {
    adjustFormRef.value.resetFields()
  }
  Object.assign(adjustForm, {
    adjust_type: 'increase',
    quantity: 1,
    reason: '',
    remark: ''
  })
  currentProduct.value = null
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  loadInventoryData()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadInventoryData()
}

onMounted(() => {
  loadBasicData()
  loadInventoryData()
  initCharts()
})
</script>

<style lang="scss" scoped>
.inventory-report-page {
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

.filter-card, .table-card {
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
  
  .stat-card {
    &.total {
      border-left: 4px solid #409EFF;
      
      .stat-icon {
        background: linear-gradient(45deg, #409EFF, #66B1FF);
      }
    }
    
    &.value {
      border-left: 4px solid #67C23A;
      
      .stat-icon {
        background: linear-gradient(45deg, #67C23A, #85CE61);
      }
    }
    
    &.warning {
      border-left: 4px solid #E6A23C;
      
      .stat-icon {
        background: linear-gradient(45deg, #E6A23C, #EEBE77);
      }
    }
    
    &.shortage {
      border-left: 4px solid #F56C6C;
      
      .stat-icon {
        background: linear-gradient(45deg, #F56C6C, #F78989);
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

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
  
  .chart-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  
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

.product-info {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  
  p {
    margin: 5px 0;
    color: #606266;
  }
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

.stock-shortage {
  color: #F56C6C;
  font-weight: 600;
}

.stock-overstock {
  color: #909399;
  font-weight: 600;
}

// 响应式设计
@media (max-width: 768px) {
  .inventory-report-page {
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
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
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