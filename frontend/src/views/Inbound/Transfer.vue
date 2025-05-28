<template>
  <div class="transfer-inbound-page">
    <div class="page-header">
      <h1>调拨入库</h1>
      <div class="header-actions">
        <el-button type="primary" @click="createTransferInbound">
          <el-icon><Plus /></el-icon>
          新建调拨入库
        </el-button>
        <el-button type="success" @click="batchReceive">
          <el-icon><Check /></el-icon>
          批量接收
        </el-button>
        <el-button type="info" @click="exportData">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 筛选区域 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" label-width="80px" :inline="true">
        <el-form-item label="调拨单号">
          <el-input 
            v-model="filterForm.transfer_no" 
            placeholder="请输入调拨单号"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        
        <el-form-item label="源仓库">
          <el-select 
            v-model="filterForm.source_warehouse_id" 
            placeholder="请选择源仓库"
            clearable
            style="width: 130px"
          >
            <el-option 
              v-for="warehouse in warehouses" 
              :key="warehouse.id"
              :label="warehouse.name" 
              :value="warehouse.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="入库状态">
          <el-select 
            v-model="filterForm.status" 
            placeholder="入库状态"
            clearable
            style="width: 120px"
          >
            <el-option label="待入库" value="pending" />
            <el-option label="部分入库" value="partial" />
            <el-option label="已入库" value="received" />
            <el-option label="差异处理中" value="discrepancy" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="物流状态">
          <el-select 
            v-model="filterForm.logistics_status" 
            placeholder="物流状态"
            clearable
            style="width: 120px"
          >
            <el-option label="运输中" value="in_transit" />
            <el-option label="已到达" value="arrived" />
            <el-option label="已签收" value="signed" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="到达日期">
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
          <el-button type="primary" @click="searchOrders">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card total">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Switch /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">总调拨单</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card pending">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pending }}</div>
            <div class="stat-label">待入库</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card in_transit">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Truck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.in_transit }}</div>
            <div class="stat-label">运输中</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card completed">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Check /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.completed }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 调拨入库列表 -->
    <el-card class="table-card">
      <el-table 
        :data="transferList" 
        stripe 
        v-loading="loading" 
        @selection-change="handleSelectionChange"
        max-height="600"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="transfer_no" label="调拨单号" width="140" />
        <el-table-column prop="source_warehouse_name" label="源仓库" width="120" />
        <el-table-column prop="target_warehouse_name" label="目标仓库" width="120" />
        
        <el-table-column prop="logistics_status" label="物流状态" width="100">
          <template #default="scope">
            <el-tag :type="getLogisticsStatusColor(scope.row.logistics_status)" size="small">
              {{ getLogisticsStatusText(scope.row.logistics_status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="total_quantity" label="调拨数量" width="100" align="right" />
        <el-table-column prop="received_quantity" label="已入库" width="100" align="right" />
        <el-table-column prop="damage_quantity" label="破损数量" width="100" align="right" />
        
        <el-table-column prop="total_value" label="货值(¥)" width="120" align="right">
          <template #default="scope">
            ¥{{ parseFloat(scope.row.total_value || 0).toFixed(2) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="入库状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusColor(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="logistics_no" label="物流单号" width="140" show-overflow-tooltip />
        <el-table-column prop="arrived_date" label="到达时间" width="150" />
        <el-table-column prop="created_by" label="创建人" width="100" />
        
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button size="small" type="info" @click="viewDetails(scope.row)">
              详情
            </el-button>
            <el-button 
              v-if="scope.row.logistics_status === 'arrived' && scope.row.status === 'pending'" 
              size="small" 
              type="primary" 
              @click="startReceiving(scope.row)"
            >
              开始入库
            </el-button>
            <el-button 
              v-if="scope.row.status === 'partial'" 
              size="small" 
              type="warning" 
              @click="continueReceiving(scope.row)"
            >
              继续入库
            </el-button>
            <el-button 
              v-if="scope.row.status === 'received'" 
              size="small" 
              type="success" 
              @click="confirmComplete(scope.row)"
            >
              确认完成
            </el-button>
            <el-dropdown 
              v-if="['pending', 'partial', 'received'].includes(scope.row.status)"
              trigger="click"
              style="margin-left: 5px"
            >
              <el-button size="small" type="info">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="trackLogistics(scope.row)">物流跟踪</el-dropdown-item>
                  <el-dropdown-item @click="printReceiptForm(scope.row)">打印入库单</el-dropdown-item>
                  <el-dropdown-item @click="reportDiscrepancy(scope.row)">差异报告</el-dropdown-item>
                  <el-dropdown-item divided @click="rejectTransfer(scope.row)">拒收</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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

    <!-- 入库操作对话框 -->
    <el-dialog 
      title="调拨入库" 
      v-model="receivingDialogVisible" 
      width="900px"
      @close="resetReceivingForm"
    >
      <div v-if="currentOrder" class="receiving-info">
        <el-descriptions title="调拨单信息" :column="3" border size="small">
          <el-descriptions-item label="调拨单号">{{ currentOrder.transfer_no }}</el-descriptions-item>
          <el-descriptions-item label="源仓库">{{ currentOrder.source_warehouse_name }}</el-descriptions-item>
          <el-descriptions-item label="目标仓库">{{ currentOrder.target_warehouse_name }}</el-descriptions-item>
          <el-descriptions-item label="物流单号">{{ currentOrder.logistics_no }}</el-descriptions-item>
          <el-descriptions-item label="到达时间">{{ currentOrder.arrived_date }}</el-descriptions-item>
          <el-descriptions-item label="物流状态">
            <el-tag :type="getLogisticsStatusColor(currentOrder.logistics_status)" size="small">
              {{ getLogisticsStatusText(currentOrder.logistics_status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="receiving-products">
          <h3>入库明细</h3>
          <el-table :data="receivingItems" border size="small" max-height="400">
            <el-table-column prop="product_name" label="商品名称" min-width="200" />
            <el-table-column prop="product_code" label="商品编码" width="120" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="transfer_quantity" label="调拨数量" width="100" align="right" />
            <el-table-column prop="received_quantity" label="已入库" width="100" align="right" />
            <el-table-column label="本次入库" width="120">
              <template #default="scope">
                <el-input-number 
                  v-model="scope.row.current_receive" 
                  :min="0" 
                  :max="scope.row.transfer_quantity - scope.row.received_quantity"
                  size="small"
                  style="width: 100%"
                />
              </template>
            </el-table-column>
            <el-table-column label="商品状态" width="120">
              <template #default="scope">
                <el-select v-model="scope.row.condition" size="small" style="width: 100%">
                  <el-option label="完好" value="good" />
                  <el-option label="轻微破损" value="slightly_damaged" />
                  <el-option label="严重破损" value="severely_damaged" />
                  <el-option label="缺失" value="missing" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="目标库位" width="120">
              <template #default="scope">
                <el-select v-model="scope.row.location" size="small" style="width: 100%" placeholder="选择库位">
                  <el-option 
                    v-for="location in availableLocations" 
                    :key="location.code"
                    :label="location.code" 
                    :value="location.code" 
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="备注" width="150">
              <template #default="scope">
                <el-input 
                  v-model="scope.row.remark" 
                  size="small"
                  placeholder="入库备注"
                />
              </template>
            </el-table-column>
          </el-table>
          
          <div class="receiving-summary">
            <el-progress 
              :percentage="receivingProgress" 
              :color="receivingProgress === 100 ? '#67C23A' : '#409EFF'"
            />
            <span class="progress-text">入库进度：{{ receivingProgress }}%</span>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="receivingDialogVisible = false">取消</el-button>
        <el-button @click="saveReceiving" :loading="receiving">保存进度</el-button>
        <el-button type="primary" @click="completeReceiving" :loading="receiving">完成入库</el-button>
      </template>
    </el-dialog>

    <!-- 差异报告对话框 -->
    <el-dialog 
      title="差异报告" 
      v-model="discrepancyDialogVisible" 
      width="700px"
    >
      <el-form :model="discrepancyForm" label-width="120px">
        <el-form-item label="差异类型" required>
          <el-select v-model="discrepancyForm.type" style="width: 100%">
            <el-option label="数量差异" value="quantity" />
            <el-option label="质量差异" value="quality" />
            <el-option label="商品差异" value="product" />
            <el-option label="包装差异" value="package" />
            <el-option label="其他差异" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="差异商品">
          <el-select v-model="discrepancyForm.product_id" style="width: 100%">
            <el-option 
              v-for="product in discrepancyProducts" 
              :key="product.id"
              :label="product.name" 
              :value="product.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="应收数量">
          <el-input-number v-model="discrepancyForm.expected_quantity" :min="0" style="width: 200px" />
        </el-form-item>
        
        <el-form-item label="实收数量">
          <el-input-number v-model="discrepancyForm.actual_quantity" :min="0" style="width: 200px" />
        </el-form-item>
        
        <el-form-item label="差异描述" required>
          <el-input 
            v-model="discrepancyForm.description" 
            type="textarea" 
            :rows="4"
            placeholder="请详细描述差异情况..."
          />
        </el-form-item>
        
        <el-form-item label="处理建议">
          <el-radio-group v-model="discrepancyForm.suggestion">
            <el-radio label="accept">接受差异</el-radio>
            <el-radio label="return">退回源仓库</el-radio>
            <el-radio label="investigate">进一步调查</el-radio>
            <el-radio label="compensation">要求赔偿</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="discrepancyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDiscrepancy">提交报告</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const loading = ref(false)
const receiving = ref(false)
const receivingDialogVisible = ref(false)
const discrepancyDialogVisible = ref(false)
const currentOrder = ref(null)
const selectedRows = ref([])

// 筛选表单
const filterForm = reactive({
  transfer_no: '',
  source_warehouse_id: null,
  status: '',
  logistics_status: '',
  date_range: []
})

// 差异报告表单
const discrepancyForm = reactive({
  type: '',
  product_id: null,
  expected_quantity: 0,
  actual_quantity: 0,
  description: '',
  suggestion: 'accept'
})

// 入库明细
const receivingItems = ref([])

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 基础数据
const warehouses = ref([])
const transferList = ref([])
const availableLocations = ref([])
const discrepancyProducts = ref([])

// 统计数据
const stats = reactive({
  total: 0,
  pending: 0,
  in_transit: 0,
  completed: 0
})

// 计算属性
const receivingProgress = computed(() => {
  if (receivingItems.value.length === 0) return 0
  const completedItems = receivingItems.value.filter(item => 
    (item.received_quantity + (item.current_receive || 0)) >= item.transfer_quantity
  ).length
  return Math.round((completedItems / receivingItems.value.length) * 100)
})

// 获取物流状态颜色
const getLogisticsStatusColor = (status) => {
  const colorMap = {
    'in_transit': 'primary',
    'arrived': 'warning',
    'signed': 'success'
  }
  return colorMap[status] || 'info'
}

// 获取物流状态文本
const getLogisticsStatusText = (status) => {
  const textMap = {
    'in_transit': '运输中',
    'arrived': '已到达',
    'signed': '已签收'
  }
  return textMap[status] || '未知'
}

// 获取入库状态颜色
const getStatusColor = (status) => {
  const colorMap = {
    'pending': 'warning',
    'partial': 'primary',
    'received': 'info',
    'discrepancy': 'danger',
    'completed': 'success'
  }
  return colorMap[status] || 'info'
}

// 获取入库状态文本
const getStatusText = (status) => {
  const textMap = {
    'pending': '待入库',
    'partial': '部分入库',
    'received': '已入库',
    'discrepancy': '差异处理中',
    'completed': '已完成'
  }
  return textMap[status] || '未知'
}

// 加载基础数据
const loadBasicData = async () => {
  try {
    // 仓库列表
    warehouses.value = JSON.parse(localStorage.getItem('wms_warehouses') || '[]')
    if (warehouses.value.length === 0) {
      warehouses.value = [
        { id: 1, name: '主仓库', code: 'WH001' },
        { id: 2, name: '北京仓库', code: 'WH002' },
        { id: 3, name: '上海仓库', code: 'WH003' },
        { id: 4, name: '广州仓库', code: 'WH004' },
        { id: 5, name: '深圳仓库', code: 'WH005' }
      ]
    }

    // 可用库位
    availableLocations.value = [
      { code: 'A01-01-01', name: 'A区01排01列01层' },
      { code: 'A01-01-02', name: 'A区01排01列02层' },
      { code: 'A01-02-01', name: 'A区01排02列01层' },
      { code: 'B01-01-01', name: 'B区01排01列01层' },
      { code: 'B01-01-02', name: 'B区01排01列02层' }
    ]

  } catch (error) {
    console.error('加载基础数据失败:', error)
  }
}

// 加载调拨入库数据
const loadTransferData = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const mockData = [
      {
        id: 1,
        transfer_no: 'TO202401150001',
        source_warehouse_name: '主仓库',
        target_warehouse_name: '北京仓库',
        logistics_status: 'arrived',
        total_quantity: 20,
        received_quantity: 0,
        damage_quantity: 0,
        total_value: 139760.00,
        status: 'pending',
        logistics_no: 'SF1234567890',
        arrived_date: '2024-01-15 14:30:00',
        created_by: '张三'
      },
      {
        id: 2,
        transfer_no: 'TO202401140002',
        source_warehouse_name: '上海仓库',
        target_warehouse_name: '深圳仓库',
        logistics_status: 'signed',
        total_quantity: 15,
        received_quantity: 10,
        damage_quantity: 1,
        total_value: 70485.00,
        status: 'partial',
        logistics_no: 'JD9876543210',
        arrived_date: '2024-01-14 16:20:00',
        created_by: '李四'
      },
      {
        id: 3,
        transfer_no: 'TO202401130003',
        source_warehouse_name: '广州仓库',
        target_warehouse_name: '主仓库',
        logistics_status: 'signed',
        total_quantity: 10,
        received_quantity: 10,
        damage_quantity: 0,
        total_value: 69880.00,
        status: 'completed',
        logistics_no: 'YTO5555666677',
        arrived_date: '2024-01-13 12:15:00',
        created_by: '王五'
      },
      {
        id: 4,
        transfer_no: 'TO202401120004',
        source_warehouse_name: '北京仓库',
        target_warehouse_name: '上海仓库',
        logistics_status: 'in_transit',
        total_quantity: 8,
        received_quantity: 0,
        damage_quantity: 0,
        total_value: 55904.00,
        status: 'pending',
        logistics_no: 'ZTO7777888899',
        arrived_date: '',
        created_by: '赵六'
      }
    ]
    
    transferList.value = mockData
    pagination.total = mockData.length
    
    // 更新统计数据
    stats.total = mockData.length
    stats.pending = mockData.filter(item => item.status === 'pending').length
    stats.in_transit = mockData.filter(item => item.logistics_status === 'in_transit').length
    stats.completed = mockData.filter(item => item.status === 'completed').length
    
  } catch (error) {
    ElMessage.error('加载调拨入库数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const searchOrders = () => {
  loadTransferData()
}

// 重置筛选
const resetFilter = () => {
  Object.assign(filterForm, {
    transfer_no: '',
    source_warehouse_id: null,
    status: '',
    logistics_status: '',
    date_range: []
  })
  loadTransferData()
}

// 新建调拨入库
const createTransferInbound = () => {
  ElMessage.info('新建调拨入库功能开发中...')
}

// 批量接收
const batchReceive = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要批量接收的调拨单')
    return
  }
  ElMessage.info(`批量接收 ${selectedRows.value.length} 个调拨单`)
}

// 导出数据
const exportData = () => {
  ElMessage.info('调拨入库数据导出功能开发中...')
}

// 查看详情
const viewDetails = (order) => {
  ElMessage.info(`查看调拨单详情: ${order.transfer_no}`)
}

// 开始入库
const startReceiving = (order) => {
  currentOrder.value = order
  loadReceivingItems(order.id)
  receivingDialogVisible.value = true
}

// 继续入库
const continueReceiving = (order) => {
  startReceiving(order)
}

// 确认完成
const confirmComplete = async (order) => {
  try {
    await ElMessageBox.confirm(
      `确定调拨单 "${order.transfer_no}" 已完成入库吗？`,
      '确认完成',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.success('调拨入库已完成')
    loadTransferData()
  } catch {
    // 用户取消操作
  }
}

// 物流跟踪
const trackLogistics = (order) => {
  ElMessage.info(`跟踪物流: ${order.logistics_no}`)
}

// 打印入库单
const printReceiptForm = (order) => {
  ElMessage.info(`打印入库单: ${order.transfer_no}`)
}

// 差异报告
const reportDiscrepancy = (order) => {
  currentOrder.value = order
  loadDiscrepancyProducts(order.id)
  discrepancyDialogVisible.value = true
}

// 拒收
const rejectTransfer = async (order) => {
  try {
    await ElMessageBox.confirm(
      `确定要拒收调拨单 "${order.transfer_no}" 吗？`,
      '拒收确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.success('调拨单已拒收')
    loadTransferData()
  } catch {
    // 用户取消操作
  }
}

// 加载入库明细
const loadReceivingItems = async (orderId) => {
  try {
    // 模拟API调用
    const mockItems = [
      {
        id: 1,
        product_name: '华为P50 Pro',
        product_code: 'HW001',
        unit: '台',
        transfer_quantity: 15,
        received_quantity: 0,
        current_receive: 0,
        condition: 'good',
        location: '',
        remark: ''
      },
      {
        id: 2,
        product_name: 'iPhone 14 Pro',
        product_code: 'IP001',
        unit: '台',
        transfer_quantity: 5,
        received_quantity: 0,
        current_receive: 0,
        condition: 'good',
        location: '',
        remark: ''
      }
    ]
    
    receivingItems.value = mockItems
  } catch (error) {
    ElMessage.error('加载入库明细失败')
  }
}

// 加载差异商品
const loadDiscrepancyProducts = async (orderId) => {
  try {
    // 模拟加载对应订单的商品列表
    discrepancyProducts.value = [
      { id: 1, name: '华为P50 Pro' },
      { id: 2, name: 'iPhone 14 Pro' }
    ]
  } catch (error) {
    ElMessage.error('加载差异商品失败')
  }
}

// 保存入库进度
const saveReceiving = async () => {
  try {
    receiving.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800))
    
    ElMessage.success('入库进度已保存')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    receiving.value = false
  }
}

// 完成入库
const completeReceiving = async () => {
  try {
    const totalReceived = receivingItems.value.reduce((sum, item) => 
      sum + (item.received_quantity + (item.current_receive || 0)), 0
    )
    
    if (totalReceived === 0) {
      ElMessage.warning('请输入入库数量')
      return
    }
    
    // 检查是否有未选择库位的商品
    const itemsWithoutLocation = receivingItems.value.filter(item => 
      (item.current_receive || 0) > 0 && !item.location
    )
    
    if (itemsWithoutLocation.length > 0) {
      ElMessage.warning('请为所有入库商品选择目标库位')
      return
    }
    
    receiving.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('入库完成')
    receivingDialogVisible.value = false
    loadTransferData()
  } catch (error) {
    ElMessage.error('入库完成失败')
  } finally {
    receiving.value = false
  }
}

// 提交差异报告
const submitDiscrepancy = async () => {
  try {
    if (!discrepancyForm.type || !discrepancyForm.description) {
      ElMessage.warning('请填写差异类型和描述')
      return
    }
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800))
    
    ElMessage.success('差异报告提交成功')
    discrepancyDialogVisible.value = false
    
    // 重置表单
    Object.assign(discrepancyForm, {
      type: '',
      product_id: null,
      expected_quantity: 0,
      actual_quantity: 0,
      description: '',
      suggestion: 'accept'
    })
    
    loadTransferData()
  } catch (error) {
    ElMessage.error('提交失败')
  }
}

// 重置表单
const resetReceivingForm = () => {
  receivingItems.value = []
  currentOrder.value = null
}

// 表格选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  loadTransferData()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadTransferData()
}

onMounted(() => {
  loadBasicData()
  loadTransferData()
})
</script>

<style lang="scss" scoped>
.transfer-inbound-page {
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
      border-left: 4px solid #606266;
      
      .stat-icon {
        background: linear-gradient(45deg, #606266, #909399);
      }
    }
    
    &.pending {
      border-left: 4px solid #E6A23C;
      
      .stat-icon {
        background: linear-gradient(45deg, #E6A23C, #EEBE77);
      }
    }
    
    &.in_transit {
      border-left: 4px solid #409EFF;
      
      .stat-icon {
        background: linear-gradient(45deg, #409EFF, #66B1FF);
      }
    }
    
    &.completed {
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

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.receiving-info {
  .receiving-products {
    margin-top: 20px;
    
    h3 {
      margin-bottom: 15px;
      color: #303133;
    }
    
    .receiving-summary {
      margin-top: 20px;
      display: flex;
      align-items: center;
      gap: 15px;
      
      .el-progress {
        flex: 1;
      }
      
      .progress-text {
        color: #303133;
        font-weight: 500;
        white-space: nowrap;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .transfer-inbound-page {
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