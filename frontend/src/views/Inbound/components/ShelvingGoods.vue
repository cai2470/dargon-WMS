<template>
  <div class="shelving-goods">
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
        <el-form-item label="分拣区域">
          <el-select 
            v-model="filterForm.sorting_zone" 
            placeholder="请选择区域"
            clearable
            style="width: 120px"
          >
            <el-option 
              v-for="zone in sortingZones" 
              :key="zone.id"
              :label="zone.name" 
              :value="zone.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分拣时间">
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
        <h3>待上架列表</h3>
        <div class="header-actions">
          <el-button type="success" @click="batchShelve" :disabled="selectedRows.length === 0">
            <el-icon><UploadFilled /></el-icon>
            批量上架
          </el-button>
          <el-button type="primary" @click="autoAssignLocations" :disabled="selectedRows.length === 0">
            <el-icon><Location /></el-icon>
            自动分配库位
          </el-button>
        </div>
      </div>
      
      <el-table :data="tableData" stripe v-loading="loading" size="small" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column label="#" type="index" width="50" />
        <el-table-column prop="order_no" label="入库单号" width="130" />
        <el-table-column prop="supplier_name" label="供应商" width="120" />
        <el-table-column prop="sorting_zone_name" label="分拣区域" width="100" />
        <el-table-column prop="sorting_start_time" label="分拣开始时间" width="130" />
        <el-table-column prop="sorting_method" label="分拣方式" width="100">
          <template #default="scope">
            <el-tag size="small" :type="getSortingMethodColor(scope.row.sorting_method)">
              {{ getSortingMethodText(scope.row.sorting_method) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_quantity" label="总数量" width="100" align="right" />
        <el-table-column prop="qualified_quantity" label="合格数量" width="100" align="right">
          <template #default="scope">
            {{ getQualifiedQuantity(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column prop="unqualified_quantity" label="不合格数量" width="100" align="right">
          <template #default="scope">
            {{ getUnqualifiedQuantity(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column prop="shelving_progress" label="上架进度" width="120">
          <template #default="scope">
            <el-progress 
              :percentage="getShelveProgress(scope.row)" 
              :color="getProgressColor(getShelveProgress(scope.row))"
              :stroke-width="12"
            />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="scope">
            <el-tag type="info" size="small">待上架</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <el-button 
              size="small" 
              type="primary" 
              @click="startShelving(scope.row)"
            >
              开始上架
            </el-button>
            <el-button 
              size="small" 
              type="success" 
              @click="quickShelve(scope.row)"
            >
              快速上架
            </el-button>
            <el-button 
              size="small" 
              type="info" 
              @click="viewDetails(scope.row)"
            >
              查看详情
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

    <!-- 开始上架对话框 -->
    <el-dialog 
      title="开始上架" 
      v-model="shelvingDialogVisible" 
      width="1000px"
    >
      <div v-if="currentOrder">
        <div class="order-info">
          <h4>入库单信息</h4>
          <el-row :gutter="20">
            <el-col :span="6">入库单号：{{ currentOrder.order_no }}</el-col>
            <el-col :span="6">供应商：{{ currentOrder.supplier_name }}</el-col>
            <el-col :span="6">分拣区域：{{ currentOrder.sorting_zone_name }}</el-col>
            <el-col :span="6">分拣方式：{{ getSortingMethodText(currentOrder.sorting_method) }}</el-col>
          </el-row>
        </div>
        
        <el-form :model="shelvingForm" label-width="120px" style="margin-top: 20px;">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="上架人员">
                <el-select v-model="shelvingForm.shelving_staff" multiple placeholder="请选择上架人员" style="width: 100%">
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
              <el-form-item label="目标仓库" required>
                <el-select 
                  v-model="shelvingForm.target_warehouse" 
                  placeholder="请选择仓库" 
                  style="width: 100%"
                  filterable
                  allow-create="false"
                  clearable
                  @change="onTargetWarehouseChange"
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
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="预计上架时间">
                <el-input-number 
                  v-model="shelvingForm.estimated_time" 
                  :min="0.5" 
                  :step="0.5"
                  placeholder="小时"
                  style="width: 100%"
                />
                <span style="margin-left: 8px; color: #666;">小时</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="上架策略">
                <el-radio-group v-model="shelvingForm.shelving_strategy">
                  <el-radio label="fifo">先进先出</el-radio>
                  <el-radio label="nearest">就近原则</el-radio>
                  <el-radio label="category">按类别分区</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="备注">
            <el-input 
              v-model="shelvingForm.remark" 
              type="textarea" 
              :rows="3"
              placeholder="请输入上架备注"
            />
          </el-form-item>
        </el-form>

        <!-- 商品上架明细 -->
        <div class="product-shelving" style="margin-top: 20px;">
          <h4>商品上架明细</h4>
          <el-table :data="currentOrder.products" border size="small">
            <el-table-column prop="product_code" label="商品编码" width="120" />
            <el-table-column prop="product_name" label="商品名称" min-width="140" />
            <el-table-column prop="actual_quantity" label="分拣数量" width="100" align="right" />
            <el-table-column label="合格数量" width="130" align="right">
              <template #default="scope">
                <el-input-number 
                  v-model="scope.row.qualified_quantity" 
                  :min="0" 
                  :max="scope.row.actual_quantity || scope.row.expected_quantity"
                  size="small"
                  style="width: 100%; min-width: 120px;"
                  controls-position="right"
                  @change="updateUnqualifiedQuantity(scope.row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="不合格数量" width="130" align="right">
              <template #default="scope">
                <el-input-number 
                  v-model="scope.row.unqualified_quantity" 
                  :min="0" 
                  :max="scope.row.actual_quantity || scope.row.expected_quantity"
                  size="small"
                  style="width: 100%; min-width: 120px;"
                  controls-position="right"
                  @change="updateQualifiedQuantity(scope.row)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="quality_result" label="质检结果" width="100">
              <template #default="scope">
                <el-tag size="small" :type="getQualityResultType(scope.row.quality_result)">
                  {{ getQualityResultText(scope.row.quality_result) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="建议库区" width="160">
              <template #default="scope">
                <el-select 
                  v-model="scope.row.suggested_zone" 
                  size="small" 
                  style="width: 100%"
                  placeholder="必须选择库区"
                  filterable
                  allow-create="false"
                  clearable
                  @change="updateZoneSelection(scope.row)"
                >
                  <el-option 
                    v-for="zone in filteredZones" 
                    :key="zone.id"
                    :label="`${zone.name} (${zone.warehouse_name})`" 
                    :value="zone.id"
                  >
                    <span>{{ zone.name }}</span>
                    <span style="float: right; color: #8492a6; font-size: 12px;">
                      {{ zone.description || zone.warehouse_name }}
                    </span>
                  </el-option>
                  <template v-if="filteredZones.length === 0">
                    <el-option value="" label="请先选择目标仓库" disabled />
                  </template>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="上架数量" width="130">
              <template #default="scope">
                <el-input-number 
                  v-model="scope.row.shelve_quantity" 
                  :min="0" 
                  :max="scope.row.actual_quantity"
                  size="small"
                  style="width: 100%; min-width: 120px;"
                  controls-position="right"
                />
              </template>
            </el-table-column>

            <el-table-column label="备注" min-width="120">
              <template #default="scope">
                <el-input 
                  v-model="scope.row.shelve_remark" 
                  size="small"
                  placeholder="备注"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="shelvingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStartShelving" :loading="shelving">开始上架</el-button>
      </template>
    </el-dialog>

    <!-- 快速上架对话框 -->
    <el-dialog 
      title="快速上架" 
      v-model="quickShelveDialogVisible" 
      width="600px"
    >
      <div v-if="currentOrder">
        <div class="order-info">
          <h4>入库单信息</h4>
          <p>入库单号：{{ currentOrder.order_no }} | 供应商：{{ currentOrder.supplier_name }}</p>
        </div>
        
        <el-form :model="quickShelveForm" label-width="120px" style="margin-top: 20px;">
          <el-form-item label="上架人员" required>
            <el-select v-model="quickShelveForm.staff_id" placeholder="请选择上架人员" style="width: 100%">
              <el-option 
                v-for="staff in staffList" 
                :key="staff.id"
                :label="staff.name" 
                :value="staff.id" 
              />
            </el-select>
          </el-form-item>
          <el-form-item label="目标仓库" required>
            <el-select 
              v-model="quickShelveForm.warehouse_id" 
              placeholder="请选择仓库" 
              style="width: 100%"
              filterable
              allow-create="false"
              clearable
            >
              <el-option 
                v-for="warehouse in warehouses" 
                :key="warehouse.id"
                :label="warehouse.name" 
                :value="warehouse.id" 
              />
            </el-select>
          </el-form-item>
          <el-form-item label="上架策略">
            <el-radio-group v-model="quickShelveForm.strategy">
              <el-radio label="auto_assign">自动分配库位</el-radio>
              <el-radio label="same_zone">相同区域集中</el-radio>
              <el-radio label="scattered">分散存放</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="备注">
            <el-input 
              v-model="quickShelveForm.remark" 
              type="textarea" 
              :rows="3"
              placeholder="请输入快速上架备注"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="quickShelveDialogVisible = false">取消</el-button>
        <el-button type="success" @click="submitQuickShelve" :loading="quickShelving">确认上架</el-button>
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
          <el-descriptions-item label="分拣区域">{{ currentOrder.sorting_zone_name }}</el-descriptions-item>
          <el-descriptions-item label="分拣开始时间">{{ currentOrder.sorting_start_time }}</el-descriptions-item>
          <el-descriptions-item label="分拣方式">{{ getSortingMethodText(currentOrder.sorting_method) }}</el-descriptions-item>
          <el-descriptions-item label="总数量">{{ currentOrder.total_quantity }}</el-descriptions-item>
          <el-descriptions-item label="合格数量">{{ getQualifiedQuantity(currentOrder) }}</el-descriptions-item>
          <el-descriptions-item label="不合格数量">{{ getUnqualifiedQuantity(currentOrder) }}</el-descriptions-item>
          <el-descriptions-item label="上架进度">{{ getShelveProgress(currentOrder) }}%</el-descriptions-item>
          <el-descriptions-item label="质检要求" :span="3">
            <span v-if="currentOrder.quality_requirements && currentOrder.quality_requirements.length > 0">
              {{ currentOrder.quality_requirements.map(req => getQualityRequirementText(req)).join(', ') }}
            </span>
            <span v-else>无</span>
          </el-descriptions-item>
          <el-descriptions-item label="分拣备注" :span="3">{{ currentOrder.sorting_remark || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 商品明细 -->
        <div style="margin-top: 20px;">
          <h4>商品明细</h4>
          <el-table :data="currentOrder.products" border size="small">
            <el-table-column prop="product_code" label="商品编码" width="120" />
            <el-table-column prop="product_name" label="商品名称" min-width="180" />
            <el-table-column prop="actual_quantity" label="分拣数量" width="100" align="right" />
            <el-table-column label="合格数量" width="100" align="right">
              <template #default="scope">
                {{ scope.row.qualified_quantity || (scope.row.quality_result === 'qualified' ? scope.row.actual_quantity : 0) }}
              </template>
            </el-table-column>
            <el-table-column label="不合格数量" width="100" align="right">
              <template #default="scope">
                {{ scope.row.unqualified_quantity || (scope.row.quality_result === 'unqualified' ? scope.row.actual_quantity : 0) }}
              </template>
            </el-table-column>
            <el-table-column prop="quality_result" label="质检结果" width="100">
              <template #default="scope">
                <el-tag size="small" :type="scope.row.quality_result === 'qualified' ? 'success' : 'danger'">
                  {{ scope.row.quality_result === 'qualified' ? '合格' : '不合格' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sort_status" label="分拣状态" width="100">
              <template #default="scope">
                <el-tag size="small" :type="getSortStatusColor(scope.row.sort_status)">
                  {{ getSortStatusText(scope.row.sort_status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sort_remark" label="分拣备注" min-width="120" />
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
import { getSupplierOptions, getWarehouseOptions } from '@/utils/filterOptions'
import { getStorageData, setStorageData } from '@/utils/storage'

const emit = defineEmits(['refresh'])

// 响应式数据
const loading = ref(false)
const shelving = ref(false)
const quickShelving = ref(false)
const shelvingDialogVisible = ref(false)
const quickShelveDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentOrder = ref(null)
const selectedRows = ref([])

// 筛选表单
const filterForm = reactive({
  order_no: '',
  supplier_id: null,
  sorting_zone: '',
  date_range: []
})

// 上架表单
const shelvingForm = reactive({
  shelving_staff: [],
  target_warehouse: '',
  estimated_time: 1,
  shelving_strategy: 'fifo',
  remark: ''
})

// 快速上架表单
const quickShelveForm = reactive({
  staff_id: '',
  warehouse_id: '',
  strategy: 'auto_assign',
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
const warehouses = ref([])
const staffList = ref([])
const sortingZones = ref([])
const availableZones = ref([])
const filteredZones = ref([]) // 根据选择仓库过滤的库区

// 加载基础数据
const loadBasicData = async () => {
  try {
    // 从localStorage加载实际创建的供应商数据
    const supplierData = getStorageData('wms_suppliers') || []
    if (supplierData.length > 0) {
      suppliers.value = supplierData.map(s => ({
        id: s.id,
        name: s.name,
        code: s.code
      }))
    } else {
      // 备用：从filterOptions加载
      const supplierOptions = getSupplierOptions()
      suppliers.value = supplierOptions.map(s => ({
        id: s.value,
        name: s.label,
        code: s.code
      }))
    }
    
    // 强制清空可能的错误数据
    warehouses.value = []
    
    // 直接从localStorage加载用户创建的仓库数据
    const warehouseData = JSON.parse(localStorage.getItem('wms_warehouses') || '[]')
    console.log('=== 仓库数据加载 ===')
    console.log('原始仓库数据:', warehouseData)
    console.log('数据类型:', typeof warehouseData, '是否为数组:', Array.isArray(warehouseData))
    
    if (Array.isArray(warehouseData) && warehouseData.length > 0) {
      // 过滤启用状态的仓库，支持多种状态格式
      const enabledWarehouses = warehouseData.filter(w => {
        // 确保w是对象且有必要的属性
        if (!w || typeof w !== 'object' || !w.name) {
          console.log('跳过无效仓库数据:', w)
          return false
        }
        
        const status = w.status
        // 支持多种状态格式
        const isEnabled = status === '启用' || 
                         status === 1 || 
                         status === 'active' || 
                         status === '正常' || 
                         status === 'enabled' ||
                         status === 'enable' ||
                         status === true ||
                         (typeof status === 'string' && (status.includes('启用') || status.includes('正常') || status.includes('active')))
        
        console.log(`仓库 ${w.name} 状态: ${status}, 是否启用: ${isEnabled}`)
        return isEnabled
      })
      
      console.log('过滤后的启用仓库:', enabledWarehouses)
      
      warehouses.value = enabledWarehouses.map(w => ({
        id: w.id,
        name: w.name,
        code: w.code || w.warehouse_code,
        status: w.status
      }))
      
      console.log('最终仓库列表:', warehouses.value)
    } else {
      console.log('没有找到仓库数据，将显示空列表')
      warehouses.value = []
    }
    
    // 加载员工列表
    staffList.value = [
      { id: 1, name: '张三' },
      { id: 2, name: '李四' },
      { id: 3, name: '王五' },
      { id: 4, name: '赵六' },
      { id: 5, name: '陈七' }
    ]
    
    // 加载分拣区域
    sortingZones.value = [
      { id: 1, name: '分拣区A' },
      { id: 2, name: '分拣区B' },
      { id: 3, name: '分拣区C' },
      { id: 4, name: '质检分拣区' }
    ]
    
    // 从localStorage加载实际创建的库区
    loadAvailableZones()
    
  } catch (error) {
    ElMessage.error('加载基础数据失败')
    console.error('加载基础数据失败:', error)
  }
}

// 加载可用库区
const loadAvailableZones = async () => {
  try {
    console.log('=== 库区数据加载 ===')
    
    // 从localStorage加载用户创建的库区数据
    const zonesData = JSON.parse(localStorage.getItem('wms_zones') || '[]')
    const warehousesData = JSON.parse(localStorage.getItem('wms_warehouses') || '[]')
    
    console.log('库区数据统计:', { 
      zones: zonesData.length, 
      warehouses: warehousesData.length
    })
    
    if (zonesData.length > 0) {
      availableZones.value = zonesData.map(zone => {
        // 获取仓库信息
        const warehouse = warehousesData.find(w => w.id === zone.warehouse_id)
        
        const zoneInfo = {
          id: zone.id,
          name: zone.name,
          code: zone.code,
          warehouse_id: zone.warehouse_id,
          warehouse_name: warehouse?.name || '未知仓库',
          description: zone.description || `${warehouse?.name || '未知仓库'}的${zone.name}`,
          status: zone.status || 1
        }
        
        console.log(`库区 ${zoneInfo.name}: 仓库ID=${zoneInfo.warehouse_id}, 仓库名=${zoneInfo.warehouse_name}`)
        return zoneInfo
      }).filter(zone => {
        // 只显示启用状态的库区
        const isEnabled = zone.status === 1 || 
                         zone.status === '启用' || 
                         zone.status === 'active' ||
                         zone.status === 'enabled'
        
        console.log(`库区 ${zone.name} 是否启用: ${isEnabled}`)
        return isEnabled
      })
      
      console.log('最终可用库区列表:', availableZones.value)
    } else {
      console.log('没有找到库区数据，显示空列表')
      availableZones.value = []
    }
  } catch (error) {
    console.error('加载库区数据失败:', error)
    availableZones.value = []
  }
}

// 加载待上架列表
const loadTableData = async () => {
  loading.value = true
  try {
    // 从存储中加载入库单数据
    const orders = getStorageData('inbound_orders') || []
    
    // 筛选待上架状态的订单
    let shelvingOrders = orders.filter(order => order.status === 'shelving')
    
    // 补充供应商和区域名称
    shelvingOrders = shelvingOrders.map(order => {
      const supplier = suppliers.value.find(s => s.id === order.supplier_id)
      const sortingZone = sortingZones.value.find(z => z.id === order.sorting_zone)
      return {
        ...order,
        supplier_name: supplier ? supplier.name : '未知供应商',
        sorting_zone_name: sortingZone ? sortingZone.name : '未知区域',
        total_quantity: order.products ? order.products.reduce((sum, p) => sum + (p.actual_quantity || p.expected_quantity || 0), 0) : 0
      }
    })
    
    // 应用筛选条件
    if (filterForm.order_no) {
      shelvingOrders = shelvingOrders.filter(order => 
        order.order_no.toLowerCase().includes(filterForm.order_no.toLowerCase())
      )
    }
    if (filterForm.supplier_id) {
      shelvingOrders = shelvingOrders.filter(order => order.supplier_id === filterForm.supplier_id)
    }
    if (filterForm.sorting_zone) {
      shelvingOrders = shelvingOrders.filter(order => order.sorting_zone === filterForm.sorting_zone)
    }
    
    tableData.value = shelvingOrders
    pagination.total = shelvingOrders.length
    
  } catch (error) {
    ElMessage.error('加载待上架列表失败')
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
    sorting_zone: '',
    date_range: []
  })
  loadTableData()
}

// 选择行变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 目标仓库变化处理
const onTargetWarehouseChange = (warehouseId) => {
  console.log('目标仓库变化:', warehouseId)
  console.log('可用库区列表:', availableZones.value)
  
  // 根据选择的仓库过滤库区
  if (warehouseId) {
    filteredZones.value = availableZones.value.filter(zone => {
      // 支持字符串和数字类型的ID比较
      return zone.warehouse_id == warehouseId || zone.warehouse_id === warehouseId
    })
    console.log('过滤后的库区:', filteredZones.value)
  } else {
    filteredZones.value = []
  }
  
  // 清空所有商品的已选择库区
  if (currentOrder.value && currentOrder.value.products) {
    currentOrder.value.products.forEach(product => {
      product.suggested_zone = null
    })
  }
}

// 获取合格数量
const getQualifiedQuantity = (order) => {
  if (!order.products) return 0
  return order.products.reduce((sum, p) => {
    return sum + (p.quality_result === 'qualified' ? (p.actual_quantity || p.expected_quantity || 0) : 0)
  }, 0)
}

// 获取不合格数量
const getUnqualifiedQuantity = (order) => {
  if (!order.products) return 0
  return order.products.reduce((sum, p) => {
    return sum + (p.quality_result === 'unqualified' ? (p.actual_quantity || p.expected_quantity || 0) : 0)
  }, 0)
}

// 获取上架进度
const getShelveProgress = (order) => {
  if (!order.products || order.products.length === 0) return 0
  const totalItems = order.products.length
  const completedItems = order.products.filter(p => p.shelve_status === 'completed').length
  return Math.round((completedItems / totalItems) * 100)
}

// 获取进度条颜色
const getProgressColor = (percentage) => {
  if (percentage < 30) return '#f56c6c'
  if (percentage < 70) return '#e6a23c'
  return '#67c23a'
}

// 开始上架
const startShelving = (order) => {
  // 调试：检查warehouses数据
  console.log('=== 开始上架调试 ===')
  console.log('当前warehouses数据:', warehouses.value)
  console.log('warehouses数据类型:', typeof warehouses.value)
  console.log('warehouses是否为数组:', Array.isArray(warehouses.value))
  
  // 如果warehouses数据有问题，重新加载
  if (!Array.isArray(warehouses.value) || warehouses.value.length === 0 || 
      (warehouses.value.length > 0 && !warehouses.value[0].name)) {
    console.log('检测到warehouses数据异常，重新加载...')
    loadBasicData()
  }
  
  currentOrder.value = {
    ...order,
    products: order.products.map(p => {
      const totalQuantity = p.actual_quantity || p.expected_quantity || 0
      // 默认95%合格，5%不合格
      const qualifiedQty = p.qualified_quantity || Math.floor(totalQuantity * 0.95)
      const unqualifiedQty = p.unqualified_quantity || Math.ceil(totalQuantity * 0.05)
      // 根据数量确定质检结果
      let qualityResult = 'qualified'
      if (unqualifiedQty > 0 && qualifiedQty > 0) {
        qualityResult = 'mixed' // 混合：有合格也有不合格
      } else if (unqualifiedQty > 0) {
        qualityResult = 'unqualified' // 全部不合格
      }
      
              return {
        ...p,
        qualified_quantity: qualifiedQty,
        unqualified_quantity: unqualifiedQty,
        quality_result: qualityResult, // 动态设置质检结果
        shelve_quantity: qualifiedQty, // 只上架合格数量
        shelve_status: 'pending',
        suggested_zone: null,
        shelve_remark: ''
      }
    })
  }
  
  // 重置表单
  Object.assign(shelvingForm, {
    shelving_staff: [],
    target_warehouse: '',
    estimated_time: 1,
    shelving_strategy: 'fifo',
    remark: ''
  })
  
  // 初始化库区过滤
  filteredZones.value = []
  
  shelvingDialogVisible.value = true
}

// 更新不合格数量（当合格数量变化时）
const updateUnqualifiedQuantity = (product) => {
  const totalQuantity = product.actual_quantity || product.expected_quantity || 0
  const qualifiedQty = product.qualified_quantity || 0
  product.unqualified_quantity = Math.max(0, totalQuantity - qualifiedQty)
  // 更新上架数量为合格数量
  product.shelve_quantity = qualifiedQty
  // 更新质检结果
  updateQualityResult(product)
}

// 更新合格数量（当不合格数量变化时）
const updateQualifiedQuantity = (product) => {
  const totalQuantity = product.actual_quantity || product.expected_quantity || 0
  const unqualifiedQty = product.unqualified_quantity || 0
  product.qualified_quantity = Math.max(0, totalQuantity - unqualifiedQty)
  // 更新上架数量为合格数量
  product.shelve_quantity = product.qualified_quantity
  // 更新质检结果
  updateQualityResult(product)
}

// 更新质检结果
const updateQualityResult = (product) => {
  const qualifiedQty = product.qualified_quantity || 0
  const unqualifiedQty = product.unqualified_quantity || 0
  
  if (unqualifiedQty === 0 && qualifiedQty > 0) {
    product.quality_result = 'qualified' // 全部合格
  } else if (qualifiedQty === 0 && unqualifiedQty > 0) {
    product.quality_result = 'unqualified' // 全部不合格
  } else if (qualifiedQty > 0 && unqualifiedQty > 0) {
    product.quality_result = 'mixed' // 混合状态
  } else {
    product.quality_result = 'pending' // 待检
  }
}

// 获取质检结果类型
const getQualityResultType = (result) => {
  const typeMap = {
    'qualified': 'success',
    'unqualified': 'danger', 
    'mixed': 'warning',
    'pending': 'info'
  }
  return typeMap[result] || 'info'
}

// 获取质检结果文本
const getQualityResultText = (result) => {
  const textMap = {
    'qualified': '合格',
    'unqualified': '不合格',
    'mixed': '混合',
    'pending': '待检'
  }
  return textMap[result] || '待检'
}

// 更新库区选择
const updateZoneSelection = (product) => {
  // 这里可以实现库区选择的相关逻辑
  console.log('选择库区:', product)
}

// 批量上架
const batchShelve = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要批量上架 ${selectedRows.value.length} 个入库单吗？`,
      '批量操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 批量更新状态为已完成
    const orders = getStorageData('inbound_orders') || []
    selectedRows.value.forEach(selectedOrder => {
      const index = orders.findIndex(order => order.id === selectedOrder.id)
      if (index !== -1) {
        orders[index] = {
          ...orders[index],
          status: 'completed',
          shelving_start_time: new Date().toLocaleString(),
          shelving_end_time: new Date().toLocaleString(),
          updated_at: new Date().toLocaleString()
        }
      }
    })
    
    setStorageData('inbound_orders', orders)
    ElMessage.success(`已批量上架 ${selectedRows.value.length} 个入库单`)
    loadTableData()
    emit('refresh')
  } catch {
    // 用户取消操作
  }
}

// 自动分配库位
const autoAssignLocations = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要为 ${selectedRows.value.length} 个入库单自动分配库位吗？`,
      '自动分配',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    // 模拟自动分配库位逻辑
    ElMessage.success('库位自动分配完成')
  } catch {
    // 用户取消操作
  }
}

// 提交开始上架
const submitStartShelving = async () => {
  try {
    // 验证必填项
    if (!shelvingForm.target_warehouse) {
      ElMessage.warning('请选择目标仓库')
      return
    }
    
    // 验证所有商品都必须选择库区
    const unassignedProducts = currentOrder.value.products.filter(product => !product.suggested_zone)
    if (unassignedProducts.length > 0) {
      ElMessage.warning(`请为所有商品选择库区，还有 ${unassignedProducts.length} 个商品未选择库区`)
      return
    }
    
    shelving.value = true
    
    // 获取仓库名称
    const warehouse = warehouses.value.find(w => w.id === shelvingForm.target_warehouse)
    
    // 更新订单状态为已完成
    const orders = getStorageData('inbound_orders') || []
    const index = orders.findIndex(order => order.id === currentOrder.value.id)
    if (index !== -1) {
      orders[index] = {
        ...orders[index],
        status: 'completed',
        shelving_staff: shelvingForm.shelving_staff,
        target_warehouse: shelvingForm.target_warehouse,
        target_warehouse_name: warehouse ? warehouse.name : '',
        estimated_shelving_time: shelvingForm.estimated_time,
        shelving_strategy: shelvingForm.shelving_strategy,
        shelving_remark: shelvingForm.remark,
        products: currentOrder.value.products,
        shelving_start_time: new Date().toLocaleString(),
        shelving_end_time: new Date().toLocaleString(),
        updated_at: new Date().toLocaleString()
      }
      
      // 同步更新库存
      updateInventoryFromInbound(orders[index])
    }
    
    setStorageData('inbound_orders', orders)
    ElMessage.success(`入库单 ${currentOrder.value.order_no} 已完成上架，库存已同步更新`)
    shelvingDialogVisible.value = false
    loadTableData()
    emit('refresh')
  } catch (error) {
    ElMessage.error('开始上架失败')
  } finally {
    shelving.value = false
  }
}

// 合并重复的库存记录
const mergeDuplicateInventory = () => {
  try {
    let inventoryData = JSON.parse(localStorage.getItem('inventory_stock') || '[]')
    const mergedData = {}
    
    // 按商品编码+仓库ID+库区ID分组
    inventoryData.forEach(item => {
      const key = `${item.product_code}-${item.warehouse_id}-${item.zone_id || 1}`
      
      if (mergedData[key]) {
        // 合并库存数量
        mergedData[key].current_stock = (mergedData[key].current_stock || 0) + (item.current_stock || 0)
        mergedData[key].qualified_stock = (mergedData[key].qualified_stock || 0) + (item.qualified_stock || 0)
        mergedData[key].unqualified_stock = (mergedData[key].unqualified_stock || 0) + (item.unqualified_stock || 0)
        mergedData[key].available_stock = mergedData[key].current_stock - (mergedData[key].reserved_stock || 0)
        mergedData[key].last_updated = new Date().toLocaleString()
        
        console.log(`🔄 合并重复记录: ${item.product_name} 库存累加到 ${mergedData[key].current_stock}`)
      } else {
        mergedData[key] = { ...item }
      }
    })
    
    // 转换回数组并保存
    const finalData = Object.values(mergedData)
    localStorage.setItem('inventory_stock', JSON.stringify(finalData))
    
    console.log(`📦 库存去重完成: 原${inventoryData.length}条记录 → 现${finalData.length}条记录`)
    return finalData
  } catch (error) {
    console.error('库存去重失败:', error)
    return null
  }
}

// 从入库单更新库存
const updateInventoryFromInbound = (completedOrder) => {
  try {
    // 获取现有库存数据
    let inventoryData = JSON.parse(localStorage.getItem('inventory_stock') || '[]')
    
    // 获取商品数据
    const productsData = JSON.parse(localStorage.getItem('wms_products') || '[]')
    
    // 处理每个商品
    completedOrder.products.forEach(product => {
      const qualifiedQty = product.qualified_quantity || (product.actual_quantity || product.expected_quantity || 0)
      const unqualifiedQty = product.unqualified_quantity || 0
      
      // 按商品编码、仓库ID和库区查找库存记录（同一商品在同一仓库同一库区应该累加）
      const selectedZone = product.suggested_zone || 1
      
      let inventoryItem = inventoryData.find(item => 
        (item.product_code === product.product_code || item.product_id === product.product_id) &&
        item.warehouse_id == completedOrder.target_warehouse &&
        item.zone_id == selectedZone
      )
      
      console.log(`🔍 查找库存记录: 商品=${product.product_code}, 仓库=${completedOrder.target_warehouse}, 库区=${selectedZone}`)
      console.log(`📦 找到已有记录:`, inventoryItem ? `是，当前库存=${inventoryItem.current_stock}` : '否，将创建新记录')
      
      if (inventoryItem) {
        // 累加更新现有库存
        const originalStock = inventoryItem.current_stock || 0
        const originalQualified = inventoryItem.qualified_stock || 0
        const originalUnqualified = inventoryItem.unqualified_stock || 0
        
        inventoryItem.current_stock = originalStock + qualifiedQty
        inventoryItem.qualified_stock = originalQualified + qualifiedQty
        inventoryItem.unqualified_stock = originalUnqualified + unqualifiedQty
        inventoryItem.available_stock = inventoryItem.current_stock - (inventoryItem.reserved_stock || 0)
        inventoryItem.last_updated = new Date().toLocaleString()
        inventoryItem.last_inbound_order = completedOrder.order_no
        
        // 更新库存状态
        inventoryItem.stock_status = getStockStatus(inventoryItem.current_stock, inventoryItem.min_stock)
        
        console.log(`✅ 库存累加更新: ${product.product_name}`)
        console.log(`   原库存: ${originalStock} → 新库存: ${inventoryItem.current_stock} (增加${qualifiedQty})`)
        console.log(`   原合格: ${originalQualified} → 新合格: ${inventoryItem.qualified_stock}`)
        console.log(`   原不合格: ${originalUnqualified} → 新不合格: ${inventoryItem.unqualified_stock}`)
      } else {
        // 创建新的库存记录
        const productInfo = productsData.find(p => p.code === product.product_code || p.id === product.product_id)
        
        // 获取选择的库区信息
        let zoneInfo = { id: selectedZone, name: 'A区' }
        const zonesData = JSON.parse(localStorage.getItem('wms_zones') || '[]')
        const zone = zonesData.find(z => z.id == selectedZone)
        if (zone) {
          zoneInfo = { id: zone.id, name: zone.name }
        }
        
        console.log(`🆕 创建新库存记录: ${product.product_name}`)
        console.log(`   仓库: ${completedOrder.target_warehouse} (${completedOrder.target_warehouse_name})`)
        console.log(`   库区: ${zoneInfo.id} (${zoneInfo.name})`)
        console.log(`   初始库存: ${qualifiedQty}`)
        
        inventoryItem = {
          id: Date.now() + Math.random(),
          product_id: product.product_id || product.id,
          product_code: product.product_code,
          product_name: product.product_name,
          warehouse_id: completedOrder.target_warehouse || '1',
          warehouse_name: completedOrder.target_warehouse_name || '主仓库',
          zone_id: zoneInfo.id,
          zone_name: zoneInfo.name,
          location_id: 1,
          location_name: 'A001',
          current_stock: qualifiedQty,
          qualified_stock: qualifiedQty,
          unqualified_stock: unqualifiedQty,
          reserved_stock: 0,
          available_stock: qualifiedQty,
          min_stock: productInfo?.min_stock || 10,
          unit: product.unit || productInfo?.unit || '个',
          stock_status: getStockStatus(qualifiedQty, productInfo?.min_stock || 10),
          created_at: new Date().toLocaleString(),
          last_updated: new Date().toLocaleString(),
          last_inbound_order: completedOrder.order_no,
          image: productInfo?.image,
          attributes: productInfo?.attributes || [],
          isku: productInfo?.isku
        }
        
        inventoryData.push(inventoryItem)
      }
    })
    
    // 保存更新后的库存数据
    localStorage.setItem('inventory_stock', JSON.stringify(inventoryData))
    
    // 执行库存去重合并
    const mergedInventory = mergeDuplicateInventory()
    
    console.log('📊 入库完成后的库存统计:')
    const inventorySummary = {}
    inventoryData.forEach(item => {
      const key = `${item.product_code}-${item.warehouse_id}-${item.zone_id}`
      if (!inventorySummary[key]) {
        inventorySummary[key] = {
          product_name: item.product_name,
          warehouse_name: item.warehouse_name,
          zone_name: item.zone_name,
          total_stock: 0,
          records: 0
        }
      }
      inventorySummary[key].total_stock += item.current_stock || 0
      inventorySummary[key].records += 1
    })
    
    Object.values(inventorySummary).forEach(summary => {
      console.log(`   ${summary.product_name} (${summary.warehouse_name}-${summary.zone_name}): ${summary.total_stock} 个库存，${summary.records} 条记录`)
      if (summary.records > 1) {
        console.warn(`⚠️  发现重复记录: ${summary.product_name} 在同一仓库库区有多条记录！`)
      }
    })
    
    // 创建库存变动记录
    createStockMovementRecords(completedOrder)
    
    // 更新商品表中的库存数量（按仓库分别统计）
    updateProductStockByWarehouse(completedOrder.products, completedOrder.target_warehouse)
    
    console.log('库存更新完成:', inventoryData)
  } catch (error) {
    console.error('更新库存失败:', error)
    ElMessage.error('库存同步失败')
  }
}

// 按仓库更新商品表中的库存
const updateProductStockByWarehouse = (products, warehouseId) => {
  try {
    const productsData = JSON.parse(localStorage.getItem('wms_products') || '[]')
    
    products.forEach(product => {
      const qualifiedQty = product.qualified_quantity || (product.actual_quantity || product.expected_quantity || 0)
      
      const productIndex = productsData.findIndex(p => 
        p.code === product.product_code || p.id === product.product_id
      )
      
      if (productIndex !== -1) {
        // 初始化仓库库存记录
        if (!productsData[productIndex].warehouse_stocks) {
          productsData[productIndex].warehouse_stocks = {}
        }
        
        // 按仓库分别记录库存
        const currentWarehouseStock = productsData[productIndex].warehouse_stocks[warehouseId] || 0
        productsData[productIndex].warehouse_stocks[warehouseId] = currentWarehouseStock + qualifiedQty
        
        // 更新总库存（所有仓库库存之和）
        const totalStock = Object.values(productsData[productIndex].warehouse_stocks).reduce((sum, stock) => sum + stock, 0)
        productsData[productIndex].stock = totalStock
        productsData[productIndex].last_stock_update = new Date().toLocaleString()
      }
    })
    
    localStorage.setItem('wms_products', JSON.stringify(productsData))
  } catch (error) {
    console.error('更新商品库存失败:', error)
  }
}

// 创建库存变动记录
const createStockMovementRecords = (completedOrder) => {
  try {
    let stockMovements = JSON.parse(localStorage.getItem('wms_stock_movements') || '[]')
    
    completedOrder.products.forEach(product => {
      const qualifiedQty = product.qualified_quantity || (product.actual_quantity || product.expected_quantity || 0)
      const unqualifiedQty = product.unqualified_quantity || 0
      
      // 合格商品入库记录
      if (qualifiedQty > 0) {
        stockMovements.push({
          id: Date.now() + Math.random(),
          product_id: product.product_id || product.id,
          product_code: product.product_code,
          product_name: product.product_name,
          warehouse_id: completedOrder.target_warehouse,
          warehouse_name: completedOrder.target_warehouse_name || '主仓库',
          movement_type: 'inbound',
          movement_subtype: 'purchase',
          quantity: qualifiedQty,
          before_quantity: 0, // 入库前数量（这里简化处理）
          after_quantity: qualifiedQty, // 入库后数量
          unit: product.unit || '个',
          order_no: completedOrder.order_no,
          reference_type: 'inbound_order',
          reference_id: completedOrder.id,
          reason: '采购入库',
          remark: `入库单${completedOrder.order_no}上架完成`,
          operator: completedOrder.shelving_staff?.[0] || '系统',
          created_by: completedOrder.created_by || '系统',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
      
      // 不合格商品入库记录
      if (unqualifiedQty > 0) {
        stockMovements.push({
          id: Date.now() + Math.random() + 1,
          product_id: product.product_id || product.id,
          product_code: product.product_code,
          product_name: product.product_name,
          warehouse_id: completedOrder.target_warehouse,
          warehouse_name: completedOrder.target_warehouse_name || '主仓库',
          movement_type: 'inbound',
          movement_subtype: 'defective',
          quantity: unqualifiedQty,
          before_quantity: 0,
          after_quantity: unqualifiedQty,
          unit: product.unit || '个',
          order_no: completedOrder.order_no,
          reference_type: 'inbound_order',
          reference_id: completedOrder.id,
          reason: '不合格商品入库',
          remark: `入库单${completedOrder.order_no}不合格商品`,
          operator: completedOrder.shelving_staff?.[0] || '系统',
          created_by: completedOrder.created_by || '系统',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    })
    
    localStorage.setItem('wms_stock_movements', JSON.stringify(stockMovements))
    console.log('✅ 库存变动记录已创建:', stockMovements.slice(-completedOrder.products.length))
  } catch (error) {
    console.error('创建库存变动记录失败:', error)
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

// 快速上架
const quickShelve = (order) => {
  currentOrder.value = order
  // 重置快速上架表单
  Object.assign(quickShelveForm, {
    staff_id: '',
    warehouse_id: '',
    strategy: 'auto_assign',
    remark: ''
  })
  quickShelveDialogVisible.value = true
}

// 提交快速上架
const submitQuickShelve = async () => {
  try {
    // 验证必填项
    if (!quickShelveForm.staff_id) {
      ElMessage.warning('请选择上架人员')
      return
    }
    if (!quickShelveForm.warehouse_id) {
      ElMessage.warning('请选择目标仓库')
      return
    }
    
    quickShelving.value = true
    
    // 获取仓库名称
    const warehouse = warehouses.value.find(w => w.id === quickShelveForm.warehouse_id)
    
    // 更新订单状态为已完成
    const orders = getStorageData('inbound_orders') || []
    const index = orders.findIndex(order => order.id === currentOrder.value.id)
    if (index !== -1) {
      // 为快速上架初始化合格/不合格数量
      const processedProducts = orders[index].products.map(product => {
        const totalQty = product.actual_quantity || product.expected_quantity || 0
        return {
          ...product,
          qualified_quantity: product.qualified_quantity || Math.floor(totalQty * 0.95), // 默认95%合格
          unqualified_quantity: product.unqualified_quantity || Math.ceil(totalQty * 0.05) // 默认5%不合格
        }
      })
      
      orders[index] = {
        ...orders[index],
        status: 'completed',
        shelving_staff: [quickShelveForm.staff_id],
        target_warehouse: quickShelveForm.warehouse_id,
        target_warehouse_name: warehouse ? warehouse.name : '',
        shelving_strategy: quickShelveForm.strategy,
        shelving_method: 'quick_shelve',
        shelving_remark: quickShelveForm.remark,
        products: processedProducts,
        shelving_start_time: new Date().toLocaleString(),
        shelving_end_time: new Date().toLocaleString(),
        updated_at: new Date().toLocaleString()
      }
      
      // 同步更新库存
      updateInventoryFromInbound(orders[index])
    }
    
    setStorageData('inbound_orders', orders)
    ElMessage.success(`入库单 ${currentOrder.value.order_no} 快速上架完成，库存已同步更新`)
    quickShelveDialogVisible.value = false
    loadTableData()
    emit('refresh')
  } catch (error) {
    ElMessage.error('快速上架失败')
  } finally {
    quickShelving.value = false
  }
}

// 查看详情
const viewDetails = (order) => {
  currentOrder.value = order
  detailDialogVisible.value = true
}

// 获取分拣方式文本
const getSortingMethodText = (method) => {
  const methodMap = {
    'by_product': '按商品',
    'by_zone': '按库区',
    'mixed': '混合',
    'quick_sort': '快速分拣'
  }
  return methodMap[method] || '未知'
}

// 获取分拣方式颜色
const getSortingMethodColor = (method) => {
  const colorMap = {
    'by_product': 'primary',
    'by_zone': 'success',
    'mixed': 'warning',
    'quick_sort': 'info'
  }
  return colorMap[method] || 'default'
}

// 获取质检要求文本
const getQualityRequirementText = (requirement) => {
  const requirementMap = {
    'appearance': '外观检查',
    'quantity': '数量核对',
    'specification': '规格检查',
    'expiry': '有效期检查'
  }
  return requirementMap[requirement] || requirement
}

// 获取分拣状态文本
const getSortStatusText = (status) => {
  const statusMap = {
    'pending': '待分拣',
    'sorting': '分拣中',
    'completed': '已完成',
    'problem': '有问题'
  }
  return statusMap[status] || '未知'
}

// 获取分拣状态颜色
const getSortStatusColor = (status) => {
  const colorMap = {
    'pending': 'warning',
    'sorting': 'primary',
    'completed': 'success',
    'problem': 'danger'
  }
  return colorMap[status] || 'default'
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
.shelving-goods {
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
  
  .product-shelving {
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
}
</style>