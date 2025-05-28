<template>
  <div class="suppliers-page">
    <div class="page-header">
      <h1>供应商管理</h1>
      <div class="header-actions">
        <el-button type="info" @click="downloadTemplate">
          <el-icon><Download /></el-icon>
          下载模板
        </el-button>
        <el-button type="success" @click="showImportDialog">
          <el-icon><Upload /></el-icon>
          批量导入
        </el-button>
        <el-button type="warning" @click="exportData">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
        <el-button type="primary" @click="openAddDialog">
          <el-icon><Plus /></el-icon>
          添加供应商
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card">
      <el-form :model="searchForm" label-width="80px" :inline="true">
        <el-form-item label="供应商名称">
          <el-input 
            v-model="searchForm.name" 
            placeholder="请输入供应商名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input 
            v-model="searchForm.contact" 
            placeholder="请输入联系人"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select 
            v-model="searchForm.status" 
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="合作中" value="1" />
            <el-option label="已停用" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchSuppliers">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 供应商列表 -->
    <el-card class="table-card">
      <el-table :data="suppliers" stripe v-loading="loading">
        <el-table-column prop="code" label="供应商编码" width="120" />
        <el-table-column prop="name" label="供应商名称" min-width="200" />
        <el-table-column prop="contact" label="联系人" width="100" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="email" label="邮箱" width="180" show-overflow-tooltip />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="credit_rating" label="信用等级" width="100" align="center">
          <template #default="scope">
            <el-rate :model-value="scope.row.credit_rating" disabled show-score />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '合作中' : '已停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="editSupplier(scope.row)">编辑</el-button>
            <el-button size="small" type="info" @click="viewProducts(scope.row)">商品</el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === 1 ? 'warning' : 'success'"
              @click="toggleStatus(scope.row)"
            >
              {{ scope.row.status === 1 ? '停用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteSupplier(scope.row)">删除</el-button>
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

    <!-- 添加/编辑供应商对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="600px"
      @close="resetForm"
    >
      <el-form :model="supplierForm" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商编码" prop="code">
              <el-input v-model="supplierForm.code" placeholder="请输入供应商编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商名称" prop="name">
              <el-input v-model="supplierForm.name" placeholder="请输入供应商名称" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contact">
              <el-input v-model="supplierForm.contact" placeholder="请输入联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="supplierForm.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="supplierForm.email" placeholder="请输入邮箱地址" />
        </el-form-item>
        
        <el-form-item label="地址" prop="address">
          <el-input v-model="supplierForm.address" placeholder="请输入详细地址" />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="信用等级">
              <el-rate v-model="supplierForm.credit_rating" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="合作类型">
              <el-select v-model="supplierForm.cooperation_type" placeholder="请选择合作类型" style="width: 100%">
                <el-option label="长期合作" value="长期合作" />
                <el-option label="项目合作" value="项目合作" />
                <el-option label="临时采购" value="临时采购" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="备注">
          <el-input 
            v-model="supplierForm.remark" 
            type="textarea" 
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSupplier" :loading="saving">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog 
      title="批量导入供应商" 
      v-model="importDialogVisible" 
      width="600px"
      @close="resetImportDialog"
    >
      <div class="import-section">
        <div class="import-step">
          <h3>步骤1：下载模板</h3>
          <p>请先下载Excel模板，按照模板格式填写供应商信息</p>
          <el-button type="primary" @click="downloadTemplate">
            <el-icon><Download /></el-icon>
            下载Excel模板
          </el-button>
        </div>
        
        <el-divider />
        
        <div class="import-step">
          <h3>步骤2：上传文件</h3>
          <p>选择填写好的Excel文件进行上传</p>
          <el-upload
            ref="uploadRef"
            class="upload-demo"
            :action="''"
            :before-upload="beforeFileUpload"
            :on-change="handleFileChange"
            :auto-upload="false"
            :show-file-list="true"
            accept=".xlsx,.xls,.csv"
            drag
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                只能上传 .xlsx/.xls/.csv 文件，且不超过 10MB
              </div>
            </template>
          </el-upload>
        </div>
        
        <el-divider />
        
        <div class="import-step" v-if="importPreviewData.length > 0">
          <h3>步骤3：数据预览</h3>
          <p>共 {{ importPreviewData.length }} 条数据，请检查无误后确认导入</p>
          <el-table :data="importPreviewData.slice(0, 5)" max-height="200" stripe>
            <el-table-column prop="code" label="供应商编码" width="100" />
            <el-table-column prop="name" label="供应商名称" width="150" />
            <el-table-column prop="contact" label="联系人" width="80" />
            <el-table-column prop="phone" label="联系电话" width="110" />
            <el-table-column prop="cooperation_type" label="合作类型" width="100" />
          </el-table>
          <div v-if="importPreviewData.length > 5" class="preview-more">
            ... 还有 {{ importPreviewData.length - 5 }} 条数据
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmImport" 
          :loading="importing"
          :disabled="importPreviewData.length === 0"
        >
          确认导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Upload } from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('添加供应商')
const formRef = ref()

// 批量导入相关
const importDialogVisible = ref(false)
const importing = ref(false)
const uploadRef = ref()
const importPreviewData = ref([])

// 搜索表单
const searchForm = reactive({
  name: '',
  contact: '',
  status: ''
})

// 供应商表单
const supplierForm = reactive({
  id: null,
  code: '',
  name: '',
  contact: '',
  phone: '',
  email: '',
  address: '',
  credit_rating: 3,
  cooperation_type: '',
  remark: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 供应商列表
const suppliers = ref([])

// 表单验证规则
const rules = {
  code: [
    { required: true, message: '请输入供应商编码', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入供应商名称', trigger: 'blur' }
  ],
  contact: [
    { required: true, message: '请输入联系人', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入地址', trigger: 'blur' }
  ]
}

// 从本地存储加载数据
const loadFromStorage = () => {
  const stored = localStorage.getItem('wms_suppliers')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (error) {
      console.error('解析本地存储数据失败:', error)
    }
  }
  return null
}

// 保存数据到本地存储
const saveToStorage = (data) => {
  try {
    localStorage.setItem('wms_suppliers', JSON.stringify(data))
  } catch (error) {
    console.error('保存到本地存储失败:', error)
  }
}

// 获取默认数据
const getDefaultSuppliers = () => [
  {
    id: 1,
    code: 'SUP001',
    name: '华为技术有限公司',
    contact: '张经理',
    phone: '13800138001',
    email: 'zhang@huawei.com',
    address: '广东省深圳市龙岗区坂田华为基地',
    credit_rating: 5,
    cooperation_type: '长期合作',
    status: 1,
    remark: '华为官方供应商，产品质量可靠'
  },
  {
    id: 2,
    code: 'SUP002',
    name: '小米科技有限责任公司',
    contact: '李经理',
    phone: '13800138002',
    email: 'li@xiaomi.com',
    address: '北京市海淀区清河中街68号华润五彩城',
    credit_rating: 4,
    cooperation_type: '长期合作',
    status: 1,
    remark: '小米官方供应商，性价比高'
  },
  {
    id: 3,
    code: 'SUP003',
    name: '苹果电子产品商贸有限公司',
    contact: '王经理',
    phone: '13800138003',
    email: 'wang@apple-trade.com',
    address: '上海市浦东新区陆家嘴金融贸易区',
    credit_rating: 5,
    cooperation_type: '项目合作',
    status: 1,
    remark: '苹果产品代理商，品质保证'
  },
  {
    id: 4,
    code: 'SUP004',
    name: '联想集团有限公司',
    contact: '赵经理',
    phone: '13800138004',
    email: 'zhao@lenovo.com',
    address: '北京市海淀区上地信息产业基地',
    credit_rating: 4,
    cooperation_type: '长期合作',
    status: 1,
    remark: '联想官方合作伙伴'
  },
  {
    id: 5,
    code: 'SUP005',
    name: '美的集团股份有限公司',
    contact: '刘经理',
    phone: '13800138005',
    email: 'liu@midea.com',
    address: '广东省佛山市顺德区美的总部大楼',
    credit_rating: 4,
    cooperation_type: '长期合作',
    status: 0,
    remark: '家电供应商，合作暂停'
  }
]

// 加载供应商列表
const loadSuppliers = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 先尝试从本地存储加载，如果没有则使用默认数据
    let data = loadFromStorage()
    if (!data || data.length === 0) {
      data = getDefaultSuppliers()
      saveToStorage(data)
    }
    
    suppliers.value = data
    pagination.total = data.length
    
  } catch (error) {
    ElMessage.error('加载供应商列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索供应商
const searchSuppliers = () => {
  loadSuppliers()
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    name: '',
    contact: '',
    status: ''
  })
  loadSuppliers()
}

// 打开添加对话框
const openAddDialog = () => {
  dialogTitle.value = '添加供应商'
  dialogVisible.value = true
}

// 编辑供应商
const editSupplier = (supplier) => {
  dialogTitle.value = '编辑供应商'
  Object.assign(supplierForm, supplier)
  dialogVisible.value = true
}

// 查看商品
const viewProducts = (supplier) => {
  ElMessage.info(`查看 ${supplier.name} 的商品信息`)
}

// 切换状态
const toggleStatus = async (supplier) => {
  const action = supplier.status === 1 ? '停用' : '启用'
  try {
    await ElMessageBox.confirm(
      `确定要${action}供应商 "${supplier.name}" 吗？`,
      '状态确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟状态切换
    supplier.status = supplier.status === 1 ? 0 : 1
    // 保存数据到本地存储
    saveToStorage(suppliers.value)
    ElMessage.success(`${action}成功`)
  } catch {
    // 用户取消操作
  }
}

// 删除供应商
const deleteSupplier = async (supplier) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除供应商 "${supplier.name}" 吗？此操作不可逆！`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    // 模拟删除操作
    const index = suppliers.value.findIndex(s => s.id === supplier.id)
    if (index !== -1) {
      suppliers.value.splice(index, 1)
      pagination.total = suppliers.value.length
      // 保存数据到本地存储
      saveToStorage(suppliers.value)
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消操作
  }
}

// 保存供应商
const saveSupplier = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    saving.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟数据更新
    if (supplierForm.id) {
      // 编辑模式
      const index = suppliers.value.findIndex(s => s.id === supplierForm.id)
      if (index !== -1) {
        suppliers.value[index] = { ...supplierForm, status: suppliers.value[index].status }
      }
      ElMessage.success('编辑成功')
    } else {
      // 添加模式
      const newSupplier = {
        ...supplierForm,
        id: Date.now(),
        status: 1
      }
      suppliers.value.unshift(newSupplier)
      pagination.total = suppliers.value.length
      ElMessage.success('添加成功')
    }
    
    // 保存数据到本地存储
    saveToStorage(suppliers.value)
    
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
  Object.assign(supplierForm, {
    id: null,
    code: '',
    name: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    credit_rating: 3,
    cooperation_type: '',
    remark: ''
  })
}

// 显示批量导入对话框
const showImportDialog = () => {
  importDialogVisible.value = true
}

// 下载模板
const downloadTemplate = () => {
  const templateData = [
    {
      '供应商编码': 'SUP001',
      '供应商名称': '示例供应商有限公司',
      '联系人': '张经理',
      '联系电话': '13800138001',
      '邮箱': 'example@company.com',
      '地址': '示例地址',
      '信用等级': '5',
      '合作类型': '长期合作',
      '备注': '示例备注'
    }
  ]
  
  // 创建CSV内容
  const headers = Object.keys(templateData[0])
  const csvContent = [
    headers.join(','),
    templateData.map(row => Object.values(row).join(',')).join('\n')
  ].join('\n')
  
  // 创建下载链接
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '供应商导入模板.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  ElMessage.success('模板下载成功')
}

// 文件上传前验证
const beforeFileUpload = (file) => {
  const isExcel = /\.(xlsx|xls|csv)$/i.test(file.name)
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isExcel) {
    ElMessage.error('只能上传 Excel 或 CSV 文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('上传文件大小不能超过 10MB!')
    return false
  }
  return false // 阻止自动上传
}

// 处理文件变化
const handleFileChange = (file) => {
  if (file.raw) {
    parseExcelFile(file.raw)
  }
}

// 解析Excel文件
const parseExcelFile = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const text = e.target.result
      const lines = text.split('\n')
      
      if (lines.length < 2) {
        ElMessage.error('文件格式不正确，至少需要包含表头和一行数据')
        return
      }
      
      // 解析CSV格式
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const data = []
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
          if (values.length >= headers.length) {
            const rowData = {}
            headers.forEach((header, index) => {
              rowData[header] = values[index] || ''
            })
            
            // 转换为内部格式
            const supplier = {
              id: Date.now() + Math.random(),
              code: rowData['供应商编码'] || '',
              name: rowData['供应商名称'] || '',
              contact: rowData['联系人'] || '',
              phone: rowData['联系电话'] || '',
              email: rowData['邮箱'] || '',
              address: rowData['地址'] || '',
              credit_rating: parseInt(rowData['信用等级']) || 3,
              cooperation_type: rowData['合作类型'] || '长期合作',
              remark: rowData['备注'] || '',
              status: 1
            }
            
            // 基本验证
            if (supplier.code && supplier.name && supplier.contact && supplier.phone) {
              data.push(supplier)
            }
          }
        }
      }
      
      if (data.length === 0) {
        ElMessage.error('没有找到有效的供应商数据')
        return
      }
      
      importPreviewData.value = data
      ElMessage.success(`成功解析 ${data.length} 条供应商数据`)
    } catch (error) {
      console.error('文件解析失败:', error)
      ElMessage.error('文件解析失败，请检查文件格式')
    }
  }
  
  reader.readAsText(file, 'utf-8')
}

// 确认导入
const confirmImport = async () => {
  if (importPreviewData.value.length === 0) {
    ElMessage.warning('没有数据可导入')
    return
  }
  
  try {
    importing.value = true
    
    // 模拟导入过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 检查重复编码
    const existingCodes = suppliers.value.map(s => s.code)
    const newSuppliers = []
    const duplicateSuppliers = []
    
    importPreviewData.value.forEach(supplier => {
      if (existingCodes.includes(supplier.code)) {
        duplicateSuppliers.push(supplier)
      } else {
        newSuppliers.push({
          ...supplier,
          id: Date.now() + Math.random()
        })
      }
    })
    
    if (duplicateSuppliers.length > 0) {
      ElMessage.warning(`发现 ${duplicateSuppliers.length} 个重复编码的供应商，已跳过`)
    }
    
    if (newSuppliers.length > 0) {
      suppliers.value.unshift(...newSuppliers)
      pagination.total = suppliers.value.length
      saveToStorage(suppliers.value)
      ElMessage.success(`成功导入 ${newSuppliers.length} 个供应商`)
    }
    
    importDialogVisible.value = false
    resetImportDialog()
    
  } catch (error) {
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
}

// 重置导入对话框
const resetImportDialog = () => {
  importPreviewData.value = []
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

// 导出数据
const exportData = () => {
  if (suppliers.value.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }
  
  const exportData = suppliers.value.map(supplier => ({
    '供应商编码': supplier.code,
    '供应商名称': supplier.name,
    '联系人': supplier.contact,
    '联系电话': supplier.phone,
    '邮箱': supplier.email || '',
    '地址': supplier.address,
    '信用等级': supplier.credit_rating || 3,
    '合作类型': supplier.cooperation_type || '',
    '状态': supplier.status === 1 ? '启用' : '停用',
    '备注': supplier.remark || ''
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
  link.download = `供应商数据_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  ElMessage.success('数据导出成功')
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  loadSuppliers()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadSuppliers()
}

onMounted(() => {
  loadSuppliers()
})
</script>

<style lang="scss" scoped>
.suppliers-page {
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
}

.search-card, .table-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

// 响应式设计
@media (max-width: 768px) {
  .suppliers-page {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    
    h1 {
      font-size: 20px;
    }
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