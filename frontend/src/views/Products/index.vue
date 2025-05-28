<template>
  <div class="products-page">
    <div class="page-header">
      <h1>商品管理</h1>
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
          添加商品
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card">
      <el-form :model="searchForm" label-width="80px" :inline="true">
        <el-form-item label="商品名称">
          <el-input 
            v-model="searchForm.name" 
            placeholder="请输入商品名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="商品编码">
          <el-input 
            v-model="searchForm.code" 
            placeholder="请输入商品编码"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="商品分类">
          <el-select 
            v-model="searchForm.category" 
            placeholder="请选择分类"
            clearable
            style="width: 150px"
          >
            <el-option 
              v-for="category in availableCategories" 
              :key="category.value"
              :label="category.label" 
              :value="category.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchProducts">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 商品列表 -->
    <el-card class="table-card">
      <el-table :data="products" stripe v-loading="loading" size="small">
        <el-table-column prop="code" label="编码" width="100" />
        <el-table-column prop="name" label="商品名称" min-width="180" />
        <el-table-column label="图片" width="60">
          <template #default="scope">
            <el-image 
              v-if="getProductImage(scope.row)" 
              :src="getProductImage(scope.row)" 
              style="width: 32px; height: 32px" 
              fit="cover"
              preview-disabled
            >
              <template #error>
                <div class="image-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div v-else class="image-placeholder">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="isku" label="iSKU" width="100" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="brand" label="品牌" width="100" />
        <el-table-column label="属性" width="120">
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
        <el-table-column prop="price" label="单价" width="100" align="right">
          <template #default="scope">
            ¥{{ parseFloat(scope.row.price || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="60" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === '正常' ? 'success' : 'danger'" size="small">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="editProduct(scope.row)">编辑</el-button>
            <el-button size="small" type="info" @click="viewStock(scope.row)">库存</el-button>
            <el-button size="small" type="danger" @click="deleteProduct(scope.row)">删除</el-button>
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

    <!-- 添加/编辑商品对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="600px"
      @close="handleDialogClose"
    >
      <el-form :model="productForm" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="商品编码" prop="code">
              <el-input 
                v-model="productForm.code" 
                placeholder="请输入商品编码" 
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="iSKU">
              <el-input 
                v-model="productForm.isku" 
                placeholder="请输入iSKU编码" 
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="商品名称" prop="name">
              <el-input 
                v-model="productForm.name" 
                placeholder="请输入商品名称" 
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品分类" prop="category">
              <el-select v-model="productForm.category" placeholder="请选择分类" style="width: 100%">
                <el-option 
                  v-for="category in availableCategories" 
                  :key="category.value"
                  :label="category.label" 
                  :value="category.value" 
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品牌" prop="brand">
              <el-input 
                v-model="productForm.brand" 
                placeholder="请输入品牌" 
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="单位" prop="unit">
              <el-select v-model="productForm.unit" placeholder="选择单位" style="width: 100%">
                <el-option label="台" value="台" />
                <el-option label="个" value="个" />
                <el-option label="件" value="件" />
                <el-option label="箱" value="箱" />
                <el-option label="套" value="套" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单价($)" prop="price">
              <el-input-number 
                v-model="productForm.price" 
                :precision="2"
                :min="0"
                :max="9999999"
                placeholder="0.00"
                style="width: 100%; min-width: 160px;"
                controls-position="right"
                class="wide-input-number"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最低库存" prop="min_stock">
              <el-input-number 
                v-model="productForm.min_stock" 
                :min="0"
                :max="999999"
                placeholder="10"
                style="width: 100%; min-width: 160px;"
                controls-position="right"
                class="wide-input-number"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="商品描述">
          <el-input 
            v-model="productForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入商品描述"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="商品规格">
          <el-input 
            v-model="productForm.specifications" 
            placeholder="如：颜色、尺寸等" 
            style="width: 100%"
          />
        </el-form-item>
        
        <!-- 图片上传 -->
        <el-form-item label="商品图片">
          <el-upload
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :on-change="handleImageUpload"
            :before-upload="beforeImageUpload"
            :file-list="productForm.images"
            :limit="5"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">
            最多上传5张图片，支持JPG、PNG、GIF、WebP格式<br/>
            <span style="color: #67C23A;">✓ 图片会自动压缩为800x800像素，无需手动调整尺寸</span>
          </div>
        </el-form-item>
        
        <!-- 商品属性 -->
        <el-form-item label="商品属性">
          <div class="attribute-section">
            <div class="attribute-list">
              <div 
                v-for="(attr, index) in productForm.attributes" 
                :key="index"
                class="attribute-item"
              >
                <el-input 
                  v-model="attr.name" 
                  placeholder="属性名称"
                  style="width: 140px; margin-right: 10px"
                />
                <el-input 
                  v-model="attr.value" 
                  placeholder="属性值"
                  style="width: 180px; margin-right: 10px"
                />
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="removeAttribute(index)"
                >
                  删除
                </el-button>
              </div>
            </div>
            <el-button 
              size="small" 
              type="primary" 
              @click="addAttribute"
              style="margin-top: 10px"
            >
              <el-icon><Plus /></el-icon>
              添加属性
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProduct" :loading="saving">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog 
      title="批量导入商品" 
      v-model="importDialogVisible" 
      width="600px"
      @close="resetImportDialog"
    >
      <div class="import-section">
        <div class="import-step">
          <h3>步骤1：下载模板</h3>
          <p>请先下载Excel模板，按照模板格式填写商品信息</p>
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
            accept=".xlsx,.xls"
            drag
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                只能上传 .xlsx/.xls 文件，且不超过 10MB
              </div>
            </template>
          </el-upload>
        </div>
        
        <el-divider />
        
        <div class="import-step" v-if="importPreviewData.length > 0">
          <h3>步骤3：数据预览</h3>
          <p>共 {{ importPreviewData.length }} 条数据，请检查无误后确认导入</p>
          <el-table :data="importPreviewData.slice(0, 5)" max-height="200" stripe>
            <el-table-column prop="code" label="商品编码" width="100" />
            <el-table-column prop="name" label="商品名称" width="150" />
            <el-table-column prop="category" label="分类" width="100" />
            <el-table-column prop="brand" label="品牌" width="80" />
            <el-table-column prop="price" label="单价" width="80" />
            <el-table-column prop="unit" label="单位" width="60" />
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
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Picture, Download, Upload } from '@element-plus/icons-vue'
import JsBarcode from 'jsbarcode'
import { getAllCategoryOptions } from '@/utils/filterOptions'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('添加商品')
const formRef = ref()

// 批量导入相关
const importDialogVisible = ref(false)
const importing = ref(false)
const uploadRef = ref()
const importPreviewData = ref([])

// 搜索表单
const searchForm = reactive({
  name: '',
  code: '',
  category: ''
})

// 商品表单
const productForm = reactive({
  id: null,
  code: '',
  isku: '',
  name: '',
  category: '',
  brand: '',
  unit: '',
  price: 0,
  min_stock: 10,
  description: '',
  specifications: '',
  images: [],
  attributes: []
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 商品列表
const products = ref([])

// 可用分类列表
const availableCategories = ref([])

// 表单验证规则
const rules = {
  code: [
    { required: true, message: '请输入商品编码', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择商品分类', trigger: 'change' }
  ],
  brand: [
    { required: true, message: '请输入品牌', trigger: 'blur' }
  ],
  unit: [
    { required: true, message: '请选择单位', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入单价', trigger: 'blur' }
  ]
}

// 从本地存储加载数据
const loadFromStorage = () => {
  const stored = localStorage.getItem('wms_products')
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
    localStorage.setItem('wms_products', JSON.stringify(data))
  } catch (error) {
    console.error('保存到本地存储失败:', error)
  }
}

// 获取默认数据
const getDefaultProducts = () => [
  {
    id: 1,
    code: 'HW001',
    isku: 'X002I2864J',
    name: '华为P50 Pro',
    category: '手机数码',
    brand: '华为',
    unit: '台',
    price: 999.99,
    stock: 45,
    min_stock: 10,
    status: '正常',
    barcode: '6901443384068',
    description: '华为P50 Pro 8GB+256GB 可可茶金',
    specifications: '8GB+256GB, 可可茶金',
    image: '/api/placeholder/200/200',
    images: [
      { name: 'main.jpg', url: '/api/placeholder/200/200' }
    ],
    attributes: [
      { name: '颜色', value: '可可茶金' },
      { name: '内存', value: '8GB+256GB' },
      { name: '屏幕尺寸', value: '6.6英寸' }
    ]
  },
  {
    id: 2,
    code: 'MI001',
    isku: 'X004K02OQ1',
    name: '小米12 Pro',
    category: '手机数码',
    brand: '小米',
    unit: '台',
    price: 699.99,
    stock: 5,
    min_stock: 10,
    status: '正常',
    barcode: '6934177734878',
    description: '小米12 Pro 8GB+128GB 蓝色',
    specifications: '8GB+128GB, 蓝色',
    image: '/api/placeholder/200/200',
    images: [
      { name: 'main.jpg', url: '/api/placeholder/200/200' }
    ],
    attributes: [
      { name: '颜色', value: '蓝色' },
      { name: '内存', value: '8GB+128GB' },
      { name: '屏幕尺寸', value: '6.73英寸' }
    ]
  },
  {
    id: 3,
    code: 'IP001',
    isku: 'X004GEZ8VD',
    name: 'iPhone 14 Pro',
    category: '手机数码',
    brand: 'Apple',
    unit: '台',
    price: 1199.99,
    stock: 23,
    min_stock: 5,
    status: '正常',
    barcode: '194253423515',
    description: 'iPhone 14 Pro 128GB 深空紫色',
    specifications: '128GB, 深空紫色',
    image: '/api/placeholder/200/200',
    images: [
      { name: 'main.jpg', url: '/api/placeholder/200/200' }
    ],
    attributes: [
      { name: '颜色', value: '深空紫色' },
      { name: '容量', value: '128GB' },
      { name: '屏幕尺寸', value: '6.1英寸' }
    ]
  },
  {
    id: 4,
    code: 'LP001',
    isku: 'SSNN32484',
    name: 'ThinkPad X1 Carbon',
    category: '电脑办公',
    brand: '联想',
    unit: '台',
    price: 1899.99,
    stock: 12,
    min_stock: 5,
    status: '正常',
    barcode: '195477589830',
    description: 'ThinkPad X1 Carbon Gen10 14英寸',
    specifications: 'i7-1260P, 16GB, 512GB SSD',
    image: '/api/placeholder/200/200',
    images: [
      { name: 'main.jpg', url: '/api/placeholder/200/200' }
    ],
    attributes: [
      { name: '处理器', value: 'i7-1260P' },
      { name: '内存', value: '16GB' },
      { name: '硬盘', value: '512GB SSD' },
      { name: '屏幕', value: '14英寸' }
    ]
  },
  {
    id: 5,
    code: 'AC001',
    isku: 'X002XSTH23',
    name: '美的空调',
    category: '家用电器',
    brand: '美的',
    unit: '台',
    price: 449.99,
    stock: 8,
    min_stock: 3,
    status: '正常',
    barcode: '6954760120041',
    description: '美的1.5匹变频空调',
    specifications: '1.5匹, 变频, 白色',
    image: '/api/placeholder/200/200',
    images: [
      { name: 'main.jpg', url: '/api/placeholder/200/200' }
    ],
    attributes: [
      { name: '匹数', value: '1.5匹' },
      { name: '类型', value: '变频' },
      { name: '颜色', value: '白色' }
    ]
  }
]

// 加载商品列表
const loadProducts = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 先尝试从本地存储加载，如果没有则使用默认数据
    let data = loadFromStorage()
    if (!data || data.length === 0) {
      data = getDefaultProducts()
      saveToStorage(data)
    }
    
    products.value = data
    pagination.total = data.length
    
    // 动态提取分类选项
    loadAvailableCategories()
    
    // 渲染条形码
    nextTick(() => {
      products.value.forEach(product => {
        if (product.barcode) {
          try {
            JsBarcode(`#barcode-${product.id}`, product.barcode, {
              format: "CODE128",
              width: 1,
              height: 30,
              displayValue: false,
              margin: 0
            })
          } catch (error) {
            console.warn('条形码生成失败:', error)
          }
        }
      })
    })
    
  } catch (error) {
    ElMessage.error('加载商品列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索商品
const searchProducts = () => {
  loadProducts()
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    name: '',
    code: '',
    category: ''
  })
  loadProducts()
}

// 加载可用分类
const loadAvailableCategories = () => {
  availableCategories.value = getAllCategoryOptions()
}

// 显示批量导入对话框
const showImportDialog = () => {
  importDialogVisible.value = true
}

// 下载模板
const downloadTemplate = () => {
  const templateData = [
    {
      '商品编码': 'DEMO001',
      '商品名称': '示例商品',
      'iSKU': 'X001DEMO01',
      '商品分类': '手机数码',
      '品牌': '示例品牌',
      '单位': '台',
      '单价': '999.99',
      '最低库存': '10',
      '商品描述': '这是一个示例商品',
      '规格说明': '示例规格'
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
  link.download = '商品导入模板.csv'
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
            const product = {
              id: Date.now() + Math.random(),
              code: rowData['商品编码'] || '',
              name: rowData['商品名称'] || '',
              isku: rowData['iSKU'] || '',
              category: rowData['商品分类'] || '',
              brand: rowData['品牌'] || '',
              unit: rowData['单位'] || '台',
              price: parseFloat(rowData['单价']) || 0,
              min_stock: parseInt(rowData['最低库存']) || 10,
              description: rowData['商品描述'] || '',
              specifications: rowData['规格说明'] || '',
              stock: 0,
              status: '正常',
              barcode: '',
              images: [],
              attributes: []
            }
            
            // 基本验证
            if (product.code && product.name && product.category && product.brand) {
              data.push(product)
            }
          }
        }
      }
      
      if (data.length === 0) {
        ElMessage.error('没有找到有效的商品数据')
        return
      }
      
      importPreviewData.value = data
      ElMessage.success(`成功解析 ${data.length} 条商品数据`)
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
    const existingCodes = products.value.map(p => p.code)
    const newProducts = []
    const duplicateProducts = []
    
    importPreviewData.value.forEach(product => {
      if (existingCodes.includes(product.code)) {
        duplicateProducts.push(product)
      } else {
        newProducts.push({
          ...product,
          id: Date.now() + Math.random(),
          barcode: Date.now().toString() + Math.floor(Math.random() * 1000)
        })
      }
    })
    
    if (duplicateProducts.length > 0) {
      ElMessage.warning(`发现 ${duplicateProducts.length} 个重复编码的商品，已跳过`)
    }
    
    if (newProducts.length > 0) {
      products.value.unshift(...newProducts)
      pagination.total = products.value.length
      saveToStorage(products.value)
      ElMessage.success(`成功导入 ${newProducts.length} 个商品`)
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
  if (products.value.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }
  
  const exportData = products.value.map(product => ({
    '商品编码': product.code,
    '商品名称': product.name,
    'iSKU': product.isku || '',
    '商品分类': product.category,
    '品牌': product.brand,
    '单位': product.unit,
    '单价': product.price,
    '当前库存': product.stock || 0,
    '最低库存': product.min_stock || 10,
    '状态': product.status,
    '商品描述': product.description || '',
    '规格说明': product.specifications || ''
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
  link.download = `商品数据_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  ElMessage.success('数据导出成功')
}

// 打开添加对话框
const openAddDialog = () => {
  dialogTitle.value = '添加商品'
  dialogVisible.value = true
}

// 编辑商品
const editProduct = (product) => {
  dialogTitle.value = '编辑商品'
  Object.assign(productForm, product)
  dialogVisible.value = true
}

// 查看库存
const viewStock = (product) => {
  ElMessage.info(`${product.name} 当前库存：${product.stock} ${product.unit}`)
}

// 删除商品
const deleteProduct = async (product) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除商品 "${product.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟删除操作
    const index = products.value.findIndex(p => p.id === product.id)
    if (index !== -1) {
      products.value.splice(index, 1)
      pagination.total = products.value.length
      // 保存数据到本地存储
      saveToStorage(products.value)
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消删除
  }
}

// 保存商品
const saveProduct = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    saving.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 处理图片数据
    const processedImages = productForm.images.map(img => ({
      name: img.name,
      url: img.url || img.response?.url || ''
    }))
    
    const productData = {
      ...productForm,
      images: processedImages,
      image: processedImages.length > 0 ? processedImages[0].url : null
    }
    
    // 模拟数据更新
    if (productForm.id) {
      // 编辑模式
      const index = products.value.findIndex(p => p.id === productForm.id)
      if (index !== -1) {
        products.value[index] = { 
          ...productData, 
          stock: products.value[index].stock, 
          status: products.value[index].status 
        }
      }
      ElMessage.success('编辑成功')
    } else {
      // 添加模式
      const newProduct = {
        ...productData,
        id: Date.now(),
        stock: 0,
        status: '正常',
        barcode: Date.now().toString()
      }
      products.value.unshift(newProduct)
      pagination.total = products.value.length
      ElMessage.success('添加成功')
    }
    
    // 保存数据到本地存储
    saveToStorage(products.value)
    
    dialogVisible.value = false
    resetForm()
    
    // 重新渲染条形码
    nextTick(() => {
      products.value.forEach(product => {
        if (product.barcode) {
          try {
            JsBarcode(`#barcode-${product.id}`, product.barcode, {
              format: "CODE128",
              width: 1,
              height: 30,
              displayValue: false,
              margin: 0
            })
          } catch (error) {
            console.warn('条形码生成失败:', error)
          }
        }
      })
    })
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
  Object.assign(productForm, {
    id: null,
    code: '',
    isku: '',
    name: '',
    category: '',
    brand: '',
    unit: '',
    price: 0,
    min_stock: 10,
    description: '',
    specifications: '',
    images: [],
    attributes: []
  })
}

// 图片上传前的处理
const beforeImageUpload = (file) => {
  const isImage = /^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.type)
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传图片格式的文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('上传图片大小不能超过 10MB!')
    return false
  }
  return true
}

// 图片上传处理 - 自动压缩和调整尺寸
const handleImageUpload = async (file, fileList) => {
  try {
    // 处理新上传的图片
    if (file.status === 'ready' && file.raw) {
      const compressedFile = await compressImage(file.raw, 800, 800, 0.8)
      
      // 创建新的文件对象
      const processedFile = {
        ...file,
        url: compressedFile.dataUrl,
        name: file.name,
        uid: file.uid,
        status: 'success'
      }
      
      // 更新文件列表
      const updatedFileList = fileList.map(f => f.uid === file.uid ? processedFile : f)
      productForm.images = updatedFileList
    } else {
      productForm.images = fileList
    }
  } catch (error) {
    ElMessage.error('图片处理失败，请重试')
    console.error('图片压缩失败:', error)
  }
}

// 图片压缩函数
const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // 计算压缩后的尺寸
      let { width, height } = img
      
      // 按比例缩放
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }
      
      // 设置画布尺寸
      canvas.width = width
      canvas.height = height
      
      // 绘制压缩后的图片
      ctx.drawImage(img, 0, 0, width, height)
      
      // 转换为 DataURL
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      
      // 转换为 Blob（可选）
      canvas.toBlob((blob) => {
        resolve({
          dataUrl,
          blob,
          width,
          height,
          originalSize: file.size,
          compressedSize: blob.size
        })
      }, 'image/jpeg', quality)
    }
    
    img.onerror = () => {
      reject(new Error('图片加载失败'))
    }
    
    // 读取文件
    const reader = new FileReader()
    reader.onload = (e) => {
      img.src = e.target.result
    }
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    reader.readAsDataURL(file)
  })
}

// 添加属性
const addAttribute = () => {
  productForm.attributes.push({
    name: '',
    value: ''
  })
}

// 移除属性
const removeAttribute = (index) => {
  productForm.attributes.splice(index, 1)
}

// 处理对话框关闭
const handleDialogClose = () => {
  resetForm()
}

// 获取商品图片
const getProductImage = (product) => {
  // 优先使用 images 数组中的第一张图片
  if (product.images && product.images.length > 0) {
    return product.images[0].url
  }
  // 其次使用 image 字段
  if (product.image) {
    return product.image
  }
  return null
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  loadProducts()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadProducts()
}

onMounted(() => {
  loadProducts()
})
</script>

<style lang="scss" scoped>
.products-page {
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

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.low-stock {
  color: #F56C6C;
  font-weight: 600;
}

.barcode {
  display: flex;
  justify-content: center;
  
  svg {
    max-width: 100px;
  }
}

.upload-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}

.attribute-section {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
  background-color: #fafafa;

  .attribute-list {
    margin-bottom: 10px;
  }

  .attribute-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.image-placeholder {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  color: #c0c4cc;
}

// 输入框样式优化
:deep(.wide-input-number) {
  .el-input__inner {
    min-width: 140px !important;
    text-align: left !important;
  }
  
  .el-input-number__increase,
  .el-input-number__decrease {
    width: 28px !important;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .products-page {
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