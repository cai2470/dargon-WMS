<template>
  <div class="packing-goods">
    <!-- 筛选区域 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" label-width="80px" :inline="true">
        <el-form-item label="出库单号">
          <el-input 
            v-model="filterForm.order_no" 
            placeholder="请输入单号"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input 
            v-model="filterForm.customer_name" 
            placeholder="请输入客户名称"
            clearable
            style="width: 120px"
          />
        </el-form-item>
        <el-form-item label="打包人员">
          <el-select 
            v-model="filterForm.packer_staff" 
            placeholder="请选择打包人员"
            clearable
            style="width: 120px"
          >
            <el-option 
              v-for="staff in staffList" 
              :key="staff.id"
              :label="staff.name" 
              :value="staff.id" 
            />
          </el-select>
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
        <h3>待打包列表</h3>
        <div class="header-actions">
          <el-button type="success" @click="batchCompletePacking" :disabled="selectedRows.length === 0">
            <el-icon><Check /></el-icon>
            批量完成打包
          </el-button>
          <el-button type="warning" @click="printPackingList" :disabled="selectedRows.length === 0">
            <el-icon><Printer /></el-icon>
            打印包装单
          </el-button>
        </div>
      </div>
      
      <el-table :data="tableData" stripe v-loading="loading" size="small" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column label="#" type="index" width="50" />
        <el-table-column prop="order_no" label="出库单号" width="130" />
        <el-table-column prop="customer_name" label="客户名称" width="120" />
        <el-table-column prop="warehouse_name" label="出库仓库" width="100" />
        <el-table-column prop="total_quantity" label="总数量" width="80" align="right" />
        <el-table-column prop="total_amount" label="总金额" width="100" align="right">
          <template #default="scope">
            ¥{{ (scope.row.total_amount || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="picking_completed_time" label="拣货完成时间" width="130" />
        <el-table-column prop="packer_name" label="打包人员" width="100" />
        <el-table-column prop="package_count" label="包裹数量" width="80" align="center" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button 
              size="small" 
              type="primary" 
              @click="startPacking(scope.row)"
            >
              开始打包
            </el-button>
            <el-button 
              size="small" 
              type="success" 
              @click="completePacking(scope.row)"
            >
              完成打包
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

    <!-- 打包操作对话框 -->
    <el-dialog 
      title="打包操作" 
      v-model="packingDialogVisible" 
      width="1000px"
    >
      <div v-if="currentOrder">
        <div class="order-info">
          <h4>出库单信息</h4>
          <el-row :gutter="20">
            <el-col :span="6">出库单号：{{ currentOrder.order_no }}</el-col>
            <el-col :span="6">客户名称：{{ currentOrder.customer_name }}</el-col>
            <el-col :span="6">出库仓库：{{ currentOrder.warehouse_name }}</el-col>
            <el-col :span="6">总数量：{{ currentOrder.total_quantity }}</el-col>
          </el-row>
        </div>
        
        <el-form :model="packingForm" label-width="120px" style="margin-top: 20px;">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="打包人员">
                <el-select v-model="packingForm.packer_staff" placeholder="请选择打包人员" style="width: 100%">
                  <el-option 
                    v-for="staff in staffList" 
                    :key="staff.id"
                    :label="staff.name" 
                    :value="staff.id" 
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="包装类型">
                <el-select v-model="packingForm.package_type" placeholder="请选择包装类型" style="width: 100%">
                  <el-option label="标准纸箱" value="standard_box" />
                  <el-option label="加厚纸箱" value="thick_box" />
                  <el-option label="泡沫箱" value="foam_box" />
                  <el-option label="木箱" value="wooden_box" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="包裹数量">
                <el-input-number 
                  v-model="packingForm.package_count" 
                  :min="1" 
                  placeholder="包裹数量"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="总重量(kg)">
                <el-input-number 
                  v-model="packingForm.total_weight" 
                  :precision="2"
                  :min="0" 
                  placeholder="总重量"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="包装费用">
                <el-input-number 
                  v-model="packingForm.package_fee" 
                  :precision="2"
                  :min="0" 
                  placeholder="包装费用"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="包装备注">
            <el-input 
              v-model="packingForm.remark" 
              type="textarea" 
              :rows="3"
              placeholder="请输入包装备注"
            />
          </el-form-item>
        </el-form>

        <!-- 商品打包明细 -->
        <div class="product-packing" style="margin-top: 20px;">
          <h4>商品打包明细</h4>
          <el-table :data="currentOrder.products" border size="small">
            <el-table-column prop="product_code" label="商品编码" width="120" />
            <el-table-column prop="product_name" label="商品名称" min-width="140" />
            <el-table-column prop="isku" label="iSKU" width="100" />
            <el-table-column prop="quantity" label="需打包数量" width="100" align="right" />
            <el-table-column prop="actual_picked_quantity" label="实际拣货数量" width="120" align="right" />
            <el-table-column prop="unit" label="单位" width="60" />
            <el-table-column label="包装规格" width="120">
              <template #default="scope">
                <el-select v-model="scope.row.package_spec" size="small" placeholder="选择规格">
                  <el-option label="单个包装" value="single" />
                  <el-option label="批量包装" value="batch" />
                  <el-option label="特殊包装" value="special" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="包装数量" width="120">
              <template #default="scope">
                <el-input-number 
                  v-model="scope.row.packed_quantity" 
                  :min="0" 
                  :max="scope.row.actual_picked_quantity || scope.row.quantity"
                  size="small"
                  style="width: 100%"
                />
              </template>
            </el-table-column>
            <el-table-column label="包装备注" min-width="120">
              <template #default="scope">
                <el-input 
                  v-model="scope.row.packing_remark" 
                  size="small"
                  placeholder="包装备注"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="packingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePackingProgress">保存进度</el-button>
        <el-button type="success" @click="submitCompletePacking">完成打包</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const emit = defineEmits(['refresh'])

// 响应式数据
const loading = ref(false)
const packingDialogVisible = ref(false)
const currentOrder = ref(null)
const selectedRows = ref([])

// 筛选表单
const filterForm = reactive({
  order_no: '',
  customer_name: '',
  packer_staff: null
})

// 打包表单
const packingForm = reactive({
  packer_staff: null,
  package_type: 'standard_box',
  package_count: 1,
  total_weight: 0,
  package_fee: 0,
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
const staffList = ref([])

// 加载基础数据
const loadBasicData = async () => {
  try {
    // 从员工管理系统加载打包人员
    const staffData = JSON.parse(localStorage.getItem('wms_staff') || '[]')
    staffList.value = staffData
      .filter(staff => 
        staff.status === 'active' && 
        (staff.position === 'packer' || 
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
    
    console.log('加载打包人员:', staffList.value.length, '人')
  } catch (error) {
    ElMessage.error('加载基础数据失败')
    console.error('加载基础数据失败:', error)
  }
}

// 加载待打包列表
const loadTableData = async () => {
  loading.value = true
  try {
    // 从localStorage获取出库单数据
    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    console.log('PackingGoods - 所有出库单数据:', orders)
    
    // 筛选待打包状态的订单
    let packingOrders = orders.filter(order => order.status === 'packing')
    console.log('PackingGoods - 筛选出的打包订单:', packingOrders)
    console.log('PackingGoods - 打包订单数量:', packingOrders.length)
    
    if (packingOrders.length === 0) {
      console.warn('⚠️ PackingGoods - 没有找到打包状态的订单')
      console.log('所有订单状态分布:')
      const statusCount = {}
      orders.forEach(o => {
        statusCount[o.status] = (statusCount[o.status] || 0) + 1
      })
      console.log(statusCount)
    }
    
    // 处理数据
    packingOrders = packingOrders.map(order => {
      const totalQuantity = order.products ? order.products.reduce((sum, p) => sum + (p.quantity || 0), 0) : 0
      
      // 获取打包人员姓名
      const packerName = order.packer_staff ? 
        (() => {
          const staff = staffList.value.find(s => s.id === order.packer_staff)
          return staff ? staff.name : '未分配'
        })() : '未分配'
      
      return {
        ...order,
        total_quantity: totalQuantity,
        packer_name: packerName,
        package_count: order.package_count || 0
      }
    })
    
    // 应用筛选条件
    if (filterForm.order_no) {
      packingOrders = packingOrders.filter(order => 
        order.order_no.toLowerCase().includes(filterForm.order_no.toLowerCase())
      )
    }
    if (filterForm.customer_name) {
      packingOrders = packingOrders.filter(order => 
        order.customer_name.toLowerCase().includes(filterForm.customer_name.toLowerCase())
      )
    }
    if (filterForm.packer_staff) {
      packingOrders = packingOrders.filter(order => order.packer_staff === filterForm.packer_staff)
    }
    
    tableData.value = packingOrders
    pagination.total = packingOrders.length
    
  } catch (error) {
    ElMessage.error('加载待打包列表失败')
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
    customer_name: '',
    packer_staff: null
  })
  loadTableData()
}

// 选择行变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 开始打包
const startPacking = (order) => {
  currentOrder.value = {
    ...order,
    products: order.products.map(p => ({
      ...p,
      package_spec: p.package_spec || 'single',
      packed_quantity: p.packed_quantity || (p.actual_picked_quantity || p.quantity),
      packing_remark: p.packing_remark || ''
    }))
  }
  
  // 重置表单
  Object.assign(packingForm, {
    packer_staff: order.packer_staff || null,
    package_type: order.package_type || 'standard_box',
    package_count: order.package_count || 1,
    total_weight: order.total_weight || 0,
    package_fee: order.package_fee || 0,
    remark: order.packing_remark || ''
  })
  
  packingDialogVisible.value = true
}

// 完成打包
const completePacking = async (order) => {
  try {
    await ElMessageBox.confirm(
      `确定要完成出库单 "${order.order_no}" 的打包吗？`,
      '完成打包',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 更新订单状态为待发货
    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    const index = orders.findIndex(o => o.id === order.id)
    if (index !== -1) {
      orders[index] = {
        ...orders[index],
        status: 'shipping',
        packing_completed_time: new Date().toLocaleString(),
        updated_at: new Date().toLocaleString()
      }
    }
    
    localStorage.setItem('outbound_orders', JSON.stringify(orders))
    ElMessage.success(`出库单 ${order.order_no} 打包已完成，进入发货环节`)
    loadTableData()
    emit('refresh')
  } catch {
    // 用户取消操作
  }
}

// 批量完成打包
const batchCompletePacking = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要批量完成 ${selectedRows.value.length} 个出库单的打包吗？`,
      '批量操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 批量更新状态为待发货
    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    selectedRows.value.forEach(selectedOrder => {
      const index = orders.findIndex(order => order.id === selectedOrder.id)
      if (index !== -1) {
        orders[index] = {
          ...orders[index],
          status: 'shipping',
          packing_completed_time: new Date().toLocaleString(),
          updated_at: new Date().toLocaleString()
        }
      }
    })
    
    localStorage.setItem('outbound_orders', JSON.stringify(orders))
    ElMessage.success(`已批量完成 ${selectedRows.value.length} 个出库单的打包`)
    loadTableData()
    emit('refresh')
  } catch {
    // 用户取消操作
  }
}

// 打印包装单
const printPackingList = () => {
  ElMessage.info('打印包装单功能开发中...')
}

// 保存打包进度
const savePackingProgress = () => {
  try {
    // 更新打包进度
    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    const index = orders.findIndex(order => order.id === currentOrder.value.id)
    if (index !== -1) {
      orders[index] = {
        ...orders[index],
        packer_staff: packingForm.packer_staff,
        package_type: packingForm.package_type,
        package_count: packingForm.package_count,
        total_weight: packingForm.total_weight,
        package_fee: packingForm.package_fee,
        packing_remark: packingForm.remark,
        products: currentOrder.value.products,
        updated_at: new Date().toLocaleString()
      }
    }
    
    localStorage.setItem('outbound_orders', JSON.stringify(orders))
    ElMessage.success('打包进度已保存')
    loadTableData()
  } catch (error) {
    ElMessage.error('保存打包进度失败')
  }
}

// 提交完成打包
const submitCompletePacking = async () => {
  try {
    // 检查是否所有商品都已打包
    const unfinishedProducts = currentOrder.value.products.filter(p => 
      (p.packed_quantity || 0) < (p.actual_picked_quantity || p.quantity)
    )
    
    if (unfinishedProducts.length > 0) {
      await ElMessageBox.confirm(
        `还有 ${unfinishedProducts.length} 个商品未完成打包，确定要完成打包吗？`,
        '确认完成',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    }
    
    // 更新订单状态为待发货
    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    const index = orders.findIndex(order => order.id === currentOrder.value.id)
    if (index !== -1) {
      orders[index] = {
        ...orders[index],
        status: 'shipping',
        packer_staff: packingForm.packer_staff,
        package_type: packingForm.package_type,
        package_count: packingForm.package_count,
        total_weight: packingForm.total_weight,
        package_fee: packingForm.package_fee,
        packing_remark: packingForm.remark,
        products: currentOrder.value.products,
        packing_completed_time: new Date().toLocaleString(),
        updated_at: new Date().toLocaleString()
      }
    }
    
    localStorage.setItem('outbound_orders', JSON.stringify(orders))
    ElMessage.success(`出库单 ${currentOrder.value.order_no} 打包已完成`)
    packingDialogVisible.value = false
    loadTableData()
    emit('refresh')
  } catch {
    // 用户取消操作
  }
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

// 暴露方法给父组件调用
defineExpose({
  loadTableData,
  loadBasicData
})

onMounted(async () => {
  try {
    await loadBasicData()
    await loadTableData()
  } catch (error) {
    console.error('初始化数据加载失败:', error)
    ElMessage.error('页面数据加载失败')
  }
})
</script>

<style lang="scss" scoped>
.packing-goods {
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
  
  .product-packing {
    h4 {
      margin: 0 0 15px 0;
      color: #303133;
      font-size: 14px;
    }
  }
}
</style> 