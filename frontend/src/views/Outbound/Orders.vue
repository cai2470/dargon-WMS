<template>
  <div class="outbound-management">
    <!-- 页面标题栏 -->
    <div class="page-header">
      <h1>发货管理</h1>
      <div class="header-actions">
        <el-button type="success" @click="exportData">
          <el-icon><Download /></el-icon>
          导出记录
        </el-button>
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
      </el-button>
      </div>
    </div>

    <!-- 功能标签页 -->
    <div class="tabs-container">
      <el-tabs v-model="activeTab" type="card" class="outbound-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="发货单" name="orders">
          <template #label>
            <div class="tab-icon">
              <el-icon><Document /></el-icon>
              <span>发货单</span>
              <el-badge v-if="orderStats.draft > 0" :value="orderStats.draft" class="tab-badge" />
            </div>
          </template>
        </el-tab-pane>
        <el-tab-pane label="预发货" name="pre_delivery">
          <template #label>
            <div class="tab-icon">
              <el-icon><Clock /></el-icon>
              <span>预发货</span>
              <el-badge v-if="orderStats.pre_delivery > 0" :value="orderStats.pre_delivery" class="tab-badge" />
            </div>
          </template>
        </el-tab-pane>
        <el-tab-pane label="拣货" name="picking">
          <template #label>
            <div class="tab-icon">
              <el-icon><Box /></el-icon>
              <span>拣货</span>
              <el-badge v-if="orderStats.picking > 0" :value="orderStats.picking" class="tab-badge" />
            </div>
          </template>
        </el-tab-pane>
        <el-tab-pane label="打包" name="packing">
          <template #label>
            <div class="tab-icon">
              <el-icon><Present /></el-icon>
              <span>打包</span>
              <el-badge v-if="orderStats.packing > 0" :value="orderStats.packing" class="tab-badge" />
            </div>
          </template>
        </el-tab-pane>
        <el-tab-pane label="发货" name="shipping">
          <template #label>
            <div class="tab-icon">
              <el-icon><Truck /></el-icon>
              <span>发货</span>
              <el-badge v-if="orderStats.shipping > 0" :value="orderStats.shipping" class="tab-badge" />
            </div>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="4">
      <el-card class="stat-card">
        <div class="stat-content">
              <div class="stat-icon draft">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-info">
                <div class="stat-value">{{ orderStats.draft }}</div>
                <div class="stat-label">草稿</div>
          </div>
        </div>
      </el-card>
        </el-col>
        <el-col :span="4">
      <el-card class="stat-card">
        <div class="stat-content">
              <div class="stat-icon pre-delivery">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-info">
                <div class="stat-value">{{ orderStats.pre_delivery }}</div>
                <div class="stat-label">预发货</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon picking">
                <el-icon><Box /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ orderStats.picking }}</div>
                <div class="stat-label">拣货中</div>
          </div>
        </div>
      </el-card>
        </el-col>
        <el-col :span="4">
      <el-card class="stat-card">
        <div class="stat-content">
              <div class="stat-icon packing">
                <el-icon><Present /></el-icon>
          </div>
          <div class="stat-info">
                <div class="stat-value">{{ orderStats.packing }}</div>
                <div class="stat-label">打包中</div>
          </div>
        </div>
      </el-card>
        </el-col>
        <el-col :span="4">
      <el-card class="stat-card">
        <div class="stat-content">
              <div class="stat-icon shipping">
            <el-icon><Truck /></el-icon>
          </div>
          <div class="stat-info">
                <div class="stat-value">{{ orderStats.shipping }}</div>
                <div class="stat-label">待发货</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon completed">
                <el-icon><Check /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ orderStats.completed }}</div>
                <div class="stat-label">已完成</div>
          </div>
        </div>
      </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 标签页内容 -->
    <div class="tab-content">
      <!-- 发货单管理 -->
      <div v-show="activeTab === 'orders'">
        <OutboundOrders ref="outboundOrdersRef" @refresh="handleRefresh" />
      </div>
      
      <!-- 预发货管理 -->
      <div v-show="activeTab === 'pre_delivery'">
        <PreDelivery ref="preDeliveryRef" @refresh="handleRefresh" />
            </div>
            
      <!-- 拣货管理 -->
      <div v-show="activeTab === 'picking'">
        <PickingGoods ref="pickingGoodsRef" @refresh="handleRefresh" />
          </div>
      
      <!-- 打包管理 -->
      <div v-show="activeTab === 'packing'">
        <PackingGoods ref="packingGoodsRef" @refresh="handleRefresh" />
      </div>
      
      <!-- 发货管理 -->
      <div v-show="activeTab === 'shipping'">
        <ShippingGoods ref="shippingGoodsRef" @refresh="handleRefresh" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import OutboundOrders from './components/OutboundOrders.vue'
import PreDelivery from './components/PreDelivery.vue'
import PickingGoods from './components/PickingGoods.vue'
import PackingGoods from './components/PackingGoods.vue'
import ShippingGoods from './components/ShippingGoods.vue'

// 响应式数据
const activeTab = ref('orders')

// 组件引用
const outboundOrdersRef = ref()
const preDeliveryRef = ref()
const pickingGoodsRef = ref()
const packingGoodsRef = ref()
const shippingGoodsRef = ref()

// 订单统计数据
const orderStats = reactive({
  draft: 0,
  pre_delivery: 0,
  picking: 0,
  packing: 0,
  shipping: 0,
  completed: 0,
  cancelled: 0,
  total: 0
})

// 加载统计数据
const loadStats = async () => {
  try {
    // 从localStorage获取出库单数据
    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    console.log('Orders - 所有出库单数据:', orders)
    
    // 统计各状态的订单数量
    const stats = {
      draft: 0,
      pre_delivery: 0,
      picking: 0,
      packing: 0,
      shipping: 0,
      completed: 0,
      cancelled: 0,
      total: orders.length
    }
    
    orders.forEach(order => {
      if (stats.hasOwnProperty(order.status)) {
        stats[order.status]++
      }
    })
    
    // 更新统计数据
    Object.assign(orderStats, stats)
    
    console.log('出库订单统计:', stats)
    console.log('更新后的orderStats:', orderStats)
  } catch (error) {
    console.error('加载出库统计数据失败:', error)
  }
}

// 处理子组件发出的刷新事件
const handleRefresh = async () => {
  console.log('🔄 接收到刷新事件，开始刷新所有组件...')
  
  // 刷新统计数据
  await loadStats()
  
  // 刷新所有组件的数据
  await refreshAllComponents()
}

// 刷新所有组件数据
const refreshAllComponents = async () => {
  try {
    // 刷新各个组件的数据
    if (outboundOrdersRef.value && typeof outboundOrdersRef.value.loadOrderList === 'function') {
      await outboundOrdersRef.value.loadOrderList()
    }
    if (preDeliveryRef.value && typeof preDeliveryRef.value.loadTableData === 'function') {
      await preDeliveryRef.value.loadTableData()
    }
    if (pickingGoodsRef.value && typeof pickingGoodsRef.value.loadTableData === 'function') {
      await pickingGoodsRef.value.loadTableData()
    }
    if (packingGoodsRef.value && typeof packingGoodsRef.value.loadTableData === 'function') {
      await packingGoodsRef.value.loadTableData()
    }
    if (shippingGoodsRef.value && typeof shippingGoodsRef.value.loadTableData === 'function') {
      await shippingGoodsRef.value.loadTableData()
    }
    
    console.log('✅ 所有组件数据已刷新')
  } catch (error) {
    console.error('刷新组件数据失败:', error)
  }
}

// 刷新统计数据
const refreshStats = () => {
  loadStats()
}

// 刷新数据
const refreshData = () => {
  loadStats()
  ElMessage.success('数据已刷新')
}

// 导出数据
const exportData = () => {
  try {
    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    
    if (orders.length === 0) {
      ElMessage.warning('暂无数据可导出')
      return
    }
    
    // 简单的CSV导出
    const headers = ['出库单号', '客户名称', '出库类型', '状态', '总数量', '总金额', '创建时间']
    const csvContent = [
      headers.join(','),
      ...orders.map(order => [
        order.order_no,
        order.customer_name,
        order.outbound_type,
        order.status,
        order.products ? order.products.reduce((sum, p) => sum + (p.quantity || 0), 0) : 0,
        order.products ? order.products.reduce((sum, p) => sum + (p.amount || 0), 0) : 0,
        order.created_at
      ].join(','))
    ].join('\n')
    
    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `出库单记录_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('数据导出成功')
  } catch (error) {
    ElMessage.error('数据导出失败')
    console.error('导出失败:', error)
  }
}

// 标签页切换
const handleTabChange = async (tabName) => {
  console.log('🔄 切换到标签页:', tabName)
  
  // 等待一个微任务周期，确保组件已渲染
  await nextTick()
  
  // 根据当前标签页刷新对应组件的数据
  try {
    switch (tabName) {
      case 'orders':
        if (outboundOrdersRef.value && typeof outboundOrdersRef.value.loadOrderList === 'function') {
          console.log('🔄 刷新发货单数据')
          await outboundOrdersRef.value.loadOrderList()
        }
        break
      case 'pre_delivery':
        if (preDeliveryRef.value && typeof preDeliveryRef.value.loadTableData === 'function') {
          console.log('🔄 刷新预发货数据')
          await preDeliveryRef.value.loadTableData()
        }
        break
      case 'picking':
        if (pickingGoodsRef.value && typeof pickingGoodsRef.value.loadTableData === 'function') {
          console.log('🔄 刷新拣货数据')
          await pickingGoodsRef.value.loadTableData()
        }
        break
      case 'packing':
        if (packingGoodsRef.value && typeof packingGoodsRef.value.loadTableData === 'function') {
          console.log('🔄 刷新打包数据')
          await packingGoodsRef.value.loadTableData()
        }
        break
      case 'shipping':
        if (shippingGoodsRef.value && typeof shippingGoodsRef.value.loadTableData === 'function') {
          console.log('🔄 刷新发货数据')
          await shippingGoodsRef.value.loadTableData()
        }
        break
    }
    
    // 同时刷新统计数据
    await loadStats()
    
    console.log('✅ 标签页切换完成，数据已刷新')
  } catch (error) {
    console.error('标签页切换刷新失败:', error)
  }
}

onMounted(async () => {
  await loadStats()
  
  // 每30秒自动刷新统计数据
  setInterval(() => {
    loadStats()
  }, 30000)
})
</script>

<style lang="scss" scoped>
.outbound-management {
  padding: 20px;

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

  .tabs-container {
  margin-bottom: 20px;
    
    .outbound-tabs {
      :deep(.el-tabs__header) {
        margin: 0 0 20px 0;
      }
      
      :deep(.el-tabs__nav) {
        border: none;
      }
      
      :deep(.el-tabs__item) {
        border: 1px solid #dcdfe6;
        border-radius: 4px 4px 0 0;
        margin-right: 5px;
        padding: 0 20px;
        
        &.is-active {
          background-color: #409eff;
          color: white;
          border-color: #409eff;
        }
      }
      
      .tab-icon {
        display: flex;
        align-items: center;
        gap: 5px;
        position: relative;
        
        .tab-badge {
          position: absolute;
          top: -8px;
          right: -15px;
        }
      }
    }
  }
  
  .stats-cards {
  margin-bottom: 20px;
  
  .stat-card {
      :deep(.el-card__body) {
        padding: 20px;
      }
      
    .stat-content {
      display: flex;
      align-items: center;
        gap: 15px;
      
      .stat-icon {
        width: 50px;
        height: 50px;
          border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
          font-size: 24px;
          color: white;
          
          &.draft {
            background: linear-gradient(135deg, #909399, #b1b3b8);
          }
          
          &.pre-delivery {
            background: linear-gradient(135deg, #e6a23c, #f0c78a);
          }
          
          &.picking {
            background: linear-gradient(135deg, #409eff, #79bbff);
          }
          
          &.packing {
            background: linear-gradient(135deg, #67c23a, #95d475);
          }
          
          &.shipping {
            background: linear-gradient(135deg, #f56c6c, #f89898);
          }
          
          &.completed {
            background: linear-gradient(135deg, #67c23a, #95d475);
          }
        }
        
        .stat-info {
          flex: 1;
          
        .stat-value {
            font-size: 28px;
          font-weight: 600;
          color: #303133;
          line-height: 1;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 14px;
          color: #909399;
        }
      }
    }
  }
}

  .tab-content {
    min-height: 500px;
  }
}
</style>