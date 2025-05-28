<template>
  <div class="sales-outbound-page">
    <div class="page-header">
      <h1>销售出库</h1>
      <div class="header-actions">
        <el-button type="primary" @click="createSalesOrder">
          <el-icon><Plus /></el-icon>
          新建销售出库
        </el-button>
        <el-button type="success" @click="batchPick">
          <el-icon><Box /></el-icon>
          批量拣货
        </el-button>
        <el-button type="warning" @click="printLabels">
          <el-icon><Printer /></el-icon>
          打印拣货单
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
        <el-form-item label="销售单号">
          <el-input 
            v-model="filterForm.sales_no" 
            placeholder="请输入销售单号"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        
        <el-form-item label="客户">
          <el-select 
            v-model="filterForm.customer_id" 
            placeholder="请选择客户"
            clearable
            style="width: 150px"
          >
            <el-option 
              v-for="customer in customers" 
              :key="customer.id"
              :label="customer.name" 
              :value="customer.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="订单状态">
          <el-select 
            v-model="filterForm.order_status" 
            placeholder="订单状态"
            clearable
            style="width: 120px"
          >
            <el-option label="待拣货" value="pending" />
            <el-option label="拣货中" value="picking" />
            <el-option label="待复核" value="checking" />
            <el-option label="待出库" value="ready" />
            <el-option label="已出库" value="shipped" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="优先级">
          <el-select 
            v-model="filterForm.priority" 
            placeholder="优先级"
            clearable
            style="width: 100px"
          >
            <el-option label="紧急" value="urgent" />
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="销售渠道">
          <el-select 
            v-model="filterForm.sales_channel" 
            placeholder="销售渠道"
            clearable
            style="width: 120px"
          >
            <el-option label="线上订单" value="online" />
            <el-option label="门店销售" value="store" />
            <el-option label="批发订单" value="wholesale" />
            <el-option label="代销订单" value="consignment" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="下单日期">
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
            <el-icon><ShoppingCart /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">总销售单</div>
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
            <div class="stat-label">待拣货</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card processing">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Box /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.processing }}</div>
            <div class="stat-label">拣货中</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card completed">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Truck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.shipped }}</div>
            <div class="stat-label">已出库</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 销售单列表 -->
    <el-card class="table-card">
      <el-table 
        :data="salesList" 
        stripe 
        v-loading="loading" 
        @selection-change="handleSelectionChange"
        max-height="600"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="sales_no" label="销售单号" width="140" />
        <el-table-column prop="customer_name" label="客户" width="150" />
        <el-table-column prop="sales_channel" label="销售渠道" width="100">
          <template #default="scope">
            <el-tag :type="getChannelColor(scope.row.sales_channel)" size="small">
              {{ getChannelText(scope.row.sales_channel) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="total_quantity" label="销售数量" width="100" align="right" />
        <el-table-column prop="picked_quantity" label="已拣数量" width="100" align="right" />
        <el-table-column prop="shipped_quantity" label="已出库" width="100" align="right" />
        
        <el-table-column prop="total_amount" label="销售金额" width="120" align="right">
          <template #default="scope">
            ¥{{ parseFloat(scope.row.total_amount || 0).toFixed(2) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="order_status" label="订单状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusColor(scope.row.order_status)">
              {{ getStatusText(scope.row.order_status) }}
            </el-tag>
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
        
        <el-table-column prop="order_date" label="下单时间" width="150" />
        <el-table-column prop="required_date" label="要求交期" width="150" />
        <el-table-column prop="created_by" label="销售员" width="100" />
        
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="scope">
            <el-button size="small" type="info" @click="viewDetails(scope.row)">
              详情
            </el-button>
            <el-button 
              v-if="scope.row.order_status === 'pending'" 
              size="small" 
              type="primary" 
              @click="startPicking(scope.row)"
            >
              开始拣货
            </el-button>
            <el-button 
              v-if="scope.row.order_status === 'picking'" 
              size="small" 
              type="warning" 
              @click="continuePickup(scope.row)"
            >
              继续拣货
            </el-button>
            <el-button 
              v-if="scope.row.order_status === 'checking'" 
              size="small" 
              type="success" 
              @click="confirmShipment(scope.row)"
            >
              确认出库
            </el-button>
            <el-dropdown 
              v-if="['pending', 'picking'].includes(scope.row.order_status)"
              trigger="click"
              style="margin-left: 5px"
            >
              <el-button size="small" type="info">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="editOrder(scope.row)">编辑订单</el-dropdown-item>
                  <el-dropdown-item @click="printPickList(scope.row)">打印拣货单</el-dropdown-item>
                  <el-dropdown-item @click="setPriority(scope.row)">设置优先级</el-dropdown-item>
                  <el-dropdown-item divided @click="cancelOrder(scope.row)">取消订单</el-dropdown-item>
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

    <!-- 新建销售出库对话框 -->
    <el-dialog 
      title="新建销售出库" 
      v-model="createDialogVisible" 
      width="900px"
      @close="resetCreateForm"
    >
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="销售单号" prop="sales_no">
              <el-input 
                v-model="createForm.sales_no" 
                placeholder="系统自动生成"
                readonly
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="客户" prop="customer_id">
              <el-select v-model="createForm.customer_id" placeholder="请选择客户" style="width: 100%">
                <el-option 
                  v-for="customer in customers" 
                  :key="customer.id"
                  :label="customer.name" 
                  :value="customer.id" 
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="销售渠道" prop="sales_channel">
              <el-select v-model="createForm.sales_channel" placeholder="选择渠道" style="width: 100%">
                <el-option label="线上订单" value="online" />
                <el-option label="门店销售" value="store" />
                <el-option label="批发订单" value="wholesale" />
                <el-option label="代销订单" value="consignment" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="出库仓库" prop="warehouse_id">
              <el-select v-model="createForm.warehouse_id" placeholder="请选择仓库" style="width: 100%">
                <el-option 
                  v-for="warehouse in warehouses" 
                  :key="warehouse.id"
                  :label="warehouse.name" 
                  :value="warehouse.id" 
                />
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
          <el-col :span="8">
            <el-form-item label="要求交期" prop="required_date">
              <el-date-picker 
                v-model="createForm.required_date" 
                type="datetime"
                placeholder="选择交期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="收货地址" prop="delivery_address">
          <el-input 
            v-model="createForm.delivery_address" 
            type="textarea" 
            :rows="2"
            placeholder="请输入详细的收货地址"
          />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input 
            v-model="createForm.remark" 
            type="textarea" 
            :rows="2"
            placeholder="请输入订单备注信息"
          />
        </el-form-item>
        
        <!-- 销售明细 -->
        <el-form-item label="销售明细">
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
              <el-table-column prop="available_stock" label="可用库存" width="100" align="right" />
              <el-table-column label="销售数量" width="120">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.quantity" 
                    :min="1" 
                    :max="scope.row.available_stock"
                    size="small"
                    style="width: 100%"
                    @change="calculateAmount(scope.row)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="销售单价(¥)" width="130">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.unit_price" 
                    :precision="2"
                    :min="0" 
                    size="small"
                    style="width: 100%"
                    @change="calculateAmount(scope.row)"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="amount" label="小计(¥)" width="120" align="right">
                <template #default="scope">
                  ¥{{ parseFloat(scope.row.amount || 0).toFixed(2) }}
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
              <span><strong>总金额：¥{{ totalAmount.toFixed(2) }}</strong></span>
            </div>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate" :loading="creating">创建销售单</el-button>
      </template>
    </el-dialog>

    <!-- 拣货对话框 -->
    <el-dialog 
      title="商品拣货" 
      v-model="pickingDialogVisible" 
      width="900px"
      @close="resetPickingForm"
    >
      <div v-if="currentOrder" class="picking-info">
        <el-descriptions title="销售单信息" :column="3" border size="small">
          <el-descriptions-item label="销售单号">{{ currentOrder.sales_no }}</el-descriptions-item>
          <el-descriptions-item label="客户">{{ currentOrder.customer_name }}</el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="getPriorityColor(currentOrder.priority)" size="small">
              {{ getPriorityText(currentOrder.priority) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="3">{{ currentOrder.delivery_address || '暂无' }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="picking-products">
          <h3>拣货明细</h3>
          <el-table :data="pickingItems" border size="small" max-height="400">
            <el-table-column prop="product_name" label="商品名称" min-width="200" />
            <el-table-column prop="product_code" label="商品编码" width="120" />
            <el-table-column prop="location" label="货位" width="100" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="order_quantity" label="订单数量" width="100" align="right" />
            <el-table-column prop="picked_quantity" label="已拣数量" width="100" align="right" />
            <el-table-column label="本次拣货" width="120">
              <template #default="scope">
                <el-input-number 
                  v-model="scope.row.current_pick" 
                  :min="0" 
                  :max="scope.row.order_quantity - scope.row.picked_quantity"
                  size="small"
                  style="width: 100%"
                />
              </template>
            </el-table-column>
            <el-table-column label="拣货状态" width="120">
              <template #default="scope">
                <el-tag 
                  :type="scope.row.picked_quantity >= scope.row.order_quantity ? 'success' : 'warning'"
                  size="small"
                >
                  {{ scope.row.picked_quantity >= scope.row.order_quantity ? '已完成' : '未完成' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="备注" width="150">
              <template #default="scope">
                <el-input 
                  v-model="scope.row.remark" 
                  size="small"
                  placeholder="拣货备注"
                />
              </template>
            </el-table-column>
          </el-table>
          
          <div class="picking-summary">
            <el-progress 
              :percentage="pickingProgress" 
              :color="pickingProgress === 100 ? '#67C23A' : '#409EFF'"
            />
            <span class="progress-text">拣货进度：{{ pickingProgress }}%</span>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="pickingDialogVisible = false">取消</el-button>
        <el-button @click="savePicking" :loading="picking">保存进度</el-button>
        <el-button type="primary" @click="completePicking" :loading="picking">完成拣货</el-button>
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
const picking = ref(false)
const createDialogVisible = ref(false)
const pickingDialogVisible = ref(false)
const createFormRef = ref()
const currentOrder = ref(null)
const selectedRows = ref([])

// 筛选表单
const filterForm = reactive({
  sales_no: '',
  customer_id: null,
  order_status: '',
  priority: '',
  sales_channel: '',
  date_range: []
})

// 新建表单
const createForm = reactive({
  sales_no: '',
  customer_id: null,
  sales_channel: '',
  warehouse_id: null,
  priority: 'medium',
  required_date: '',
  delivery_address: '',
  remark: '',
  products: []
})

// 拣货明细
const pickingItems = ref([])

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 基础数据
const customers = ref([])
const warehouses = ref([])
const availableProducts = ref([])
const salesList = ref([])

// 统计数据
const stats = reactive({
  total: 0,
  pending: 0,
  processing: 0,
  shipped: 0
})

// 验证规则
const createRules = {
  customer_id: [
    { required: true, message: '请选择客户', trigger: 'change' }
  ],
  sales_channel: [
    { required: true, message: '请选择销售渠道', trigger: 'change' }
  ],
  warehouse_id: [
    { required: true, message: '请选择出库仓库', trigger: 'change' }
  ],
  required_date: [
    { required: true, message: '请选择要求交期', trigger: 'change' }
  ],
  delivery_address: [
    { required: true, message: '请输入收货地址', trigger: 'blur' }
  ]
}

// 计算属性
const totalQuantity = computed(() => {
  return createForm.products.reduce((sum, item) => sum + (item.quantity || 0), 0)
})

const totalAmount = computed(() => {
  return createForm.products.reduce((sum, item) => sum + (item.amount || 0), 0)
})

const pickingProgress = computed(() => {
  if (pickingItems.value.length === 0) return 0
  const completedItems = pickingItems.value.filter(item => item.picked_quantity >= item.order_quantity).length
  return Math.round((completedItems / pickingItems.value.length) * 100)
})

// 获取渠道颜色
const getChannelColor = (channel) => {
  const colorMap = {
    'online': 'primary',
    'store': 'success',
    'wholesale': 'warning',
    'consignment': 'info'
  }
  return colorMap[channel] || 'info'
}

// 获取渠道文本
const getChannelText = (channel) => {
  const textMap = {
    'online': '线上',
    'store': '门店',
    'wholesale': '批发',
    'consignment': '代销'
  }
  return textMap[channel] || '未知'
}

// 获取状态颜色
const getStatusColor = (status) => {
  const colorMap = {
    'pending': 'warning',
    'picking': 'primary',
    'checking': 'info',
    'ready': 'success',
    'shipped': 'success',
    'cancelled': 'danger'
  }
  return colorMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'pending': '待拣货',
    'picking': '拣货中',
    'checking': '待复核',
    'ready': '待出库',
    'shipped': '已出库',
    'cancelled': '已取消'
  }
  return textMap[status] || '未知'
}

// 获取优先级颜色
const getPriorityColor = (priority) => {
  const colorMap = {
    'urgent': 'danger',
    'high': 'warning',
    'medium': 'primary',
    'low': 'success'
  }
  return colorMap[priority] || 'info'
}

// 获取优先级文本
const getPriorityText = (priority) => {
  const textMap = {
    'urgent': '紧急',
    'high': '高',
    'medium': '中',
    'low': '低'
  }
  return textMap[priority] || '未知'
}

// 生成销售单号
const generateSalesNo = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0')
  return `SO${year}${month}${day}${time}`
}

// 加载基础数据
const loadBasicData = async () => {
  try {
    // 客户列表
    customers.value = [
      { id: 1, name: '北京科技有限公司', level: 'VIP' },
      { id: 2, name: '上海贸易公司', level: 'Gold' },
      { id: 3, name: '深圳电子商务', level: 'Silver' },
      { id: 4, name: '广州批发商', level: 'Bronze' },
      { id: 5, name: '杭州零售商', level: 'Bronze' }
    ]

    // 仓库列表
    warehouses.value = JSON.parse(localStorage.getItem('wms_warehouses') || '[]')
    if (warehouses.value.length === 0) {
      warehouses.value = [
        { id: 1, name: '主仓库', code: 'WH001' },
        { id: 2, name: '北京仓库', code: 'WH002' },
        { id: 3, name: '上海仓库', code: 'WH003' }
      ]
    }

    // 商品列表（含库存）
    const products = JSON.parse(localStorage.getItem('wms_products') || '[]')
    availableProducts.value = products.map(p => ({
      id: p.id,
      code: p.code,
      name: p.name,
      unit: p.unit || '台',
      price: parseFloat(p.price || 0),
      available_stock: Math.floor(Math.random() * 100) + 10 // 模拟库存
    }))
  } catch (error) {
    console.error('加载基础数据失败:', error)
  }
}

// 加载销售单数据
const loadSalesData = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const mockData = [
      {
        id: 1,
        sales_no: 'SO202401150001',
        customer_name: '北京科技有限公司',
        sales_channel: 'online',
        total_quantity: 15,
        picked_quantity: 0,
        shipped_quantity: 0,
        total_amount: 119820.00,
        order_status: 'pending',
        priority: 'urgent',
        order_date: '2024-01-15 10:30:00',
        required_date: '2024-01-16 18:00:00',
        delivery_address: '北京市朝阳区科技园区1号楼',
        created_by: '张三'
      },
      {
        id: 2,
        sales_no: 'SO202401140002',
        customer_name: '上海贸易公司',
        sales_channel: 'wholesale',
        total_quantity: 25,
        picked_quantity: 15,
        shipped_quantity: 0,
        total_amount: 93975.00,
        order_status: 'picking',
        priority: 'high',
        order_date: '2024-01-14 14:20:00',
        required_date: '2024-01-17 12:00:00',
        delivery_address: '上海市浦东新区陆家嘴金融区',
        created_by: '李四'
      },
      {
        id: 3,
        sales_no: 'SO202401130003',
        customer_name: '深圳电子商务',
        sales_channel: 'store',
        total_quantity: 8,
        picked_quantity: 8,
        shipped_quantity: 0,
        total_amount: 55992.00,
        order_status: 'checking',
        priority: 'medium',
        order_date: '2024-01-13 11:45:00',
        required_date: '2024-01-15 15:00:00',
        delivery_address: '深圳市南山区科技园南区',
        created_by: '王五'
      },
      {
        id: 4,
        sales_no: 'SO202401120004',
        customer_name: '广州批发商',
        sales_channel: 'wholesale',
        total_quantity: 30,
        picked_quantity: 30,
        shipped_quantity: 30,
        total_amount: 209970.00,
        order_status: 'shipped',
        priority: 'medium',
        order_date: '2024-01-12 16:15:00',
        required_date: '2024-01-14 10:00:00',
        delivery_address: '广州市天河区珠江新城',
        created_by: '赵六'
      }
    ]
    
    salesList.value = mockData
    pagination.total = mockData.length
    
    // 更新统计数据
    stats.total = mockData.length
    stats.pending = mockData.filter(item => item.order_status === 'pending').length
    stats.processing = mockData.filter(item => ['picking', 'checking', 'ready'].includes(item.order_status)).length
    stats.shipped = mockData.filter(item => item.order_status === 'shipped').length
    
  } catch (error) {
    ElMessage.error('加载销售单数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const searchOrders = () => {
  loadSalesData()
}

// 重置筛选
const resetFilter = () => {
  Object.assign(filterForm, {
    sales_no: '',
    customer_id: null,
    order_status: '',
    priority: '',
    sales_channel: '',
    date_range: []
  })
  loadSalesData()
}

// 新建销售出库
const createSalesOrder = () => {
  createForm.sales_no = generateSalesNo()
  createDialogVisible.value = true
}

// 批量拣货
const batchPick = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要批量拣货的销售单')
    return
  }
  ElMessage.info(`开始批量拣货 ${selectedRows.value.length} 个销售单`)
}

// 打印拣货单
const printLabels = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要打印拣货单的销售单')
    return
  }
  ElMessage.info(`打印 ${selectedRows.value.length} 个拣货单`)
}

// 导出数据
const exportData = () => {
  ElMessage.info('销售数据导出功能开发中...')
}

// 查看详情
const viewDetails = (order) => {
  ElMessage.info(`查看销售单详情: ${order.sales_no}`)
}

// 开始拣货
const startPicking = (order) => {
  currentOrder.value = order
  loadPickingItems(order.id)
  pickingDialogVisible.value = true
}

// 继续拣货
const continuePickup = (order) => {
  startPicking(order)
}

// 确认出库
const confirmShipment = async (order) => {
  try {
    await ElMessageBox.confirm(
      `确定销售单 "${order.sales_no}" 已完成出库吗？`,
      '确认出库',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.success('出库完成')
    loadSalesData()
  } catch {
    // 用户取消操作
  }
}

// 编辑订单
const editOrder = (order) => {
  ElMessage.info(`编辑销售单: ${order.sales_no}`)
}

// 打印拣货单
const printPickList = (order) => {
  ElMessage.info(`打印拣货单: ${order.sales_no}`)
}

// 设置优先级
const setPriority = (order) => {
  ElMessage.info(`设置优先级: ${order.sales_no}`)
}

// 取消订单
const cancelOrder = async (order) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消销售单 "${order.sales_no}" 吗？`,
      '取消确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.success('销售单已取消')
    loadSalesData()
  } catch {
    // 用户取消操作
  }
}

// 加载拣货明细
const loadPickingItems = async (orderId) => {
  try {
    // 模拟API调用
    const mockItems = [
      {
        id: 1,
        product_name: '华为P50 Pro',
        product_code: 'HW001',
        location: 'A01-01-01',
        unit: '台',
        order_quantity: 10,
        picked_quantity: 0,
        current_pick: 0,
        remark: ''
      },
      {
        id: 2,
        product_name: 'iPhone 14 Pro',
        product_code: 'IP001',
        location: 'A01-02-01',
        unit: '台',
        order_quantity: 5,
        picked_quantity: 0,
        current_pick: 0,
        remark: ''
      }
    ]
    
    pickingItems.value = mockItems
  } catch (error) {
    ElMessage.error('加载拣货明细失败')
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
      available_stock: availableProducts.value[0].available_stock,
      quantity: 1,
      unit_price: availableProducts.value[0].price,
      amount: availableProducts.value[0].price,
      remark: ''
    })
  }
}

// 移除商品
const removeProduct = (index) => {
  createForm.products.splice(index, 1)
}

// 计算金额
const calculateAmount = (product) => {
  product.amount = (product.quantity || 0) * (product.unit_price || 0)
}

// 提交创建
const submitCreate = async () => {
  if (!createFormRef.value) return
  
  try {
    await createFormRef.value.validate()
    
    if (createForm.products.length === 0) {
      ElMessage.warning('请添加销售商品')
      return
    }
    
    creating.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    ElMessage.success('销售单创建成功')
    createDialogVisible.value = false
    loadSalesData()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('创建失败')
    }
  } finally {
    creating.value = false
  }
}

// 保存拣货进度
const savePicking = async () => {
  try {
    picking.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800))
    
    ElMessage.success('拣货进度已保存')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    picking.value = false
  }
}

// 完成拣货
const completePicking = async () => {
  try {
    const allCompleted = pickingItems.value.every(item => 
      (item.picked_quantity + (item.current_pick || 0)) >= item.order_quantity
    )
    
    if (!allCompleted) {
      const result = await ElMessageBox.confirm(
        '还有商品未完成拣货，确定要完成拣货吗？',
        '确认完成',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    }
    
    picking.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('拣货完成')
    pickingDialogVisible.value = false
    loadSalesData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('拣货完成失败')
    }
  } finally {
    picking.value = false
  }
}

// 重置表单
const resetCreateForm = () => {
  if (createFormRef.value) {
    createFormRef.value.resetFields()
  }
  Object.assign(createForm, {
    sales_no: '',
    customer_id: null,
    sales_channel: '',
    warehouse_id: null,
    priority: 'medium',
    required_date: '',
    delivery_address: '',
    remark: '',
    products: []
  })
}

const resetPickingForm = () => {
  pickingItems.value = []
  currentOrder.value = null
}

// 表格选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  loadSalesData()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadSalesData()
}

onMounted(() => {
  loadBasicData()
  loadSalesData()
})
</script>

<style lang="scss" scoped>
.sales-outbound-page {
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
    
    &.pending {
      border-left: 4px solid #E6A23C;
      
      .stat-icon {
        background: linear-gradient(45deg, #E6A23C, #EEBE77);
      }
    }
    
    &.processing {
      border-left: 4px solid #909399;
      
      .stat-icon {
        background: linear-gradient(45deg, #909399, #B1B3B8);
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

.picking-info {
  .picking-products {
    margin-top: 20px;
    
    h3 {
      margin-bottom: 15px;
      color: #303133;
    }
    
    .picking-summary {
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
  .sales-outbound-page {
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