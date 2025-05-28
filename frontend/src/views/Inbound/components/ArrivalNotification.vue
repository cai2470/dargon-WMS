<template>
  <div class="arrival-notification">
    <!-- 操作按钮 -->
    <el-card class="action-card">
      <div class="action-header">
        <div>
          <h3>到货通知</h3>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 13px;">新增入库单，创建后自动进入待到货流程</p>
        </div>
        <el-button type="primary" @click="createArrival">
          <el-icon><Plus /></el-icon>
          新增入库单
        </el-button>
      </div>
    </el-card>

    <!-- 筛选区域 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" label-width="80px" :inline="true">
        <el-form-item label="到货通知单号">
          <el-input 
            v-model="filterForm.order_no" 
            placeholder="请输入单号"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="供应商名称">
          <el-input 
            v-model="filterForm.supplier_name" 
            placeholder="请输入供应商名称"
            clearable
            style="width: 120px"
          />
        </el-form-item>
        <el-form-item label="规格名称">
          <el-input 
            v-model="filterForm.spec_name" 
            placeholder="请输入规格名称"
            clearable
            style="width: 120px"
          />
        </el-form-item>
        <el-form-item label="批次">
          <el-input 
            v-model="filterForm.batch_no" 
            placeholder="批次"
            clearable
            style="width: 100px"
          />
        </el-form-item>
        <el-form-item label="预计送达时间">
          <el-date-picker
            v-model="filterForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="负责人名称">
          <el-input 
            v-model="filterForm.operator" 
            placeholder="负责人"
            clearable
            style="width: 100px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchData">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card">
      <el-table :data="tableData" stripe v-loading="loading" size="small">
        <el-table-column type="selection" width="55" />
        <el-table-column label="#" type="index" width="50" />
        <el-table-column prop="order_no" label="入库单号" width="130" />
        <el-table-column prop="batch_no" label="批次" width="80" />
        <el-table-column prop="expected_date" label="预计到货时间" width="130" />
        <el-table-column prop="supplier_name" label="供应商" width="120" />
        <el-table-column prop="operator" label="负责人" width="100" />
        <el-table-column label="状态" width="80">
          <template #default="scope">
            <el-tag size="small" :type="scope.row.status === 'pending' ? 'warning' : 'info'">
              {{ scope.row.status === 'pending' ? '待到货' : '通知中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button 
              size="small" 
              type="primary" 
              @click="editRecord(scope.row)"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteRecord(scope.row)"
            >
              <el-icon><Delete /></el-icon>
              删除
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

    <!-- 新增/编辑到货通知对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="800px"
      @close="resetForm"
    >
      <el-form :model="notificationForm" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商" prop="supplier_id">
              <el-select v-model="notificationForm.supplier_id" placeholder="请选择供应商" style="width: 100%">
                <el-option 
                  v-for="supplier in suppliers" 
                  :key="supplier.id"
                  :label="supplier.name" 
                  :value="supplier.id" 
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目标仓库" prop="warehouse_id">
              <el-select v-model="notificationForm.warehouse_id" placeholder="请选择仓库" style="width: 100%">
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
            <el-form-item label="预计到货时间" prop="expected_date">
              <el-date-picker 
                v-model="notificationForm.expected_date" 
                type="datetime"
                placeholder="选择日期时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人" prop="operator">
              <el-input 
                v-model="notificationForm.operator" 
                placeholder="请输入负责人姓名" 
                style="width: 100%"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="批次号" prop="batch_no">
              <el-input 
                v-model="notificationForm.batch_no" 
                placeholder="请输入批次号" 
                style="width: 100%"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入库类型" prop="inbound_type">
              <el-select v-model="notificationForm.inbound_type" placeholder="请选择类型" style="width: 100%">
                <el-option label="采购入库" value="purchase" />
                <el-option label="退货入库" value="return" />
                <el-option label="调拨入库" value="transfer" />
                <el-option label="其他入库" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="备注">
          <el-input 
            v-model="notificationForm.remark" 
            type="textarea" 
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
        
        <!-- 商品明细 -->
        <el-form-item label="商品明细">
          <div class="product-details">
            <div class="detail-header">
              <el-button size="small" type="primary" @click="addProduct">
                <el-icon><Plus /></el-icon>
                添加商品
              </el-button>
            </div>
            
            <el-table :data="notificationForm.products" border size="small">
              <el-table-column prop="product_code" label="商品编码" width="120" />
              <el-table-column prop="product_name" label="商品名称" min-width="180" />
              <el-table-column prop="unit" label="单位" width="60" />
              <el-table-column label="预计数量" width="140">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.expected_quantity" 
                    :min="1" 
                    size="small"
                    style="width: 100%; min-width: 120px;"
                    controls-position="right"
                    @change="calculateAmount(scope.row)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="单价" width="140">
                <template #default="scope">
                  <el-input-number 
                    v-model="scope.row.unit_price" 
                    :precision="2"
                    :min="0" 
                    size="small"
                    style="width: 100%; min-width: 120px;"
                    controls-position="right"
                    @change="calculateAmount(scope.row)"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="amount" label="金额" width="120" align="right">
                <template #default="scope">
                  ¥{{ scope.row.amount.toFixed(2) }}
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
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveNotification" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 选择商品对话框 -->
    <el-dialog 
      title="选择商品" 
      v-model="productSelectVisible" 
      width="600px"
    >
      <el-table :data="availableProducts" @selection-change="handleProductSelection">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="code" label="编码" width="100" />
        <el-table-column prop="name" label="名称" min-width="160" />
        <el-table-column prop="unit" label="单位" width="60" />
        <el-table-column prop="price" label="参考价格" width="100" align="right">
          <template #default="scope">
            ¥{{ scope.row.price }}
          </template>
        </el-table-column>
      </el-table>
      
      <template #footer>
        <el-button @click="productSelectVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmProductSelection">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getSupplierOptions, getWarehouseOptions } from '@/utils/filterOptions'
import { generateOrderNo, generateId, getStorageData, setStorageData } from '@/utils/storage'

const emit = defineEmits(['refresh'])

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const productSelectVisible = ref(false)
const formRef = ref()
const currentRecord = ref(null)

// 筛选表单
const filterForm = reactive({
  order_no: '',
  supplier_name: '',
  spec_name: '',
  batch_no: '',
  date_range: [],
  operator: ''
})

// 到货通知表单
const notificationForm = reactive({
  supplier_id: null,
  warehouse_id: null,
  expected_date: '',
  operator: '',
  batch_no: '',
  inbound_type: '',
  remark: '',
  products: []
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
const availableProducts = ref([])
const selectedProducts = ref([])

// 对话框标题
const dialogTitle = computed(() => {
  return currentRecord.value ? '编辑到货通知' : '新增到货通知'
})

// 表单验证规则
const rules = {
  supplier_id: [
    { required: true, message: '请选择供应商', trigger: 'change' }
  ],
  warehouse_id: [
    { required: true, message: '请选择目标仓库', trigger: 'change' }
  ],
  operator: [
    { required: true, message: '请输入负责人', trigger: 'blur' }
  ],
  expected_date: [
    { required: true, message: '请选择预计到货时间', trigger: 'change' }
  ],
  batch_no: [
    { required: true, message: '请输入批次号', trigger: 'blur' }
  ],
  inbound_type: [
    { required: true, message: '请选择入库类型', trigger: 'change' }
  ]
}

// 加载基础数据
const loadBasicData = async () => {
  try {
    // 直接从localStorage加载供应商数据
    const suppliersData = getStorageData('suppliers') || []
    suppliers.value = suppliersData.filter(s => s.status === 1).map(s => ({
      id: s.id,
      name: s.name,
      code: s.code || s.supplier_code
    }))
    
    // 如果没有数据，使用默认供应商
    if (suppliers.value.length === 0) {
      suppliers.value = [
        { id: 1, name: '华为技术有限公司', code: 'HUAWEI' },
        { id: 2, name: '小米科技有限责任公司', code: 'XIAOMI' }
      ]
    }
    
    // 直接从localStorage加载仓库数据
    const warehousesData = getStorageData('warehouses') || []
    warehouses.value = warehousesData.filter(w => w.status === 1).map(w => ({
      id: w.id,
      name: w.name,
      code: w.code
    }))
    
    // 如果没有数据，使用默认仓库
    if (warehouses.value.length === 0) {
      warehouses.value = [
        { id: 1, name: '主仓库', code: 'WH001' },
        { id: 2, name: '北京仓库', code: 'WH002' }
      ]
    }
    
    // 加载商品列表
    const productsData = getStorageData('products') || []
    availableProducts.value = productsData.map(p => ({
      id: p.id,
      code: p.code,
      name: p.name,
      unit: p.unit || '台',
      price: parseFloat(p.price || 0)
    }))
    
  } catch (error) {
    ElMessage.error('加载基础数据失败')
    console.error('加载基础数据失败:', error)
  }
}

// 加载到货通知列表
const loadTableData = async () => {
  loading.value = true
  try {
    // 从存储中加载入库单数据
    const orders = getStorageData('inbound_orders') || []
    
    // 这里显示新创建的到货通知记录（实际可以是草稿状态或专门的通知记录）
    // 由于我们现在直接创建为pending状态，这里可以显示所有记录供查看
    let notificationOrders = orders.filter(order => order.status === 'pending' || order.status === 'notified')
    
    // 补充供应商名称
    notificationOrders = notificationOrders.map(order => {
      const supplier = suppliers.value.find(s => s.id === order.supplier_id)
      return {
        ...order,
        supplier_name: supplier ? supplier.name : '未知供应商'
      }
    })
    
    // 应用筛选条件
    if (filterForm.order_no) {
      notificationOrders = notificationOrders.filter(order => 
        order.order_no.toLowerCase().includes(filterForm.order_no.toLowerCase())
      )
    }
    if (filterForm.supplier_name) {
      notificationOrders = notificationOrders.filter(order => 
        order.supplier_name.toLowerCase().includes(filterForm.supplier_name.toLowerCase())
      )
    }
    if (filterForm.batch_no) {
      notificationOrders = notificationOrders.filter(order => 
        order.batch_no && order.batch_no.includes(filterForm.batch_no)
      )
    }
    if (filterForm.operator) {
      notificationOrders = notificationOrders.filter(order => 
        order.operator && order.operator.includes(filterForm.operator)
      )
    }
    
    tableData.value = notificationOrders
    pagination.total = notificationOrders.length
    
  } catch (error) {
    ElMessage.error('加载到货通知列表失败')
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
    supplier_name: '',
    spec_name: '',
    batch_no: '',
    date_range: [],
    operator: ''
  })
  loadTableData()
}

// 新增到货通知
const createArrival = () => {
  currentRecord.value = null
  dialogVisible.value = true
}

// 编辑记录
const editRecord = (record) => {
  currentRecord.value = record
  
  // 填充表单数据
  Object.assign(notificationForm, {
    supplier_id: record.supplier_id,
    warehouse_id: record.warehouse_id,
    expected_date: record.expected_date,
    operator: record.operator,
    batch_no: record.batch_no,
    inbound_type: record.inbound_type,
    remark: record.remark,
    products: record.products || []
  })
  
  dialogVisible.value = true
}

// 删除记录
const deleteRecord = async (record) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除到货通知 "${record.order_no}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 从存储中删除记录
    const orders = getStorageData('inbound_orders') || []
    const filteredOrders = orders.filter(order => order.id !== record.id)
    setStorageData('inbound_orders', filteredOrders)
    
    ElMessage.success('到货通知删除成功')
    loadTableData()
    emit('refresh')
  } catch {
    // 用户取消操作
  }
}

// 添加商品
const addProduct = () => {
  productSelectVisible.value = true
}

// 商品选择变化
const handleProductSelection = (selection) => {
  selectedProducts.value = selection
}

// 确认商品选择
const confirmProductSelection = () => {
  selectedProducts.value.forEach(product => {
    // 检查是否已经添加过
    const exists = notificationForm.products.find(p => p.product_id === product.id)
    if (!exists) {
      notificationForm.products.push({
        product_id: product.id,
        product_code: product.code,
        product_name: product.name,
        unit: product.unit,
        expected_quantity: 1,
        unit_price: product.price,
        amount: product.price
      })
    }
  })
  productSelectVisible.value = false
  selectedProducts.value = []
}

// 移除商品
const removeProduct = (index) => {
  notificationForm.products.splice(index, 1)
}

// 计算金额
const calculateAmount = (product) => {
  product.amount = (product.expected_quantity || 0) * (product.unit_price || 0)
}

// 保存到货通知
const saveNotification = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    if (notificationForm.products.length === 0) {
      ElMessage.warning('请添加商品明细')
      return
    }
    
    saving.value = true
    
    // 获取供应商和仓库名称
    const supplier = suppliers.value.find(s => s.id === notificationForm.supplier_id)
    const warehouse = warehouses.value.find(w => w.id === notificationForm.warehouse_id)
    
    // 构建订单数据
    const orderData = {
      supplier_id: notificationForm.supplier_id,
      supplier_name: supplier ? supplier.name : '',
      warehouse_id: notificationForm.warehouse_id,
      warehouse_name: warehouse ? warehouse.name : '',
      expected_date: notificationForm.expected_date,
      operator: notificationForm.operator,
      batch_no: notificationForm.batch_no,
      inbound_type: notificationForm.inbound_type,
      remark: notificationForm.remark,
      products: notificationForm.products,
      status: 'pending', // 设置为待到货状态，这样新增后会进入到货流程
      created_by: notificationForm.operator,
      total_amount: notificationForm.products.reduce((sum, p) => sum + (p.amount || 0), 0)
    }
    
    const orders = getStorageData('inbound_orders') || []
    
    if (currentRecord.value) {
      // 编辑模式：更新现有记录
      const index = orders.findIndex(order => order.id === currentRecord.value.id)
      if (index !== -1) {
        orders[index] = {
          ...orders[index],
          ...orderData,
          updated_at: new Date().toLocaleString()
        }
      }
      ElMessage.success('到货通知更新成功')
    } else {
      // 新建模式：添加新记录
      const newOrder = {
        id: generateId(),
        order_no: generateOrderNo('ARR'),
        created_at: new Date().toLocaleString(),
        updated_at: new Date().toLocaleString(),
        ...orderData
      }
      orders.unshift(newOrder)
      ElMessage.success(`到货通知 ${newOrder.order_no} 创建成功`)
    }
    
    setStorageData('inbound_orders', orders)
    dialogVisible.value = false
    loadTableData()
    emit('refresh')
  } catch (error) {
    if (error !== false) {
      ElMessage.error('保存失败')
    }
  } finally {
    saving.value = false
  }
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(notificationForm, {
    supplier_id: null,
    warehouse_id: null,
    expected_date: '',
    operator: '',
    batch_no: '',
    inbound_type: '',
    remark: '',
    products: []
  })
  currentRecord.value = null
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
.arrival-notification {
  .action-card, .filter-card, .table-card {
    margin-bottom: 20px;
  }
  
  .action-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
      margin: 0;
      color: #303133;
      font-size: 16px;
      font-weight: 600;
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
  }
}
</style>