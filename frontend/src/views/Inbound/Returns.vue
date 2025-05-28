<template>
  <div class="returns-inbound-page">
    <div class="page-header">
      <h1>退货入库</h1>
      <div class="header-actions">
        <el-button type="primary" @click="createReturnOrder">
          <el-icon><Plus /></el-icon>
          新建退货入库
        </el-button>
        <el-button type="warning" @click="quickReturn">
          <el-icon><RefreshLeft /></el-icon>
          快速退货
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
        <el-form-item label="退货单号">
          <el-input 
            v-model="filterForm.return_no" 
            placeholder="请输入退货单号"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        
        <el-form-item label="客户/供应商">
          <el-select 
            v-model="filterForm.partner_id" 
            placeholder="请选择客户/供应商"
            clearable
            style="width: 150px"
          >
            <el-option 
              v-for="partner in partners" 
              :key="partner.id"
              :label="partner.name" 
              :value="partner.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="退货类型">
          <el-select 
            v-model="filterForm.return_type" 
            placeholder="退货类型"
            clearable
            style="width: 120px"
          >
            <el-option label="客户退货" value="customer" />
            <el-option label="供应商退货" value="supplier" />
            <el-option label="质量问题" value="quality" />
            <el-option label="破损退货" value="damage" />
            <el-option label="过期退货" value="expired" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="处理状态">
          <el-select 
            v-model="filterForm.status" 
            placeholder="处理状态"
            clearable
            style="width: 120px"
          >
            <el-option label="待处理" value="pending" />
            <el-option label="检验中" value="inspecting" />
            <el-option label="已入库" value="stored" />
            <el-option label="已拒收" value="rejected" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="退货日期">
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
            <el-icon><RefreshLeft /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">总退货单</div>
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
      
      <el-card class="stat-card processing">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Search /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.inspecting }}</div>
            <div class="stat-label">检验中</div>
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

    <!-- 退货单列表 -->
    <el-card class="table-card">
      <el-table 
        :data="returnsList" 
        stripe 
        v-loading="loading" 
        max-height="600"
      >
        <el-table-column prop="return_no" label="退货单号" width="140" />
        
        <el-table-column prop="partner_name" label="客户/供应商" width="150" />
        <el-table-column prop="warehouse_name" label="退货仓库" width="120" />
        
        <el-table-column prop="return_type" label="退货类型" width="100">
          <template #default="scope">
            <el-tag :type="getReturnTypeColor(scope.row.return_type)" size="small">
              {{ getReturnTypeText(scope.row.return_type) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="total_quantity" label="退货数量" width="100" align="right" />
        <el-table-column prop="processed_quantity" label="已处理" width="100" align="right" />
        
        <el-table-column prop="total_amount" label="退货金额" width="120" align="right">
          <template #default="scope">
            ¥{{ parseFloat(scope.row.total_amount || 0).toFixed(2) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="处理状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusColor(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="reason" label="退货原因" width="150" show-overflow-tooltip />
        <el-table-column prop="return_date" label="退货日期" width="150" />
        <el-table-column prop="created_by" label="创建人" width="100" />
        
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button size="small" type="info" @click="viewDetails(scope.row)">
              详情
            </el-button>
            <el-button 
              v-if="scope.row.status === 'pending'" 
              size="small" 
              type="primary" 
              @click="startInspection(scope.row)"
            >
              开始检验
            </el-button>
            <el-button 
              v-if="scope.row.status === 'inspecting'" 
              size="small" 
              type="success" 
              @click="completeInspection(scope.row)"
            >
              完成入库
            </el-button>
            <el-button 
              v-if="scope.row.status === 'inspecting'" 
              size="small" 
              type="danger" 
              @click="rejectReturn(scope.row)"
            >
              拒收
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

    <!-- 新建退货入库对话框 -->
    <el-dialog 
      title="新建退货入库" 
      v-model="createDialogVisible" 
      width="800px"
      @close="resetCreateForm"
    >
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="退货单号" prop="return_no">
              <el-input 
                v-model="createForm.return_no" 
                placeholder="系统自动生成"
                readonly
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="退货类型" prop="return_type">
              <el-select v-model="createForm.return_type" placeholder="请选择退货类型" style="width: 100%">
                <el-option label="客户退货" value="customer" />
                <el-option label="供应商退货" value="supplier" />
                <el-option label="质量问题" value="quality" />
                <el-option label="破损退货" value="damage" />
                <el-option label="过期退货" value="expired" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="目标仓库" prop="warehouse_id">
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
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户/供应商" prop="partner_id">
              <el-select v-model="createForm.partner_id" placeholder="请选择客户/供应商" style="width: 100%">
                <el-option 
                  v-for="partner in partners" 
                  :key="partner.id"
                  :label="partner.name" 
                  :value="partner.id" 
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="退货日期" prop="return_date">
              <el-date-picker 
                v-model="createForm.return_date" 
                type="datetime"
                placeholder="选择退货日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="退货原因" prop="reason">
          <el-input 
            v-model="createForm.reason" 
            type="textarea" 
            :rows="3"
            placeholder="请详细描述退货原因"
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
        
        <!-- 退货明细 -->
        <el-form-item label="退货明细">
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
              <el-table-column label="退货数量" width="120">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.quantity" 
                    :min="1" 
                    size="small"
                    style="width: 100%"
                    @change="calculateAmount(scope.row)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="单价(¥)" width="120">
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
              <el-table-column prop="amount" label="金额(¥)" width="120" align="right">
                <template #default="scope">
                  ¥{{ parseFloat(scope.row.amount || 0).toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column label="商品状态" width="120">
                <template #default="scope">
                  <el-select v-model="scope.row.condition" size="small" style="width: 100%">
                    <el-option label="完好" value="good" />
                    <el-option label="轻微损坏" value="slightly_damaged" />
                    <el-option label="严重损坏" value="severely_damaged" />
                    <el-option label="过期" value="expired" />
                  </el-select>
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
        <el-button type="primary" @click="submitCreate" :loading="creating">创建退货单</el-button>
      </template>
    </el-dialog>

    <!-- 退货检验对话框 -->
    <el-dialog 
      title="退货检验" 
      v-model="inspectionDialogVisible" 
      width="800px"
      @close="resetInspectionForm"
    >
      <div v-if="currentOrder" class="inspection-info">
        <el-descriptions title="退货单信息" :column="3" border size="small">
          <el-descriptions-item label="退货单号">{{ currentOrder.return_no }}</el-descriptions-item>
          <el-descriptions-item label="客户/供应商">{{ currentOrder.partner_name }}</el-descriptions-item>
          <el-descriptions-item label="退货类型">{{ getReturnTypeText(currentOrder.return_type) }}</el-descriptions-item>
          <el-descriptions-item label="退货原因" :span="3">{{ currentOrder.reason }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="inspection-products">
          <h3>检验明细</h3>
          <el-table :data="inspectionItems" border size="small" max-height="300">
            <el-table-column prop="product_name" label="商品名称" min-width="200" />
            <el-table-column prop="product_code" label="商品编码" width="120" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="return_quantity" label="退货数量" width="100" align="right" />
            <el-table-column label="实际数量" width="120">
              <template #default="scope">
                <el-input-number 
                  v-model="scope.row.actual_quantity" 
                  :min="0" 
                  :max="scope.row.return_quantity"
                  size="small"
                  style="width: 100%"
                />
              </template>
            </el-table-column>
            <el-table-column label="检验结果" width="120">
              <template #default="scope">
                <el-select v-model="scope.row.inspection_result" size="small" style="width: 100%">
                  <el-option label="合格入库" value="qualified" />
                  <el-option label="降级入库" value="downgrade" />
                  <el-option label="报废处理" value="scrap" />
                  <el-option label="退回客户" value="return" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="处理说明" width="150">
              <template #default="scope">
                <el-input 
                  v-model="scope.row.remark" 
                  size="small"
                  placeholder="处理说明"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="inspectionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmInspection" :loading="inspecting">确认检验</el-button>
      </template>
    </el-dialog>

    <!-- 快速退货对话框 -->
    <el-dialog 
      title="快速退货" 
      v-model="quickReturnDialogVisible" 
      width="600px"
    >
      <el-form :model="quickReturnForm" label-width="100px">
        <el-form-item label="商品编码/名称">
          <el-input 
            v-model="quickReturnForm.product_search" 
            placeholder="输入商品编码或名称搜索"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="退货数量">
          <el-input-number 
            v-model="quickReturnForm.quantity" 
            :min="1" 
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="退货原因">
          <el-select v-model="quickReturnForm.reason" style="width: 100%">
            <el-option label="质量问题" value="quality" />
            <el-option label="规格不符" value="spec_mismatch" />
            <el-option label="客户要求" value="customer_request" />
            <el-option label="包装破损" value="package_damage" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="处理方式">
          <el-radio-group v-model="quickReturnForm.action">
            <el-radio label="immediate_storage">立即入库</el-radio>
            <el-radio label="need_inspection">需要检验</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="quickReturnDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitQuickReturn">确认退货</el-button>
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
const inspecting = ref(false)
const createDialogVisible = ref(false)
const inspectionDialogVisible = ref(false)
const quickReturnDialogVisible = ref(false)
const createFormRef = ref()
const currentOrder = ref(null)

// 筛选表单
const filterForm = reactive({
  return_no: '',
  partner_id: null,
  return_type: '',
  status: '',
  date_range: []
})

// 新建表单
const createForm = reactive({
  return_no: '',
  return_type: '',
  warehouse_id: null,
  partner_id: null,
  return_date: '',
  reason: '',
  remark: '',
  products: []
})

// 快速退货表单
const quickReturnForm = reactive({
  product_search: '',
  quantity: 1,
  reason: '',
  action: 'immediate_storage'
})

// 检验明细
const inspectionItems = ref([])

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 基础数据
const partners = ref([])
const warehouses = ref([])
const availableProducts = ref([])
const returnsList = ref([])

// 统计数据
const stats = reactive({
  total: 0,
  pending: 0,
  inspecting: 0,
  completed: 0
})

// 验证规则
const createRules = {
  return_type: [
    { required: true, message: '请选择退货类型', trigger: 'change' }
  ],
  warehouse_id: [
    { required: true, message: '请选择目标仓库', trigger: 'change' }
  ],
  partner_id: [
    { required: true, message: '请选择客户/供应商', trigger: 'change' }
  ],
  return_date: [
    { required: true, message: '请选择退货日期', trigger: 'change' }
  ],
  reason: [
    { required: true, message: '请输入退货原因', trigger: 'blur' }
  ]
}

// 计算属性
const totalQuantity = computed(() => {
  return createForm.products.reduce((sum, item) => sum + (item.quantity || 0), 0)
})

const totalAmount = computed(() => {
  return createForm.products.reduce((sum, item) => sum + (item.amount || 0), 0)
})

// 获取退货类型颜色
const getReturnTypeColor = (type) => {
  const colorMap = {
    'customer': 'primary',
    'supplier': 'success',
    'quality': 'warning',
    'damage': 'danger',
    'expired': 'info'
  }
  return colorMap[type] || 'info'
}

// 获取退货类型文本
const getReturnTypeText = (type) => {
  const textMap = {
    'customer': '客户退货',
    'supplier': '供应商退货',
    'quality': '质量问题',
    'damage': '破损退货',
    'expired': '过期退货'
  }
  return textMap[type] || '未知'
}

// 获取状态颜色
const getStatusColor = (status) => {
  const colorMap = {
    'pending': 'warning',
    'inspecting': 'primary',
    'stored': 'success',
    'rejected': 'danger'
  }
  return colorMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'pending': '待处理',
    'inspecting': '检验中',
    'stored': '已入库',
    'rejected': '已拒收'
  }
  return textMap[status] || '未知'
}

// 生成退货单号
const generateReturnNo = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0')
  return `RT${year}${month}${day}${time}`
}

// 加载基础数据
const loadBasicData = async () => {
  try {
    // 从localStorage加载客户/供应商列表
    const storedSuppliers = localStorage.getItem('wms_suppliers')
    let suppliersList = []
    if (storedSuppliers) {
      const allSuppliers = JSON.parse(storedSuppliers)
      suppliersList = allSuppliers.filter(s => s.status === 1).map(s => ({ 
        ...s, 
        type: 'supplier' 
      }))
    }
    
    const customers = [
      { id: 101, name: '北京科技有限公司', type: 'customer' },
      { id: 102, name: '上海贸易公司', type: 'customer' },
      { id: 103, name: '深圳电子商务', type: 'customer' },
      { id: 104, name: '广州批发商', type: 'customer' }
    ]
    
    partners.value = [...suppliersList, ...customers]

    // 从localStorage加载仓库列表
    const storedWarehouses = localStorage.getItem('wms_warehouses')
    if (storedWarehouses) {
      warehouses.value = JSON.parse(storedWarehouses)
    } else {
      warehouses.value = [
        { id: 1, name: '主仓库', code: 'WH001' },
        { id: 2, name: '北京仓库', code: 'WH002' },
        { id: 3, name: '上海仓库', code: 'WH003' }
      ]
    }

    // 从localStorage加载商品列表
    const storedProducts = localStorage.getItem('wms_products')
    if (storedProducts) {
      const products = JSON.parse(storedProducts)
    availableProducts.value = products.map(p => ({
      id: p.id,
      code: p.code,
      name: p.name,
      unit: p.unit || '台',
      price: parseFloat(p.price || 0)
    }))
    } else {
      availableProducts.value = [
        { id: 1, code: 'HW001', name: '华为P50 Pro', unit: '台', price: 999.99 },
        { id: 2, code: 'MI001', name: '小米12 Pro', unit: '台', price: 699.99 },
        { id: 3, code: 'IP001', name: 'iPhone 14 Pro', unit: '台', price: 1199.99 },
        { id: 4, code: 'LP001', name: 'ThinkPad X1 Carbon', unit: '台', price: 1899.99 },
        { id: 5, code: 'AC001', name: '美的空调', unit: '台', price: 449.99 }
      ]
    }
  } catch (error) {
    console.error('加载基础数据失败:', error)
  }
}

// 加载退货单数据
const loadReturnsData = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const mockData = [
      {
        id: 1,
        return_no: 'RT202401150001',
        partner_name: '北京科技有限公司',
        warehouse_name: '主仓库',
        return_type: 'customer',
        total_quantity: 5,
        processed_quantity: 0,
        total_amount: 34940.00,
        status: 'pending',
        reason: '客户要求退货，产品不符合需求',
        return_date: '2024-01-15 10:30:00',
        created_by: '张三'
      },
      {
        id: 2,
        return_no: 'RT202401140002',
        partner_name: '上海贸易公司',
        warehouse_name: '上海仓库',
        return_type: 'quality',
        total_quantity: 3,
        processed_quantity: 3,
        total_amount: 14097.00,
        status: 'inspecting',
        reason: '产品质量存在问题，包装破损',
        return_date: '2024-01-14 14:20:00',
        created_by: '李四'
      },
      {
        id: 3,
        return_no: 'RT202401130003',
        partner_name: '华为供应商',
        warehouse_name: '主仓库',
        return_type: 'supplier',
        total_quantity: 10,
        processed_quantity: 10,
        total_amount: 69880.00,
        status: 'stored',
        reason: '供应商召回产品，版本升级',
        return_date: '2024-01-13 11:45:00',
        created_by: '王五'
      },
      {
        id: 4,
        return_no: 'RT202401120004',
        partner_name: '深圳电子商务',
        warehouse_name: '主仓库',
        return_type: 'expired',
        total_quantity: 2,
        processed_quantity: 0,
        total_amount: 0.00,
        status: 'rejected',
        reason: '产品已过保质期，无法销售',
        return_date: '2024-01-12 16:15:00',
        created_by: '赵六'
      }
    ]
    
    returnsList.value = mockData
    pagination.total = mockData.length
    
    // 更新统计数据
    stats.total = mockData.length
    stats.pending = mockData.filter(item => item.status === 'pending').length
    stats.inspecting = mockData.filter(item => item.status === 'inspecting').length
    stats.completed = mockData.filter(item => item.status === 'stored').length
    
  } catch (error) {
    ElMessage.error('加载退货单数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const searchOrders = () => {
  loadReturnsData()
}

// 重置筛选
const resetFilter = () => {
  Object.assign(filterForm, {
    return_no: '',
    partner_id: null,
    return_type: '',
    status: '',
    date_range: []
  })
  loadReturnsData()
}

// 新建退货入库
const createReturnOrder = () => {
  createForm.return_no = generateReturnNo()
  createDialogVisible.value = true
}

// 快速退货
const quickReturn = () => {
  quickReturnDialogVisible.value = true
}

// 导出数据
const exportData = () => {
  ElMessage.info('退货数据导出功能开发中...')
}

// 查看详情
const viewDetails = (order) => {
  ElMessage.info(`查看退货单详情: ${order.return_no}`)
}

// 开始检验
const startInspection = (order) => {
  currentOrder.value = order
  loadInspectionItems(order.id)
  inspectionDialogVisible.value = true
}

// 完成入库
const completeInspection = async (order) => {
  try {
    await ElMessageBox.confirm(
      `确定完成退货单 "${order.return_no}" 的入库操作吗？`,
      '完成入库',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.success('退货入库完成')
    loadReturnsData()
  } catch {
    // 用户取消操作
  }
}

// 拒收退货
const rejectReturn = async (order) => {
  try {
    await ElMessageBox.confirm(
      `确定拒收退货单 "${order.return_no}" 吗？`,
      '拒收确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.success('退货已拒收')
    loadReturnsData()
  } catch {
    // 用户取消操作
  }
}

// 加载检验明细
const loadInspectionItems = async (orderId) => {
  try {
    // 模拟API调用
    const mockItems = [
      {
        id: 1,
        product_name: '华为P50 Pro',
        product_code: 'HW001',
        unit: '台',
        return_quantity: 3,
        actual_quantity: 3,
        inspection_result: 'qualified',
        remark: ''
      }
    ]
    
    inspectionItems.value = mockItems
  } catch (error) {
    ElMessage.error('加载检验明细失败')
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
      quantity: 1,
      unit_price: availableProducts.value[0].price,
      amount: availableProducts.value[0].price,
      condition: 'good'
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
      ElMessage.warning('请添加退货商品')
      return
    }
    
    creating.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    ElMessage.success('退货单创建成功')
    createDialogVisible.value = false
    loadReturnsData()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('创建失败')
    }
  } finally {
    creating.value = false
  }
}

// 确认检验
const confirmInspection = async () => {
  try {
    const totalProcessed = inspectionItems.value.reduce((sum, item) => sum + (item.actual_quantity || 0), 0)
    if (totalProcessed === 0) {
      ElMessage.warning('请输入实际数量')
      return
    }
    
    inspecting.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('检验完成')
    inspectionDialogVisible.value = false
    loadReturnsData()
  } catch (error) {
    ElMessage.error('检验失败')
  } finally {
    inspecting.value = false
  }
}

// 提交快速退货
const submitQuickReturn = async () => {
  try {
    if (!quickReturnForm.product_search || !quickReturnForm.reason) {
      ElMessage.warning('请填写完整信息')
      return
    }
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800))
    
    ElMessage.success('快速退货处理完成')
    quickReturnDialogVisible.value = false
    
    // 重置表单
    Object.assign(quickReturnForm, {
      product_search: '',
      quantity: 1,
      reason: '',
      action: 'immediate_storage'
    })
    
    loadReturnsData()
  } catch (error) {
    ElMessage.error('快速退货处理失败')
  }
}

// 重置表单
const resetCreateForm = () => {
  if (createFormRef.value) {
    createFormRef.value.resetFields()
  }
  Object.assign(createForm, {
    return_no: '',
    return_type: '',
    warehouse_id: null,
    partner_id: null,
    return_date: '',
    reason: '',
    remark: '',
    products: []
  })
}

const resetInspectionForm = () => {
  inspectionItems.value = []
  currentOrder.value = null
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  loadReturnsData()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadReturnsData()
}

onMounted(() => {
  loadBasicData()
  loadReturnsData()
})
</script>

<style lang="scss" scoped>
.returns-inbound-page {
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
      border-left: 4px solid #F56C6C;
      
      .stat-icon {
        background: linear-gradient(45deg, #F56C6C, #F78989);
      }
    }
    
    &.pending {
      border-left: 4px solid #E6A23C;
      
      .stat-icon {
        background: linear-gradient(45deg, #E6A23C, #EEBE77);
      }
    }
    
    &.processing {
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

.inspection-info {
  .inspection-products {
    margin-top: 20px;
    
    h3 {
      margin-bottom: 15px;
      color: #303133;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .returns-inbound-page {
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