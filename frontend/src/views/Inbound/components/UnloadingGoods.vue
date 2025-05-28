<template>
  <div class="unloading-goods">
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
        <el-form-item label="车牌号">
          <el-input 
            v-model="filterForm.transport_no" 
            placeholder="车牌号/运单号"
            clearable
            style="width: 120px"
          />
        </el-form-item>
        <el-form-item label="到货时间">
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
        <h3>待卸货列表</h3>
        <div class="header-actions">
          <el-button type="success" @click="batchStartUnloading" :disabled="selectedRows.length === 0">
            <el-icon><Box /></el-icon>
            批量开始卸货
          </el-button>
        </div>
      </div>
      
      <el-table :data="tableData" stripe v-loading="loading" size="small" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column label="#" type="index" width="50" />
        <el-table-column prop="order_no" label="入库单号" width="130" />
        <el-table-column prop="supplier_name" label="供应商" width="120" />
        <el-table-column prop="transport_method" label="运输方式" width="80">
          <template #default="scope">
            <el-tag size="small" :type="getTransportTypeColor(scope.row.transport_method)">
              {{ getTransportMethodText(scope.row.transport_method) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="transport_no" label="车牌号/运单号" width="120" />
        <el-table-column prop="driver_name" label="司机/配送员" width="100" />
        <el-table-column prop="contact_phone" label="联系电话" width="110" />
        <el-table-column prop="actual_arrival_time" label="实际到货时间" width="130" />
        <el-table-column prop="goods_status" label="货物状态" width="100">
          <template #default="scope">
            <el-tag size="small" :type="getGoodsStatusColor(scope.row.goods_status)">
              {{ getGoodsStatusText(scope.row.goods_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_quantity" label="预计数量" width="100" align="right" />
        <el-table-column label="状态" width="80">
          <template #default="scope">
            <el-tag type="primary" size="small">待卸货</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button 
              size="small" 
              type="primary" 
              @click="startUnloading(scope.row)"
            >
              开始卸货
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
              @click="reportProblem(scope.row)"
            >
              问题上报
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

    <!-- 开始卸货对话框 -->
    <el-dialog 
      title="开始卸货" 
      v-model="unloadingDialogVisible" 
      width="700px"
    >
      <div v-if="currentOrder">
        <div class="order-info">
          <h4>入库单信息</h4>
          <el-row :gutter="20">
            <el-col :span="8">入库单号：{{ currentOrder.order_no }}</el-col>
            <el-col :span="8">供应商：{{ currentOrder.supplier_name }}</el-col>
            <el-col :span="8">车牌号：{{ currentOrder.transport_no }}</el-col>
          </el-row>
        </div>
        
        <el-form :model="unloadingForm" label-width="120px" style="margin-top: 20px;">
          <el-form-item label="卸货人员">
            <el-select 
              v-model="unloadingForm.unloading_staff" 
              multiple 
              placeholder="请选择卸货人员" 
              style="width: 100%"
              filterable
            >
              <el-option 
                v-for="staff in staffList" 
                :key="staff.id"
                :label="`${staff.name} (${staff.staff_no}) - ${getDepartmentText(staff.department)}`" 
                :value="staff.id"
              >
                <span style="float: left">{{ staff.name }} ({{ staff.staff_no }})</span>
                <span style="float: right; color: #8492a6; font-size: 12px">
                  {{ getPositionText(staff.position) }}
                </span>
              </el-option>
            </el-select>
            <div style="margin-top: 5px; font-size: 12px; color: #999;">
              当前可选卸货人员 {{ staffList.length }} 人
            </div>
          </el-form-item>
          <el-form-item label="卸货区域">
            <el-select v-model="unloadingForm.unloading_zone" placeholder="请选择卸货区域" style="width: 100%">
              <el-option 
                v-for="zone in unloadingZones" 
                :key="zone.id"
                :label="zone.name" 
                :value="zone.id" 
              />
            </el-select>
          </el-form-item>
          <el-form-item label="预计卸货时间">
            <el-input-number 
              v-model="unloadingForm.estimated_time" 
              :min="0.5" 
              :step="0.5"
              placeholder="小时"
              style="width: 100%"
            />
            <span style="margin-left: 8px; color: #666;">小时</span>
          </el-form-item>
          <el-form-item label="特殊要求">
            <el-checkbox-group v-model="unloadingForm.special_requirements">
              <el-checkbox label="fragile">易碎品</el-checkbox>
              <el-checkbox label="hazardous">危险品</el-checkbox>
              <el-checkbox label="refrigerated">需冷藏</el-checkbox>
              <el-checkbox label="valuable">贵重物品</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="卸货工具">
            <el-checkbox-group v-model="unloadingForm.tools_needed">
              <el-checkbox label="forklift">叉车</el-checkbox>
              <el-checkbox label="cart">推车</el-checkbox>
              <el-checkbox label="crane">吊车</el-checkbox>
              <el-checkbox label="manual">人工</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="备注">
            <el-input 
              v-model="unloadingForm.remark" 
              type="textarea" 
              :rows="3"
              placeholder="请输入卸货备注"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="unloadingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStartUnloading" :loading="unloading">开始卸货</el-button>
      </template>
    </el-dialog>

    <!-- 问题上报对话框 -->
    <el-dialog 
      title="问题上报" 
      v-model="problemDialogVisible" 
      width="600px"
    >
      <div v-if="currentOrder">
        <div class="order-info">
          <h4>入库单信息</h4>
          <p>入库单号：{{ currentOrder.order_no }} | 供应商：{{ currentOrder.supplier_name }}</p>
        </div>
        
        <el-form :model="problemForm" label-width="100px" style="margin-top: 20px;">
          <el-form-item label="问题类型" required>
            <el-select v-model="problemForm.problem_type" placeholder="请选择问题类型" style="width: 100%">
              <el-option label="货物损坏" value="damaged" />
              <el-option label="数量不符" value="quantity_mismatch" />
              <el-option label="品质问题" value="quality_issue" />
              <el-option label="包装问题" value="packaging_issue" />
              <el-option label="运输延误" value="transport_delay" />
              <el-option label="其他问题" value="other" />
            </el-select>
          </el-form-item>
          <el-form-item label="问题描述" required>
            <el-input 
              v-model="problemForm.description" 
              type="textarea" 
              :rows="4"
              placeholder="请详细描述遇到的问题"
            />
          </el-form-item>
          <el-form-item label="紧急程度">
            <el-radio-group v-model="problemForm.urgency">
              <el-radio label="low">一般</el-radio>
              <el-radio label="medium">紧急</el-radio>
              <el-radio label="high">非常紧急</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="上报人">
            <el-input 
              v-model="problemForm.reporter" 
              placeholder="请输入上报人姓名"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="problemDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="submitProblemReport" :loading="reporting">提交上报</el-button>
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
          <el-descriptions-item label="运输方式">{{ getTransportMethodText(currentOrder.transport_method) }}</el-descriptions-item>
          <el-descriptions-item label="车牌号/运单号">{{ currentOrder.transport_no }}</el-descriptions-item>
          <el-descriptions-item label="司机/配送员">{{ currentOrder.driver_name }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentOrder.contact_phone }}</el-descriptions-item>
          <el-descriptions-item label="实际到货时间">{{ currentOrder.actual_arrival_time }}</el-descriptions-item>
          <el-descriptions-item label="货物状态">{{ getGoodsStatusText(currentOrder.goods_status) }}</el-descriptions-item>
          <el-descriptions-item label="到货备注" :span="3">{{ currentOrder.arrival_remark || '-' }}</el-descriptions-item>
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
import { getSupplierOptions } from '@/utils/filterOptions'
import { getStorageData, setStorageData } from '@/utils/storage'

const emit = defineEmits(['refresh'])

// 响应式数据
const loading = ref(false)
const unloading = ref(false)
const reporting = ref(false)
const unloadingDialogVisible = ref(false)
const problemDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentOrder = ref(null)
const selectedRows = ref([])

// 筛选表单
const filterForm = reactive({
  order_no: '',
  supplier_id: null,
  transport_no: '',
  date_range: []
})

// 卸货表单
const unloadingForm = reactive({
  unloading_staff: [],
  unloading_zone: '',
  estimated_time: 2,
  special_requirements: [],
  tools_needed: [],
  remark: ''
})

// 问题上报表单
const problemForm = reactive({
  problem_type: '',
  description: '',
  urgency: 'medium',
  reporter: ''
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
const staffList = ref([])
const unloadingZones = ref([])

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
    
    // 从员工管理系统加载员工列表，筛选出卸货人员
    const staffData = JSON.parse(localStorage.getItem('wms_staff') || '[]')
    staffList.value = staffData
      .filter(staff => 
        staff.status === 'active' && 
        (staff.position === 'unloader' || 
         staff.position === 'warehouse_manager' ||
         staff.roles.includes('operator'))
      )
      .map(staff => ({
        id: staff.id,
        name: staff.name,
        staff_no: staff.staff_no,
        department: staff.department,
        position: staff.position,
        phone: staff.phone
      }))
    
    console.log('加载卸货人员:', staffList.value.length, '人')
    
    // 加载卸货区域
    unloadingZones.value = [
      { id: 1, name: '卸货区A' },
      { id: 2, name: '卸货区B' },
      { id: 3, name: '卸货区C' },
      { id: 4, name: '临时卸货区' }
    ]
    
  } catch (error) {
    ElMessage.error('加载基础数据失败')
    console.error('加载基础数据失败:', error)
  }
}

// 加载待卸货列表
const loadTableData = async () => {
  loading.value = true
  try {
    // 从存储中加载入库单数据
    const orders = getStorageData('inbound_orders') || []
    
    // 筛选待卸货状态的订单
    let unloadingOrders = orders.filter(order => order.status === 'unloading')
    
    // 补充供应商名称
    unloadingOrders = unloadingOrders.map(order => {
      const supplier = suppliers.value.find(s => s.id === order.supplier_id)
      return {
        ...order,
        supplier_name: supplier ? supplier.name : '未知供应商',
        total_quantity: order.products ? order.products.reduce((sum, p) => sum + (p.expected_quantity || 0), 0) : 0
      }
    })
    
    // 应用筛选条件
    if (filterForm.order_no) {
      unloadingOrders = unloadingOrders.filter(order => 
        order.order_no.toLowerCase().includes(filterForm.order_no.toLowerCase())
      )
    }
    if (filterForm.supplier_id) {
      unloadingOrders = unloadingOrders.filter(order => order.supplier_id === filterForm.supplier_id)
    }
    if (filterForm.transport_no) {
      unloadingOrders = unloadingOrders.filter(order => 
        order.transport_no && order.transport_no.includes(filterForm.transport_no)
      )
    }
    
    tableData.value = unloadingOrders
    pagination.total = unloadingOrders.length
    
  } catch (error) {
    ElMessage.error('加载待卸货列表失败')
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
    transport_no: '',
    date_range: []
  })
  loadTableData()
}

// 选择行变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 开始卸货
const startUnloading = (order) => {
  currentOrder.value = order
  unloadingDialogVisible.value = true
}

// 批量开始卸货
const batchStartUnloading = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要批量开始卸货 ${selectedRows.value.length} 个入库单吗？`,
      '批量操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 批量更新状态为待分拣
    const orders = getStorageData('inbound_orders') || []
    selectedRows.value.forEach(selectedOrder => {
      const index = orders.findIndex(order => order.id === selectedOrder.id)
      if (index !== -1) {
        orders[index] = {
          ...orders[index],
          status: 'sorting',
          unloading_start_time: new Date().toLocaleString(),
          updated_at: new Date().toLocaleString()
        }
      }
    })
    
    setStorageData('inbound_orders', orders)
    ElMessage.success(`已批量开始卸货 ${selectedRows.value.length} 个入库单`)
    loadTableData()
    emit('refresh')
  } catch {
    // 用户取消操作
  }
}

// 提交开始卸货
const submitStartUnloading = async () => {
  try {
    unloading.value = true
    
    // 更新订单状态为待分拣
    const orders = getStorageData('inbound_orders') || []
    const index = orders.findIndex(order => order.id === currentOrder.value.id)
    if (index !== -1) {
      orders[index] = {
        ...orders[index],
        status: 'sorting',
        unloading_staff: unloadingForm.unloading_staff,
        unloading_zone: unloadingForm.unloading_zone,
        estimated_unloading_time: unloadingForm.estimated_time,
        special_requirements: unloadingForm.special_requirements,
        tools_needed: unloadingForm.tools_needed,
        unloading_remark: unloadingForm.remark,
        unloading_start_time: new Date().toLocaleString(),
        updated_at: new Date().toLocaleString()
      }
    }
    
    setStorageData('inbound_orders', orders)
    ElMessage.success(`入库单 ${currentOrder.value.order_no} 已开始卸货`)
    unloadingDialogVisible.value = false
    loadTableData()
    emit('refresh')
  } catch (error) {
    ElMessage.error('开始卸货失败')
  } finally {
    unloading.value = false
  }
}

// 问题上报
const reportProblem = (order) => {
  currentOrder.value = order
  problemDialogVisible.value = true
}

// 提交问题上报
const submitProblemReport = async () => {
  try {
    if (!problemForm.problem_type || !problemForm.description) {
      ElMessage.warning('请填写完整的问题信息')
      return
    }
    
    reporting.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 这里可以保存问题报告到存储或发送到后端
    
    ElMessage.success('问题上报成功，相关人员将及时处理')
    problemDialogVisible.value = false
    
    // 重置表单
    Object.assign(problemForm, {
      problem_type: '',
      description: '',
      urgency: 'medium',
      reporter: ''
    })
  } catch (error) {
    ElMessage.error('问题上报失败')
  } finally {
    reporting.value = false
  }
}

// 查看详情
const viewDetails = (order) => {
  currentOrder.value = order
  detailDialogVisible.value = true
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

// 获取运输方式颜色
const getTransportTypeColor = (method) => {
  const colorMap = {
    'land': 'primary',
    'air': 'warning',
    'sea': 'info',
    'express': 'success'
  }
  return colorMap[method] || 'default'
}

// 获取货物状态文本
const getGoodsStatusText = (status) => {
  const statusMap = {
    'normal': '正常',
    'damaged': '破损',
    'incomplete': '不完整',
    'contaminated': '污染'
  }
  return statusMap[status] || '未知'
}

// 获取货物状态颜色
const getGoodsStatusColor = (status) => {
  const colorMap = {
    'normal': 'success',
    'damaged': 'danger',
    'shortage': 'warning',
    'other': 'info'
  }
  return colorMap[status] || 'default'
}

// 获取部门文本
const getDepartmentText = (department) => {
  const departmentMap = {
    'warehouse': '仓储部',
    'transport': '运输部',
    'quality': '质检部',
    'service': '客服部',
    'management': '管理部',
    'finance': '财务部'
  }
  return departmentMap[department] || department
}

// 获取职位文本
const getPositionText = (position) => {
  const positionMap = {
    'warehouse_manager': '仓库管理员',
    'unloader': '卸货人员',
    'picker': '拣货人员',
    'packer': '打包人员',
    'inspector': '质检员',
    'driver': '司机',
    'service_agent': '客服专员',
    'accountant': '财务专员',
    'supervisor': '主管',
    'manager': '经理'
  }
  return positionMap[position] || position
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
.unloading-goods {
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