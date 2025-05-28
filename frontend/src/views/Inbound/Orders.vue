<template>
  <div class="inbound-management">
    <!-- 页面标题栏 -->
    <div class="page-header">
      <h1>收货管理</h1>
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
      <el-tabs v-model="activeTab" type="card" class="inbound-tabs">
        <el-tab-pane label="到货通知" name="arrival">
          <div class="tab-icon">
            <el-icon><Notification /></el-icon>
          </div>
        </el-tab-pane>
        <el-tab-pane label="待到货" name="pending">
          <div class="tab-icon">
            <el-icon><Clock /></el-icon>
          </div>
        </el-tab-pane>
        <el-tab-pane label="待卸货" name="unloading">
          <div class="tab-icon">
            <el-icon><Truck /></el-icon>
          </div>
        </el-tab-pane>
        <el-tab-pane label="待分拣" name="sorting">
          <div class="tab-icon">
            <el-icon><Sort /></el-icon>
          </div>
        </el-tab-pane>
        <el-tab-pane label="待上架" name="shelving">
          <div class="tab-icon">
            <el-icon><Upload /></el-icon>
          </div>
        </el-tab-pane>
        <el-tab-pane label="收货明细" name="details">
          <div class="tab-icon">
            <el-icon><Document /></el-icon>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 数据统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon arrival">
            <el-icon><Notification /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.arrival }}</div>
            <div class="stat-label">到货通知</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon pending">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pending }}</div>
            <div class="stat-label">待到货</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon unloading">
            <el-icon><Truck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.unloading }}</div>
            <div class="stat-label">待卸货</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon sorting">
            <el-icon><Sort /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.sorting }}</div>
            <div class="stat-label">待分拣</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon shelving">
            <el-icon><Upload /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.shelving }}</div>
            <div class="stat-label">待上架</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon completed">
            <el-icon><Check /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.completed }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 到货通知页面 -->
    <div v-if="activeTab === 'arrival'">
      <ArrivalNotification @refresh="refreshData" />
      </div>

    <!-- 待到货页面 -->
    <div v-else-if="activeTab === 'pending'">
      <PendingArrival @refresh="refreshData" />
    </div>

    <!-- 待卸货页面 -->
    <div v-else-if="activeTab === 'unloading'">
      <UnloadingGoods @refresh="refreshData" />
    </div>

    <!-- 待分拣页面 -->
    <div v-else-if="activeTab === 'sorting'">
      <SortingGoods @refresh="refreshData" />
            </div>
            
    <!-- 待上架页面 -->
    <div v-else-if="activeTab === 'shelving'">
      <ShelvingGoods @refresh="refreshData" />
          </div>

    <!-- 收货明细页面 -->
    <div v-else-if="activeTab === 'details'">
      <ReceiptDetails @refresh="refreshData" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import ArrivalNotification from './components/ArrivalNotification.vue'
import PendingArrival from './components/PendingArrival.vue'
import UnloadingGoods from './components/UnloadingGoods.vue'
import SortingGoods from './components/SortingGoods.vue'
import ShelvingGoods from './components/ShelvingGoods.vue'
import ReceiptDetails from './components/ReceiptDetails.vue'

// 当前激活的标签页
const activeTab = ref('arrival')

// 统计数据
const stats = reactive({
  arrival: 0,
  pending: 0,
  unloading: 0,
  sorting: 0,
  shelving: 0,
  completed: 0
})

// 加载统计数据
const loadStats = () => {
  try {
    // 从localStorage获取入库单数据
    const inboundOrders = JSON.parse(localStorage.getItem('inbound_orders') || '[]')
    
    // 统计各个状态的数量
    // arrival表示可创建的到货通知（这里显示0，因为到货通知是创建功能）
    stats.arrival = 0
    stats.pending = inboundOrders.filter(order => order.status === 'pending').length
    stats.unloading = inboundOrders.filter(order => order.status === 'unloading').length
    stats.sorting = inboundOrders.filter(order => order.status === 'sorting').length
    stats.shelving = inboundOrders.filter(order => order.status === 'shelving').length
    stats.completed = inboundOrders.filter(order => order.status === 'completed').length

    // 如果没有数据，初始化一些示例数据
    if (inboundOrders.length === 0) {
      initSampleData()
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
  }
}

// 初始化示例数据
const initSampleData = () => {
  const sampleOrders = [
    {
      id: '1',
      order_no: '20250526-0001',
      supplier_id: '1',
      supplier_name: '医药耗材供应商a',
      warehouse_id: '1',
        warehouse_name: '主仓库',
      status: 'shelving',
      expected_date: '2025-05-26',
      batch_no: '111222',
      created_at: new Date().toLocaleString(),
      created_by: '系统管理员',
      products: [
        {
          id: '1',
          product_code: 'MED001',
          product_name: '一次性医用口罩',
          expected_quantity: 1000,
          unit: '个',
          unit_price: 1.5,
          amount: 1500
        }
      ]
    },
    {
      id: '2',
      order_no: '20250524-0002',
      supplier_id: '2',
      supplier_name: 'TEST',
      warehouse_id: '1',
      warehouse_name: '主仓库',
      status: 'pending',
      expected_date: '2025-05-30',
      batch_no: '007',
      created_at: new Date().toLocaleString(),
      created_by: '采购员',
      products: [
        {
          id: '2',
          product_code: 'TEST001',
          product_name: '测试商品',
          expected_quantity: 100,
          unit: '盒',
          unit_price: 25.0,
          amount: 2500
        }
      ]
    },
    {
      id: '3',
      order_no: '20250524-0001',
      supplier_id: '3',
      supplier_name: '华为技术有限公司',
      warehouse_id: '2',
      warehouse_name: '北京仓库',
      status: 'unloading',
      expected_date: '2025-05-23',
      batch_no: '213',
      created_at: new Date().toLocaleString(),
      created_by: '仓库管理员',
      products: [
        {
          id: '3',
          product_code: 'HW001',
          product_name: '华为P50 Pro',
          expected_quantity: 50,
          unit: '台',
          unit_price: 4999.99,
          amount: 249999.5
        }
      ]
    }
  ]

  localStorage.setItem('inbound_orders', JSON.stringify(sampleOrders))
  loadStats()
}

// 刷新数据
const refreshData = () => {
  loadStats()
  ElMessage.success('数据已刷新')
}

// 导出数据
const exportData = () => {
  ElMessage.info('导出功能开发中...')
}

onMounted(() => {
  loadStats()
})
</script>

<style lang="scss" scoped>
.inbound-management {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 140px);
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

.tabs-container {
  margin-bottom: 20px;
  
  .inbound-tabs {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    
    :deep(.el-tabs__header) {
      margin: 0;
      border-bottom: 1px solid #e4e7ed;
      
      .el-tabs__nav {
        border: none;
        
        .el-tabs__item {
          border: none;
          border-radius: 0;
          height: 60px;
          line-height: 60px;
          padding: 0 30px;
          color: #606266;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s;
          
          &:hover {
            color: #409eff;
            background-color: #f0f9ff;
          }
          
          &.is-active {
            color: #409eff;
            background-color: #409eff;
            color: white;
          }
        }
      }
    }
    
    :deep(.el-tabs__content) {
      padding: 0;
    }
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
  
  .stat-card {
    transition: all 0.3s;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }
    
    .stat-content {
      display: flex;
      align-items: center;
      padding: 10px;
      
      .stat-icon {
        width: 45px;
        height: 45px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        
        .el-icon {
          font-size: 20px;
          color: white;
        }
        
        &.arrival {
          background: linear-gradient(45deg, #ff6b6b, #ee5a52);
        }
        
        &.pending {
          background: linear-gradient(45deg, #feca57, #ff9ff3);
        }
        
        &.unloading {
          background: linear-gradient(45deg, #48dbfb, #0abde3);
        }
        
        &.sorting {
          background: linear-gradient(45deg, #1dd1a1, #10ac84);
        }
        
        &.shelving {
          background: linear-gradient(45deg, #a55eea, #8b1cbb);
        }
        
        &.completed {
          background: linear-gradient(45deg, #26de81, #20bf6b);
        }
      }
      
      .stat-info {
        .stat-value {
          font-size: 20px;
          font-weight: 600;
          color: #303133;
          line-height: 1;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .inbound-management {
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
  
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .tabs-container {
    .inbound-tabs {
      :deep(.el-tabs__header) {
        .el-tabs__nav {
          .el-tabs__item {
            padding: 0 15px;
            font-size: 12px;
            height: 50px;
            line-height: 50px;
          }
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .tabs-container {
    .inbound-tabs {
      :deep(.el-tabs__header) {
        .el-tabs__nav {
          .el-tabs__item {
            padding: 0 10px;
      font-size: 11px;
          }
        }
      }
    }
  }
}
</style>