<template>
  <div class="inspection-page">
    <div class="page-header">
      <h1>质检管理</h1>
      <div class="header-actions">
        <el-button type="success" @click="batchInspect">
          <el-icon><Check /></el-icon>
          批量质检
        </el-button>
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card">
      <el-form :model="searchForm" label-width="80px" :inline="true">
        <el-form-item label="入库单号">
          <el-input 
            v-model="searchForm.inbound_no" 
            placeholder="请输入入库单号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="商品名称">
          <el-input 
            v-model="searchForm.product_name" 
            placeholder="请输入商品名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="质检状态">
          <el-select 
            v-model="searchForm.status" 
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option 
              v-for="status in statusOptions" 
              :key="status.value"
              :label="status.label" 
              :value="status.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select 
            v-model="searchForm.priority" 
            placeholder="优先级"
            clearable
            style="width: 120px"
          >
            <el-option 
              v-for="priority in priorityOptions" 
              :key="priority.value"
              :label="priority.label" 
              :value="priority.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchInspections">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 质检统计 -->
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon pending">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ inspectionStats.pending }}</div>
            <div class="stat-label">待质检</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon inspecting">
            <el-icon><Loading /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ inspectionStats.inspecting }}</div>
            <div class="stat-label">质检中</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon passed">
            <el-icon><Check /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ inspectionStats.passed }}</div>
            <div class="stat-label">质检合格</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon failed">
            <el-icon><Close /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ inspectionStats.failed }}</div>
            <div class="stat-label">质检不合格</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 质检列表 -->
    <el-card class="table-card">
      <el-table 
        :data="inspectionList" 
        stripe 
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="inbound_no" label="入库单号" width="140" />
        <el-table-column prop="product_code" label="商品编码" width="120" />
        <el-table-column prop="product_name" label="商品名称" min-width="180" />
        <el-table-column prop="batch_number" label="批次号" width="120" />
        <el-table-column prop="quantity" label="数量" width="80" align="right" />
        <el-table-column prop="unit" label="单位" width="60" />
        <el-table-column prop="supplier_name" label="供应商" width="120" />
        <el-table-column prop="production_date" label="生产日期" width="110" />
        <el-table-column prop="expiry_date" label="过期日期" width="110" />
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="scope">
            <el-tag 
              :type="getPriorityType(scope.row.priority)"
              effect="plain"
            >
              {{ getPriorityText(scope.row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="质检状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="inspector" label="质检员" width="100" />
        <el-table-column prop="inspection_time" label="质检时间" width="150" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button 
              v-if="scope.row.status === 'pending'"
              size="small" 
              type="primary" 
              @click="startInspection(scope.row)"
            >
              开始质检
            </el-button>
            <el-button 
              v-if="scope.row.status === 'inspecting'"
              size="small" 
              type="success" 
              @click="completeInspection(scope.row)"
            >
              完成质检
            </el-button>
            <el-button 
              size="small" 
              type="info" 
              @click="viewDetails(scope.row)"
            >
              详情
            </el-button>
            <el-button 
              v-if="['passed', 'failed'].includes(scope.row.status)"
              size="small" 
              type="warning" 
              @click="viewReport(scope.row)"
            >
              质检报告
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

    <!-- 质检操作对话框 -->
    <el-dialog 
      title="质检操作" 
      v-model="inspectionDialogVisible" 
      width="800px"
      @close="resetInspectionForm"
    >
      <div v-if="currentInspection" class="inspection-info">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="入库单号">{{ currentInspection.inbound_no }}</el-descriptions-item>
          <el-descriptions-item label="商品名称">{{ currentInspection.product_name }}</el-descriptions-item>
          <el-descriptions-item label="商品编码">{{ currentInspection.product_code }}</el-descriptions-item>
          <el-descriptions-item label="批次号">{{ currentInspection.batch_number }}</el-descriptions-item>
          <el-descriptions-item label="数量">{{ currentInspection.quantity }} {{ currentInspection.unit }}</el-descriptions-item>
          <el-descriptions-item label="供应商">{{ currentInspection.supplier_name }}</el-descriptions-item>
          <el-descriptions-item label="生产日期">{{ currentInspection.production_date }}</el-descriptions-item>
          <el-descriptions-item label="过期日期">{{ currentInspection.expiry_date }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="inspection-form" style="margin-top: 20px">
        <el-form :model="inspectionForm" :rules="inspectionRules" ref="inspectionFormRef" label-width="120px">
          <el-form-item label="质检结果" prop="result">
            <el-radio-group v-model="inspectionForm.result">
              <el-radio value="passed">合格</el-radio>
              <el-radio value="failed">不合格</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="质检项目" prop="inspection_items">
            <el-checkbox-group v-model="inspectionForm.inspection_items">
              <el-checkbox value="appearance">外观检查</el-checkbox>
              <el-checkbox value="function">功能测试</el-checkbox>
              <el-checkbox value="packaging">包装检查</el-checkbox>
              <el-checkbox value="documentation">文档检查</el-checkbox>
              <el-checkbox value="quantity">数量核验</el-checkbox>
              <el-checkbox value="specification">规格确认</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          
          <el-form-item 
            v-if="inspectionForm.result === 'failed'" 
            label="不合格原因" 
            prop="failed_reason"
          >
            <el-select 
              v-model="inspectionForm.failed_reason" 
              multiple 
              placeholder="请选择不合格原因"
              style="width: 100%"
            >
              <el-option label="外观损坏" value="appearance_damage" />
              <el-option label="功能异常" value="function_abnormal" />
              <el-option label="数量不符" value="quantity_mismatch" />
              <el-option label="规格不符" value="specification_mismatch" />
              <el-option label="包装破损" value="packaging_damage" />
              <el-option label="过期商品" value="expired_product" />
              <el-option label="文档缺失" value="missing_documentation" />
              <el-option label="其他原因" value="other" />
            </el-select>
          </el-form-item>
          
          <el-form-item 
            v-if="inspectionForm.result === 'failed'" 
            label="不合格数量" 
            prop="failed_quantity"
          >
            <el-input-number 
              v-model="inspectionForm.failed_quantity" 
              :min="0" 
              :max="currentInspection?.quantity || 0"
              style="width: 200px"
            />
            <span style="margin-left: 10px">{{ currentInspection?.unit }}</span>
          </el-form-item>
          
          <el-form-item 
            v-if="inspectionForm.result === 'failed'" 
            label="处理方式" 
            prop="handling_method"
          >
            <el-radio-group v-model="inspectionForm.handling_method">
              <el-radio value="return">退回供应商</el-radio>
              <el-radio value="repair">维修处理</el-radio>
              <el-radio value="downgrade">降级处理</el-radio>
              <el-radio value="scrap">报废处理</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="质检备注">
            <el-input 
              v-model="inspectionForm.remark" 
              type="textarea" 
              :rows="4"
              placeholder="请输入质检备注"
            />
          </el-form-item>
          
          <el-form-item label="上传图片">
            <el-upload
              action="#"
              list-type="picture-card"
              :auto-upload="false"
              :on-change="handleImageUpload"
              :file-list="inspectionForm.images"
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="inspectionDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveInspection">保存质检结果</el-button>
      </template>
    </el-dialog>

    <!-- 质检报告对话框 -->
    <el-dialog 
      title="质检报告" 
      v-model="reportDialogVisible" 
      width="700px"
    >
      <div v-if="currentReport" class="inspection-report">
        <div class="report-header">
          <h3>质检报告 - {{ currentReport.inbound_no }}</h3>
          <div class="report-time">质检时间：{{ currentReport.inspection_time }}</div>
        </div>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="商品名称">{{ currentReport.product_name }}</el-descriptions-item>
          <el-descriptions-item label="商品编码">{{ currentReport.product_code }}</el-descriptions-item>
          <el-descriptions-item label="批次号">{{ currentReport.batch_number }}</el-descriptions-item>
          <el-descriptions-item label="数量">{{ currentReport.quantity }} {{ currentReport.unit }}</el-descriptions-item>
          <el-descriptions-item label="质检员">{{ currentReport.inspector }}</el-descriptions-item>
          <el-descriptions-item label="质检结果">
            <el-tag :type="currentReport.status === 'passed' ? 'success' : 'danger'">
              {{ getStatusText(currentReport.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="report-details" style="margin-top: 20px">
          <h4>质检详情</h4>
          <el-table :data="currentReport.details" size="small">
            <el-table-column prop="item" label="质检项目" />
            <el-table-column prop="result" label="检查结果">
              <template #default="scope">
                <el-tag :type="scope.row.result === '合格' ? 'success' : 'danger'">
                  {{ scope.row.result }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" />
          </el-table>
        </div>
        
        <div v-if="currentReport.failed_items && currentReport.failed_items.length > 0" class="failed-info" style="margin-top: 20px">
          <h4>不合格信息</h4>
          <p><strong>不合格原因：</strong>{{ currentReport.failed_items.join('、') }}</p>
          <p><strong>不合格数量：</strong>{{ currentReport.failed_quantity }} {{ currentReport.unit }}</p>
          <p><strong>处理方式：</strong>{{ getHandlingMethodText(currentReport.handling_method) }}</p>
        </div>
        
        <div v-if="currentReport.remark" class="inspection-remark" style="margin-top: 20px">
          <h4>质检备注</h4>
          <p>{{ currentReport.remark }}</p>
        </div>
      </div>
      
      <template #footer>
        <el-button type="primary" @click="printReport">打印报告</el-button>
        <el-button @click="reportDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Check, Close, Clock, Loading, Refresh
} from '@element-plus/icons-vue'
import { getInspectionStatusOptions, getPriorityOptions } from '@/utils/filterOptions'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const inspectionDialogVisible = ref(false)
const reportDialogVisible = ref(false)
const inspectionFormRef = ref()

// 搜索表单
const searchForm = reactive({
  inbound_no: '',
  product_name: '',
  status: '',
  priority: ''
})

// 质检表单
const inspectionForm = reactive({
  result: '',
  inspection_items: [],
  failed_reason: [],
  failed_quantity: 0,
  handling_method: '',
  remark: '',
  images: []
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 数据列表
const inspectionList = ref([])
const selectedRows = ref([])
const currentInspection = ref(null)
const currentReport = ref(null)

// 筛选选项
const statusOptions = ref([])
const priorityOptions = ref([])

// 统计数据
const inspectionStats = reactive({
  pending: 0,
  inspecting: 0,
  passed: 0,
  failed: 0
})

// 表单验证规则
const inspectionRules = {
  result: [
    { required: true, message: '请选择质检结果', trigger: 'change' }
  ],
  inspection_items: [
    { required: true, message: '请选择质检项目', trigger: 'change' }
  ],
  failed_reason: [
    { required: true, message: '请选择不合格原因', trigger: 'change' }
  ],
  failed_quantity: [
    { required: true, message: '请输入不合格数量', trigger: 'blur' }
  ],
  handling_method: [
    { required: true, message: '请选择处理方式', trigger: 'change' }
  ]
}

// 获取优先级类型
const getPriorityType = (priority) => {
  const typeMap = {
    'high': 'danger',
    'medium': 'warning',
    'low': 'success'
  }
  return typeMap[priority] || 'info'
}

// 获取优先级文本
const getPriorityText = (priority) => {
  const textMap = {
    'high': '高',
    'medium': '中',
    'low': '低'
  }
  return textMap[priority] || '未知'
}

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    'pending': 'warning',
    'inspecting': 'primary',
    'passed': 'success',
    'failed': 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'pending': '待质检',
    'inspecting': '质检中',
    'passed': '质检合格',
    'failed': '质检不合格'
  }
  return textMap[status] || '未知'
}

// 获取处理方式文本
const getHandlingMethodText = (method) => {
  const textMap = {
    'return': '退回供应商',
    'repair': '维修处理',
    'downgrade': '降级处理',
    'scrap': '报废处理'
  }
  return textMap[method] || '未知'
}

// 加载质检列表
const loadInspectionList = async () => {
  loading.value = true
  try {
    // 模拟API调用
    const mockInspections = [
      {
        id: 1,
        inbound_no: 'IB2024001',
        product_code: 'HW001',
        product_name: '华为P50 Pro',
        batch_number: 'B2024001',
        quantity: 50,
        unit: '台',
        supplier_name: '华为技术有限公司',
        production_date: '2024-01-01',
        expiry_date: '2026-01-01',
        priority: 'high',
        status: 'pending',
        inspector: '',
        inspection_time: '',
        created_at: '2024-01-15 09:00:00'
      },
      {
        id: 2,
        inbound_no: 'IB2024002',
        product_code: 'IP001',
        product_name: 'iPhone 14 Pro',
        batch_number: 'B2024002',
        quantity: 30,
        unit: '台',
        supplier_name: '苹果公司',
        production_date: '2024-01-02',
        expiry_date: '2026-01-02',
        priority: 'medium',
        status: 'inspecting',
        inspector: '张三',
        inspection_time: '',
        created_at: '2024-01-15 10:30:00'
      },
      {
        id: 3,
        inbound_no: 'IB2024003',
        product_code: 'XM001',
        product_name: '小米13 Pro',
        batch_number: 'B2024003',
        quantity: 40,
        unit: '台',
        supplier_name: '小米科技',
        production_date: '2024-01-03',
        expiry_date: '2026-01-03',
        priority: 'low',
        status: 'passed',
        inspector: '李四',
        inspection_time: '2024-01-15 14:30:00',
        created_at: '2024-01-15 11:00:00'
      },
      {
        id: 4,
        inbound_no: 'IB2024004',
        product_code: 'OP001',
        product_name: 'OPPO Find X5',
        batch_number: 'B2024004',
        quantity: 25,
        unit: '台',
        supplier_name: 'OPPO公司',
        production_date: '2024-01-04',
        expiry_date: '2026-01-04',
        priority: 'high',
        status: 'failed',
        inspector: '王五',
        inspection_time: '2024-01-15 15:45:00',
        created_at: '2024-01-15 12:00:00'
      }
    ]
    
    inspectionList.value = mockInspections
    pagination.total = mockInspections.length
    
    // 更新统计数据
    inspectionStats.pending = mockInspections.filter(item => item.status === 'pending').length
    inspectionStats.inspecting = mockInspections.filter(item => item.status === 'inspecting').length
    inspectionStats.passed = mockInspections.filter(item => item.status === 'passed').length
    inspectionStats.failed = mockInspections.filter(item => item.status === 'failed').length
    
  } catch (error) {
    ElMessage.error('加载质检列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索质检
const searchInspections = () => {
  loadInspectionList()
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    inbound_no: '',
    product_name: '',
    status: '',
    priority: ''
  })
  loadInspectionList()
}

// 刷新数据
const refreshData = () => {
  ElMessage.success('数据已刷新')
  loadInspectionList()
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 批量质检
const batchInspect = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要批量质检的商品')
    return
  }
  ElMessage.info(`批量质检 ${selectedRows.value.length} 个商品`)
}

// 开始质检
const startInspection = (inspection) => {
  currentInspection.value = inspection
  resetInspectionForm()
  inspectionDialogVisible.value = true
}

// 完成质检
const completeInspection = (inspection) => {
  currentInspection.value = inspection
  // 如果已经在质检中，直接打开质检对话框
  inspectionDialogVisible.value = true
}

// 查看详情
const viewDetails = (inspection) => {
  ElMessageBox.alert(
    `
    入库单号：${inspection.inbound_no}
    商品名称：${inspection.product_name}
    商品编码：${inspection.product_code}
    批次号：${inspection.batch_number}
    数量：${inspection.quantity} ${inspection.unit}
    供应商：${inspection.supplier_name}
    生产日期：${inspection.production_date}
    过期日期：${inspection.expiry_date}
    优先级：${getPriorityText(inspection.priority)}
    状态：${getStatusText(inspection.status)}
    质检员：${inspection.inspector || '未分配'}
    `,
    '质检详情',
    {
      confirmButtonText: '确定',
      type: 'info'
    }
  )
}

// 查看质检报告
const viewReport = (inspection) => {
  // 模拟质检报告数据
  currentReport.value = {
    ...inspection,
    details: [
      { item: '外观检查', result: '合格', remark: '外观完好无损' },
      { item: '功能测试', result: inspection.status === 'passed' ? '合格' : '不合格', remark: inspection.status === 'passed' ? '功能正常' : '部分功能异常' },
      { item: '包装检查', result: '合格', remark: '包装完整' },
      { item: '数量核验', result: '合格', remark: '数量准确' }
    ],
    failed_items: inspection.status === 'failed' ? ['功能异常', '规格不符'] : [],
    failed_quantity: inspection.status === 'failed' ? 5 : 0,
    handling_method: inspection.status === 'failed' ? 'return' : '',
    remark: inspection.status === 'failed' ? '发现部分商品功能异常，建议退回供应商处理' : '质检通过，可以入库'
  }
  reportDialogVisible.value = true
}

// 图片上传处理
const handleImageUpload = (file, fileList) => {
  inspectionForm.images = fileList
}

// 保存质检结果
const saveInspection = async () => {
  if (!inspectionFormRef.value) return
  
  try {
    await inspectionFormRef.value.validate()
    saving.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('质检结果保存成功')
    inspectionDialogVisible.value = false
    loadInspectionList()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('保存失败')
    }
  } finally {
    saving.value = false
  }
}

// 重置质检表单
const resetInspectionForm = () => {
  if (inspectionFormRef.value) {
    inspectionFormRef.value.resetFields()
  }
  Object.assign(inspectionForm, {
    result: '',
    inspection_items: [],
    failed_reason: [],
    failed_quantity: 0,
    handling_method: '',
    remark: '',
    images: []
  })
}

// 打印报告
const printReport = () => {
  ElMessage.info('打印功能开发中...')
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  loadInspectionList()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadInspectionList()
}

// 加载基础数据
const loadBasicData = () => {
  // 加载质检状态选项
  statusOptions.value = getInspectionStatusOptions()
  
  // 加载优先级选项
  priorityOptions.value = getPriorityOptions()
}

onMounted(() => {
  loadBasicData()
  loadInspectionList()
})
</script>

<style scoped>
.inspection-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-card {
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #fff;
}

.stat-icon.pending {
  background: linear-gradient(135deg, #fad961 0%, #f76b1c 100%);
}

.stat-icon.inspecting {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.passed {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.failed {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.table-card {
  border-radius: 8px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.inspection-info {
  margin-bottom: 20px;
}

.inspection-form {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.inspection-report {
  padding: 20px;
}

.report-header {
  text-align: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #409eff;
  padding-bottom: 15px;
}

.report-header h3 {
  margin: 0 0 10px 0;
  color: #303133;
}

.report-time {
  color: #909399;
  font-size: 14px;
}

.report-details h4,
.failed-info h4,
.inspection-remark h4 {
  color: #303133;
  margin-bottom: 10px;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.failed-info p,
.inspection-remark p {
  margin: 8px 0;
  line-height: 1.6;
}
</style> 