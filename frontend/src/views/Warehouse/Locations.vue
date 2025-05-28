<template>
  <div class="locations-page">
    <div class="page-header">
      <h1>库位管理</h1>
      <div class="header-actions">
        <el-button type="success" @click="batchGenerate">
          <el-icon><Magic /></el-icon>
          批量生成
        </el-button>
        <el-button type="primary" @click="openAddDialog">
          <el-icon><Plus /></el-icon>
          添加库位
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card">
      <el-form :model="searchForm" label-width="80px" :inline="true">
        <el-form-item label="所属仓库">
          <el-select 
            v-model="searchForm.warehouse_id" 
            placeholder="请选择仓库"
            clearable
            style="width: 150px"
            @change="onWarehouseChange"
          >
            <el-option 
              v-for="warehouse in warehouses" 
              :key="warehouse.id"
              :label="warehouse.name" 
              :value="warehouse.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="所属库区">
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
        <el-form-item label="库位编码">
          <el-input 
            v-model="searchForm.code" 
            placeholder="请输入库位编码"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="库位状态">
          <el-select 
            v-model="searchForm.status" 
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="空闲" value="empty" />
            <el-option label="占用" value="occupied" />
            <el-option label="预留" value="reserved" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchLocations">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 库位统计 -->
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon total">
            <el-icon><Grid /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ locationStats.total }}</div>
            <div class="stat-label">总库位数</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon empty">
            <el-icon><Check /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ locationStats.empty }}</div>
            <div class="stat-label">空闲库位</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon occupied">
            <el-icon><Box /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ locationStats.occupied }}</div>
            <div class="stat-label">占用库位</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon disabled">
            <el-icon><Close /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ locationStats.disabled }}</div>
            <div class="stat-label">禁用库位</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 库位列表 -->
    <el-card class="table-card">
      <div class="table-header">
        <h3>库位列表</h3>
        <div class="batch-actions" v-if="selectedLocations.length > 0">
          <el-button type="success" size="small" @click="batchEnable" :disabled="!canBatchEnable">
            <el-icon><Check /></el-icon>
            批量启用 ({{ selectedLocations.length }})
          </el-button>
          <el-button type="warning" size="small" @click="batchDisable" :disabled="!canBatchDisable">
            <el-icon><Close /></el-icon>
            批量禁用 ({{ selectedLocations.length }})
          </el-button>
          <el-button type="danger" size="small" @click="batchDelete">
            <el-icon><Delete /></el-icon>
            批量删除 ({{ selectedLocations.length }})
          </el-button>
        </div>
      </div>
      
      <el-table 
        :data="paginatedLocations" 
        stripe 
        v-loading="loading"
        height="500"
        :scroll-behavior="'smooth'"
        @selection-change="handleSelectionChange"
        ref="locationTable"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="code" label="库位编码" width="120" />
        <el-table-column prop="warehouse_name" label="所属仓库" width="120" />
        <el-table-column prop="zone_name" label="所属库区" width="100" />
        <el-table-column prop="type" label="库位类型" width="100" />
        <el-table-column prop="row_no" label="排" width="80" align="center" />
        <el-table-column prop="column_no" label="列" width="80" align="center" />
        <el-table-column prop="level_no" label="层" width="80" align="center" />
        <el-table-column prop="max_weight" label="最大承重(kg)" width="120" align="right" />
        <el-table-column prop="max_volume" label="最大体积(m³)" width="120" align="right" />
        <el-table-column prop="current_product" label="当前商品" min-width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="editLocation(scope.row)">编辑</el-button>
            <el-button 
              v-if="scope.row.status !== 'disabled'" 
              size="small" 
              type="warning" 
              @click="disableLocation(scope.row)"
            >
              禁用
            </el-button>
            <el-button 
              v-else
              size="small" 
              type="success" 
              @click="enableLocation(scope.row)"
            >
              启用
            </el-button>
            <el-button 
              size="small" 
              type="danger"
              @click="deleteLocation(scope.row)"
            >
              删除
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

    <!-- 添加/编辑库位对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="600px"
      @close="resetForm"
    >
      <el-form :model="locationForm" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="库位编码" prop="code">
              <el-input v-model="locationForm.code" placeholder="请输入库位编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="库位类型" prop="type">
              <el-select v-model="locationForm.type" placeholder="请选择类型" style="width: 100%">
                <el-option label="货架" value="货架" />
                <el-option label="地堆" value="地堆" />
                <el-option label="托盘" value="托盘" />
                <el-option label="悬挂" value="悬挂" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属仓库" prop="warehouse_id">
              <el-select 
                v-model="locationForm.warehouse_id" 
                placeholder="请选择仓库" 
                style="width: 100%"
                @change="onFormWarehouseChange"
              >
                <el-option 
                  v-for="warehouse in warehouses" 
                  :key="warehouse.id"
                  :label="warehouse.name" 
                  :value="warehouse.id" 
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属库区" prop="zone_id">
              <el-select v-model="locationForm.zone_id" placeholder="请选择库区" style="width: 100%">
                <el-option 
                  v-for="zone in formFilteredZones" 
                  :key="zone.id"
                  :label="zone.name" 
                  :value="zone.id" 
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="排" prop="row_no">
              <el-input-number 
                v-model="locationForm.row_no" 
                :min="1"
                placeholder="排"
                style="width: 100%; min-width: 120px;"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="列" prop="column_no">
              <el-input-number 
                v-model="locationForm.column_no" 
                :min="1"
                placeholder="列"
                style="width: 100%; min-width: 120px;"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="层" prop="level_no">
              <el-input-number 
                v-model="locationForm.level_no" 
                :min="1"
                placeholder="层"
                style="width: 100%; min-width: 120px;"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最大承重(kg)" prop="max_weight">
              <el-input-number 
                v-model="locationForm.max_weight" 
                :min="0"
                placeholder="承重"
                style="width: 100%; min-width: 150px;"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大体积(m³)" prop="max_volume">
              <el-input-number 
                v-model="locationForm.max_volume" 
                :min="0"
                :precision="2"
                placeholder="体积"
                style="width: 100%; min-width: 150px;"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="备注">
          <el-input 
            v-model="locationForm.remark" 
            type="textarea" 
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveLocation" :loading="saving">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量生成对话框 -->
    <el-dialog 
      title="批量生成库位" 
      v-model="batchDialogVisible" 
      width="500px"
    >
      <el-form :model="batchForm" ref="batchFormRef" label-width="100px">
        <el-form-item label="所属仓库" prop="warehouse_id">
          <el-select 
            v-model="batchForm.warehouse_id" 
            placeholder="请选择仓库" 
            style="width: 100%"
            @change="onBatchWarehouseChange"
          >
            <el-option 
              v-for="warehouse in warehouses" 
              :key="warehouse.id"
              :label="warehouse.name" 
              :value="warehouse.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="所属库区" prop="zone_id">
          <el-select v-model="batchForm.zone_id" placeholder="请选择库区" style="width: 100%">
            <el-option 
              v-for="zone in batchFilteredZones" 
              :key="zone.id"
              :label="zone.name" 
              :value="zone.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="排数">
              <el-input-number 
                v-model="batchForm.rows" 
                :min="1" 
                :max="50" 
                style="width: 100%; min-width: 120px;"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="列数">
              <el-input-number 
                v-model="batchForm.columns" 
                :min="1" 
                :max="50" 
                style="width: 100%; min-width: 120px;"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="层数">
              <el-input-number 
                v-model="batchForm.levels" 
                :min="1" 
                :max="10" 
                style="width: 100%; min-width: 120px;"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="编码前缀">
          <el-input v-model="batchForm.prefix" placeholder="如：A01" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="generateLocations" :loading="generating">生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const generating = ref(false)
const dialogVisible = ref(false)
const batchDialogVisible = ref(false)
const dialogTitle = ref('添加库位')
const formRef = ref()
const batchFormRef = ref()

// 搜索表单
const searchForm = reactive({
  warehouse_id: null,
  zone_id: null,
  code: '',
  status: ''
})

// 库位表单
const locationForm = reactive({
  id: null,
  code: '',
  warehouse_id: null,
  zone_id: null,
  type: '',
  row_no: 1,
  column_no: 1,
  level_no: 1,
  max_weight: null,
  max_volume: null,
  remark: ''
})

// 批量生成表单
const batchForm = reactive({
  warehouse_id: null,
  zone_id: null,
  rows: 5,
  columns: 10,
  levels: 3,
  prefix: 'A'
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 数据列表
const locations = ref([])
const warehouses = ref([])
const zones = ref([])
const selectedLocations = ref([])
const locationTable = ref()

// 统计数据
const locationStats = reactive({
  total: 0,
  empty: 0,
  occupied: 0,
  disabled: 0
})

// 计算属性：分页后的数据
const paginatedLocations = computed(() => {
  const start = (pagination.page - 1) * pagination.size
  const end = start + pagination.size
  return locations.value.slice(start, end)
})

// 计算属性：是否可以批量启用
const canBatchEnable = computed(() => {
  return selectedLocations.value.some(location => location.status === 'disabled')
})

// 计算属性：是否可以批量禁用
const canBatchDisable = computed(() => {
  return selectedLocations.value.some(location => location.status !== 'disabled')
})

// 计算属性：根据选择的仓库过滤库区
const filteredZones = computed(() => {
  if (!searchForm.warehouse_id) return zones.value
  return zones.value.filter(zone => zone.warehouse_id === searchForm.warehouse_id)
})

const formFilteredZones = computed(() => {
  if (!locationForm.warehouse_id) return zones.value
  return zones.value.filter(zone => zone.warehouse_id === locationForm.warehouse_id)
})

const batchFilteredZones = computed(() => {
  if (!batchForm.warehouse_id) return zones.value
  return zones.value.filter(zone => zone.warehouse_id === batchForm.warehouse_id)
})

// 表单验证规则
const rules = {
  code: [
    { required: true, message: '请输入库位编码', trigger: 'blur' }
  ],
  warehouse_id: [
    { required: true, message: '请选择所属仓库', trigger: 'change' }
  ],
  zone_id: [
    { required: true, message: '请选择所属库区', trigger: 'change' }
  ],
  type: [
    { required: true, message: '请选择库位类型', trigger: 'change' }
  ],
  row_no: [
    { required: true, message: '请输入排号', trigger: 'blur' }
  ],
  column_no: [
    { required: true, message: '请输入列号', trigger: 'blur' }
  ],
  level_no: [
    { required: true, message: '请输入层号', trigger: 'blur' }
  ]
}

// 获取状态标签类型
const getStatusType = (status) => {
  const typeMap = {
    'empty': 'success',
    'occupied': 'warning',
    'reserved': 'primary',
    'disabled': 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'empty': '空闲',
    'occupied': '占用',
    'reserved': '预留',
    'disabled': '禁用'
  }
  return textMap[status] || '未知'
}

// 加载基础数据
const loadBasicData = async () => {
  try {
    // 从localStorage加载仓库数据
    const storedWarehouses = JSON.parse(localStorage.getItem('wms_warehouses') || '[]')
    if (storedWarehouses.length > 0) {
      warehouses.value = storedWarehouses.filter(w => w.status === 1).map(w => ({
        id: w.id,
        name: w.name,
        code: w.code
      }))
    } else {
      // 仓库列表默认数据
      warehouses.value = [
        { id: 1, name: '主仓库', code: 'WH001' },
        { id: 2, name: '北京仓库', code: 'WH002' },
        { id: 3, name: '上海仓库', code: 'WH003' }
      ]
    }
    
    // 从localStorage加载库区数据
    const storedZones = JSON.parse(localStorage.getItem('wms_zones') || '[]')
    if (storedZones.length > 0) {
      zones.value = storedZones.filter(z => z.status === 1).map(z => ({
        id: z.id,
        warehouse_id: z.warehouse_id,
        name: z.name,
        code: z.code
      }))
    } else {
      // 库区列表默认数据
      zones.value = [
        { id: 1, warehouse_id: 1, name: 'A区', code: 'A001' },
        { id: 2, warehouse_id: 1, name: 'B区', code: 'B001' },
        { id: 3, warehouse_id: 1, name: 'C区', code: 'C001' },
        { id: 4, warehouse_id: 2, name: 'A区', code: 'A001' },
        { id: 5, warehouse_id: 3, name: 'A区', code: 'A001' }
      ]
    }
  } catch (error) {
    ElMessage.error('加载基础数据失败')
  }
}

// 加载库位列表
const loadLocations = async () => {
  loading.value = true
  try {
    // 从localStorage加载实际库位数据
    const storedLocations = JSON.parse(localStorage.getItem('wms_locations') || '[]')
    
    if (storedLocations.length > 0) {
      // 使用实际存储的库位数据
      locations.value = storedLocations.map(loc => {
        // 获取仓库和库区名称
        const warehouse = warehouses.value.find(w => w.id === loc.warehouse_id)
        const zone = zones.value.find(z => z.id === loc.zone_id)
        
        return {
          ...loc,
          warehouse_name: warehouse?.name || loc.warehouse_name || '未知仓库',
          zone_name: zone?.name || loc.zone_name || '未知库区'
        }
      })
    } else {
      // 如果没有存储数据，使用空数组
      locations.value = []
      console.log('没有找到库位数据，显示空列表')
    }
    
    pagination.total = locations.value.length
    
    // 更新统计数据
    locationStats.total = locations.value.length
    locationStats.empty = locations.value.filter(item => item.status === 'empty').length
    locationStats.occupied = locations.value.filter(item => item.status === 'occupied').length
    locationStats.disabled = locations.value.filter(item => item.status === 'disabled').length
    
    console.log('加载库位数据完成:', {
      total: locationStats.total,
      empty: locationStats.empty,
      occupied: locationStats.occupied,
      disabled: locationStats.disabled
    })
    
  } catch (error) {
    console.error('加载库位列表失败:', error)
    ElMessage.error('加载库位列表失败')
  } finally {
    loading.value = false
  }
}

// 仓库变化处理
const onWarehouseChange = () => {
  searchForm.zone_id = null
}

const onFormWarehouseChange = () => {
  locationForm.zone_id = null
}

const onBatchWarehouseChange = () => {
  batchForm.zone_id = null
}

// 搜索库位
const searchLocations = () => {
  loadLocations()
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    warehouse_id: null,
    zone_id: null,
    code: '',
    status: ''
  })
  loadLocations()
}

// 打开添加对话框
const openAddDialog = () => {
  dialogTitle.value = '添加库位'
  dialogVisible.value = true
}

// 编辑库位
const editLocation = (location) => {
  dialogTitle.value = '编辑库位'
  Object.assign(locationForm, location)
  dialogVisible.value = true
}

// 禁用库位
const disableLocation = async (location) => {
  try {
    await ElMessageBox.confirm(
      `确定要禁用库位 "${location.code}" 吗？`,
      '禁用确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟禁用操作
    const oldStatus = location.status
    location.status = 'disabled'
    
    // 更新统计数据
    if (oldStatus === 'empty') locationStats.empty--
    else if (oldStatus === 'occupied') locationStats.occupied--
    locationStats.disabled++
    
    ElMessage.success('禁用成功')
  } catch {
    // 用户取消操作
  }
}

// 启用库位
const enableLocation = async (location) => {
  // 模拟启用操作
  location.status = 'empty'
  
  // 更新统计数据
  locationStats.disabled--
  locationStats.empty++
  
  ElMessage.success(`库位 ${location.code} 已启用`)
}

// 删除库位
const deleteLocation = async (location) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除库位 "${location.code}" 吗？删除后无法恢复！`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    // 从列表中删除
    const index = locations.value.findIndex(l => l.id === location.id)
    if (index !== -1) {
      const oldStatus = location.status
      locations.value.splice(index, 1)
      pagination.total = locations.value.length
      
      // 同步删除localStorage中的数据
      const storedLocations = JSON.parse(localStorage.getItem('wms_locations') || '[]')
      const updatedLocations = storedLocations.filter(loc => loc.id !== location.id)
      localStorage.setItem('wms_locations', JSON.stringify(updatedLocations))
      
      // 更新统计数据
      locationStats.total = locations.value.length
      if (oldStatus === 'empty') locationStats.empty--
      else if (oldStatus === 'occupied') locationStats.occupied--
      else if (oldStatus === 'disabled') locationStats.disabled--
      
      console.log(`库位 ${location.code} 已删除，同步到localStorage`)
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消操作
  }
}

// 批量生成
const batchGenerate = () => {
  batchDialogVisible.value = true
}

// 生成库位
const generateLocations = async () => {
  if (!batchFormRef.value) return
  
  // 验证必填字段
  if (!batchForm.warehouse_id || !batchForm.zone_id) {
    ElMessage.warning('请选择仓库和库区')
    return
  }
  
  try {
    generating.value = true
    
    const total = batchForm.rows * batchForm.columns * batchForm.levels
    await ElMessageBox.confirm(
      `将生成 ${total} 个库位，确定继续吗？`,
      '批量生成确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 获取仓库和库区信息
    const warehouse = warehouses.value.find(w => w.id === batchForm.warehouse_id)
    const zone = zones.value.find(z => z.id === batchForm.zone_id)
    
    if (!warehouse || !zone) {
      ElMessage.error('仓库或库区信息不存在')
      return
    }
    
    // 生成库位数据
    const newLocations = []
    const existingCodes = locations.value.map(loc => loc.code)
    
    for (let row = 1; row <= batchForm.rows; row++) {
      for (let col = 1; col <= batchForm.columns; col++) {
        for (let level = 1; level <= batchForm.levels; level++) {
          const code = `${batchForm.prefix}${row.toString().padStart(2, '0')}${col.toString().padStart(2, '0')}${level}`
          
          // 检查编码是否重复
          if (existingCodes.includes(code)) {
            continue
          }
          
          const newLocation = {
            id: Date.now() + newLocations.length,
            code: code,
            warehouse_id: batchForm.warehouse_id,
            warehouse_name: warehouse.name,
            zone_id: batchForm.zone_id,
            zone_name: zone.name,
            type: '货架',
            row_no: row,
            column_no: col,
            level_no: level,
            max_weight: 1000,
            max_volume: 5.0,
            current_product: '',
            status: 'empty',
            remark: '批量生成'
          }
          
          newLocations.push(newLocation)
        }
      }
    }
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 添加到列表
    locations.value.unshift(...newLocations)
    pagination.total = locations.value.length
    
    // 更新统计数据
    locationStats.total = locations.value.length
    locationStats.empty = locations.value.filter(item => item.status === 'empty').length
    
    // 保存到localStorage
    const existingData = JSON.parse(localStorage.getItem('wms_locations') || '[]')
    const updatedData = [...existingData, ...newLocations]
    localStorage.setItem('wms_locations', JSON.stringify(updatedData))
    
    ElMessage.success(`成功生成 ${newLocations.length} 个库位`)
    batchDialogVisible.value = false
    
    // 重置批量生成表单
    Object.assign(batchForm, {
      warehouse_id: null,
      zone_id: null,
      rows: 5,
      columns: 10,
      levels: 3,
      prefix: 'A'
    })
    
    // 刷新页面数据
    await loadLocations()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('生成失败')
    }
  } finally {
    generating.value = false
  }
}

// 保存库位
const saveLocation = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    saving.value = true
    
    // 获取localStorage中的数据
    const storedLocations = JSON.parse(localStorage.getItem('wms_locations') || '[]')
    
    if (locationForm.id) {
      // 编辑模式
      const index = locations.value.findIndex(l => l.id === locationForm.id)
      if (index !== -1) {
        const warehouseName = warehouses.value.find(w => w.id === locationForm.warehouse_id)?.name || ''
        const zoneName = zones.value.find(z => z.id === locationForm.zone_id)?.name || ''
        
        const updatedLocation = { 
          ...locationForm, 
          warehouse_name: warehouseName, 
          zone_name: zoneName,
          current_product: locations.value[index].current_product,
          status: locations.value[index].status 
        }
        
        locations.value[index] = updatedLocation
        
        // 同步更新localStorage
        const storageIndex = storedLocations.findIndex(l => l.id === locationForm.id)
        if (storageIndex !== -1) {
          storedLocations[storageIndex] = updatedLocation
        }
        localStorage.setItem('wms_locations', JSON.stringify(storedLocations))
      }
      ElMessage.success('编辑成功')
    } else {
      // 添加模式
      const warehouseName = warehouses.value.find(w => w.id === locationForm.warehouse_id)?.name || ''
      const zoneName = zones.value.find(z => z.id === locationForm.zone_id)?.name || ''
      const newLocation = {
        ...locationForm,
        id: Date.now(),
        warehouse_name: warehouseName,
        zone_name: zoneName,
        current_product: '',
        status: 'empty'
      }
      
      locations.value.unshift(newLocation)
      pagination.total = locations.value.length
      
      // 同步添加到localStorage
      storedLocations.unshift(newLocation)
      localStorage.setItem('wms_locations', JSON.stringify(storedLocations))
      
      // 更新统计数据
      locationStats.total = locations.value.length
      locationStats.empty = locations.value.filter(item => item.status === 'empty').length
      
      console.log('新增库位已保存到localStorage:', newLocation)
      ElMessage.success('添加成功')
    }
    
    dialogVisible.value = false
    resetForm()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('保存失败')
    }
  } finally {
    saving.value = false
  }
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(locationForm, {
    id: null,
    code: '',
    warehouse_id: null,
    zone_id: null,
    type: '',
    row_no: 1,
    column_no: 1,
    level_no: 1,
    max_weight: null,
    max_volume: null,
    remark: ''
  })
}

// 选择变化处理
const handleSelectionChange = (selection) => {
  selectedLocations.value = selection
}

// 批量启用
const batchEnable = async () => {
  try {
    const disabledLocations = selectedLocations.value.filter(loc => loc.status === 'disabled')
    if (disabledLocations.length === 0) {
      ElMessage.warning('没有可启用的库位')
      return
    }
    
    await ElMessageBox.confirm(
      `确定要启用 ${disabledLocations.length} 个库位吗？`,
      '批量启用',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 更新状态
    disabledLocations.forEach(location => {
      const index = locations.value.findIndex(l => l.id === location.id)
      if (index !== -1) {
        locations.value[index].status = 'empty'
      }
    })
    
    // 更新统计
    updateLocationStats()
    
    // 清空选择
    selectedLocations.value = []
    locationTable.value?.clearSelection()
    
    ElMessage.success(`已启用 ${disabledLocations.length} 个库位`)
  } catch {
    // 用户取消
  }
}

// 批量禁用
const batchDisable = async () => {
  try {
    const enabledLocations = selectedLocations.value.filter(loc => loc.status !== 'disabled')
    if (enabledLocations.length === 0) {
      ElMessage.warning('没有可禁用的库位')
      return
    }
    
    await ElMessageBox.confirm(
      `确定要禁用 ${enabledLocations.length} 个库位吗？`,
      '批量禁用',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 更新状态
    enabledLocations.forEach(location => {
      const index = locations.value.findIndex(l => l.id === location.id)
      if (index !== -1) {
        locations.value[index].status = 'disabled'
      }
    })
    
    // 更新统计
    updateLocationStats()
    
    // 清空选择
    selectedLocations.value = []
    locationTable.value?.clearSelection()
    
    ElMessage.success(`已禁用 ${enabledLocations.length} 个库位`)
  } catch {
    // 用户取消
  }
}

// 批量删除
const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 ${selectedLocations.value.length} 个库位吗？此操作不可恢复！`,
      '批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    // 删除选中的库位
    const selectedIds = selectedLocations.value.map(loc => loc.id)
    locations.value = locations.value.filter(loc => !selectedIds.includes(loc.id))
    
    // 同步删除localStorage中的数据
    const storedLocations = JSON.parse(localStorage.getItem('wms_locations') || '[]')
    const updatedLocations = storedLocations.filter(loc => !selectedIds.includes(loc.id))
    localStorage.setItem('wms_locations', JSON.stringify(updatedLocations))
    
    // 更新分页总数
    pagination.total = locations.value.length
    
    // 更新统计
    updateLocationStats()
    
    // 清空选择
    selectedLocations.value = []
    locationTable.value?.clearSelection()
    
    console.log(`批量删除 ${selectedIds.length} 个库位，同步到localStorage`)
    ElMessage.success(`已删除 ${selectedIds.length} 个库位`)
  } catch {
    // 用户取消
  }
}

// 更新统计数据
const updateLocationStats = () => {
  locationStats.total = locations.value.length
  locationStats.empty = locations.value.filter(item => item.status === 'empty').length
  locationStats.occupied = locations.value.filter(item => item.status === 'occupied').length
  locationStats.disabled = locations.value.filter(item => item.status === 'disabled').length
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1 // 重置到第一页
}

const handleCurrentChange = (page) => {
  pagination.page = page
}

onMounted(() => {
  loadBasicData()
  loadLocations()
})
</script>

<style lang="scss" scoped>
.locations-page {
  padding: 20px;
  height: 100vh;
  overflow-y: auto;
  scroll-behavior: smooth;
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
  
  .batch-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }
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
        
        &.empty {
          background: linear-gradient(45deg, #67C23A, #85CE61);
        }
        
        &.occupied {
          background: linear-gradient(45deg, #E6A23C, #EEBE77);
        }
        
        &.disabled {
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

// 响应式设计
@media (max-width: 768px) {
  .locations-page {
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
</style>