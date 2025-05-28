<template>
  <div class="transfer-outbound-page">
    <div class="page-header">
      <h1>调拨出库</h1>
      <div class="header-actions">
        <el-button type="primary" @click="createTransferOrder">
          <el-icon><Plus /></el-icon>
          新建调拨出库
        </el-button>
        <el-button type="success" @click="batchProcess">
          <el-icon><Operation /></el-icon>
          批量处理
        </el-button>
        <el-button type="warning" @click="trackingReport">
          <el-icon><Position /></el-icon>
          物流跟踪
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
        
        <el-form-item label="目标仓库">
          <el-select 
            v-model="filterForm.target_warehouse_id" 
            placeholder="请选择目标仓库"
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
        
        <el-form-item label="调拨状态">
          <el-select 
            v-model="filterForm.transfer_status" 
            placeholder="调拨状态"
            clearable
            style="width: 120px"
          >
            <el-option label="待出库" value="pending" />
            <el-option label="已出库" value="shipped" />
            <el-option label="运输中" value="in_transit" />
            <el-option label="已到达" value="arrived" />
            <el-option label="已入库" value="received" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="调拨类型">
          <el-select 
            v-model="filterForm.transfer_type" 
            placeholder="调拨类型"
            clearable
            style="width: 120px"
          >
            <el-option label="库存调拨" value="stock" />
            <el-option label="紧急调拨" value="urgent" />
            <el-option label="补货调拨" value="replenish" />
            <el-option label="退货调拨" value="return" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="创建日期">
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
            <div class="stat-label">待处理</div>
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

    <!-- 调拨单列表 -->
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
        
        <el-table-column prop="transfer_type" label="调拨类型" width="100">
          <template #default="scope">
            <el-tag :type="getTypeColor(scope.row.transfer_type)" size="small">
              {{ getTypeText(scope.row.transfer_type) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="total_quantity" label="调拨数量" width="100" align="right" />
        <el-table-column prop="shipped_quantity" label="已出库" width="100" align="right" />
        <el-table-column prop="received_quantity" label="已入库" width="100" align="right" />
        
        <el-table-column prop="total_value" label="货值(¥)" width="120" align="right">
          <template #default="scope">
            ¥{{ parseFloat(scope.row.total_value || 0).toFixed(2) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="transfer_status" label="调拨状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusColor(scope.row.transfer_status)">
              {{ getStatusText(scope.row.transfer_status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="logistics_no" label="物流单号" width="140" show-overflow-tooltip />
        <el-table-column prop="expected_date" label="预计到达" width="150" />
        <el-table-column prop="created_by" label="创建人" width="100" />
        
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="scope">
            <el-button size="small" type="info" @click="viewDetails(scope.row)">
              详情
            </el-button>
            <el-button 
              v-if="scope.row.transfer_status === 'pending'" 
              size="small" 
              type="primary" 
              @click="confirmShipment(scope.row)"
            >
              确认出库
            </el-button>
            <el-button 
              v-if="scope.row.transfer_status === 'shipped'" 
              size="small" 
              type="warning" 
              @click="trackLogistics(scope.row)"
            >
              物流跟踪
            </el-button>
            <el-button 
              v-if="scope.row.transfer_status === 'arrived'" 
              size="small" 
              type="success" 
              @click="confirmReceive(scope.row)"
            >
              确认入库
            </el-button>
            <el-dropdown 
              v-if="['pending', 'shipped'].includes(scope.row.transfer_status)"
              trigger="click"
              style="margin-left: 5px"
            >
              <el-button size="small" type="info">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="editOrder(scope.row)">编辑调拨单</el-dropdown-item>
                  <el-dropdown-item @click="printTransferForm(scope.row)">打印调拨单</el-dropdown-item>
                  <el-dropdown-item @click="setLogistics(scope.row)">设置物流</el-dropdown-item>
                  <el-dropdown-item divided @click="cancelOrder(scope.row)">取消调拨</el-dropdown-item>
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

    <!-- 新建调拨出库对话框 -->
    <el-dialog 
      title="新建调拨出库" 
      v-model="createDialogVisible" 
      width="900px"
      @close="resetCreateForm"
    >
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="调拨单号" prop="transfer_no">
              <el-input 
                v-model="createForm.transfer_no" 
                placeholder="系统自动生成"
                readonly
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="调拨类型" prop="transfer_type">
              <el-select v-model="createForm.transfer_type" placeholder="请选择调拨类型" style="width: 100%">
                <el-option label="库存调拨" value="stock" />
                <el-option label="紧急调拨" value="urgent" />
                <el-option label="补货调拨" value="replenish" />
                <el-option label="退货调拨" value="return" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="createForm.priority" placeholder="选择优先级" style="width: 100%">
                <el-option label="紧急" value="urgent" />
                <el-option label="高" value="high" />
                <el-option label="中" value="medium" />
                <el-option label="低" value="low" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="源仓库" prop="source_warehouse_id">
              <el-select v-model="createForm.source_warehouse_id" placeholder="请选择源仓库" style="width: 100%">
                <el-option 
                  v-for="warehouse in warehouses" 
                  :key="warehouse.id"
                  :label="warehouse.name" 
                  :value="warehouse.id" 
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目标仓库" prop="target_warehouse_id">
              <el-select v-model="createForm.target_warehouse_id" placeholder="请选择目标仓库" style="width: 100%">
                <el-option 
                  v-for="warehouse in warehouses" 
                  :key="warehouse.id"
                  :label="warehouse.name" 
                  :value="warehouse.id" 
                  :disabled="warehouse.id === createForm.source_warehouse_id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预计到达时间" prop="expected_date">
              <el-date-picker 
                v-model="createForm.expected_date" 
                type="datetime"
                placeholder="选择预计到达时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物流公司">
              <el-select v-model="createForm.logistics_company" placeholder="选择物流公司" style="width: 100%">
                <el-option label="顺丰快递" value="sf" />
                <el-option label="京东物流" value="jd" />
                <el-option label="德邦快递" value="deppon" />
                <el-option label="安能物流" value="ane" />
                <el-option label="自有运输" value="self" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="调拨原因" prop="reason">
          <el-input 
            v-model="createForm.reason" 
            type="textarea" 
            :rows="2"
            placeholder="请输入调拨原因"
          />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input 
            v-model="createForm.remark" 
            type="textarea" 
            :rows="2"
            placeholder="请输入备注信息"
          />
        </el-form-item>
        
        <!-- 调拨明细 -->
        <el-form-item label="调拨明细">
          <div class="product-details">
            <div class="detail-header">
              <el-button size="small" type="primary" @click="addProduct">
                <el-icon><Plus /></el-icon>
                添加商品
              </el-button>
            </div>
            
            <el-table :data="createForm.products" border size="small">
              <el-table-column prop="product_name" label="商品名称" min-width="200" />
              <el-table-column prop="product_code" label="商品编码" width="120" />
              <el-table-column prop="unit" label="单位" width="80" />
              <el-table-column prop="current_stock" label="当前库存" width="100" align="right" />
              <el-table-column label="调拨数量" width="120">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.quantity" 
                    :min="1" 
                    :max="scope.row.current_stock"
                    size="small"
                    style="width: 100%"
                    @change="calculateValue(scope.row)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="单位成本(¥)" width="130">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.unit_cost" 
                    :precision="2"
                    :min="0" 
                    size="small"
                    style="width: 100%"
                    @change="calculateValue(scope.row)"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="total_value" label="总价值(¥)" width="120" align="right">
                <template #default="scope">
                  ¥{{ parseFloat(scope.row.total_value || 0).toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column label="备注" width="150">
                <template #default="scope">
                  <el-input 
                    v-model="scope.row.remark" 
                    size="small"
                    placeholder="备注"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="scope">
                  <el-button 
                    size="small" 
                    type="danger" 
                    @click="removeProduct(scope.$index)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <div class="summary-info">
              <span><strong>总数量：{{ totalQuantity }}</strong></span>
              <span><strong>总价值：¥{{ totalValue.toFixed(2) }}</strong></span>
            </div>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate" :loading="creating">创建调拨单</el-button>
      </template>
    </el-dialog>

    <!-- 物流跟踪对话框 -->
    <el-dialog 
      title="物流跟踪" 
      v-model="trackingDialogVisible" 
      width="700px"
      @close="resetTrackingForm"
    >
      <div v-if="currentOrder" class="tracking-info">
        <el-descriptions title="调拨单信息" :column="2" border size="small">
          <el-descriptions-item label="调拨单号">{{ currentOrder.transfer_no }}</el-descriptions-item>
          <el-descriptions-item label="物流单号">{{ currentOrder.logistics_no || '暂无' }}</el-descriptions-item>
          <el-descriptions-item label="源仓库">{{ currentOrder.source_warehouse_name }}</el-descriptions-item>
          <el-descriptions-item label="目标仓库">{{ currentOrder.target_warehouse_name }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="tracking-timeline">
          <h3>物流轨迹</h3>
          <el-timeline>
            <el-timeline-item
              v-for="(track, index) in trackingRecords"
              :key="index"
              :timestamp="track.time"
              :type="track.type"
            >
              <div class="tracking-content">
                <div class="tracking-location">{{ track.location }}</div>
                <div class="tracking-description">{{ track.description }}</div>
                <div class="tracking-status">{{ track.status }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="trackingDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="refreshTracking">刷新轨迹</el-button>
      </template>
    </el-dialog>

    <!-- 设置物流对话框 -->
    <el-dialog 
      title="设置物流信息" 
      v-model="logisticsDialogVisible" 
      width="500px"
    >
      <el-form :model="logisticsForm" label-width="100px">
        <el-form-item label="物流公司" required>
          <el-select v-model="logisticsForm.logistics_company" style="width: 100%">
            <el-option label="顺丰快递" value="sf" />
            <el-option label="京东物流" value="jd" />
            <el-option label="德邦快递" value="deppon" />
            <el-option label="安能物流" value="ane" />
            <el-option label="自有运输" value="self" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="物流单号" required>
          <el-input v-model="logisticsForm.logistics_no" placeholder="请输入物流单号" />
        </el-form-item>
        
        <el-form-item label="联系电话">
          <el-input v-model="logisticsForm.contact_phone" placeholder="请输入联系电话" />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input 
            v-model="logisticsForm.remark" 
            type="textarea" 
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="logisticsDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveLogistics">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const loading = ref(false)
const creating = ref(false)
const createDialogVisible = ref(false)
const trackingDialogVisible = ref(false)
const logisticsDialogVisible = ref(false)
const createFormRef = ref()
const currentOrder = ref(null)
const selectedRows = ref([])

// 筛选表单
const filterForm = reactive({
  transfer_no: '',
  source_warehouse_id: null,
  target_warehouse_id: null,
  transfer_status: '',
  transfer_type: '',
  date_range: []
})

// 新建表单
const createForm = reactive({
  transfer_no: '',
  transfer_type: '',
  priority: 'medium',
  source_warehouse_id: null,
  target_warehouse_id: null,
  expected_date: '',
  logistics_company: '',
  reason: '',
  remark: '',
  products: []
})

// 物流表单
const logisticsForm = reactive({
  logistics_company: '',
  logistics_no: '',
  contact_phone: '',
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
const availableProducts = ref([])
const transferList = ref([])
const trackingRecords = ref([])

// 统计数据
const stats = reactive({
  total: 0,
  pending: 0,
  in_transit: 0,
  completed: 0
})

// 验证规则
const createRules = {
  transfer_type: [
    { required: true, message: '请选择调拨类型', trigger: 'change' }
  ],
  source_warehouse_id: [
    { required: true, message: '请选择源仓库', trigger: 'change' }
  ],
  target_warehouse_id: [
    { required: true, message: '请选择目标仓库', trigger: 'change' }
  ],
  expected_date: [
    { required: true, message: '请选择预计到达时间', trigger: 'change' }
  ],
  reason: [
    { required: true, message: '请输入调拨原因', trigger: 'blur' }
  ]
}

// 计算属性
const totalQuantity = computed(() => {
  return createForm.products.reduce((sum, item) => sum + (item.quantity || 0), 0)
})

const totalValue = computed(() => {
  return createForm.products.reduce((sum, item) => sum + (item.total_value || 0), 0)
})

// 获取调拨类型颜色
const getTypeColor = (type) => {
  const colorMap = {
    'stock': 'primary',
    'urgent': 'danger',
    'replenish': 'success',
    'return': 'warning'
  }
  return colorMap[type] || 'info'
}

// 获取调拨类型文本
const getTypeText = (type) => {
  const textMap = {
    'stock': '库存调拨',
    'urgent': '紧急调拨',
    'replenish': '补货调拨',
    'return': '退货调拨'
  }
  return textMap[type] || '未知'
}

// 获取状态颜色
const getStatusColor = (status) => {
  const colorMap = {
    'pending': 'warning',
    'shipped': 'primary',
    'in_transit': 'info',
    'arrived': 'success',
    'received': 'success',
    'cancelled': 'danger'
  }
  return colorMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'pending': '待出库',
    'shipped': '已出库',
    'in_transit': '运输中',
    'arrived': '已到达',
    'received': '已入库',
    'cancelled': '已取消'
  }
  return textMap[status] || '未知'
}

// 生成调拨单号
const generateTransferNo = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0')
  return `TO${year}${month}${day}${time}`
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

    // 商品列表（含库存）
    const products = JSON.parse(localStorage.getItem('wms_products') || '[]')
    availableProducts.value = products.map(p => ({
      id: p.id,
      code: p.code,
      name: p.name,
      unit: p.unit || '台',
      cost: parseFloat(p.price || 0) * 0.7, // 模拟成本价
      current_stock: Math.floor(Math.random() * 100) + 10 // 模拟库存
    }))
  } catch (error) {
    console.error('加载基础数据失败:', error)
  }
}

// 加载调拨单数据
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
        transfer_type: 'urgent',
        total_quantity: 20,
        shipped_quantity: 20,
        received_quantity: 0,
        total_value: 139760.00,
        transfer_status: 'in_transit',
        logistics_no: 'SF1234567890',
        expected_date: '2024-01-16 14:00:00',
        created_by: '张三'
      },
      {
        id: 2,
        transfer_no: 'TO202401140002',
        source_warehouse_name: '上海仓库',
        target_warehouse_name: '深圳仓库',
        transfer_type: 'replenish',
        total_quantity: 15,
        shipped_quantity: 0,
        received_quantity: 0,
        total_value: 70485.00,
        transfer_status: 'pending',
        logistics_no: '',
        expected_date: '2024-01-17 10:00:00',
        created_by: '李四'
      },
      {
        id: 3,
        transfer_no: 'TO202401130003',
        source_warehouse_name: '广州仓库',
        target_warehouse_name: '主仓库',
        transfer_type: 'stock',
        total_quantity: 10,
        shipped_quantity: 10,
        received_quantity: 10,
        total_value: 69880.00,
        transfer_status: 'received',
        logistics_no: 'JD9876543210',
        expected_date: '2024-01-14 16:00:00',
        created_by: '王五'
      },
      {
        id: 4,
        transfer_no: 'TO202401120004',
        source_warehouse_name: '北京仓库',
        target_warehouse_name: '上海仓库',
        transfer_type: 'return',
        total_quantity: 5,
        shipped_quantity: 5,
        received_quantity: 5,
        total_value: 34940.00,
        transfer_status: 'received',
        logistics_no: 'YTO5555666677',
        expected_date: '2024-01-13 12:00:00',
        created_by: '赵六'
      }
    ]
    
    transferList.value = mockData
    pagination.total = mockData.length
    
    // 更新统计数据
    stats.total = mockData.length
    stats.pending = mockData.filter(item => item.transfer_status === 'pending').length
    stats.in_transit = mockData.filter(item => ['shipped', 'in_transit', 'arrived'].includes(item.transfer_status)).length
    stats.completed = mockData.filter(item => item.transfer_status === 'received').length
    
  } catch (error) {
    ElMessage.error('加载调拨单数据失败')
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
    target_warehouse_id: null,
    transfer_status: '',
    transfer_type: '',
    date_range: []
  })
  loadTransferData()
}

// 新建调拨出库
const createTransferOrder = () => {
  createForm.transfer_no = generateTransferNo()
  createDialogVisible.value = true
}

// 批量处理
const batchProcess = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要批量处理的调拨单')
    return
  }
  ElMessage.info(`批量处理 ${selectedRows.value.length} 个调拨单`)
}

// 物流跟踪报告
const trackingReport = () => {
  ElMessage.info('物流跟踪报告功能开发中...')
}

// 导出数据
const exportData = () => {
  ElMessage.info('调拨数据导出功能开发中...')
}

// 查看详情
const viewDetails = (order) => {
  ElMessage.info(`查看调拨单详情: ${order.transfer_no}`)
}

// 确认出库
const confirmShipment = async (order) => {
  try {
    await ElMessageBox.confirm(
      `确定调拨单 "${order.transfer_no}" 已完成出库吗？`,
      '确认出库',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.success('出库确认成功，状态更新为已出库')
    loadTransferData()
  } catch {
    // 用户取消操作
  }
}

// 物流跟踪
const trackLogistics = (order) => {
  currentOrder.value = order
  loadTrackingRecords(order.logistics_no)
  trackingDialogVisible.value = true
}

// 确认入库
const confirmReceive = async (order) => {
  try {
    await ElMessageBox.confirm(
      `确定调拨单 "${order.transfer_no}" 已完成入库吗？`,
      '确认入库',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.success('入库确认成功')
    loadTransferData()
  } catch {
    // 用户取消操作
  }
}

// 编辑订单
const editOrder = (order) => {
  ElMessage.info(`编辑调拨单: ${order.transfer_no}`)
}

// 打印调拨单
const printTransferForm = (order) => {
  ElMessage.info(`打印调拨单: ${order.transfer_no}`)
}

// 设置物流
const setLogistics = (order) => {
  currentOrder.value = order
  Object.assign(logisticsForm, {
    logistics_company: order.logistics_company || '',
    logistics_no: order.logistics_no || '',
    contact_phone: '',
    remark: ''
  })
  logisticsDialogVisible.value = true
}

// 取消订单
const cancelOrder = async (order) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消调拨单 "${order.transfer_no}" 吗？`,
      '取消确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.success('调拨单已取消')
    loadTransferData()
  } catch {
    // 用户取消操作
  }
}

// 加载物流轨迹
const loadTrackingRecords = async (logisticsNo) => {
  try {
    // 模拟API调用
    const mockTracking = [
      {
        time: '2024-01-15 08:00:00',
        location: '主仓库',
        description: '商品已从主仓库发出',
        status: '已发货',
        type: 'primary'
      },
      {
        time: '2024-01-15 10:30:00',
        location: '北京市分拣中心',
        description: '快件到达北京市分拣中心',
        status: '运输中',
        type: 'success'
      },
      {
        time: '2024-01-15 14:20:00',
        location: '朝阳区配送站',
        description: '快件到达朝阳区配送站',
        status: '派送中',
        type: 'warning'
      },
      {
        time: '2024-01-15 16:45:00',
        location: '北京仓库',
        description: '快件已到达目标仓库，等待收货确认',
        status: '待收货',
        type: 'info'
      }
    ]
    
    trackingRecords.value = mockTracking
  } catch (error) {
    ElMessage.error('加载物流轨迹失败')
  }
}

// 刷新轨迹
const refreshTracking = () => {
  if (currentOrder.value) {
    loadTrackingRecords(currentOrder.value.logistics_no)
    ElMessage.success('轨迹信息已刷新')
  }
}

// 保存物流信息
const saveLogistics = async () => {
  try {
    if (!logisticsForm.logistics_company || !logisticsForm.logistics_no) {
      ElMessage.warning('请填写物流公司和物流单号')
      return
    }
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800))
    
    ElMessage.success('物流信息保存成功')
    logisticsDialogVisible.value = false
    loadTransferData()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

// 添加商品
const addProduct = () => {
  // 简化版，直接从可选商品中选择
  if (availableProducts.value.length > 0) {
    createForm.products.push({
      product_id: availableProducts.value[0].id,
      product_code: availableProducts.value[0].code,
      product_name: availableProducts.value[0].name,
      unit: availableProducts.value[0].unit,
      current_stock: availableProducts.value[0].current_stock,
      quantity: 1,
      unit_cost: availableProducts.value[0].cost,
      total_value: availableProducts.value[0].cost,
      remark: ''
    })
  }
}

// 移除商品
const removeProduct = (index) => {
  createForm.products.splice(index, 1)
}

// 计算价值
const calculateValue = (product) => {
  product.total_value = (product.quantity || 0) * (product.unit_cost || 0)
}

// 提交创建
const submitCreate = async () => {
  if (!createFormRef.value) return
  
  try {
    await createFormRef.value.validate()
    
    if (createForm.source_warehouse_id === createForm.target_warehouse_id) {
      ElMessage.warning('源仓库和目标仓库不能相同')
      return
    }
    
    if (createForm.products.length === 0) {
      ElMessage.warning('请添加调拨商品')
      return
    }
    
    creating.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    ElMessage.success('调拨单创建成功')
    createDialogVisible.value = false
    loadTransferData()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('创建失败')
    }
  } finally {
    creating.value = false
  }
}

// 重置表单
const resetCreateForm = () => {
  if (createFormRef.value) {
    createFormRef.value.resetFields()
  }
  Object.assign(createForm, {
    transfer_no: '',
    transfer_type: '',
    priority: 'medium',
    source_warehouse_id: null,
    target_warehouse_id: null,
    expected_date: '',
    logistics_company: '',
    reason: '',
    remark: '',
    products: []
  })
}

const resetTrackingForm = () => {
  trackingRecords.value = []
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
.transfer-outbound-page {
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

.product-details {
  .detail-header {
    margin-bottom: 15px;
  }
  
  .summary-info {
    margin-top: 15px;
    text-align: right;
    color: #303133;
    
    span {
      margin-left: 20px;
    }
  }
}

.tracking-info {
  .tracking-timeline {
    margin-top: 20px;
    
    h3 {
      margin-bottom: 15px;
      color: #303133;
    }
    
    .tracking-content {
      .tracking-location {
        font-weight: 600;
        color: #303133;
        margin-bottom: 5px;
      }
      
      .tracking-description {
        color: #606266;
        margin-bottom: 3px;
      }
      
      .tracking-status {
        color: #909399;
        font-size: 12px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .transfer-outbound-page {
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