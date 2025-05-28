<template>
  <div class="shipping-goods">
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
        <el-form-item label="物流公司">
          <el-select 
            v-model="filterForm.logistics_company" 
            placeholder="请选择物流公司"
            clearable
            style="width: 120px"
          >
            <el-option 
              v-for="company in logisticsCompanies" 
              :key="company.value"
              :label="company.label" 
              :value="company.value" 
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
        <h3>待发货列表</h3>
        <div class="header-actions">
          <el-button type="success" @click="batchCompleteShipping" :disabled="selectedRows.length === 0">
            <el-icon><Check /></el-icon>
            批量确认发货
          </el-button>
          <el-button type="warning" @click="printShippingList" :disabled="selectedRows.length === 0">
            <el-icon><Printer /></el-icon>
            打印发货单
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
        <el-table-column prop="package_count" label="包裹数量" width="80" align="center" />
        <el-table-column prop="total_weight" label="总重量(kg)" width="100" align="right" />
        <el-table-column prop="total_amount" label="总金额" width="100" align="right">
          <template #default="scope">
            ¥{{ (scope.row.total_amount || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="logistics_company" label="物流公司" width="120" />
        <el-table-column prop="tracking_number" label="运单号" width="140" />
        <el-table-column prop="packing_completed_time" label="打包完成时间" width="130" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button 
              size="small" 
              type="primary" 
              @click="startShipping(scope.row)"
            >
              安排发货
            </el-button>
            <el-button 
              size="small" 
              type="success" 
              @click="completeShipping(scope.row)"
            >
              确认发货
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

    <!-- 发货操作对话框 -->
    <el-dialog 
      title="安排发货" 
      v-model="shippingDialogVisible" 
      width="800px"
    >
      <div v-if="currentOrder">
        <div class="order-info">
          <h4>出库单信息</h4>
          <el-row :gutter="20">
            <el-col :span="6">出库单号：{{ currentOrder.order_no }}</el-col>
            <el-col :span="6">客户名称：{{ currentOrder.customer_name }}</el-col>
            <el-col :span="6">包裹数量：{{ currentOrder.package_count }}</el-col>
            <el-col :span="6">总重量：{{ currentOrder.total_weight }}kg</el-col>
          </el-row>
        </div>
        
        <el-form :model="shippingForm" label-width="120px" style="margin-top: 20px;">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="物流公司" required>
                <el-select 
                  v-model="shippingForm.logistics_company" 
                  placeholder="请选择或输入物流公司" 
                  style="width: 100%"
                  filterable
                  allow-create
                  default-first-option
                >
                  <el-option 
                    v-for="company in logisticsCompanies" 
                    :key="company.value"
                    :label="company.label" 
                    :value="company.value"
                  >
                    <span style="float: left">{{ company.label }}</span>
                    <span style="float: right; color: #8492a6; font-size: 12px">
                      {{ company.code || company.value }}
                    </span>
                  </el-option>
                </el-select>
                <div style="margin-top: 5px; font-size: 12px; color: #999;">
                  支持选择预设物流公司或手动输入新公司名称
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="运单号" required>
                <el-input 
                  v-model="shippingForm.tracking_number" 
                  placeholder="请输入运单号"
                />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="预计发货时间">
                <el-date-picker 
                  v-model="shippingForm.estimated_shipping_time" 
                  type="datetime"
                  placeholder="选择发货时间"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="运费">
                <el-input-number 
                  v-model="shippingForm.shipping_fee" 
                  :precision="2"
                  :min="0" 
                  placeholder="运费"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="收货地址">
            <el-input 
              v-model="shippingForm.delivery_address" 
              type="textarea" 
              :rows="2"
              placeholder="收货地址"
            />
          </el-form-item>
          
          <el-form-item label="发货备注">
            <el-input 
              v-model="shippingForm.remark" 
              type="textarea" 
              :rows="3"
              placeholder="请输入发货备注"
            />
          </el-form-item>
        </el-form>

        <!-- 包裹信息 -->
        <div class="package-info" style="margin-top: 20px;">
          <h4>包裹信息</h4>
          <el-table :data="packageList" border size="small">
            <el-table-column label="包裹编号" width="120">
              <template #default="scope">
                PKG{{ String(scope.$index + 1).padStart(3, '0') }}
              </template>
            </el-table-column>
            <el-table-column label="包装类型" width="120">
              <template #default="scope">
                {{ getPackageTypeText(currentOrder.package_type) }}
              </template>
            </el-table-column>
            <el-table-column label="重量(kg)" width="100">
              <template #default="scope">
                <el-input-number 
                  v-model="scope.row.weight" 
                  :precision="2"
                  :min="0" 
                  size="small"
                  style="width: 100%"
                />
              </template>
            </el-table-column>
            <el-table-column label="尺寸(长×宽×高cm)" width="200">
              <template #default="scope">
                <el-input 
                  v-model="scope.row.dimensions" 
                  size="small"
                  placeholder="如: 30×20×15"
                />
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="120">
              <template #default="scope">
                <el-input 
                  v-model="scope.row.remark" 
                  size="small"
                  placeholder="包裹备注"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="shippingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveShippingInfo">保存信息</el-button>
        <el-button type="success" @click="submitCompleteShipping">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const emit = defineEmits(['refresh'])

// 响应式数据
const loading = ref(false)
const shippingDialogVisible = ref(false)
const currentOrder = ref(null)
const selectedRows = ref([])
const packageList = ref([])

// 筛选表单
const filterForm = reactive({
  order_no: '',
  customer_name: '',
  logistics_company: ''
})

// 发货表单
const shippingForm = reactive({
  logistics_company: '',
  tracking_number: '',
  estimated_shipping_time: '',
  shipping_fee: 0,
  delivery_address: '',
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

// 物流公司选项
const logisticsCompanies = ref([
  { label: '顺丰速运', value: 'SF', code: 'SF' },
  { label: '中通快递', value: 'ZTO', code: 'ZTO' },
  { label: '圆通速递', value: 'YTO', code: 'YTO' },
  { label: '京东物流', value: 'JD', code: 'JD' },
  { label: '自有物流', value: 'OWN_LOGISTICS', code: 'OWN' }
])

// 加载待发货列表
const loadTableData = async () => {
  loading.value = true
  try {
    // 从localStorage获取出库单数据
    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    console.log('ShippingGoods - 所有出库单数据:', orders)
    
    // 筛选待发货状态的订单
    let shippingOrders = orders.filter(order => order.status === 'shipping')
    console.log('ShippingGoods - 筛选出的发货订单:', shippingOrders)
    console.log('ShippingGoods - 发货订单数量:', shippingOrders.length)
    
    if (shippingOrders.length === 0) {
      console.warn('⚠️ ShippingGoods - 没有找到发货状态的订单')
      console.log('所有订单状态分布:')
      const statusCount = {}
      orders.forEach(o => {
        statusCount[o.status] = (statusCount[o.status] || 0) + 1
      })
      console.log(statusCount)
    }
    
    // 处理数据
    shippingOrders = shippingOrders.map(order => {
      const totalQuantity = order.products ? order.products.reduce((sum, p) => sum + (p.quantity || 0), 0) : 0
      
      // 获取物流公司名称
      const logisticsCompanyName = order.logistics_company ? 
        (() => {
          const company = logisticsCompanies.value.find(c => c.value === order.logistics_company)
          return company ? company.label : order.logistics_company
        })() : '未选择'
      
      return {
        ...order,
        total_quantity: totalQuantity,
        logistics_company: logisticsCompanyName
      }
    })
    
    // 应用筛选条件
    if (filterForm.order_no) {
      shippingOrders = shippingOrders.filter(order => 
        order.order_no.toLowerCase().includes(filterForm.order_no.toLowerCase())
      )
    }
    if (filterForm.customer_name) {
      shippingOrders = shippingOrders.filter(order => 
        order.customer_name.toLowerCase().includes(filterForm.customer_name.toLowerCase())
      )
    }
    if (filterForm.logistics_company) {
      shippingOrders = shippingOrders.filter(order => 
        order.logistics_company_code === filterForm.logistics_company
      )
    }
    
    tableData.value = shippingOrders
    pagination.total = shippingOrders.length
    
  } catch (error) {
    ElMessage.error('加载待发货列表失败')
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
    logistics_company: ''
  })
  loadTableData()
}

// 选择行变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 安排发货
const startShipping = (order) => {
  currentOrder.value = order
  
  // 重置表单
  Object.assign(shippingForm, {
    logistics_company: order.logistics_company_code || '',
    tracking_number: order.tracking_number || '',
    estimated_shipping_time: order.estimated_shipping_time || '',
    shipping_fee: order.shipping_fee || 0,
    delivery_address: order.delivery_address || '',
    remark: order.shipping_remark || ''
  })
  
  // 初始化包裹列表
  const packageCount = order.package_count || 1
  packageList.value = Array.from({ length: packageCount }, (_, index) => ({
    id: index + 1,
    weight: (order.total_weight || 0) / packageCount,
    dimensions: '',
    remark: ''
  }))
  
  shippingDialogVisible.value = true
}

// 确认发货
const completeShipping = async (order) => {
  try {
    if (!order.logistics_company || !order.tracking_number) {
      ElMessage.warning('请先安排发货信息')
      return
    }
    
    await ElMessageBox.confirm(
      `确定要确认出库单 "${order.order_no}" 已发货吗？`,
      '确认发货',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 更新订单状态为已完成，并减少库存
    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    const index = orders.findIndex(o => o.id === order.id)
    if (index !== -1) {
      orders[index] = {
        ...orders[index],
        status: 'completed',
        shipping_completed_time: new Date().toLocaleString(),
        updated_at: new Date().toLocaleString()
      }
      
      // 减少库存
      updateInventoryStock(orders[index])
    }
    
    localStorage.setItem('outbound_orders', JSON.stringify(orders))
    ElMessage.success(`出库单 ${order.order_no} 发货已确认，库存已更新`)
    loadTableData()
    emit('refresh')
  } catch {
    // 用户取消操作
  }
}

// 批量确认发货
const batchCompleteShipping = async () => {
  try {
    // 检查是否所有订单都有发货信息
    const incompleteOrders = selectedRows.value.filter(order => 
      !order.logistics_company || !order.tracking_number
    )
    
    if (incompleteOrders.length > 0) {
      ElMessage.warning(`有 ${incompleteOrders.length} 个订单缺少发货信息，请先完善`)
      return
    }
    
    await ElMessageBox.confirm(
      `确定要批量确认 ${selectedRows.value.length} 个出库单已发货吗？`,
      '批量操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 批量更新状态为已完成
    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    selectedRows.value.forEach(selectedOrder => {
      const index = orders.findIndex(order => order.id === selectedOrder.id)
      if (index !== -1) {
        orders[index] = {
          ...orders[index],
          status: 'completed',
          shipping_completed_time: new Date().toLocaleString(),
          updated_at: new Date().toLocaleString()
        }
        
        // 减少库存
        updateInventoryStock(orders[index])
      }
    })
    
    localStorage.setItem('outbound_orders', JSON.stringify(orders))
    ElMessage.success(`已批量确认 ${selectedRows.value.length} 个出库单发货`)
    loadTableData()
    emit('refresh')
  } catch {
    // 用户取消操作
  }
}

// 打印发货单
const printShippingList = () => {
  ElMessage.info('打印发货单功能开发中...')
}

// 保存发货信息
const saveShippingInfo = () => {
  try {
    if (!shippingForm.logistics_company || !shippingForm.tracking_number) {
      ElMessage.warning('请填写物流公司和运单号')
      return
    }
    
    // 更新发货信息
    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    const index = orders.findIndex(order => order.id === currentOrder.value.id)
    if (index !== -1) {
      orders[index] = {
        ...orders[index],
        logistics_company_code: shippingForm.logistics_company,
        logistics_company: logisticsCompanies.value.find(c => c.value === shippingForm.logistics_company)?.label || shippingForm.logistics_company,
        tracking_number: shippingForm.tracking_number,
        estimated_shipping_time: shippingForm.estimated_shipping_time,
        shipping_fee: shippingForm.shipping_fee,
        delivery_address: shippingForm.delivery_address,
        shipping_remark: shippingForm.remark,
        package_details: packageList.value,
        updated_at: new Date().toLocaleString()
      }
    }
    
    localStorage.setItem('outbound_orders', JSON.stringify(orders))
    ElMessage.success('发货信息已保存')
    loadTableData()
  } catch (error) {
    ElMessage.error('保存发货信息失败')
  }
}

// 提交确认发货
const submitCompleteShipping = async () => {
  try {
    if (!shippingForm.logistics_company || !shippingForm.tracking_number) {
      ElMessage.warning('请填写物流公司和运单号')
      return
    }
    
    await ElMessageBox.confirm(
      `确定要确认出库单 "${currentOrder.value.order_no}" 已发货吗？`,
      '确认发货',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 更新订单状态为已完成
    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    const index = orders.findIndex(order => order.id === currentOrder.value.id)
    if (index !== -1) {
      orders[index] = {
        ...orders[index],
        status: 'completed',
        logistics_company_code: shippingForm.logistics_company,
        logistics_company: logisticsCompanies.value.find(c => c.value === shippingForm.logistics_company)?.label || shippingForm.logistics_company,
        tracking_number: shippingForm.tracking_number,
        estimated_shipping_time: shippingForm.estimated_shipping_time,
        shipping_fee: shippingForm.shipping_fee,
        delivery_address: shippingForm.delivery_address,
        shipping_remark: shippingForm.remark,
        package_details: packageList.value,
        shipping_completed_time: new Date().toLocaleString(),
        updated_at: new Date().toLocaleString()
      }
      
      // 减少库存
      updateInventoryStock(orders[index])
    }
    
    localStorage.setItem('outbound_orders', JSON.stringify(orders))
    ElMessage.success(`出库单 ${currentOrder.value.order_no} 发货已确认`)
    shippingDialogVisible.value = false
    loadTableData()
    emit('refresh')
  } catch {
    // 用户取消操作
  }
}

// 更新库存（出库减少库存）
const updateInventoryStock = (order) => {
  try {
    // 获取当前库存数据
    let inventoryData = JSON.parse(localStorage.getItem('inventory_stock') || '[]')
    
    // 减少每个出库商品的库存
    order.products.forEach(outboundProduct => {
      // 按商品编码和仓库ID查找库存记录
      const inventoryIndex = inventoryData.findIndex(inv => 
        (inv.product_code === outboundProduct.product_code || inv.product_id === outboundProduct.product_id) &&
        inv.warehouse_id == order.warehouse_id
      )
      
      if (inventoryIndex !== -1) {
        const currentStock = inventoryData[inventoryIndex].current_stock || 0
        const qualifiedStock = inventoryData[inventoryIndex].qualified_stock || currentStock
        const availableStock = inventoryData[inventoryIndex].available_stock || 0
        const shippedQuantity = outboundProduct.packed_quantity || outboundProduct.actual_picked_quantity || outboundProduct.quantity || 0
        
        // 减少库存数量
        const newCurrentStock = Math.max(0, currentStock - shippedQuantity)
        const newQualifiedStock = Math.max(0, qualifiedStock - shippedQuantity)
        const newAvailableStock = Math.max(0, availableStock - shippedQuantity)
        
        inventoryData[inventoryIndex].current_stock = newCurrentStock
        inventoryData[inventoryIndex].qualified_stock = newQualifiedStock
        inventoryData[inventoryIndex].available_stock = newAvailableStock
        inventoryData[inventoryIndex].last_updated = new Date().toISOString()
        inventoryData[inventoryIndex].last_outbound_order = order.order_no
        inventoryData[inventoryIndex].stock_status = getStockStatus(newCurrentStock, inventoryData[inventoryIndex].min_stock)
        
        console.log(`库存扣减: ${outboundProduct.product_name} 从 ${currentStock} 减少 ${shippedQuantity} 变为 ${newCurrentStock}`)
      } else {
        console.warn(`未找到商品 ${outboundProduct.product_name} (${outboundProduct.product_code}) 在仓库 ${order.warehouse_id} 的库存记录`)
      }
    })
    
    // 清理零库存记录，保存更新后的库存数据
    const validInventoryData = inventoryData.filter(item => {
      const currentStock = parseInt(item.current_stock || 0)
      const availableStock = parseInt(item.available_stock || 0)
      const unqualifiedStock = parseInt(item.unqualified_stock || 0)
      // 只保留有库存的记录（包括不合格库存）
      return currentStock > 0 || availableStock > 0 || unqualifiedStock > 0
    })
    
    localStorage.setItem('inventory_stock', JSON.stringify(validInventoryData))
    console.log('✅ 库存数据已更新并清理，剩余记录数:', validInventoryData.length)
    
    // 创建库存变动记录
    createOutboundStockMovementRecords(order)
    
  } catch (error) {
    console.error('更新出库库存失败:', error)
  }
}

// 获取库存状态
const getStockStatus = (currentStock, minStock) => {
  const stock = parseInt(currentStock || 0)
  const min = parseInt(minStock || 0)
  
  if (stock === 0) return 'out_of_stock'
  if (stock <= min) return 'warning'
  return 'normal'
}

// 获取出库类型文本
const getOutboundTypeText = (type) => {
  const typeMap = {
    'sale': '销售',
    'transfer': '调拨',
    'return': '退货',
    'other': '其他'
  }
  return typeMap[type] || '销售'
}

// 创建出库库存变动记录
const createOutboundStockMovementRecords = (order) => {
  try {
    const movements = JSON.parse(localStorage.getItem('wms_stock_movements') || '[]')
    
    order.products.forEach(product => {
      const shippedQuantity = product.packed_quantity || product.actual_picked_quantity || product.quantity || 0
      
      if (shippedQuantity > 0) {
        movements.push({
          id: Date.now() + Math.random(),
          product_id: product.product_id,
          product_code: product.product_code,
          product_name: product.product_name,
          warehouse_id: order.warehouse_id,
          warehouse_name: order.warehouse_name || '未知仓库',
          movement_type: 'outbound',
          movement_subtype: order.outbound_type || 'sale',
          quantity: shippedQuantity,
          before_quantity: 0, // 这里需要从实际库存获取
          after_quantity: 0, // 这里需要计算减少后的库存
          unit: product.unit || '个',
          order_no: order.order_no,
          reference_type: 'outbound_order',
          reference_id: order.id,
          reason: `${getOutboundTypeText(order.outbound_type)}发货`,
          remark: `出库单${order.order_no}发货完成` + (order.shipping_remark ? `，备注：${order.shipping_remark}` : ''),
          operator: '系统管理员',
          created_by: '系统管理员',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    })
    
    console.log('✅ 出库库存变动记录已创建:', movements.slice(-order.products.length))
    
    localStorage.setItem('wms_stock_movements', JSON.stringify(movements))
  } catch (error) {
    console.error('创建出库库存变动记录失败:', error)
  }
}

// 获取包装类型文本
const getPackageTypeText = (type) => {
  const textMap = {
    'standard_box': '标准纸箱',
    'thick_box': '加厚纸箱',
    'foam_box': '泡沫箱',
    'wooden_box': '木箱',
    'other': '其他'
  }
  return textMap[type] || '标准纸箱'
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
  loadTableData
})

onMounted(async () => {
  try {
    await loadTableData()
  } catch (error) {
    console.error('初始化数据加载失败:', error)
    ElMessage.error('页面数据加载失败')
  }
})
</script>

<style lang="scss" scoped>
.shipping-goods {
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
  
  .package-info {
    h4 {
      margin: 0 0 15px 0;
      color: #303133;
      font-size: 14px;
    }
  }
}
</style> 