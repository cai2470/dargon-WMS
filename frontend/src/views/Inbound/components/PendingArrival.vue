<template>
  <div class="pending-arrival">
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
        <el-form-item label="仓库">
          <el-select 
            v-model="filterForm.warehouse_id" 
            placeholder="请选择仓库"
            clearable
            style="width: 100px"
          >
            <el-option 
              v-for="warehouse in warehouses" 
              :key="warehouse.id"
              :label="warehouse.name" 
              :value="warehouse.id" 
            />
          </el-select>
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
        <el-form-item>
          <el-button type="primary" @click="searchData">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card">
      <div class="table-header">
        <h3>待到货列表</h3>
        <div class="header-actions">
          <el-button type="success" @click="batchConfirmArrival" :disabled="selectedRows.length === 0">
            <el-icon><Check /></el-icon>
            批量确认到货
          </el-button>
        </div>
      </div>
      
      <el-table :data="tableData" stripe v-loading="loading" size="small" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column label="#" type="index" width="50" />
        <el-table-column prop="order_no" label="入库单号" width="130" />
        <el-table-column prop="supplier_name" label="供应商" width="120" />
        <el-table-column prop="warehouse_name" label="目标仓库" width="100" />
        <el-table-column prop="batch_no" label="批次" width="80" />
        <el-table-column prop="expected_date" label="预计送达时间" width="130" />
        <el-table-column prop="total_quantity" label="预计数量" width="100" align="right" />
        <el-table-column prop="total_amount" label="预计金额" width="120" align="right">
          <template #default="scope">
            ¥{{ scope.row.total_amount?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="负责人" width="80" />
        <el-table-column prop="created_at" label="创建时间" width="130" />
        <el-table-column label="状态" width="80">
          <template #default="scope">
            <el-tag type="warning" size="small">待到货</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button 
              size="small" 
              type="primary" 
              @click="confirmArrival(scope.row)"
            >
              确认到货
            </el-button>
            <el-button 
              size="small" 
              type="info" 
              @click="viewDetails(scope.row)"
            >
              查看详情
            </el-button>
            <el-button 
              size="small" 
              type="warning" 
              @click="editOrder(scope.row)"
            >
              编辑
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

    <!-- 确认到货对话框 -->
    <el-dialog 
      title="确认到货" 
      v-model="confirmDialogVisible" 
      width="600px"
    >
      <div v-if="currentOrder">
        <div class="order-info">
          <h4>入库单信息</h4>
          <el-row :gutter="20">
            <el-col :span="8">入库单号：{{ currentOrder.order_no }}</el-col>
            <el-col :span="8">供应商：{{ currentOrder.supplier_name }}</el-col>
            <el-col :span="8">目标仓库：{{ currentOrder.warehouse_name }}</el-col>
          </el-row>
        </div>
        
        <el-form :model="confirmForm" label-width="120px" style="margin-top: 20px;">
          <el-form-item label="实际到货时间">
            <el-date-picker 
              v-model="confirmForm.actual_arrival_time" 
              type="datetime"
              placeholder="选择实际到货时间"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="运输方式">
            <el-select v-model="confirmForm.transport_method" placeholder="请选择运输方式" style="width: 100%">
              <el-option label="陆运" value="land" />
              <el-option label="空运" value="air" />
              <el-option label="海运" value="sea" />
              <el-option label="快递" value="express" />
            </el-select>
          </el-form-item>
          <el-form-item label="车牌号/运单号">
            <el-input 
              v-model="confirmForm.transport_no" 
              placeholder="请输入车牌号或运单号"
            />
          </el-form-item>
          <el-form-item label="司机/配送员">
            <el-input 
              v-model="confirmForm.driver_name" 
              placeholder="请输入司机或配送员姓名"
            />
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input 
              v-model="confirmForm.contact_phone" 
              placeholder="请输入联系电话"
            />
          </el-form-item>
          <el-form-item label="货物状态">
            <el-radio-group v-model="confirmForm.goods_status">
              <el-radio label="normal">正常</el-radio>
              <el-radio label="damaged">有损坏</el-radio>
              <el-radio label="shortage">有短缺</el-radio>
              <el-radio label="other">其他问题</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="备注">
            <el-input 
              v-model="confirmForm.remark" 
              type="textarea" 
              :rows="3"
              placeholder="请输入到货备注"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitConfirmArrival" :loading="confirming">确认到货</el-button>
      </template>
    </el-dialog>

    <!-- 订单详情对话框 -->
    <el-dialog 
      title="入库单详情" 
      v-model="detailDialogVisible" 
      width="800px"
    >
      <div v-if="currentOrder" class="order-detail">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="入库单号">{{ currentOrder.order_no }}</el-descriptions-item>
          <el-descriptions-item label="供应商">{{ currentOrder.supplier_name }}</el-descriptions-item>
          <el-descriptions-item label="目标仓库">{{ currentOrder.warehouse_name }}</el-descriptions-item>
          <el-descriptions-item label="预计到货时间">{{ currentOrder.expected_date }}</el-descriptions-item>
          <el-descriptions-item label="批次号">{{ currentOrder.batch_no }}</el-descriptions-item>
          <el-descriptions-item label="入库类型">{{ getInboundTypeText(currentOrder.inbound_type) }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ currentOrder.operator }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentOrder.created_at }}</el-descriptions-item>
          <el-descriptions-item label="总金额">¥{{ currentOrder.total_amount?.toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="3">{{ currentOrder.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 商品明细 -->
        <div style="margin-top: 20px;">
          <h4>商品明细</h4>
          <el-table :data="currentOrder.products" border size="small">
            <el-table-column prop="product_code" label="商品编码" width="120" />
            <el-table-column prop="product_name" label="商品名称" min-width="180" />
            <el-table-column prop="unit" label="单位" width="60" />
            <el-table-column prop="expected_quantity" label="预计数量" width="100" align="right" />
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
          </el-table>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getSupplierOptions, getWarehouseOptions } from '@/utils/filterOptions'
import { getStorageData, setStorageData } from '@/utils/storage'

const emit = defineEmits(['refresh'])

// 响应式数据
const loading = ref(false)
const confirming = ref(false)
const confirmDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentOrder = ref(null)
const selectedRows = ref([])

// 筛选表单
const filterForm = reactive({
  order_no: '',
  supplier_id: null,
  warehouse_id: null,
  date_range: []
})

// 确认到货表单
const confirmForm = reactive({
  actual_arrival_time: new Date(),
  transport_method: '',
  transport_no: '',
  driver_name: '',
  contact_phone: '',
  goods_status: 'normal',
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
const suppliers = ref([])
const warehouses = ref([])

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

// 加载待到货列表
const loadTableData = async () => {
  loading.value = true
  try {
    // 从存储中加载入库单数据
    const orders = getStorageData('inbound_orders') || []
    
    // 筛选待到货状态的订单
    let pendingOrders = orders.filter(order => order.status === 'pending')
    
    // 补充供应商和仓库名称
    pendingOrders = pendingOrders.map(order => {
      const supplier = suppliers.value.find(s => s.id === order.supplier_id)
      const warehouse = warehouses.value.find(w => w.id === order.warehouse_id)
      return {
        ...order,
        supplier_name: supplier ? supplier.name : '未知供应商',
        warehouse_name: warehouse ? warehouse.name : '未知仓库',
        total_quantity: order.products ? order.products.reduce((sum, p) => sum + (p.expected_quantity || 0), 0) : 0
      }
    })
    
    // 应用筛选条件
    if (filterForm.order_no) {
      pendingOrders = pendingOrders.filter(order => 
        order.order_no.toLowerCase().includes(filterForm.order_no.toLowerCase())
      )
    }
    if (filterForm.supplier_id) {
      pendingOrders = pendingOrders.filter(order => order.supplier_id === filterForm.supplier_id)
    }
    if (filterForm.warehouse_id) {
      pendingOrders = pendingOrders.filter(order => order.warehouse_id === filterForm.warehouse_id)
    }
    
    tableData.value = pendingOrders
    pagination.total = pendingOrders.length
    
  } catch (error) {
    ElMessage.error('加载待到货列表失败')
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
    supplier_id: null,
    warehouse_id: null,
    date_range: []
  })
  loadTableData()
}

// 选择行变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 确认到货
const confirmArrival = (order) => {
  currentOrder.value = order
  confirmDialogVisible.value = true
}

// 批量确认到货
const batchConfirmArrival = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要批量确认 ${selectedRows.value.length} 个入库单到货吗？`,
      '批量确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 批量更新状态为待卸货
    const orders = getStorageData('inbound_orders') || []
    selectedRows.value.forEach(selectedOrder => {
      const index = orders.findIndex(order => order.id === selectedOrder.id)
      if (index !== -1) {
        orders[index] = {
          ...orders[index],
          status: 'unloading',
          actual_arrival_time: new Date().toLocaleString(),
          updated_at: new Date().toLocaleString()
        }
      }
    })
    
    setStorageData('inbound_orders', orders)
    ElMessage.success(`已批量确认 ${selectedRows.value.length} 个入库单到货`)
    loadTableData()
    emit('refresh')
  } catch {
    // 用户取消操作
  }
}

// 提交确认到货
const submitConfirmArrival = async () => {
  try {
    confirming.value = true
    
    // 更新订单状态为待卸货
    const orders = getStorageData('inbound_orders') || []
    const index = orders.findIndex(order => order.id === currentOrder.value.id)
    if (index !== -1) {
      orders[index] = {
        ...orders[index],
        status: 'unloading',
        actual_arrival_time: confirmForm.actual_arrival_time,
        transport_method: confirmForm.transport_method,
        transport_no: confirmForm.transport_no,
        driver_name: confirmForm.driver_name,
        contact_phone: confirmForm.contact_phone,
        goods_status: confirmForm.goods_status,
        arrival_remark: confirmForm.remark,
        updated_at: new Date().toLocaleString()
      }
    }
    
    setStorageData('inbound_orders', orders)
    ElMessage.success(`入库单 ${currentOrder.value.order_no} 已确认到货`)
    confirmDialogVisible.value = false
    loadTableData()
    emit('refresh')
  } catch (error) {
    ElMessage.error('确认到货失败')
  } finally {
    confirming.value = false
  }
}

// 查看详情
const viewDetails = (order) => {
  currentOrder.value = order
  detailDialogVisible.value = true
}

// 编辑订单
const editOrder = (order) => {
  ElMessage.info('编辑功能开发中...')
}

// 获取入库类型文本
const getInboundTypeText = (type) => {
  const typeMap = {
    'purchase': '采购入库',
    'return': '退货入库',
    'transfer': '调拨入库',
    'other': '其他入库'
  }
  return typeMap[type] || '未知'
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
.pending-arrival {
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
  
  .order-detail {
    h4 {
      margin: 0 0 15px 0;
      color: #303133;
      font-size: 14px;
    }
  }
}
</style>