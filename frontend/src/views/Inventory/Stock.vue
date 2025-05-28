<template>
  <div class="stock-page">
    <div class="page-header">
      <h1>库存查询</h1>
      <div class="header-actions">
        <el-button type="info" @click="showStockInfo" plain>
          <el-icon><InfoFilled /></el-icon>
          库存说明
        </el-button>
        <el-button type="success" @click="exportData">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
        <el-button type="warning" @click="refreshStock">
          <el-icon><Refresh /></el-icon>
          刷新库存
        </el-button>

        <el-button type="warning" @click="mergeDuplicateStock">
          <el-icon><Operation /></el-icon>
          合并重复库存
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card">
      <el-form :model="searchForm" label-width="80px" :inline="true">
        <el-form-item label="仓库">
          <el-select 
            v-model="searchForm.warehouse_id" 
            placeholder="请选择仓库"
            clearable
            style="width: 150px"
          >
            <el-option 
              v-for="warehouse in warehouses" 
              :key="warehouse.id"
              :label="warehouse.name" 
              :value="warehouse.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="库区">
          <el-select 
            v-model="searchForm.zone_id" 
            placeholder="请选择库区"
            clearable
            style="width: 150px"
          >
            <el-option 
              v-for="zone in filteredZones" 
              :key="zone.id"
              :label="zone.name" 
              :value="zone.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="商品名称">
          <el-input 
            v-model="searchForm.product_name" 
            placeholder="请输入商品名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="商品编码">
          <el-input 
            v-model="searchForm.product_code" 
            placeholder="请输入商品编码"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="库存状态">
          <el-select 
            v-model="searchForm.stock_status" 
            placeholder="库存状态"
            clearable
            style="width: 120px"
          >
            <el-option 
              v-for="status in stockStatusOptions" 
              :key="status.value"
              :label="status.label" 
              :value="status.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchStock">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 库存统计 -->
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon total">
            <el-icon><Goods /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stockStats.total }}</div>
            <div class="stat-label">总商品数</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon normal">
            <el-icon><Check /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stockStats.normal }}</div>
            <div class="stat-label">正常库存</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon warning">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stockStats.warning }}</div>
            <div class="stat-label">库存预警</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon empty">
            <el-icon><Close /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stockStats.empty }}</div>
            <div class="stat-label">缺货商品</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 库存列表 -->
    <el-card class="table-card">
      <el-table :data="stockList" stripe v-loading="loading" max-height="600" size="small">
        <el-table-column prop="product_code" label="编码" width="100" />
        <el-table-column prop="product_name" label="商品名称" min-width="150" />
        <el-table-column label="图片" width="50">
          <template #default="scope">
            <el-image 
              v-if="scope.row.image" 
              :src="scope.row.image" 
              style="width: 28px; height: 28px" 
              fit="cover"
              preview-disabled
            />
          </template>
        </el-table-column>
        <el-table-column prop="isku" label="iSKU" width="90" />
        <el-table-column label="属性" width="90">
          <template #default="scope">
            <div v-if="scope.row.attributes && scope.row.attributes.length > 0">
              <el-tag 
                v-for="attr in scope.row.attributes.slice(0, 1)" 
                :key="attr.name"
                size="small"
              >
                {{ attr.value }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="warehouse_name" label="仓库" width="80" />
        <el-table-column prop="zone_name" label="库区" width="80" />
        <el-table-column prop="location_name" label="库位" width="80" />
        <el-table-column prop="available_stock" label="可用库存" width="90" align="right">
          <template #default="scope">
            <strong>{{ scope.row.available_stock }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="unqualified_stock" label="不合格库存" width="90" align="right">
          <template #default="scope">
            <span class="unqualified-stock">
              {{ scope.row.unqualified_stock || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="reserved_stock" label="预留" width="70" align="right" />
        <el-table-column prop="min_stock" label="最低" width="70" align="right" />
        <el-table-column prop="unit" label="单位" width="60" />
        <el-table-column prop="stock_status" label="状态" width="80">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.stock_status)" size="small">
              {{ getStatusText(scope.row.stock_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_updated" label="最后更新" width="130" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="adjustStock(scope.row)">调整库存</el-button>
            <el-button size="small" type="info" @click="viewHistory(scope.row)">历史记录</el-button>
            <el-button size="small" type="danger" @click="deleteStock(scope.row)">删除</el-button>
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

    <!-- 库存调整对话框 -->
    <el-dialog 
      title="库存调整" 
      v-model="adjustDialogVisible" 
      width="500px"
      @close="resetAdjustForm"
    >
      <el-form :model="adjustForm" :rules="adjustRules" ref="adjustFormRef" label-width="100px">
        <el-form-item label="商品信息">
          <div class="product-info">
            <div><strong>{{ currentProduct?.product_name }}</strong></div>
            <div class="text-muted">编码：{{ currentProduct?.product_code }}</div>
            <div class="text-muted">当前库存：{{ currentProduct?.current_stock }} {{ currentProduct?.unit }}</div>
          </div>
        </el-form-item>
        
        <el-form-item label="调整类型" prop="adjust_type">
          <el-radio-group v-model="adjustForm.adjust_type">
            <el-radio label="in">入库</el-radio>
            <el-radio label="out">出库</el-radio>
            <el-radio label="set">设置</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="目标仓库">
          <el-select v-model="adjustForm.warehouse_id" placeholder="请选择仓库" style="width: 100%">
            <el-option 
              v-for="warehouse in warehouses" 
              :key="warehouse.id"
              :label="warehouse.name" 
              :value="warehouse.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="目标库区">
          <el-select v-model="adjustForm.zone_id" placeholder="请选择库区" style="width: 100%">
            <el-option 
              v-for="zone in filteredZonesForAdjust" 
              :key="zone.id"
              :label="zone.name" 
              :value="zone.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="调整数量" prop="quantity">
          <el-input-number 
            v-model="adjustForm.quantity" 
            :min="adjustForm.adjust_type === 'set' ? 0 : 1"
            placeholder="请输入数量"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="调整原因" prop="reason">
          <el-select v-model="adjustForm.reason" placeholder="请选择原因" style="width: 100%">
            <el-option label="盘点调整" value="盘点调整" />
            <el-option label="损耗调整" value="损耗调整" />
            <el-option label="退货调整" value="退货调整" />
            <el-option label="其他调整" value="其他调整" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input 
            v-model="adjustForm.remark" 
            type="textarea" 
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="deleteStockRecord" :loading="deleting">删除记录</el-button>
        <el-button type="primary" @click="submitAdjust" :loading="adjusting">确定调整</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getWarehouseOptions, getZoneOptions, getStockStatusOptions } from '@/utils/filterOptions'

// 响应式数据
const loading = ref(false)
const adjusting = ref(false)
const deleting = ref(false)
const adjustDialogVisible = ref(false)
const adjustFormRef = ref()
const currentProduct = ref(null)

// 数据监听相关
const autoRefreshTimer = ref(null)
const lastDataVersion = ref(0)

// 搜索表单
const searchForm = reactive({
  warehouse_id: null,
  zone_id: null,
  product_name: '',
  product_code: '',
  stock_status: ''
})

// 库存调整表单
const adjustForm = reactive({
  adjust_type: 'in',
  quantity: 1,
  warehouse_id: null,
  zone_id: null,
  reason: '',
  remark: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 仓库列表
const warehouses = ref([])

// 库区列表
const zones = ref([])

// 库存列表
const stockList = ref([])

// 库存状态选项
const stockStatusOptions = ref([])

// 库存统计
const stockStats = reactive({
  total: 0,
  normal: 0,
  warning: 0,
  empty: 0
})

// 调整表单验证规则
const adjustRules = {
  adjust_type: [
    { required: true, message: '请选择调整类型', trigger: 'change' }
  ],
  quantity: [
    { required: true, message: '请输入调整数量', trigger: 'blur' }
  ],
  reason: [
    { required: true, message: '请选择调整原因', trigger: 'change' }
  ]
}

// 计算属性：根据选择的仓库过滤库区
const filteredZones = computed(() => {
  if (!searchForm.warehouse_id) return zones.value
  return zones.value.filter(zone => zone.warehouse_id === searchForm.warehouse_id)
})

// 计算属性：调整表单的库区筛选
const filteredZonesForAdjust = computed(() => {
  if (!adjustForm.warehouse_id) return zones.value
  return zones.value.filter(zone => zone.warehouse_id === adjustForm.warehouse_id)
})

// 获取库存状态
const getStockStatus = (currentStock, minStock) => {
  const stock = parseInt(currentStock || 0)
  const min = parseInt(minStock || 0)
  
  if (stock === 0) return 'out_of_stock'
  if (stock <= min) return 'warning'
  return 'normal'
}

// 获取库存状态样式
const getStockClass = (row) => {
  if (row.current_stock === 0) return 'stock-empty'
  if (row.current_stock <= row.min_stock) return 'stock-warning'
  return 'stock-normal'
}

// 获取状态标签类型
const getStatusType = (status) => {
  const typeMap = {
    'normal': 'success',
    'warning': 'warning',
    'out_of_stock': 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'normal': '正常',
    'warning': '预警',
    'out_of_stock': '缺货'
  }
  return textMap[status] || '未知'
}

// 加载仓库列表
const loadWarehouses = async () => {
  try {
    const warehouseOptions = getWarehouseOptions()
    warehouses.value = warehouseOptions.map(w => ({
      id: w.id,
      name: w.label,
      code: w.code
    }))
  } catch (error) {
    ElMessage.error('加载仓库列表失败')
  }
}

// 加载库区列表
const loadZones = async () => {
  try {
    const zoneOptions = getZoneOptions()
    zones.value = zoneOptions.map(z => ({
      id: z.id,
      warehouse_id: z.warehouse_id,
      name: z.label
    }))
  } catch (error) {
    ElMessage.error('加载库区列表失败')
  }
}

// 检查数据是否有更新
const checkDataVersion = () => {
  try {
    const inventoryData = JSON.parse(localStorage.getItem('inventory_stock') || '[]')
    const movementData = JSON.parse(localStorage.getItem('wms_stock_movements') || '[]')
    
    // 计算数据版本号（基于数据长度和最后更新时间）
    const currentVersion = inventoryData.length + movementData.length + 
      (inventoryData[0]?.last_updated || '').replace(/[^\d]/g, '')
    
    return currentVersion
  } catch {
    return 0
  }
}

// 加载库存数据
const loadStockData = async (showMessage = false) => {
  loading.value = true
  try {
    // 检查数据版本
    const currentVersion = checkDataVersion()
    if (currentVersion !== lastDataVersion.value) {
      lastDataVersion.value = currentVersion
      if (showMessage) {
        console.log('🔄 检测到库存数据更新，正在刷新...')
      }
    }
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 从localStorage加载库存数据
    let inventoryData = JSON.parse(localStorage.getItem('inventory_stock') || '[]')
    
    console.log('=== 库存查询数据加载 ===')
    console.log('原始库存数据:', inventoryData)
    console.log('数据版本:', currentVersion)
    
    // 确保每条记录都有必要的字段
    inventoryData = inventoryData.map(item => ({
      ...item,
      stock_status: item.stock_status || getStockStatus(item.current_stock, item.min_stock),
      available_stock: item.available_stock || (item.current_stock - (item.reserved_stock || 0)),
      qualified_stock: item.qualified_stock || item.current_stock,
      unqualified_stock: item.unqualified_stock || 0,
      reserved_stock: item.reserved_stock || 0,
      unit: item.unit || '台',
      last_updated: item.last_updated || new Date().toLocaleString()
    }))
    
    // 应用筛选条件
    let filteredData = inventoryData
    
    // 仓库筛选
    if (searchForm.warehouse_id) {
      filteredData = filteredData.filter(item => 
        item.warehouse_id == searchForm.warehouse_id
      )
    }
    
    // 库区筛选
    if (searchForm.zone_id) {
      filteredData = filteredData.filter(item => 
        (item.zone_id || 1) == searchForm.zone_id
      )
    }
    
    // 商品名称筛选
    if (searchForm.product_name) {
      filteredData = filteredData.filter(item => 
        item.product_name?.toLowerCase().includes(searchForm.product_name.toLowerCase())
      )
    }
    
    // 商品编码筛选
    if (searchForm.product_code) {
      filteredData = filteredData.filter(item => 
        item.product_code?.toLowerCase().includes(searchForm.product_code.toLowerCase())
      )
    }
    
    // 库存状态筛选
    if (searchForm.stock_status) {
      filteredData = filteredData.filter(item => 
        item.stock_status === searchForm.stock_status
      )
    }
    
    console.log('筛选后数据:', filteredData)
    
    // 分页处理
    pagination.total = filteredData.length
    const startIndex = (pagination.page - 1) * pagination.size
    const endIndex = startIndex + pagination.size
    stockList.value = filteredData.slice(startIndex, endIndex)
    
    console.log('当前页数据:', stockList.value)
    
    if (showMessage && stockList.value.length > 0) {
      ElMessage.success('库存数据已刷新')
    }
    
  } catch (error) {
    console.error('加载库存数据失败:', error)
    ElMessage.error('加载库存数据失败')
    stockList.value = []
  } finally {
    loading.value = false
  }
}

// 搜索库存
const searchStock = () => {
  loadStockData()
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    warehouse_id: null,
    zone_id: null,
    product_name: '',
    product_code: '',
    stock_status: ''
  })
  loadStockData()
}

// 刷新库存
const refreshStock = () => {
  ElMessage.success('库存数据已刷新')
  loadStockData(true)
}

// 删除库存记录
const deleteStockRecord = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除商品"${currentProduct.value?.product_name}"的库存记录吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    deleting.value = true
    
    // 从localStorage获取库存数据
    let inventoryData = JSON.parse(localStorage.getItem('inventory_stock') || '[]')
    const originalCount = inventoryData.length
    
    console.log(`🗑️ 删除库存记录: ${currentProduct.value.product_name} (${currentProduct.value.product_code}) - 仓库: ${currentProduct.value.warehouse_name}`)
    
    // 删除指定记录
    inventoryData = inventoryData.filter(item => {
      // 精确匹配要删除的记录
      const isMatch = (item.product_code === currentProduct.value.product_code || item.id === currentProduct.value.id) &&
                     item.warehouse_id == currentProduct.value.warehouse_id &&
                     (item.zone_id || 1) == (currentProduct.value.zone_id || 1)
      
      return !isMatch // 保留不匹配的记录，删除匹配的记录
    })
    
    const deletedCount = originalCount - inventoryData.length
    
    // 保存删除后的数据
    localStorage.setItem('inventory_stock', JSON.stringify(inventoryData))
    
    // 同时更新商品表的库存字段（将该仓库的库存设为0）
    const productsData = JSON.parse(localStorage.getItem('wms_products') || '[]')
    const productIndex = productsData.findIndex(p => 
      p.code === currentProduct.value.product_code || p.id === currentProduct.value.product_id
    )
    
    if (productIndex !== -1) {
      // 重新计算总库存（排除被删除的仓库库存）
      const remainingStock = inventoryData
        .filter(item => item.product_code === currentProduct.value.product_code)
        .reduce((sum, item) => sum + (item.current_stock || 0), 0)
      
      productsData[productIndex].stock = remainingStock
      productsData[productIndex].last_stock_update = new Date().toLocaleString()
      localStorage.setItem('wms_products', JSON.stringify(productsData))
    }
    
    // 记录库存变动历史
    const stockMovements = JSON.parse(localStorage.getItem('stock_movements') || '[]')
    stockMovements.push({
      id: Date.now(),
      product_code: currentProduct.value.product_code,
      product_name: currentProduct.value.product_name,
      movement_type: 'delete',
      adjust_type: 'delete',
      before_quantity: currentProduct.value.current_stock,
      after_quantity: 0,
      change_quantity: -(currentProduct.value.current_stock || 0),
      reason: '删除库存记录',
      remark: `删除 ${currentProduct.value.warehouse_name} 仓库的库存记录`,
      warehouse_name: currentProduct.value.warehouse_name || '主仓库',
      operator: '系统管理员',
      created_at: new Date().toLocaleString()
    })
    localStorage.setItem('stock_movements', JSON.stringify(stockMovements))
    
    console.log('删除后库存记录数:', inventoryData.length)
    
    ElMessage.success(`成功删除 ${deletedCount} 条库存记录`)
    
    // 关闭对话框并重新加载数据
    adjustDialogVisible.value = false
    loadStockData(true)
    
  } catch {
    // 用户取消操作
  } finally {
    deleting.value = false
  }
}

// 合并重复库存数据
const mergeDuplicateStock = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要合并重复的库存数据吗？相同商品在同一仓库同一库区的库存将会累加合并。',
      '合并确认',
      {
        confirmButtonText: '确定合并',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 从localStorage获取库存数据
    let inventoryData = JSON.parse(localStorage.getItem('inventory_stock') || '[]')
    const originalCount = inventoryData.length
    const mergedData = {}
    
    console.log('合并前库存记录数:', originalCount)
    console.log('合并前数据:', inventoryData)
    
    // 按商品编码+仓库ID+库区ID分组合并
    inventoryData.forEach(item => {
      const key = `${item.product_code}-${item.warehouse_id}-${item.zone_id || 1}`
      
      if (mergedData[key]) {
        // 合并库存数量
        const existingItem = mergedData[key]
        existingItem.current_stock = (existingItem.current_stock || 0) + (item.current_stock || 0)
        existingItem.qualified_stock = (existingItem.qualified_stock || 0) + (item.qualified_stock || 0)
        existingItem.unqualified_stock = (existingItem.unqualified_stock || 0) + (item.unqualified_stock || 0)
        existingItem.available_stock = existingItem.current_stock - (existingItem.reserved_stock || 0)
        existingItem.last_updated = new Date().toLocaleString()
        existingItem.stock_status = getStockStatus(existingItem.current_stock, existingItem.min_stock)
        
        console.log(`🔄 合并重复记录: ${item.product_name} 在 ${item.warehouse_name}-${item.zone_name}`)
      } else {
        mergedData[key] = { 
          ...item,
          stock_status: getStockStatus(item.current_stock, item.min_stock)
        }
      }
    })
    
    // 转换回数组
    const finalData = Object.values(mergedData)
    const mergedCount = originalCount - finalData.length
    
    // 保存合并后的数据
    localStorage.setItem('inventory_stock', JSON.stringify(finalData))
    
    console.log('合并后库存记录数:', finalData.length)
    console.log('合并后数据:', finalData)
    
    ElMessage.success(`成功合并 ${mergedCount} 条重复库存记录`)
    
    // 重新加载库存数据
    loadStockData(true)
    
  } catch {
    // 用户取消操作
  }
}

// 启动自动刷新
const startAutoRefresh = () => {
  stopAutoRefresh() // 先停止之前的定时器
  
  // 每30秒检查一次数据是否有更新
  autoRefreshTimer.value = setInterval(() => {
    const currentVersion = checkDataVersion()
    if (currentVersion !== lastDataVersion.value) {
      console.log('🔄 自动检测到库存数据更新，正在刷新...')
      loadStockData(true)
    }
  }, 30000) // 30秒检查一次
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (autoRefreshTimer.value) {
    clearInterval(autoRefreshTimer.value)
    autoRefreshTimer.value = null
  }
}

// 页面可见性变化时的处理
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    // 页面变为可见时，检查是否需要刷新数据
    const currentVersion = checkDataVersion()
    if (currentVersion !== lastDataVersion.value) {
      console.log('🔄 页面重新获得焦点，检测到数据更新，正在刷新...')
      loadStockData(true)
    }
    startAutoRefresh()
  } else {
    // 页面隐藏时停止自动刷新以节省资源
    stopAutoRefresh()
  }
}

// 导出数据
const exportData = () => {
  if (stockList.value.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }
  
  // 获取当前筛选条件下的所有数据
  let inventoryData = JSON.parse(localStorage.getItem('inventory_stock') || '[]')
  
  // 应用当前筛选条件
  let filteredData = inventoryData
  
  if (searchForm.warehouse_id) {
    filteredData = filteredData.filter(item => 
      item.warehouse_id == searchForm.warehouse_id
    )
  }
  
  if (searchForm.zone_id) {
    filteredData = filteredData.filter(item => 
      (item.zone_id || 1) == searchForm.zone_id
    )
  }
  
  if (searchForm.product_name) {
    filteredData = filteredData.filter(item => 
      item.product_name?.toLowerCase().includes(searchForm.product_name.toLowerCase())
    )
  }
  
  if (searchForm.product_code) {
    filteredData = filteredData.filter(item => 
      item.product_code?.toLowerCase().includes(searchForm.product_code.toLowerCase())
    )
  }
  
  if (searchForm.stock_status) {
    filteredData = filteredData.filter(item => 
      item.stock_status === searchForm.stock_status
    )
  }
  
  const exportData = filteredData.map(item => ({
    '仓库名称': item.warehouse_name || '',
    '库区名称': item.zone_name || '',
    '库位名称': item.location_name || '',
    '商品编码': item.product_code || '',
    '商品名称': item.product_name || '',
    'iSKU': item.isku || '',
    '当前库存': item.current_stock || 0,
    '可用库存': item.available_stock || 0,
    '预留库存': item.reserved_stock || 0,
    '合格库存': item.qualified_stock || 0,
    '不合格库存': item.unqualified_stock || 0,
    '单位': item.unit || '',
    '单价': item.unit_price || 0,
    '库存金额': ((item.current_stock || 0) * (item.unit_price || 0)).toFixed(2),
    '最低库存': item.min_stock || 0,
    '最高库存': item.max_stock || 0,
    '库存状态': item.stock_status || '',
    '最后更新时间': item.last_updated || ''
  }))
  
  const headers = Object.keys(exportData[0])
  const csvContent = [
    headers.join(','),
    ...exportData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
  ].join('\n')
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `库存查询数据_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  ElMessage.success(`成功导出 ${exportData.length} 条库存数据`)
}

// 显示库存说明
const showStockInfo = () => {
  ElMessageBox.alert(
    `
📊 库存状态说明：

🟢 正常：当前库存 > 最低库存
🟡 预警：当前库存 ≤ 最低库存（需要及时补货）
🔴 缺货：当前库存 = 0（紧急补货）

📦 库存字段说明：

• 当前库存：实际在库商品数量
• 预留库存：已分配给出库单但未出库的数量（约占10%）
• 可用库存：可用于新订单分配的数量（当前库存 - 预留库存）
• 最低库存：安全库存阈值，低于此值系统会预警

⚠️ 库存预警机制：
系统会自动监控库存水平，当商品库存低于最低库存时会显示预警标识，提醒管理员及时补货，避免断货风险。

💡 建议：
定期检查预警商品，合理设置最低库存值，确保供应链稳定。
    `,
    '库存管理说明',
    {
      confirmButtonText: '知道了',
      type: 'info',
      dangerouslyUseHTMLString: false
    }
  )
}

// 调整库存
const adjustStock = (product) => {
  currentProduct.value = product
  // 初始化调整表单的仓库和库区
  adjustForm.warehouse_id = product.warehouse_id || warehouses.value[0]?.id
  adjustForm.zone_id = product.zone_id || zones.value.find(z => z.warehouse_id === adjustForm.warehouse_id)?.id
  adjustDialogVisible.value = true
}

// 查看历史记录
const viewHistory = (product) => {
  ElMessage.info(`查看 ${product.product_name} 的库存历史记录`)
}

// 删除库存记录
const deleteStock = async (product) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除商品"${product.product_name}"的库存记录吗？\n仓库：${product.warehouse_name}\n当前库存：${product.current_stock} ${product.unit}\n\n此操作不可恢复！`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 从localStorage获取库存数据
    let inventoryData = JSON.parse(localStorage.getItem('inventory_stock') || '[]')
    const originalCount = inventoryData.length
    
    console.log(`🗑️ 删除库存记录: ${product.product_name} (${product.product_code}) - 仓库: ${product.warehouse_name}`)
    
    // 删除指定记录
    inventoryData = inventoryData.filter(item => {
      // 精确匹配要删除的记录
      const isMatch = (item.product_code === product.product_code || item.id === product.id) &&
                     item.warehouse_id == product.warehouse_id &&
                     (item.zone_id || 1) == (product.zone_id || 1)
      
      return !isMatch // 保留不匹配的记录，删除匹配的记录
    })
    
    const deletedCount = originalCount - inventoryData.length
    
    if (deletedCount === 0) {
      ElMessage.warning('未找到要删除的库存记录')
      return
    }
    
    // 保存删除后的数据
    localStorage.setItem('inventory_stock', JSON.stringify(inventoryData))
    
    // 同时更新商品表的库存字段（将该仓库的库存设为0）
    const productsData = JSON.parse(localStorage.getItem('wms_products') || '[]')
    const productIndex = productsData.findIndex(p => 
      p.code === product.product_code || p.id === product.product_id
    )
    
    if (productIndex !== -1) {
      // 重新计算总库存（排除被删除的仓库库存）
      const remainingStock = inventoryData
        .filter(item => item.product_code === product.product_code)
        .reduce((sum, item) => sum + (item.current_stock || 0), 0)
      
      productsData[productIndex].stock = remainingStock
      productsData[productIndex].last_stock_update = new Date().toLocaleString()
      localStorage.setItem('wms_products', JSON.stringify(productsData))
    }
    
    // 记录库存变动历史
    const stockMovements = JSON.parse(localStorage.getItem('wms_stock_movements') || '[]')
    stockMovements.push({
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      product_id: product.product_id,
      product_code: product.product_code,
      product_name: product.product_name,
      movement_type: 'adjustment',
      quantity: -(product.current_stock || 0),
      before_quantity: product.current_stock || 0,
      after_quantity: 0,
      warehouse_id: product.warehouse_id,
      location_id: product.location_id || '1',
      location_name: product.location_name || 'A001',
      order_no: '',
      remark: `删除库存记录 - ${product.warehouse_name}`,
      created_at: new Date().toISOString(),
      created_by: '系统管理员'
    })
    localStorage.setItem('wms_stock_movements', JSON.stringify(stockMovements))
    
    console.log('删除后库存记录数:', inventoryData.length)
    
    ElMessage.success(`成功删除 ${deletedCount} 条库存记录`)
    
    // 重新加载数据
    await loadStockData(true)
    
  } catch (error) {
    // 用户取消删除或其他错误
    if (error !== 'cancel') {
      console.error('删除库存记录失败:', error)
      ElMessage.error('删除记录失败')
    }
  }
}

// 提交库存调整
const submitAdjust = async () => {
  if (!adjustFormRef.value) return
  
  try {
    await adjustFormRef.value.validate()
    adjusting.value = true
    
    const adjustQuantity = adjustForm.quantity || 0
    const adjustType = adjustForm.adjust_type
    
    // 计算新库存
    let newStock = currentProduct.value.current_stock || 0
    if (adjustType === 'in') {
      newStock += adjustQuantity
    } else if (adjustType === 'out') {
      newStock = Math.max(0, newStock - adjustQuantity)
    } else if (adjustType === 'set') {
      newStock = adjustQuantity
    }
    
    // 更新库存数据
    let inventoryData = JSON.parse(localStorage.getItem('inventory_stock') || '[]')
    
    // 查找并更新记录
    const index = inventoryData.findIndex(item => 
      item.product_code === currentProduct.value.product_code || 
      item.id === currentProduct.value.id
    )
    
    if (index !== -1) {
      inventoryData[index] = {
        ...inventoryData[index],
        current_stock: newStock,
        qualified_stock: newStock,
        available_stock: newStock - (inventoryData[index].reserved_stock || 0),
        stock_status: getStockStatus(newStock, inventoryData[index].min_stock),
        last_updated: new Date().toLocaleString(),
        last_adjust_reason: adjustForm.reason,
        last_adjust_remark: adjustForm.remark
      }
    } else {
      // 如果没有记录，创建新记录
      inventoryData.push({
        id: Date.now(),
        product_id: currentProduct.value.product_id,
        product_code: currentProduct.value.product_code,
        product_name: currentProduct.value.product_name,
        warehouse_id: searchForm.warehouse_id || 1,
        warehouse_name: currentProduct.value.warehouse_name || '主仓库',
        zone_id: searchForm.zone_id || 1,
        zone_name: currentProduct.value.zone_name || 'A区',
        location_id: 1,
        location_name: currentProduct.value.location_name || 'A001',
        current_stock: newStock,
        qualified_stock: newStock,
        unqualified_stock: 0,
        reserved_stock: 0,
        available_stock: newStock,
        min_stock: currentProduct.value.min_stock || 10,
        unit: currentProduct.value.unit || '台',
        stock_status: getStockStatus(newStock, currentProduct.value.min_stock || 10),
        last_updated: new Date().toLocaleString(),
        last_adjust_reason: adjustForm.reason,
        last_adjust_remark: adjustForm.remark
      })
    }
    
    // 保存到localStorage
    localStorage.setItem('inventory_stock', JSON.stringify(inventoryData))
    
    // 同时更新商品表的库存字段
    const productsData = JSON.parse(localStorage.getItem('wms_products') || '[]')
    const productIndex = productsData.findIndex(p => 
      p.code === currentProduct.value.product_code || p.id === currentProduct.value.product_id
    )
    
    if (productIndex !== -1) {
      productsData[productIndex].stock = newStock
      productsData[productIndex].last_stock_update = new Date().toLocaleString()
      localStorage.setItem('wms_products', JSON.stringify(productsData))
    }
    
    // 记录库存变动历史
    const stockMovements = JSON.parse(localStorage.getItem('stock_movements') || '[]')
    stockMovements.push({
      id: Date.now(),
      product_code: currentProduct.value.product_code,
      product_name: currentProduct.value.product_name,
      movement_type: 'adjust',
      adjust_type: adjustType,
      before_quantity: currentProduct.value.current_stock,
      after_quantity: newStock,
      change_quantity: adjustType === 'set' ? (newStock - currentProduct.value.current_stock) : 
                      (adjustType === 'in' ? adjustQuantity : -adjustQuantity),
      reason: adjustForm.reason,
      remark: adjustForm.remark,
      warehouse_name: currentProduct.value.warehouse_name || '主仓库',
      operator: '系统管理员',
      created_at: new Date().toLocaleString()
    })
    localStorage.setItem('stock_movements', JSON.stringify(stockMovements))
    
    ElMessage.success(`库存调整成功！${currentProduct.value.product_name} 库存从 ${currentProduct.value.current_stock} 调整为 ${newStock}`)
    adjustDialogVisible.value = false
    loadStockData()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('库存调整失败')
    }
  } finally {
    adjusting.value = false
  }
}

// 重置调整表单
const resetAdjustForm = () => {
  if (adjustFormRef.value) {
    adjustFormRef.value.resetFields()
  }
  Object.assign(adjustForm, {
    adjust_type: 'in',
    quantity: 1,
    warehouse_id: null,
    zone_id: null,
    reason: '',
    remark: ''
  })
  currentProduct.value = null
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  loadStockData()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadStockData()
}

// 暴露方法给父组件调用
defineExpose({
  loadStockData,
  refreshStock,
  checkDataVersion
})

onMounted(() => {
  loadWarehouses()
  loadZones()
  loadStockData()
  // 加载库存状态选项
  stockStatusOptions.value = getStockStatusOptions()
  
  // 启动自动刷新
  startAutoRefresh()
  
  // 监听页面可见性变化
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  // 监听storage事件（当其他标签页修改localStorage时触发）
  window.addEventListener('storage', (e) => {
    if (e.key === 'inventory_stock' || e.key === 'wms_stock_movements') {
      console.log('🔄 检测到其他页面修改了库存数据，正在刷新...')
      loadStockData(true)
    }
  })
})

onUnmounted(() => {
  // 清理定时器和事件监听
  stopAutoRefresh()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('storage', handleVisibilityChange)
})
</script>

<style lang="scss" scoped>
.stock-page {
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

.search-card, .table-card {
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
  
  .stat-card {
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
        
        &.total {
          background: linear-gradient(45deg, #409EFF, #67C23A);
        }
        
        &.normal {
          background: linear-gradient(45deg, #67C23A, #85CE61);
        }
        
        &.warning {
          background: linear-gradient(45deg, #E6A23C, #EEBE77);
        }
        
        &.empty {
          background: linear-gradient(45deg, #F56C6C, #F78989);
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

// 库存状态样式
.stock-normal {
  color: #67C23A;
  font-weight: 600;
}

.stock-warning {
  color: #E6A23C;
  font-weight: 600;
}

.stock-empty {
  color: #F56C6C;
  font-weight: 600;
}

.unqualified-stock {
  color: #E6A23C;
  font-weight: 600;
}

.product-info {
  .text-muted {
    color: #909399;
    font-size: 13px;
    margin-top: 4px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .stock-page {
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
      
      .el-input, .el-select {
        width: 100% !important;
      }
    }
  }
  
  :deep(.el-table) {
    font-size: 12px;
    
    .el-button {
      padding: 5px 8px;
      font-size: 11px;
    }
  }
}

// 表格滚动条优化
:deep(.el-table) {
  .el-table__body-wrapper {
    // 优化滚动条样式
    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
      
      &:hover {
        background: #a8a8a8;
      }
    }
    
    &::-webkit-scrollbar-corner {
      background: #f1f1f1;
    }
  }
  
  // 修复水平滚动条显示问题
  .el-scrollbar__bar.is-horizontal {
    height: 8px !important;
    bottom: 0 !important;
    
    .el-scrollbar__thumb {
      background: #c1c1c1;
      border-radius: 4px;
      
      &:hover {
        background: #a8a8a8;
      }
    }
  }
  
  .el-scrollbar__bar.is-vertical {
    width: 8px !important;
    right: 0 !important;
    
    .el-scrollbar__thumb {
      background: #c1c1c1;
      border-radius: 4px;
      
      &:hover {
        background: #a8a8a8;
      }
    }
  }
  
  // 表格行悬停效果
  .el-table__row {
    transition: background-color 0.2s ease;
    
    &:hover {
      background-color: #f5f7fa !important;
    }
  }
  
  // 固定列阴影优化
  .el-table__fixed-right {
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  }
  
  // 表头样式优化
  .el-table__header-wrapper {
    .el-table__header {
      th {
        background-color: #fafafa;
        color: #606266;
        font-weight: 600;
        border-bottom: 2px solid #e4e7ed;
      }
    }
  }
}

// 空数据状态样式
:deep(.el-table__empty-block) {
  padding: 60px 0;
  
  .el-table__empty-text {
    color: #909399;
    font-size: 14px;
    
    &::before {
      content: "📦";
      display: block;
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    &::after {
      content: "暂无库存数据，请先进行入库操作";
      display: block;
      margin-top: 8px;
      font-size: 12px;
      color: #c0c4cc;
    }
  }
}
</style>