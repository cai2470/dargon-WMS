<template>
  <div class="sorting-goods">
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
        <el-form-item label="卸货区域">
          <el-select 
            v-model="filterForm.unloading_zone" 
            placeholder="请选择区域"
            clearable
            style="width: 120px"
          >
            <el-option 
              v-for="zone in unloadingZones" 
              :key="zone.id"
              :label="zone.name" 
              :value="zone.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="卸货时间">
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
        <h3>待分拣列表</h3>
        <div class="header-actions">
          <el-button type="success" @click="batchStartSorting" :disabled="selectedRows.length === 0">
            <el-icon><Operation /></el-icon>
            批量开始分拣
          </el-button>
        </div>
      </div>
      
      <el-table :data="tableData" stripe v-loading="loading" size="small" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column label="#" type="index" width="50" />
        <el-table-column prop="order_no" label="入库单号" width="130" />
        <el-table-column prop="supplier_name" label="供应商" width="120" />
        <el-table-column prop="unloading_zone_name" label="卸货区域" width="100" />
        <el-table-column prop="unloading_start_time" label="开始卸货时间" width="130" />
        <el-table-column prop="estimated_unloading_time" label="预计卸货时长" width="120">
          <template #default="scope">
            {{ scope.row.estimated_unloading_time }}小时
          </template>
        </el-table-column>
        <el-table-column prop="total_quantity" label="总数量" width="100" align="right" />
        <el-table-column prop="product_types" label="商品种类" width="100" align="right">
          <template #default="scope">
            {{ scope.row.products ? scope.row.products.length : 0 }}种
          </template>
        </el-table-column>
        <el-table-column prop="special_requirements" label="特殊要求" width="120">
          <template #default="scope">
            <div v-if="scope.row.special_requirements && scope.row.special_requirements.length > 0">
              <el-tag 
                v-for="req in scope.row.special_requirements.slice(0, 2)" 
                :key="req"
                size="small"
                style="margin-right: 4px;"
              >
                {{ getSpecialRequirementText(req) }}
              </el-tag>
              <span v-if="scope.row.special_requirements.length > 2">...</span>
            </div>
            <span v-else class="text-muted">无</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="scope">
            <el-tag type="warning" size="small">待分拣</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button 
              size="small" 
              type="primary" 
              @click="startSorting(scope.row)"
            >
              开始分拣
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
              type="success" 
              @click="quickSort(scope.row)"
            >
              快速分拣
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

    <!-- 开始分拣对话框 -->
    <el-dialog 
      title="开始分拣" 
      v-model="sortingDialogVisible" 
      width="900px"
    >
      <div v-if="currentOrder">
        <div class="order-info">
          <h4>入库单信息</h4>
          <el-row :gutter="20">
            <el-col :span="6">入库单号：{{ currentOrder.order_no }}</el-col>
            <el-col :span="6">供应商：{{ currentOrder.supplier_name }}</el-col>
            <el-col :span="6">卸货区域：{{ currentOrder.unloading_zone_name }}</el-col>
            <el-col :span="6">总数量：{{ currentOrder.total_quantity }}</el-col>
          </el-row>
        </div>
        
        <el-form :model="sortingForm" label-width="120px" style="margin-top: 20px;">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="分拣人员">
                <el-select v-model="sortingForm.sorting_staff" multiple placeholder="请选择分拣人员" style="width: 100%">
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
              <el-form-item label="分拣区域">
                <el-select v-model="sortingForm.sorting_zone" placeholder="请选择分拣区域" style="width: 100%">
                  <el-option 
                    v-for="zone in sortingZones" 
                    :key="zone.id"
                    :label="zone.name" 
                    :value="zone.id" 
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="预计分拣时间">
                <el-input-number 
                  v-model="sortingForm.estimated_time" 
                  :min="0.5" 
                  :step="0.5"
                  placeholder="小时"
                  style="width: 100%"
                />
                <span style="margin-left: 8px; color: #666;">小时</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="分拣方式">
                <el-radio-group v-model="sortingForm.sorting_method">
                  <el-radio label="by_product">按商品分拣</el-radio>
                  <el-radio label="by_zone">按库区分拣</el-radio>
                  <el-radio label="mixed">混合分拣</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="质检要求">
            <el-checkbox-group v-model="sortingForm.quality_requirements">
              <el-checkbox label="appearance">外观检查</el-checkbox>
              <el-checkbox label="quantity">数量核对</el-checkbox>
              <el-checkbox label="specification">规格检查</el-checkbox>
              <el-checkbox label="expiry">有效期检查</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          
          <el-form-item label="备注">
            <el-input 
              v-model="sortingForm.remark" 
              type="textarea" 
              :rows="3"
              placeholder="请输入分拣备注"
            />
          </el-form-item>
        </el-form>

        <!-- 商品分拣明细 -->
        <div class="product-sorting" style="margin-top: 20px;">
          <h4>商品分拣明细</h4>
          <el-table :data="currentOrder.products" border size="small">
            <el-table-column prop="product_code" label="商品编码" width="120" />
            <el-table-column prop="product_name" label="商品名称" min-width="160" />
            <el-table-column prop="expected_quantity" label="预计数量" width="100" align="right" />
            <el-table-column label="实际数量" width="120">
              <template #default="scope">
                <el-input-number 
                  v-model="scope.row.actual_quantity" 
                  :min="0" 
                  :max="scope.row.expected_quantity * 2"
                  size="small"
                  style="width: 100%"
                />
              </template>
            </el-table-column>

            <el-table-column label="备注" min-width="120">
              <template #default="scope">
                <el-input 
                  v-model="scope.row.sort_remark" 
                  size="small"
                  placeholder="备注"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="sortingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStartSorting" :loading="sorting">开始分拣</el-button>
      </template>
    </el-dialog>

    <!-- 快速分拣对话框 -->
    <el-dialog 
      title="快速分拣" 
      v-model="quickSortDialogVisible" 
      width="600px"
    >
      <div v-if="currentOrder">
        <div class="order-info">
          <h4>入库单信息</h4>
          <p>入库单号：{{ currentOrder.order_no }} | 供应商：{{ currentOrder.supplier_name }}</p>
        </div>
        
        <el-form :model="quickSortForm" label-width="120px" style="margin-top: 20px;">
          <el-form-item label="分拣人员" required>
            <el-select v-model="quickSortForm.staff_id" placeholder="请选择分拣人员" style="width: 100%">
              <el-option 
                v-for="staff in staffList" 
                :key="staff.id"
                :label="staff.name" 
                :value="staff.id" 
              />
            </el-select>
          </el-form-item>
          <el-form-item label="全部商品状态">
            <el-radio-group v-model="quickSortForm.all_status">
              <el-radio label="all_qualified">全部合格</el-radio>
              <el-radio label="all_completed">全部分拣完成</el-radio>
              <el-radio label="has_problem">存在问题</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="备注">
            <el-input 
              v-model="quickSortForm.remark" 
              type="textarea" 
              :rows="3"
              placeholder="请输入快速分拣备注"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="quickSortDialogVisible = false">取消</el-button>
        <el-button type="success" @click="submitQuickSort" :loading="quickSorting">确认分拣</el-button>
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
          <el-descriptions-item label="卸货区域">{{ currentOrder.unloading_zone_name }}</el-descriptions-item>
          <el-descriptions-item label="开始卸货时间">{{ currentOrder.unloading_start_time }}</el-descriptions-item>
          <el-descriptions-item label="预计卸货时长">{{ currentOrder.estimated_unloading_time }}小时</el-descriptions-item>
          <el-descriptions-item label="总数量">{{ currentOrder.total_quantity }}</el-descriptions-item>
          <el-descriptions-item label="特殊要求" :span="3">
            <span v-if="currentOrder.special_requirements && currentOrder.special_requirements.length > 0">
              {{ currentOrder.special_requirements.map(req => getSpecialRequirementText(req)).join(', ') }}
            </span>
            <span v-else>无</span>
          </el-descriptions-item>
          <el-descriptions-item label="卸货备注" :span="3">{{ currentOrder.unloading_remark || '-' }}</el-descriptions-item>
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
const sorting = ref(false)
const quickSorting = ref(false)
const sortingDialogVisible = ref(false)
const quickSortDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentOrder = ref(null)
const selectedRows = ref([])

// 筛选表单
const filterForm = reactive({
  order_no: '',
  supplier_id: null,
  unloading_zone: '',
  date_range: []
})

// 分拣表单
const sortingForm = reactive({
  sorting_staff: [],
  sorting_zone: '',
  estimated_time: 1.5,
  sorting_method: 'by_product',
  quality_requirements: [],
  remark: ''
})

// 快速分拣表单
const quickSortForm = reactive({
  staff_id: '',
  all_status: 'all_qualified',
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
const staffList = ref([])
const unloadingZones = ref([])
const sortingZones = ref([])

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
    
    // 加载员工列表
    staffList.value = [
      { id: 1, name: '张三' },
      { id: 2, name: '李四' },
      { id: 3, name: '王五' },
      { id: 4, name: '赵六' },
      { id: 5, name: '陈七' }
    ]
    
    // 加载卸货区域
    unloadingZones.value = [
      { id: 1, name: '卸货区A' },
      { id: 2, name: '卸货区B' },
      { id: 3, name: '卸货区C' },
      { id: 4, name: '临时卸货区' }
    ]
    
    // 加载分拣区域
    sortingZones.value = [
      { id: 1, name: '分拣区A' },
      { id: 2, name: '分拣区B' },
      { id: 3, name: '分拣区C' },
      { id: 4, name: '质检分拣区' }
    ]
    
  } catch (error) {
    ElMessage.error('加载基础数据失败')
    console.error('加载基础数据失败:', error)
  }
}

// 加载待分拣列表
const loadTableData = async () => {
  loading.value = true
  try {
    // 从存储中加载入库单数据
    const orders = getStorageData('inbound_orders') || []
    
    // 筛选待分拣状态的订单
    let sortingOrders = orders.filter(order => order.status === 'sorting')
    
    // 补充供应商和区域名称
    sortingOrders = sortingOrders.map(order => {
      const supplier = suppliers.value.find(s => s.id === order.supplier_id)
      const unloadingZone = unloadingZones.value.find(z => z.id === order.unloading_zone)
      return {
        ...order,
        supplier_name: supplier ? supplier.name : '未知供应商',
        unloading_zone_name: unloadingZone ? unloadingZone.name : '未知区域',
        total_quantity: order.products ? order.products.reduce((sum, p) => sum + (p.expected_quantity || 0), 0) : 0
      }
    })
    
    // 应用筛选条件
    if (filterForm.order_no) {
      sortingOrders = sortingOrders.filter(order => 
        order.order_no.toLowerCase().includes(filterForm.order_no.toLowerCase())
      )
    }
    if (filterForm.supplier_id) {
      sortingOrders = sortingOrders.filter(order => order.supplier_id === filterForm.supplier_id)
    }
    if (filterForm.unloading_zone) {
      sortingOrders = sortingOrders.filter(order => order.unloading_zone === filterForm.unloading_zone)
    }
    
    tableData.value = sortingOrders
    pagination.total = sortingOrders.length
    
  } catch (error) {
    ElMessage.error('加载待分拣列表失败')
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
    unloading_zone: '',
    date_range: []
  })
  loadTableData()
}

// 选择行变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 开始分拣
const startSorting = (order) => {
  currentOrder.value = {
    ...order,
    products: order.products.map(p => ({
      ...p,
      actual_quantity: p.expected_quantity,
      sort_status: 'pending',
      quality_result: 'pending',
      sort_remark: ''
    }))
  }
  sortingDialogVisible.value = true
}

// 批量开始分拣
const batchStartSorting = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要批量开始分拣 ${selectedRows.value.length} 个入库单吗？`,
      '批量操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 批量更新状态为待上架
    const orders = getStorageData('inbound_orders') || []
    selectedRows.value.forEach(selectedOrder => {
      const index = orders.findIndex(order => order.id === selectedOrder.id)
      if (index !== -1) {
        orders[index] = {
          ...orders[index],
          status: 'shelving',
          sorting_start_time: new Date().toLocaleString(),
          updated_at: new Date().toLocaleString()
        }
      }
    })
    
    setStorageData('inbound_orders', orders)
    ElMessage.success(`已批量开始分拣 ${selectedRows.value.length} 个入库单`)
    loadTableData()
    emit('refresh')
  } catch {
    // 用户取消操作
  }
}

// 提交开始分拣
const submitStartSorting = async () => {
  try {
    sorting.value = true
    
    // 获取分拣区域名称
    const sortingZone = sortingZones.value.find(z => z.id === sortingForm.sorting_zone)
    
    // 更新订单状态为待上架
    const orders = getStorageData('inbound_orders') || []
    const index = orders.findIndex(order => order.id === currentOrder.value.id)
    if (index !== -1) {
      orders[index] = {
        ...orders[index],
        status: 'shelving',
        sorting_staff: sortingForm.sorting_staff,
        sorting_zone: sortingForm.sorting_zone,
        sorting_zone_name: sortingZone ? sortingZone.name : '',
        estimated_sorting_time: sortingForm.estimated_time,
        sorting_method: sortingForm.sorting_method,
        quality_requirements: sortingForm.quality_requirements,
        sorting_remark: sortingForm.remark,
        products: currentOrder.value.products,
        sorting_start_time: new Date().toLocaleString(),
        updated_at: new Date().toLocaleString()
      }
    }
    
    setStorageData('inbound_orders', orders)
    ElMessage.success(`入库单 ${currentOrder.value.order_no} 已开始分拣`)
    sortingDialogVisible.value = false
    loadTableData()
    emit('refresh')
  } catch (error) {
    ElMessage.error('开始分拣失败')
  } finally {
    sorting.value = false
  }
}

// 快速分拣
const quickSort = (order) => {
  currentOrder.value = order
  quickSortDialogVisible.value = true
}

// 提交快速分拣
const submitQuickSort = async () => {
  try {
    if (!quickSortForm.staff_id) {
      ElMessage.warning('请选择分拣人员')
      return
    }
    
    quickSorting.value = true
    
    // 根据选择的状态更新所有商品
    const products = currentOrder.value.products.map(p => ({
      ...p,
      actual_quantity: p.expected_quantity,
      sort_status: 'completed',
      quality_result: quickSortForm.all_status === 'has_problem' ? 'unqualified' : 'qualified',
      sort_remark: quickSortForm.remark
    }))
    
    // 更新订单状态为待上架
    const orders = getStorageData('inbound_orders') || []
    const index = orders.findIndex(order => order.id === currentOrder.value.id)
    if (index !== -1) {
      orders[index] = {
        ...orders[index],
        status: 'shelving',
        sorting_staff: [quickSortForm.staff_id],
        sorting_method: 'quick_sort',
        products: products,
        sorting_start_time: new Date().toLocaleString(),
        sorting_end_time: new Date().toLocaleString(),
        quick_sort_status: quickSortForm.all_status,
        sorting_remark: quickSortForm.remark,
        updated_at: new Date().toLocaleString()
      }
    }
    
    setStorageData('inbound_orders', orders)
    ElMessage.success(`入库单 ${currentOrder.value.order_no} 快速分拣完成`)
    quickSortDialogVisible.value = false
    loadTableData()
    emit('refresh')
  } catch (error) {
    ElMessage.error('快速分拣失败')
  } finally {
    quickSorting.value = false
  }
}

// 查看详情
const viewDetails = (order) => {
  currentOrder.value = order
  detailDialogVisible.value = true
}

// 获取特殊要求文本
const getSpecialRequirementText = (requirement) => {
  const requirementMap = {
    'fragile': '易碎品',
    'hazardous': '危险品',
    'refrigerated': '需冷藏',
    'valuable': '贵重物品'
  }
  return requirementMap[requirement] || requirement
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
.sorting-goods {
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
  
  .product-sorting {
    h4 {
      margin: 0 0 15px 0;
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
  
  .text-muted {
    color: #909399;
    font-size: 12px;
  }
}
</style>