<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>工作台</h1>
      <p>欢迎使用小神龙仓库管理系统</p>
    </div>
    
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon warehouse">
          <el-icon><OfficeBuilding /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.warehouses }}</div>
          <div class="stat-label">仓库数量</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon products">
          <el-icon><Box /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.products }}</div>
          <div class="stat-label">商品种类</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon inventory">
          <el-icon><Goods /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalStock }}</div>
          <div class="stat-label">总库存量</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon alerts">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.alerts }}</div>
          <div class="stat-label">库存预警</div>
        </div>
      </div>
    </div>
    
    <!-- 快捷操作 -->
    <div class="quick-actions">
      <h2>快捷操作</h2>
      <div class="actions-grid">
        <div class="action-card" @click="$router.push('/inventory/stock')">
          <el-icon><Search /></el-icon>
          <span>库存查询</span>
        </div>
        
        <div class="action-card" @click="$router.push('/products/list')">
          <el-icon><Plus /></el-icon>
          <span>添加商品</span>
        </div>
        
        <div class="action-card" @click="$router.push('/inbound/orders')">
          <el-icon><Upload /></el-icon>
          <span>入库管理</span>
        </div>
        
        <div class="action-card" @click="$router.push('/outbound/orders')">
          <el-icon><Download /></el-icon>
          <span>出库管理</span>
        </div>
        
        <div class="action-card" @click="$router.push('/inventory/alerts')">
          <el-icon><Bell /></el-icon>
          <span>库存预警</span>
        </div>
        
        <div class="action-card" @click="$router.push('/reports/inventory')">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据报表</span>
        </div>
      </div>
    </div>
    
    <!-- 最近操作 -->
    <div class="recent-activities">
      <h2>最近操作</h2>
      <el-card class="activity-card">
        <div class="activity-list">
          <div 
            v-for="activity in recentActivities" 
            :key="activity.id"
            class="activity-item"
          >
            <div class="activity-icon">
              <el-icon>
                <component :is="activity.icon" />
              </el-icon>
            </div>
            <div class="activity-content">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-time">{{ activity.time }}</div>
            </div>
            <div class="activity-status" :class="activity.status">
              {{ activity.statusText }}
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  OfficeBuilding, 
  Box, 
  Goods, 
  Warning, 
  Search, 
  Plus, 
  Upload, 
  Download, 
  Bell, 
  DataAnalysis,
  Document,
  Check
} from '@element-plus/icons-vue'

// 统计数据
const stats = ref({
  warehouses: 0,
  products: 0,
  totalStock: 0,
  alerts: 0
})

// 最近操作记录
const recentActivities = ref([])

// 加载统计数据
const loadStats = async () => {
  try {
    // 从localStorage读取真实数据
    
    // 1. 仓库数量：从wms_warehouses读取，统计状态为启用的仓库
    const warehousesData = JSON.parse(localStorage.getItem('wms_warehouses') || '[]')
    const activeWarehouses = warehousesData.filter(w => w.status === 1).length
    
    // 2. 商品种类：从wms_products读取，统计状态为正常的商品
    const productsData = JSON.parse(localStorage.getItem('wms_products') || '[]')
    const activeProducts = productsData.filter(p => p.status === '正常').length
    
    // 3. 总库存量：从inventory_stock读取，汇总所有库存记录的当前库存
    const inventoryData = JSON.parse(localStorage.getItem('inventory_stock') || '[]')
    const totalStock = inventoryData.reduce((sum, item) => sum + (item.current_stock || 0), 0)
    
    // 4. 库存预警：统计当前库存小于等于最低库存的商品数量
    const alertProducts = inventoryData.filter(item => {
      const currentStock = item.current_stock || 0
      const minStock = item.min_stock || 0
      return currentStock <= minStock && currentStock > 0 // 排除已缺货的
    }).length
    
    stats.value = {
      warehouses: activeWarehouses || 0,
      products: activeProducts || 0,
      totalStock: totalStock || 0,
      alerts: alertProducts || 0
    }
    
    console.log('📊 工作台统计数据已更新:', stats.value)
    
    // 更新最近操作记录
    updateRecentActivities()
    
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
    
    // 使用默认值
    stats.value = {
      warehouses: 0,
      products: 0,
      totalStock: 0,
      alerts: 0
    }
  }
}

// 更新最近操作记录
const updateRecentActivities = () => {
  try {
    const activities = []
    
    // 从入库订单获取最近的入库操作
    const inboundOrders = JSON.parse(localStorage.getItem('inbound_orders') || '[]')
    const recentInbound = inboundOrders
      .filter(order => order.status === '已完成')
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 2)
    
    recentInbound.forEach(order => {
      activities.push({
        id: `inbound-${order.id}`,
        title: `${order.product_name || '商品'} 入库操作`,
        time: order.updated_at || order.created_at,
        icon: 'Upload',
        status: 'success',
        statusText: '已完成'
      })
    })
    
    // 从出库订单获取最近的出库操作
    const outboundOrders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    const recentOutbound = outboundOrders
      .filter(order => order.status === '已完成')
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 2)
    
    recentOutbound.forEach(order => {
      activities.push({
        id: `outbound-${order.id}`,
        title: `${order.product_name || '商品'} 出库操作`,
        time: order.updated_at || order.created_at,
        icon: 'Download',
        status: 'success',
        statusText: '已完成'
      })
    })
    
    // 从库存数据获取预警商品
    const inventoryData = JSON.parse(localStorage.getItem('inventory_stock') || '[]')
    const alertItems = inventoryData
      .filter(item => {
        const currentStock = item.current_stock || 0
        const minStock = item.min_stock || 0
        return currentStock <= minStock && currentStock > 0
      })
      .sort((a, b) => (a.current_stock / (a.min_stock || 1)) - (b.current_stock / (b.min_stock || 1)))
      .slice(0, 2)
    
    alertItems.forEach(item => {
      activities.push({
        id: `alert-${item.id}`,
        title: `${item.product_name} 库存预警`,
        time: item.last_updated || new Date().toLocaleString(),
        icon: 'Warning',
        status: 'warning',
        statusText: '待处理'
      })
    })
    
    // 按时间排序，显示最近4条
    activities.sort((a, b) => new Date(b.time) - new Date(a.time))
    
    if (activities.length > 0) {
      recentActivities.value = activities.slice(0, 4)
    } else {
      // 如果没有真实活动，显示系统状态
      recentActivities.value = [
        {
          id: 'system-status',
          title: '系统正常运行中',
          time: new Date().toLocaleString(),
          icon: 'Check',
          status: 'success',
          statusText: '正常'
        }
      ]
    }
    
    console.log('📋 最近操作记录已更新:', recentActivities.value)
    
  } catch (error) {
    console.error('更新最近操作记录失败:', error)
    // 保持默认的活动记录
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style lang="scss" scoped>
.dashboard {
  padding: 20px;
  
  .dashboard-header {
    margin-bottom: 30px;
    
    h1 {
      margin: 0 0 8px 0;
      color: #303133;
      font-size: 28px;
      font-weight: 600;
    }
    
    p {
      margin: 0;
      color: #909399;
      font-size: 16px;
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
  
  .stat-card {
    background: white;
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    
    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      
      .el-icon {
        font-size: 32px;
        color: white;
      }
      
      &.warehouse {
        background: linear-gradient(45deg, #409EFF, #67C23A);
      }
      
      &.products {
        background: linear-gradient(45deg, #E6A23C, #F56C6C);
      }
      
      &.inventory {
        background: linear-gradient(45deg, #67C23A, #409EFF);
      }
      
      &.alerts {
        background: linear-gradient(45deg, #F56C6C, #E6A23C);
      }
    }
    
    .stat-content {
      .stat-value {
        font-size: 32px;
        font-weight: 600;
        color: #303133;
        line-height: 1;
        margin-bottom: 4px;
      }
      
      .stat-label {
        font-size: 14px;
        color: #909399;
      }
    }
  }
}

.quick-actions, .recent-activities {
  margin-bottom: 40px;
  
  h2 {
    margin: 0 0 20px 0;
    color: #303133;
    font-size: 20px;
    font-weight: 600;
  }
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  
  .action-card {
    background: white;
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }
    
    .el-icon {
      font-size: 32px;
      color: #409EFF;
      margin-bottom: 12px;
    }
    
    span {
      font-size: 14px;
      color: #303133;
      font-weight: 500;
    }
  }
}

.activity-card {
  .activity-list {
    .activity-item {
      display: flex;
      align-items: center;
      padding: 16px 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .activity-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #f5f7fa;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        
        .el-icon {
          font-size: 18px;
          color: #409EFF;
        }
      }
      
      .activity-content {
        flex: 1;
        
        .activity-title {
          font-size: 14px;
          color: #303133;
          margin-bottom: 4px;
        }
        
        .activity-time {
          font-size: 12px;
          color: #909399;
        }
      }
      
      .activity-status {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        
        &.success {
          background: #f0f9ff;
          color: #67C23A;
        }
        
        &.warning {
          background: #fdf6ec;
          color: #E6A23C;
        }
        
        &.pending {
          background: #f0f0f0;
          color: #909399;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .dashboard {
    padding: 15px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    
    .action-card {
      padding: 20px 16px;
      
      .el-icon {
        font-size: 28px;
      }
      
      span {
        font-size: 13px;
      }
    }
  }
}
</style>