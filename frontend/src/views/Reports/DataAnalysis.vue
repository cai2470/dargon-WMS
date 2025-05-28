<template>
  <div class="data-analysis-container">
    <div class="page-header">
      <h2>数据分析</h2>
      <div class="header-actions">
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" label-width="80px" :inline="true">
        <el-form-item label="仓库">
          <el-select 
            v-model="filterForm.warehouse_id" 
            placeholder="请选择仓库"
            clearable
            style="width: 150px"
            @change="handleFilterChange"
          >
            <el-option 
              v-for="warehouse in warehouses" 
              :key="warehouse.id"
              :label="warehouse.name" 
              :value="warehouse.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 200px"
            @change="handleFilterChange"
          />
        </el-form-item>
        <el-form-item label="分析维度">
          <el-radio-group v-model="filterForm.dimension" @change="handleFilterChange">
            <el-radio label="all">全部</el-radio>
            <el-radio label="warehouse">仓库</el-radio>
            <el-radio label="category">分类</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyFilter">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 概览卡片 -->
    <div class="overview-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="overview-card">
            <div class="card-icon inventory">
              <el-icon><Box /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-title">总库存价值</div>
              <div class="card-value">¥{{ formatNumber(overview.totalInventoryValue) }}</div>
              <div class="card-trend" :class="overview.inventoryTrend >= 0 ? 'up' : 'down'">
                <el-icon v-if="overview.inventoryTrend >= 0"><ArrowUp /></el-icon>
                <el-icon v-else><ArrowDown /></el-icon>
                {{ Math.abs(overview.inventoryTrend) }}%
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="overview-card">
            <div class="card-icon inbound">
              <el-icon><Download /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-title">入库订单</div>
              <div class="card-value">{{ overview.inboundOrders }}</div>
              <div class="card-trend" :class="overview.inboundTrend >= 0 ? 'up' : 'down'">
                <el-icon v-if="overview.inboundTrend >= 0"><ArrowUp /></el-icon>
                <el-icon v-else><ArrowDown /></el-icon>
                {{ Math.abs(overview.inboundTrend) }}%
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="overview-card">
            <div class="card-icon outbound">
              <el-icon><Upload /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-title">出库订单</div>
              <div class="card-value">{{ overview.outboundOrders }}</div>
              <div class="card-trend" :class="overview.outboundTrend >= 0 ? 'up' : 'down'">
                <el-icon v-if="overview.outboundTrend >= 0"><ArrowUp /></el-icon>
                <el-icon v-else><ArrowDown /></el-icon>
                {{ Math.abs(overview.outboundTrend) }}%
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="overview-card">
            <div class="card-icon turnover">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-title">库存周转率</div>
              <div class="card-value">{{ overview.turnoverRate }}%</div>
              <div class="card-trend" :class="overview.turnoverTrend >= 0 ? 'up' : 'down'">
                <el-icon v-if="overview.turnoverTrend >= 0"><ArrowUp /></el-icon>
                <el-icon v-else><ArrowDown /></el-icon>
                {{ Math.abs(overview.turnoverTrend) }}%
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 仓库对比分析 -->
    <div class="charts-container">
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>仓库对比分析</h3>
            </div>
            <el-table :data="warehouseData" stripe border v-loading="loading">
              <el-table-column prop="name" label="仓库名称" width="120" />
              <el-table-column prop="inventory_value" label="库存价值" align="right">
                <template #default="{ row }">
                  ¥{{ formatNumber(row.inventory_value) }}
                </template>
              </el-table-column>
              <el-table-column prop="inbound_count" label="入库单数" width="100" align="right" />
              <el-table-column prop="outbound_count" label="出库单数" width="100" align="right" />
              <el-table-column prop="utilization" label="利用率" width="80" align="right">
                <template #default="{ row }">
                  {{ row.utilization }}%
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.status === '正常' ? 'success' : 'warning'">
                    {{ row.status }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-col>

        <el-col :span="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>商品分类统计</h3>
            </div>
            <el-table :data="categoryData" stripe border v-loading="loading">
              <el-table-column prop="name" label="分类名称" width="120" />
              <el-table-column prop="quantity" label="库存数量" align="right" />
              <el-table-column prop="value" label="库存价值" align="right">
                <template #default="{ row }">
                  ¥{{ formatNumber(row.value) }}
                </template>
              </el-table-column>
              <el-table-column prop="inbound_qty" label="入库数量" width="100" align="right" />
              <el-table-column prop="outbound_qty" label="出库数量" width="100" align="right" />
              <el-table-column prop="percentage" label="占比" width="80" align="right">
                <template #default="{ row }">
                  {{ row.percentage }}%
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-col>
      </el-row>

      <!-- 总数据汇总 -->
      <div class="chart-card" style="margin-top: 20px;" v-if="filterForm.dimension === 'all'">
        <div class="chart-header">
          <h3>总数据汇总</h3>
        </div>
        <el-descriptions :column="4" border>
          <el-descriptions-item label="总商品数">{{ summaryData.totalProducts }}</el-descriptions-item>
          <el-descriptions-item label="总库存数量">{{ formatNumber(summaryData.totalStock) }}</el-descriptions-item>
          <el-descriptions-item label="总库存价值">¥{{ formatNumber(summaryData.totalValue) }}</el-descriptions-item>
          <el-descriptions-item label="活跃仓库数">{{ summaryData.activeWarehouses }}</el-descriptions-item>
          <el-descriptions-item label="本周入库订单">{{ summaryData.weekInboundOrders }}</el-descriptions-item>
          <el-descriptions-item label="本周出库订单">{{ summaryData.weekOutboundOrders }}</el-descriptions-item>
          <el-descriptions-item label="本周入库数量">{{ formatNumber(summaryData.weekInboundQty) }}</el-descriptions-item>
          <el-descriptions-item label="本周出库数量">{{ formatNumber(summaryData.weekOutboundQty) }}</el-descriptions-item>
          <el-descriptions-item label="平均处理时间">{{ summaryData.avgProcessTime }}小时</el-descriptions-item>
          <el-descriptions-item label="库存周转率">{{ summaryData.turnoverRate }}%</el-descriptions-item>
          <el-descriptions-item label="库存预警数">{{ summaryData.lowStockAlerts }}</el-descriptions-item>
          <el-descriptions-item label="零库存商品">{{ summaryData.zeroStockProducts }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 详细数据表格 -->
      <div class="chart-card" style="margin-top: 20px;">
        <div class="chart-header">
          <h3>本周详细数据</h3>
        </div>
        <el-table :data="detailData" stripe border style="width: 100%" v-loading="loading">
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="warehouse_name" label="仓库" width="120" v-if="filterForm.dimension === 'warehouse'" />
          <el-table-column prop="inbound_orders" label="入库订单" width="100" align="right" />
          <el-table-column prop="outbound_orders" label="出库订单" width="100" align="right" />
          <el-table-column prop="inbound_qty" label="入库数量" width="100" align="right" />
          <el-table-column prop="outbound_qty" label="出库数量" width="100" align="right" />
          <el-table-column prop="inventory_value" label="库存价值" width="150" align="right">
            <template #default="{ row }">
              ¥{{ formatNumber(row.inventory_value) }}
            </template>
          </el-table-column>
          <el-table-column prop="inbound_value" label="入库金额" width="150" align="right">
            <template #default="{ row }">
              ¥{{ formatNumber(row.inbound_value) }}
            </template>
          </el-table-column>
          <el-table-column prop="outbound_value" label="出库金额" width="150" align="right">
            <template #default="{ row }">
              ¥{{ formatNumber(row.outbound_value) }}
            </template>
          </el-table-column>
          <el-table-column prop="turnover_rate" label="周转率" width="100" align="right">
            <template #default="{ row }">
              {{ row.turnover_rate }}%
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh, Box, Download, Upload, TrendCharts,
  ArrowUp, ArrowDown
} from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)

// 搜索筛选表单
const filterForm = reactive({
  warehouse_id: null,
  date_range: [],
  dimension: 'all'
})

// 基础数据
const warehouses = ref([])
const allInventoryData = ref([])
const allInboundOrders = ref([])
const allOutboundOrders = ref([])

// 简单的格式化函数
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  return Number(num).toLocaleString()
}

// 概览数据
const overview = reactive({
  totalInventoryValue: 0,
  inventoryTrend: 0,
  inboundOrders: 0,
  inboundTrend: 0,
  outboundOrders: 0,
  outboundTrend: 0,
  turnoverRate: 0,
  turnoverTrend: 0
})

// 仓库数据
const warehouseData = ref([])

// 分类数据
const categoryData = ref([])

// 汇总数据
const summaryData = reactive({
  totalProducts: 0,
  totalStock: 0,
  totalValue: 0,
  activeWarehouses: 0,
  weekInboundOrders: 0,
  weekOutboundOrders: 0,
  weekInboundQty: 0,
  weekOutboundQty: 0,
  avgProcessTime: 0,
  turnoverRate: 0,
  lowStockAlerts: 0,
  zeroStockProducts: 0
})

// 详细数据
const detailData = ref([])

// 加载基础数据
const loadBasicData = async () => {
  try {
    loading.value = true

    // 加载仓库数据
    const warehouseList = JSON.parse(localStorage.getItem('wms_warehouses') || '[]')
    warehouses.value = warehouseList.filter(w => w.status === 1 || w.status === '启用').map(w => ({
      id: w.id,
      name: w.name,
      code: w.code
    }))

    // 加载库存数据
    allInventoryData.value = JSON.parse(localStorage.getItem('inventory_stock') || '[]')

    // 加载入库单数据
    allInboundOrders.value = JSON.parse(localStorage.getItem('inbound_orders') || '[]')

    // 加载出库单数据
    allOutboundOrders.value = JSON.parse(localStorage.getItem('outbound_orders') || '[]')

    console.log('基础数据加载完成:', {
      warehouses: warehouses.value.length,
      inventory: allInventoryData.value.length,
      inbound: allInboundOrders.value.length,
      outbound: allOutboundOrders.value.length
    })

  } catch (error) {
    console.error('加载基础数据失败:', error)
    ElMessage.error('加载基础数据失败')
  } finally {
    loading.value = false
  }
}

// 应用筛选
const applyFilter = () => {
  loading.value = true
  try {
    updateOverview()
    updateWarehouseData()
    updateCategoryData()
    updateSummaryData()
    updateDetailData()
  } catch (error) {
    console.error('数据分析失败:', error)
    ElMessage.error('数据分析失败')
  } finally {
    loading.value = false
  }
}

// 重置筛选
const resetFilter = () => {
  Object.assign(filterForm, {
    warehouse_id: null,
    date_range: [],
    dimension: 'all'
  })
  applyFilter()
}

// 筛选变化处理
const handleFilterChange = () => {
  // 可以在这里添加实时筛选逻辑
}

// 更新概览数据
const updateOverview = () => {
  // 计算总库存价值
  overview.totalInventoryValue = allInventoryData.value.reduce((sum, item) => {
    return sum + ((item.current_stock || 0) * (item.unit_price || 0))
  }, 0)

  // 计算入库订单数量
  overview.inboundOrders = allInboundOrders.value.length

  // 计算出库订单数量
  overview.outboundOrders = allOutboundOrders.value.length

  // 计算库存周转率（简化计算）
  const totalInboundValue = allInboundOrders.value.reduce((sum, order) => {
    return sum + (order.products || []).reduce((pSum, product) => {
      return pSum + ((product.actual_quantity || product.expected_quantity || 0) * (product.unit_price || 0))
    }, 0)
  }, 0)

  overview.turnoverRate = overview.totalInventoryValue > 0 
    ? Math.round((totalInboundValue / overview.totalInventoryValue) * 100) 
    : 0

  // 模拟趋势数据
  overview.inventoryTrend = Math.round((Math.random() - 0.5) * 20 * 100) / 100
  overview.inboundTrend = Math.round((Math.random() - 0.3) * 30 * 100) / 100
  overview.outboundTrend = Math.round((Math.random() - 0.3) * 25 * 100) / 100
  overview.turnoverTrend = Math.round((Math.random() - 0.4) * 15 * 100) / 100
}

// 更新仓库数据
const updateWarehouseData = () => {
  const warehouseStats = new Map()

  // 初始化仓库统计
  warehouses.value.forEach(warehouse => {
    warehouseStats.set(warehouse.id, {
      id: warehouse.id,
      name: warehouse.name,
      inventory_value: 0,
      inbound_count: 0,
      outbound_count: 0,
      utilization: 0,
      status: '正常'
    })
  })

  // 统计库存价值
  allInventoryData.value.forEach(item => {
    const warehouseId = item.warehouse_id
    if (warehouseStats.has(warehouseId)) {
      const stat = warehouseStats.get(warehouseId)
      stat.inventory_value += (item.current_stock || 0) * (item.unit_price || 0)
    }
  })

  // 统计入库单数量
  allInboundOrders.value.forEach(order => {
    const warehouseId = order.warehouse_id || order.target_warehouse
    if (warehouseStats.has(warehouseId)) {
      warehouseStats.get(warehouseId).inbound_count++
    }
  })

  // 统计出库单数量
  allOutboundOrders.value.forEach(order => {
    const warehouseId = order.warehouse_id
    if (warehouseStats.has(warehouseId)) {
      warehouseStats.get(warehouseId).outbound_count++
    }
  })

  // 计算利用率（基于库存价值占比）
  const maxValue = Math.max(...Array.from(warehouseStats.values()).map(s => s.inventory_value))
  warehouseStats.forEach(stat => {
    stat.utilization = maxValue > 0 ? Math.round((stat.inventory_value / maxValue) * 100) : 0
  })

  warehouseData.value = Array.from(warehouseStats.values())
}

// 更新分类数据
const updateCategoryData = () => {
  const categoryStats = new Map()

  // 加载商品数据获取分类信息
  const products = JSON.parse(localStorage.getItem('wms_products') || '[]')

  allInventoryData.value.forEach(item => {
    const product = products.find(p => p.code === item.product_code || p.id === item.product_id)
    const category = product?.category || '未分类'

    if (!categoryStats.has(category)) {
      categoryStats.set(category, {
        name: category,
        quantity: 0,
        value: 0,
        inbound_qty: 0,
        outbound_qty: 0,
        percentage: 0
      })
    }

    const stat = categoryStats.get(category)
    stat.quantity += item.current_stock || 0
    stat.value += (item.current_stock || 0) * (item.unit_price || 0)
  })

  // 计算入库出库数量
  allInboundOrders.value.forEach(order => {
    (order.products || []).forEach(product => {
      const productInfo = products.find(p => p.code === product.product_code || p.id === product.product_id)
      const category = productInfo?.category || '未分类'
      
      if (categoryStats.has(category)) {
        categoryStats.get(category).inbound_qty += product.actual_quantity || product.expected_quantity || 0
      }
    })
  })

  allOutboundOrders.value.forEach(order => {
    (order.products || []).forEach(product => {
      const productInfo = products.find(p => p.code === product.product_code || p.id === product.product_id)
      const category = productInfo?.category || '未分类'
      
      if (categoryStats.has(category)) {
        categoryStats.get(category).outbound_qty += product.actual_quantity || product.expected_quantity || 0
      }
    })
  })

  // 计算占比
  const totalValue = Array.from(categoryStats.values()).reduce((sum, stat) => sum + stat.value, 0)
  categoryStats.forEach(stat => {
    stat.percentage = totalValue > 0 ? Math.round((stat.value / totalValue) * 100) : 0
  })

  categoryData.value = Array.from(categoryStats.values())
}

// 更新汇总数据
const updateSummaryData = () => {
  const products = JSON.parse(localStorage.getItem('wms_products') || '[]')
  
  summaryData.totalProducts = products.length
  summaryData.totalStock = allInventoryData.value.reduce((sum, item) => sum + (item.current_stock || 0), 0)
  summaryData.totalValue = overview.totalInventoryValue
  summaryData.activeWarehouses = warehouses.value.length

  // 计算本周数据
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  summaryData.weekInboundOrders = allInboundOrders.value.filter(order => 
    new Date(order.created_at) >= oneWeekAgo
  ).length

  summaryData.weekOutboundOrders = allOutboundOrders.value.filter(order => 
    new Date(order.created_at) >= oneWeekAgo
  ).length

  summaryData.weekInboundQty = allInboundOrders.value
    .filter(order => new Date(order.created_at) >= oneWeekAgo)
    .reduce((sum, order) => {
      return sum + (order.products || []).reduce((pSum, product) => {
        return pSum + (product.actual_quantity || product.expected_quantity || 0)
      }, 0)
    }, 0)

  summaryData.weekOutboundQty = allOutboundOrders.value
    .filter(order => new Date(order.created_at) >= oneWeekAgo)
    .reduce((sum, order) => {
      return sum + (order.products || []).reduce((pSum, product) => {
        return pSum + (product.actual_quantity || product.expected_quantity || 0)
      }, 0)
    }, 0)

  // 计算平均处理时间
  const completedOrders = allInboundOrders.value.filter(order => order.status === 'completed' && order.created_at && order.shelving_end_time)
  if (completedOrders.length > 0) {
    const totalTime = completedOrders.reduce((sum, order) => {
      const start = new Date(order.created_at)
      const end = new Date(order.shelving_end_time)
      return sum + (end - start) / (1000 * 60 * 60) // 小时
    }, 0)
    summaryData.avgProcessTime = Math.round(totalTime / completedOrders.length * 10) / 10
  }

  summaryData.turnoverRate = overview.turnoverRate

  // 计算预警数量
  summaryData.lowStockAlerts = allInventoryData.value.filter(item => {
    const currentStock = item.current_stock || 0
    const minStock = item.min_stock || 10
    return currentStock <= minStock && currentStock > 0
  }).length

  summaryData.zeroStockProducts = allInventoryData.value.filter(item => 
    (item.current_stock || 0) === 0
  ).length
}

// 更新详细数据
const updateDetailData = () => {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push(date.toISOString().split('T')[0])
  }

  if (filterForm.dimension === 'warehouse' && filterForm.warehouse_id) {
    // 按仓库分析
    const warehouse = warehouses.value.find(w => w.id === filterForm.warehouse_id)
    detailData.value = days.map(date => {
      const dayInbound = allInboundOrders.value.filter(order => 
        order.created_at?.startsWith(date) && 
        (order.warehouse_id === filterForm.warehouse_id || order.target_warehouse === filterForm.warehouse_id)
      )
      const dayOutbound = allOutboundOrders.value.filter(order => 
        order.created_at?.startsWith(date) && order.warehouse_id === filterForm.warehouse_id
      )

      const inboundQty = dayInbound.reduce((sum, order) => 
        sum + (order.products || []).reduce((pSum, p) => pSum + (p.actual_quantity || p.expected_quantity || 0), 0), 0
      )
      const outboundQty = dayOutbound.reduce((sum, order) => 
        sum + (order.products || []).reduce((pSum, p) => pSum + (p.actual_quantity || p.expected_quantity || 0), 0), 0
      )

      return {
        date,
        warehouse_name: warehouse?.name || '未知仓库',
        inbound_orders: dayInbound.length,
        outbound_orders: dayOutbound.length,
        inbound_qty: inboundQty,
        outbound_qty: outboundQty,
        inventory_value: Math.floor(Math.random() * 500000) + 100000,
        inbound_value: dayInbound.reduce((sum, order) => 
          sum + (order.products || []).reduce((pSum, p) => 
            pSum + ((p.actual_quantity || p.expected_quantity || 0) * (p.unit_price || 0)), 0
          ), 0
        ),
        outbound_value: dayOutbound.reduce((sum, order) => 
          sum + (order.products || []).reduce((pSum, p) => 
            pSum + ((p.actual_quantity || p.expected_quantity || 0) * (p.unit_price || 0)), 0
          ), 0
        ),
        turnover_rate: Math.floor(Math.random() * 30) + 50
      }
    })
  } else {
    // 全部数据分析
    detailData.value = days.map(date => {
      const dayInbound = allInboundOrders.value.filter(order => order.created_at?.startsWith(date))
      const dayOutbound = allOutboundOrders.value.filter(order => order.created_at?.startsWith(date))

      const inboundQty = dayInbound.reduce((sum, order) => 
        sum + (order.products || []).reduce((pSum, p) => pSum + (p.actual_quantity || p.expected_quantity || 0), 0), 0
      )
      const outboundQty = dayOutbound.reduce((sum, order) => 
        sum + (order.products || []).reduce((pSum, p) => pSum + (p.actual_quantity || p.expected_quantity || 0), 0), 0
      )

      return {
        date,
        inbound_orders: dayInbound.length,
        outbound_orders: dayOutbound.length,
        inbound_qty: inboundQty,
        outbound_qty: outboundQty,
        inventory_value: Math.floor(Math.random() * 1000000) + 500000,
        inbound_value: dayInbound.reduce((sum, order) => 
          sum + (order.products || []).reduce((pSum, p) => 
            pSum + ((p.actual_quantity || p.expected_quantity || 0) * (p.unit_price || 0)), 0
          ), 0
        ),
        outbound_value: dayOutbound.reduce((sum, order) => 
          sum + (order.products || []).reduce((pSum, p) => 
            pSum + ((p.actual_quantity || p.expected_quantity || 0) * (p.unit_price || 0)), 0
          ), 0
        ),
        turnover_rate: Math.floor(Math.random() * 40) + 40
      }
    })
  }
}

// 刷新数据
const refreshData = async () => {
  await loadBasicData()
  applyFilter()
  ElMessage.success('数据分析已刷新')
}

// 生命周期
onMounted(async () => {
  await loadBasicData()
  applyFilter()
})
</script>

<style scoped>
.data-analysis-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.overview-cards {
  margin-bottom: 20px;
}

.overview-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.card-icon.inventory {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-icon.inbound {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.card-icon.outbound {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.card-icon.turnover {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.card-trend {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.card-trend.up {
  color: #67C23A;
}

.card-trend.down {
  color: #F56C6C;
}

.charts-container {
  margin-top: 20px;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.chart-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.filter-card {
  margin-bottom: 20px;
}
</style> 