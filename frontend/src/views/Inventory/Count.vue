<template>
  <div class="count-page">
    <div class="page-header">
      <h1>库存盘点</h1>
      <div class="header-actions">
        <el-button type="primary" @click="createCount">
          <el-icon><Plus /></el-icon>
          新建盘点
        </el-button>
        <el-button type="success" @click="exportCount">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 盘点统计 -->
    <div class="count-stats">
      <el-card class="stat-card pending">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ countStats.pending }}</div>
            <div class="stat-label">待盘点</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card counting">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Loading /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ countStats.counting }}</div>
            <div class="stat-label">盘点中</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card completed">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Check /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ countStats.completed }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card difference">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ countStats.difference }}</div>
            <div class="stat-label">有差异</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 筛选区域 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" label-width="80px" :inline="true">
        <el-form-item label="盘点类型">
          <el-select 
            v-model="filterForm.count_type" 
            placeholder="请选择盘点类型"
            clearable
            style="width: 150px"
          >
            <el-option label="全盘" value="full" />
            <el-option label="抽盘" value="sample" />
            <el-option label="动态盘点" value="dynamic" />
            <el-option label="循环盘点" value="cycle" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="盘点状态">
          <el-select 
            v-model="filterForm.status" 
            placeholder="盘点状态"
            clearable
            style="width: 120px"
          >
            <el-option label="待开始" value="pending" />
            <el-option label="进行中" value="counting" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="仓库">
          <el-select 
            v-model="filterForm.warehouse_id" 
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
        
        <el-form-item label="盘点人">
          <el-input 
            v-model="filterForm.counter" 
            placeholder="请输入盘点人"
            clearable
            style="width: 120px"
          />
        </el-form-item>
        
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="searchCounts">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 盘点列表 -->
    <el-card class="table-card">
      <el-table :data="countList" stripe v-loading="loading" max-height="600">
        <el-table-column prop="count_no" label="盘点单号" width="140" />
        
        <el-table-column prop="count_type" label="盘点类型" width="100">
          <template #default="scope">
            <el-tag :type="getCountTypeColor(scope.row.count_type)">
              {{ getCountTypeText(scope.row.count_type) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="warehouse_name" label="仓库" width="120" />
        <el-table-column prop="zone_name" label="库区" width="100" />
        <el-table-column prop="product_count" label="商品数量" width="100" align="right" />
        
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusColor(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="difference_count" label="差异数量" width="100" align="right">
          <template #default="scope">
            <span v-if="scope.row.difference_count > 0" class="text-danger">
              {{ scope.row.difference_count }}
            </span>
            <span v-else-if="scope.row.difference_count === 0" class="text-success">
              无差异
            </span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="counter" label="盘点人" width="100" />
        <el-table-column prop="created_time" label="创建时间" width="150" />
        <el-table-column prop="start_time" label="开始时间" width="150" />
        <el-table-column prop="end_time" label="完成时间" width="150" />
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button 
              v-if="scope.row.status === 'pending'" 
              size="small" 
              type="primary" 
              @click="startCount(scope.row)"
            >
              开始盘点
            </el-button>
            <el-button 
              v-if="scope.row.status === 'counting'" 
              size="small" 
              type="success" 
              @click="continueCount(scope.row)"
            >
              继续盘点
            </el-button>
            <el-button 
              size="small" 
              type="info" 
              @click="viewDetails(scope.row)"
            >
              详情
            </el-button>
            <el-button 
              v-if="scope.row.status === 'completed' && scope.row.difference_count > 0" 
              size="small" 
              type="warning" 
              @click="adjustStock(scope.row)"
            >
              调整库存
            </el-button>
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

    <!-- 新建盘点对话框 -->
    <el-dialog 
      title="新建盘点" 
      v-model="createDialogVisible" 
      width="600px"
      @close="resetCreateForm"
    >
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="盘点单号" prop="count_no">
          <el-input 
            v-model="createForm.count_no" 
            placeholder="系统自动生成"
            readonly
          />
        </el-form-item>
        
        <el-form-item label="盘点类型" prop="count_type">
          <el-radio-group v-model="createForm.count_type">
            <el-radio label="full">全盘</el-radio>
            <el-radio label="sample">抽盘</el-radio>
            <el-radio label="dynamic">动态盘点</el-radio>
            <el-radio label="cycle">循环盘点</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="仓库" prop="warehouse_id">
          <el-select v-model="createForm.warehouse_id" placeholder="请选择仓库" style="width: 100%">
            <el-option 
              v-for="warehouse in warehouses" 
              :key="warehouse.id"
              :label="warehouse.name" 
              :value="warehouse.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="库区" prop="zone_id">
          <el-select 
            v-model="createForm.zone_id" 
            placeholder="请选择库区（可选）" 
            clearable
            style="width: 100%"
          >
            <el-option 
              v-for="zone in filteredZones" 
              :key="zone.id"
              :label="zone.name" 
              :value="zone.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="计划开始时间" prop="planned_start_time">
          <el-date-picker
            v-model="createForm.planned_start_time"
            type="datetime"
            placeholder="请选择计划开始时间"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="盘点人" prop="counter">
          <el-input 
            v-model="createForm.counter" 
            placeholder="请输入盘点人"
          />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input 
            v-model="createForm.remark" 
            type="textarea" 
            :rows="3"
            placeholder="请输入盘点备注"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate" :loading="creating">创建盘点</el-button>
      </template>
    </el-dialog>

    <!-- 盘点详情对话框 -->
    <el-dialog 
      title="盘点详情" 
      v-model="detailDialogVisible" 
      width="800px"
    >
      <div v-if="currentCount" class="count-detail">
        <!-- 盘点基本信息 -->
        <el-descriptions title="基本信息" :column="3" border>
          <el-descriptions-item label="盘点单号">
            {{ currentCount.count_no }}
          </el-descriptions-item>
          <el-descriptions-item label="盘点类型">
            <el-tag :type="getCountTypeColor(currentCount.count_type)">
              {{ getCountTypeText(currentCount.count_type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusColor(currentCount.status)">
              {{ getStatusText(currentCount.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="仓库">
            {{ currentCount.warehouse_name }}
          </el-descriptions-item>
          <el-descriptions-item label="库区">
            {{ currentCount.zone_name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="盘点人">
            {{ currentCount.counter }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ currentCount.created_time }}
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">
            {{ currentCount.start_time || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="完成时间">
            {{ currentCount.end_time || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 盘点明细 -->
        <div class="count-items">
          <h3>盘点明细</h3>
          <el-table :data="countItems" stripe max-height="300">
            <el-table-column prop="product_code" label="商品编码" width="120" />
            <el-table-column prop="product_name" label="商品名称" min-width="200" />
            <el-table-column prop="location_name" label="库位" width="100" />
            <el-table-column prop="book_quantity" label="账面库存" width="100" align="right" />
            <el-table-column prop="actual_quantity" label="实盘库存" width="100" align="right">
              <template #default="scope">
                <span v-if="scope.row.actual_quantity !== null">
                  {{ scope.row.actual_quantity }}
                </span>
                <span v-else class="text-muted">未盘点</span>
              </template>
            </el-table-column>
            <el-table-column prop="difference_quantity" label="差异数量" width="100" align="right">
              <template #default="scope">
                <span v-if="scope.row.difference_quantity !== null" 
                      :class="getDifferenceClass(scope.row.difference_quantity)">
                  {{ scope.row.difference_quantity > 0 ? '+' : '' }}{{ scope.row.difference_quantity }}
                </span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="remark" label="备注" min-width="150" />
          </el-table>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 盘点操作对话框 -->
    <el-dialog 
      :title="countDialogTitle" 
      v-model="countDialogVisible" 
      width="700px"
      @close="resetCountForm"
    >
      <div v-if="currentCount" class="counting-interface">
        <div class="count-header">
          <h3>{{ currentCount.count_no }} - {{ currentCount.warehouse_name }}</h3>
          <el-progress :percentage="countProgress" />
        </div>
        
        <el-table :data="countingItems" stripe max-height="400" v-loading="countingLoading">
          <el-table-column prop="product_code" label="商品编码" width="120" />
          <el-table-column prop="product_name" label="商品名称" min-width="200" />
          <el-table-column prop="location_name" label="库位" width="100" />
          <el-table-column prop="book_quantity" label="账面库存" width="100" align="right" />
          <el-table-column label="实盘库存" width="150">
            <template #default="scope">
              <el-input-number 
                v-model="scope.row.actual_quantity" 
                :min="0" 
                size="small"
                @change="calculateDifference(scope.row)"
                style="width: 120px"
              />
            </template>
          </el-table-column>
          <el-table-column label="差异" width="100" align="right">
            <template #default="scope">
              <span :class="getDifferenceClass(scope.row.difference_quantity)">
                {{ scope.row.difference_quantity !== null ? 
                    (scope.row.difference_quantity > 0 ? '+' : '') + scope.row.difference_quantity : '-' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="备注" width="150">
            <template #default="scope">
              <el-input 
                v-model="scope.row.remark" 
                size="small"
                placeholder="备注"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <template #footer>
        <el-button @click="countDialogVisible = false">取消</el-button>
        <el-button type="success" @click="saveCountProgress" :loading="saving">保存进度</el-button>
        <el-button type="primary" @click="completeCount" :loading="completing">完成盘点</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const loading = ref(false)
const creating = ref(false)
const saving = ref(false)
const completing = ref(false)
const countingLoading = ref(false)
const createDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const countDialogVisible = ref(false)
const createFormRef = ref()
const currentCount = ref(null)

// 筛选表单
const filterForm = reactive({
  count_type: '',
  status: '',
  warehouse_id: null,
  counter: '',
  date_range: []
})

// 新建表单
const createForm = reactive({
  count_no: '',
  count_type: 'full',
  warehouse_id: null,
  zone_id: null,
  planned_start_time: '',
  counter: '',
  remark: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 基础数据
const warehouses = ref([])
const zones = ref([])
const countList = ref([])
const countItems = ref([])
const countingItems = ref([])

// 盘点统计
const countStats = reactive({
  pending: 0,
  counting: 0,
  completed: 0,
  difference: 0
})

// 验证规则
const createRules = {
  count_type: [
    { required: true, message: '请选择盘点类型', trigger: 'change' }
  ],
  warehouse_id: [
    { required: true, message: '请选择仓库', trigger: 'change' }
  ],
  planned_start_time: [
    { required: true, message: '请选择计划开始时间', trigger: 'change' }
  ],
  counter: [
    { required: true, message: '请输入盘点人', trigger: 'blur' }
  ]
}

// 计算属性
const filteredZones = computed(() => {
  if (!createForm.warehouse_id) return zones.value
  return zones.value.filter(zone => zone.warehouse_id === createForm.warehouse_id)
})

const countDialogTitle = computed(() => {
  if (!currentCount.value) return '盘点操作'
  return currentCount.value.status === 'pending' ? '开始盘点' : '继续盘点'
})

const countProgress = computed(() => {
  if (countingItems.value.length === 0) return 0
  const counted = countingItems.value.filter(item => item.actual_quantity !== null).length
  return Math.round((counted / countingItems.value.length) * 100)
})

// 获取盘点类型颜色
const getCountTypeColor = (type) => {
  const colorMap = {
    'full': 'primary',
    'sample': 'success',
    'dynamic': 'warning',
    'cycle': 'info'
  }
  return colorMap[type] || 'info'
}

// 获取盘点类型文本
const getCountTypeText = (type) => {
  const textMap = {
    'full': '全盘',
    'sample': '抽盘',
    'dynamic': '动态盘点',
    'cycle': '循环盘点'
  }
  return textMap[type] || '未知'
}

// 获取状态颜色
const getStatusColor = (status) => {
  const colorMap = {
    'pending': 'warning',
    'counting': 'primary',
    'completed': 'success',
    'cancelled': 'danger'
  }
  return colorMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'pending': '待开始',
    'counting': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return textMap[status] || '未知状态'
}

// 获取差异样式
const getDifferenceClass = (difference) => {
  if (difference > 0) return 'text-success'
  if (difference < 0) return 'text-danger'
  return 'text-muted'
}

// 生成盘点单号
const generateCountNo = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0')
  return `IC${year}${month}${day}${time}`
}

// 加载基础数据
const loadBasicData = async () => {
  try {
    // 加载仓库列表
    warehouses.value = JSON.parse(localStorage.getItem('wms_warehouses') || '[]')
    if (warehouses.value.length === 0) {
      warehouses.value = [
        { id: 1, name: '主仓库', code: 'WH001' },
        { id: 2, name: '北京仓库', code: 'WH002' },
        { id: 3, name: '上海仓库', code: 'WH003' }
      ]
    }

    // 加载库区列表
    zones.value = JSON.parse(localStorage.getItem('wms_zones') || '[]')
    if (zones.value.length === 0) {
      zones.value = [
        { id: 1, warehouse_id: 1, name: 'A区', code: 'A' },
        { id: 2, warehouse_id: 1, name: 'B区', code: 'B' },
        { id: 3, warehouse_id: 2, name: 'A区', code: 'A' },
        { id: 4, warehouse_id: 3, name: 'A区', code: 'A' }
      ]
    }
  } catch (error) {
    console.error('加载基础数据失败:', error)
  }
}

// 加载盘点数据
const loadCountData = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 从localStorage获取已保存的盘点记录
    let savedCounts = JSON.parse(localStorage.getItem('inventory_counts') || '[]')
    
    // 如果没有保存的盘点记录，基于真实库存数据生成一些盘点记录
    if (savedCounts.length === 0) {
      const inventoryStock = JSON.parse(localStorage.getItem('inventory_stock') || '[]')
      const warehousesData = JSON.parse(localStorage.getItem('wms_warehouses') || '[]')
      
      // 按仓库分组统计商品数量
      const warehouseStats = {}
      inventoryStock.forEach(stock => {
        const warehouseId = stock.warehouse_id || 1
        const warehouseName = stock.warehouse_name || warehousesData.find(w => w.id === warehouseId)?.name || '主仓库'
        
        if (!warehouseStats[warehouseId]) {
          warehouseStats[warehouseId] = {
            warehouse_name: warehouseName,
            product_count: 0,
            zones: new Set()
          }
        }
        
        warehouseStats[warehouseId].product_count++
        warehouseStats[warehouseId].zones.add(stock.zone_name || 'A区')
      })
      
      // 生成盘点记录
      const counters = ['张三', '李四', '王五', '赵六', '陈七']
      const countTypes = ['full', 'sample', 'cycle', 'dynamic']
      const statuses = ['completed', 'counting', 'pending']
      
      let countId = 1
      Object.entries(warehouseStats).forEach(([warehouseId, stats]) => {
        // 为每个仓库生成1-2个盘点记录
        const countNum = Math.floor(Math.random() * 2) + 1
        
        for (let i = 0; i < countNum; i++) {
          const daysAgo = Math.floor(Math.random() * 7) + 1
          const createdTime = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
          const status = statuses[Math.floor(Math.random() * statuses.length)]
          
          let startTime = ''
          let endTime = ''
          let differenceCount = null
          
          if (status === 'counting' || status === 'completed') {
            startTime = new Date(createdTime.getTime() + 30 * 60 * 1000).toLocaleString()
          }
          
          if (status === 'completed') {
            endTime = new Date(createdTime.getTime() + (3 + Math.random() * 2) * 60 * 60 * 1000).toLocaleString()
            differenceCount = Math.floor(Math.random() * 5) // 0-4个差异
          }
          
          savedCounts.push({
            id: countId++,
            count_no: `IC${createdTime.getFullYear()}${String(createdTime.getMonth() + 1).padStart(2, '0')}${String(createdTime.getDate()).padStart(2, '0')}${String(countId).padStart(4, '0')}`,
            count_type: countTypes[Math.floor(Math.random() * countTypes.length)],
            warehouse_id: parseInt(warehouseId),
            warehouse_name: stats.warehouse_name,
            zone_name: Array.from(stats.zones)[0] || 'A区',
            product_count: Math.min(stats.product_count, Math.floor(Math.random() * 20) + 5),
            status: status,
            difference_count: differenceCount,
            counter: counters[Math.floor(Math.random() * counters.length)],
            created_time: createdTime.toLocaleString(),
            start_time: startTime,
            end_time: endTime,
            remark: status === 'completed' ? '盘点完成' : status === 'counting' ? '盘点进行中' : '待开始盘点'
          })
        }
      })
      
      // 如果还是没有数据，创建一些默认记录
      if (savedCounts.length === 0) {
        savedCounts = [
          {
            id: 1,
            count_no: 'IC202401150001',
            count_type: 'full',
            warehouse_id: 1,
            warehouse_name: '主仓库',
            zone_name: 'A区',
            product_count: 25,
            status: 'completed',
            difference_count: 3,
            counter: '张三',
            created_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleString(),
            start_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toLocaleString(),
            end_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toLocaleString(),
            remark: '月度盘点'
          }
        ]
      }
      
      // 保存生成的盘点记录
      localStorage.setItem('inventory_counts', JSON.stringify(savedCounts))
    }
    
    // 应用筛选条件
    let filteredCounts = savedCounts
    
    if (filterForm.count_type) {
      filteredCounts = filteredCounts.filter(count => count.count_type === filterForm.count_type)
    }
    if (filterForm.status) {
      filteredCounts = filteredCounts.filter(count => count.status === filterForm.status)
    }
    if (filterForm.warehouse_id) {
      filteredCounts = filteredCounts.filter(count => count.warehouse_id === filterForm.warehouse_id)
    }
    if (filterForm.counter) {
      filteredCounts = filteredCounts.filter(count => 
        count.counter.includes(filterForm.counter)
      )
    }
    if (filterForm.date_range && filterForm.date_range.length === 2) {
      const startDate = new Date(filterForm.date_range[0]).getTime()
      const endDate = new Date(filterForm.date_range[1]).getTime() + 24 * 60 * 60 * 1000
      filteredCounts = filteredCounts.filter(count => {
        const countDate = new Date(count.created_time).getTime()
        return countDate >= startDate && countDate <= endDate
      })
    }
    
    // 按创建时间倒序排序
    filteredCounts.sort((a, b) => new Date(b.created_time) - new Date(a.created_time))
    
    countList.value = filteredCounts
    pagination.total = filteredCounts.length
    
    // 更新统计数据（基于所有盘点记录，不是筛选后的）
    countStats.pending = savedCounts.filter(item => item.status === 'pending').length
    countStats.counting = savedCounts.filter(item => item.status === 'counting').length
    countStats.completed = savedCounts.filter(item => item.status === 'completed').length
    countStats.difference = savedCounts.filter(item => 
      item.status === 'completed' && item.difference_count > 0
    ).length
    
  } catch (error) {
    console.error('加载盘点数据失败:', error)
    ElMessage.error('加载盘点数据失败')
  } finally {
    loading.value = false
  }
}

// 加载盘点明细
const loadCountItems = async (countId) => {
  try {
    // 从localStorage获取盘点明细
    let savedItems = JSON.parse(localStorage.getItem(`count_items_${countId}`) || '[]')
    
    // 如果没有保存的明细，基于真实库存数据生成
    if (savedItems.length === 0) {
      const inventoryStock = JSON.parse(localStorage.getItem('inventory_stock') || '[]')
      const count = countList.value.find(c => c.id === countId)
      
      if (count && inventoryStock.length > 0) {
        // 筛选该仓库的库存数据
        const warehouseStock = inventoryStock.filter(stock => 
          stock.warehouse_id === count.warehouse_id || stock.warehouse_name === count.warehouse_name
        )
        
        // 随机选择一些商品进行盘点
        const selectedStock = warehouseStock
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(count.product_count || 10, warehouseStock.length))
        
        savedItems = selectedStock.map((stock, index) => {
          const bookQuantity = stock.current_stock || 0
          // 模拟实际盘点数量（大部分相符，少数有差异）
          let actualQuantity = bookQuantity
          if (Math.random() < 0.3) { // 30%概率有差异
            const variance = Math.floor(Math.random() * 5) - 2 // -2到+2的差异
            actualQuantity = Math.max(0, bookQuantity + variance)
          }
          
          const differenceQuantity = actualQuantity - bookQuantity
          let remark = ''
          if (differenceQuantity > 0) {
            remark = '盘盈'
          } else if (differenceQuantity < 0) {
            remark = '盘亏'
          }
          
          return {
            id: index + 1,
            product_code: stock.product_code,
            product_name: stock.product_name,
            location_name: stock.location_name || 'A001',
            book_quantity: bookQuantity,
            actual_quantity: actualQuantity,
            difference_quantity: differenceQuantity,
            unit: stock.unit || '台',
            remark: remark
          }
        })
        
        // 保存生成的明细
        localStorage.setItem(`count_items_${countId}`, JSON.stringify(savedItems))
      }
      
      // 如果还是没有数据，使用默认明细
      if (savedItems.length === 0) {
        savedItems = [
          {
            id: 1,
            product_code: 'HW001',
            product_name: '华为P50 Pro',
            location_name: 'A001',
            book_quantity: 45,
            actual_quantity: 43,
            difference_quantity: -2,
            unit: '台',
            remark: '盘亏'
          },
          {
            id: 2,
            product_code: 'MI001',
            product_name: '小米12 Pro',
            location_name: 'A002',
            book_quantity: 30,
            actual_quantity: 32,
            difference_quantity: 2,
            unit: '台',
            remark: '盘盈'
          },
          {
            id: 3,
            product_code: 'IP001',
            product_name: 'iPhone 14 Pro',
            location_name: 'A003',
            book_quantity: 20,
            actual_quantity: 20,
            difference_quantity: 0,
            unit: '台',
            remark: ''
          }
        ]
      }
    }
    
    countItems.value = savedItems
  } catch (error) {
    console.error('加载盘点明细失败:', error)
    ElMessage.error('加载盘点明细失败')
  }
}

// 搜索盘点
const searchCounts = () => {
  loadCountData()
}

// 重置筛选
const resetFilter = () => {
  Object.assign(filterForm, {
    count_type: '',
    status: '',
    warehouse_id: null,
    counter: '',
    date_range: []
  })
  loadCountData()
}

// 导出盘点
const exportCount = () => {
  ElMessage.info('盘点数据导出功能开发中...')
}

// 新建盘点
const createCount = () => {
  createForm.count_no = generateCountNo()
  createDialogVisible.value = true
}

// 提交创建
const submitCreate = async () => {
  if (!createFormRef.value) return
  
  try {
    await createFormRef.value.validate()
    creating.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('盘点单创建成功')
    createDialogVisible.value = false
    loadCountData()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('盘点单创建失败')
    }
  } finally {
    creating.value = false
  }
}

// 开始盘点
const startCount = (count) => {
  currentCount.value = count
  loadCountingItems(count.id)
  countDialogVisible.value = true
}

// 继续盘点
const continueCount = (count) => {
  currentCount.value = count
  loadCountingItems(count.id)
  countDialogVisible.value = true
}

// 加载盘点商品
const loadCountingItems = async (countId) => {
  countingLoading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const mockItems = [
      {
        id: 1,
        product_code: 'HW001',
        product_name: '华为P50 Pro',
        location_name: 'A001',
        book_quantity: 45,
        actual_quantity: null,
        difference_quantity: null,
        unit: '台',
        remark: ''
      },
      {
        id: 2,
        product_code: 'MI001',
        product_name: '小米12 Pro',
        location_name: 'A002',
        book_quantity: 30,
        actual_quantity: null,
        difference_quantity: null,
        unit: '台',
        remark: ''
      },
      {
        id: 3,
        product_code: 'IP001',
        product_name: 'iPhone 14 Pro',
        location_name: 'A003',
        book_quantity: 20,
        actual_quantity: null,
        difference_quantity: null,
        unit: '台',
        remark: ''
      }
    ]
    
    countingItems.value = mockItems
  } catch (error) {
    ElMessage.error('加载盘点商品失败')
  } finally {
    countingLoading.value = false
  }
}

// 计算差异
const calculateDifference = (item) => {
  if (item.actual_quantity !== null) {
    item.difference_quantity = item.actual_quantity - item.book_quantity
  } else {
    item.difference_quantity = null
  }
}

// 保存盘点进度
const saveCountProgress = async () => {
  saving.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800))
    
    ElMessage.success('盘点进度已保存')
  } catch (error) {
    ElMessage.error('保存盘点进度失败')
  } finally {
    saving.value = false
  }
}

// 完成盘点
const completeCount = async () => {
  try {
    // 检查是否所有商品都已盘点
    const uncounted = countingItems.value.filter(item => item.actual_quantity === null)
    if (uncounted.length > 0) {
      await ElMessageBox.confirm(
        `还有 ${uncounted.length} 个商品未盘点，是否确认完成盘点？`,
        '确认完成',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    }
    
    completing.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('盘点完成')
    countDialogVisible.value = false
    loadCountData()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('盘点完成失败')
    }
  } finally {
    completing.value = false
  }
}

// 查看详情
const viewDetails = async (count) => {
  currentCount.value = count
  await loadCountItems(count.id)
  detailDialogVisible.value = true
}

// 调整库存
const adjustStock = (count) => {
  ElMessage.info(`调整库存功能开发中，盘点单号：${count.count_no}`)
}

// 重置表单
const resetCreateForm = () => {
  if (createFormRef.value) {
    createFormRef.value.resetFields()
  }
  Object.assign(createForm, {
    count_no: '',
    count_type: 'full',
    warehouse_id: null,
    zone_id: null,
    planned_start_time: '',
    counter: '',
    remark: ''
  })
}

const resetCountForm = () => {
  countingItems.value = []
  currentCount.value = null
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  loadCountData()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadCountData()
}

onMounted(() => {
  loadBasicData()
  loadCountData()
})
</script>

<style lang="scss" scoped>
.count-page {
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

.count-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
  
  .stat-card {
    &.pending {
      border-left: 4px solid #E6A23C;
      
      .stat-icon {
        background: linear-gradient(45deg, #E6A23C, #EEBE77);
      }
    }
    
    &.counting {
      border-left: 4px solid #409EFF;
      
      .stat-icon {
        background: linear-gradient(45deg, #409EFF, #66B1FF);
      }
    }
    
    &.completed {
      border-left: 4px solid #67C23A;
      
      .stat-icon {
        background: linear-gradient(45deg, #67C23A, #85CE61);
      }
    }
    
    &.difference {
      border-left: 4px solid #F56C6C;
      
      .stat-icon {
        background: linear-gradient(45deg, #F56C6C, #F78989);
      }
    }
    
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

.filter-card, .table-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.text-success {
  color: #67C23A;
  font-weight: 600;
}

.text-danger {
  color: #F56C6C;
  font-weight: 600;
}

.text-muted {
  color: #909399;
}

.count-detail {
  .count-items {
    margin-top: 30px;
    
    h3 {
      margin-bottom: 15px;
      color: #303133;
    }
  }
}

.counting-interface {
  .count-header {
    margin-bottom: 20px;
    
    h3 {
      margin-bottom: 10px;
      color: #303133;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .count-page {
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
  
  .count-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  :deep(.el-form--inline .el-form-item) {
    margin-right: 0;
    margin-bottom: 15px;
    width: 100%;
    
    .el-form-item__content {
      width: 100%;
      
      .el-input, .el-select, .el-date-picker {
        width: 100% !important;
      }
    }
  }
  
  :deep(.el-table) {
    font-size: 12px;
    
    .el-button {
      padding: 5px 8px;
      font-size: 11px;
      margin: 2px;
    }
  }
}
</style>