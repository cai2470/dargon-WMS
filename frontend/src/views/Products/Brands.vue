<template>
  <div class="brands-page">
    <div class="page-header">
      <h1>品牌管理</h1>
      <el-button type="primary" @click="openAddDialog">
        <el-icon><Plus /></el-icon>
        添加品牌
      </el-button>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card">
      <el-form :model="searchForm" label-width="80px" :inline="true">
        <el-form-item label="品牌名称">
          <el-input 
            v-model="searchForm.name" 
            placeholder="请输入品牌名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="品牌状态">
          <el-select 
            v-model="searchForm.status" 
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="启用" value="1" />
            <el-option label="停用" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchBrands">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 品牌列表 -->
    <el-card class="table-card">
      <el-table :data="brands" stripe v-loading="loading">
        <el-table-column prop="logo" label="品牌Logo" width="100" align="center">
          <template #default="scope">
            <el-avatar :size="40" :src="scope.row.logo" :alt="scope.row.name">
              {{ scope.row.name.charAt(0) }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="品牌编码" width="120" />
        <el-table-column prop="name" label="品牌名称" min-width="150" />
        <el-table-column prop="name_en" label="英文名称" min-width="150" />
        <el-table-column prop="country" label="品牌国家" width="100" />
        <el-table-column prop="founded_year" label="成立年份" width="100" align="center" />
        <el-table-column prop="product_count" label="商品数量" width="100" align="center" />
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="editBrand(scope.row)">编辑</el-button>
            <el-button size="small" type="info" @click="viewProducts(scope.row)">商品</el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === 1 ? 'warning' : 'success'"
              @click="toggleStatus(scope.row)"
            >
              {{ scope.row.status === 1 ? '停用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteBrand(scope.row)">删除</el-button>
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

    <!-- 添加/编辑品牌对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="500px"
      @close="resetForm"
    >
      <el-form :model="brandForm" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="品牌编码" prop="code">
          <el-input v-model="brandForm.code" placeholder="请输入品牌编码" />
        </el-form-item>
        <el-form-item label="品牌名称" prop="name">
          <el-input v-model="brandForm.name" placeholder="请输入品牌名称" />
        </el-form-item>
        <el-form-item label="英文名称">
          <el-input v-model="brandForm.name_en" placeholder="请输入英文名称" />
        </el-form-item>
        <el-form-item label="品牌国家">
          <el-select v-model="brandForm.country" placeholder="请选择国家" style="width: 100%">
            <el-option label="中国" value="中国" />
            <el-option label="美国" value="美国" />
            <el-option label="日本" value="日本" />
            <el-option label="韩国" value="韩国" />
            <el-option label="德国" value="德国" />
            <el-option label="法国" value="法国" />
            <el-option label="英国" value="英国" />
            <el-option label="意大利" value="意大利" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="成立年份">
          <el-input-number v-model="brandForm.founded_year" :min="1800" :max="2024" style="width: 100%" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="brandForm.sort" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="品牌Logo">
          <el-input v-model="brandForm.logo" placeholder="请输入Logo URL地址" />
        </el-form-item>
        <el-form-item label="品牌描述">
          <el-input 
            v-model="brandForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入品牌描述"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBrand" :loading="saving">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('添加品牌')
const formRef = ref()

// 搜索表单
const searchForm = reactive({
  name: '',
  status: ''
})

// 品牌表单
const brandForm = reactive({
  id: null,
  code: '',
  name: '',
  name_en: '',
  country: '',
  founded_year: null,
  sort: 0,
  logo: '',
  description: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 品牌列表
const brands = ref([])

// 表单验证规则
const rules = {
  code: [
    { required: true, message: '请输入品牌编码', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入品牌名称', trigger: 'blur' }
  ]
}

// 从本地存储加载数据
const loadFromStorage = () => {
  const stored = localStorage.getItem('wms_brands')
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
    localStorage.setItem('wms_brands', JSON.stringify(data))
  } catch (error) {
    console.error('保存到本地存储失败:', error)
  }
}

// 获取默认数据
const getDefaultBrands = () => [
  {
    id: 1,
    code: 'HUAWEI',
    name: '华为',
    name_en: 'HUAWEI',
    country: '中国',
    founded_year: 1987,
    sort: 1,
    logo: 'https://img.alicdn.com/imgextra/i4/6000000007038/O1CN01q6eJ5J1xL8qY5qZ5Q_!!6000000007038-0-tps.jpg',
    description: '华为技术有限公司，全球领先的ICT（信息与通信）基础设施和智能终端提供商',
    product_count: 8,
    status: 1
  },
  {
    id: 2,
    code: 'XIAOMI',
    name: '小米',
    name_en: 'Xiaomi',
    country: '中国',
    founded_year: 2010,
    sort: 2,
    logo: 'https://img.alicdn.com/imgextra/i3/6000000001818/O1CN01FY6q8J1VtgP4Jw6kw_!!6000000001818-0-tps.jpg',
    description: '小米科技有限责任公司，专注于高端智能手机、互联网电视以及智能家居生态链建设的创新型科技企业',
    product_count: 6,
    status: 1
  },
  {
    id: 3,
    code: 'APPLE',
    name: '苹果',
    name_en: 'Apple',
    country: '美国',
    founded_year: 1976,
    sort: 3,
    logo: 'https://img.alicdn.com/imgextra/i1/6000000007219/O1CN01v8QW8M1yRmZ0a0a2Q_!!6000000007219-0-tps.jpg',
    description: '苹果公司，美国跨国科技公司，以设计、开发和销售消费电子、计算机软件以及在线服务为主',
    product_count: 5,
    status: 1
  },
  {
    id: 4,
    code: 'LENOVO',
    name: '联想',
    name_en: 'Lenovo',
    country: '中国',
    founded_year: 1984,
    sort: 4,
    logo: 'https://img.alicdn.com/imgextra/i3/6000000004395/O1CN01jMYQz11kKqG6Y8ksw_!!6000000004395-0-tps.jpg',
    description: '联想集团有限公司，全球最大的个人电脑厂商',
    product_count: 4,
    status: 1
  },
  {
    id: 5,
    code: 'SAMSUNG',
    name: '三星',
    name_en: 'Samsung',
    country: '韩国',
    founded_year: 1938,
    sort: 5,
    logo: 'https://img.alicdn.com/imgextra/i2/6000000004759/O1CN01nN8JQr1oRqY5QxY4z_!!6000000004759-0-tps.jpg',
    description: '三星电子，韩国最大的电子工业企业，同时也是三星集团旗下最大的子公司',
    product_count: 3,
    status: 1
  },
  {
    id: 6,
    code: 'MIDEA',
    name: '美的',
    name_en: 'Midea',
    country: '中国',
    founded_year: 1968,
    sort: 6,
    logo: 'https://img.alicdn.com/imgextra/i4/6000000004132/O1CN01V1nF5Q1jGY4x9N2v8_!!6000000004132-0-tps.jpg',
    description: '美的集团股份有限公司，中国家电行业领军企业',
    product_count: 2,
    status: 0
  }
]

// 加载品牌列表
const loadBrands = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 先尝试从本地存储加载，如果没有则使用默认数据
    let data = loadFromStorage()
    if (!data || data.length === 0) {
      data = getDefaultBrands()
      saveToStorage(data)
    }
    
    brands.value = data
    pagination.total = data.length
    
  } catch (error) {
    ElMessage.error('加载品牌列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索品牌
const searchBrands = () => {
  loadBrands()
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    name: '',
    status: ''
  })
  loadBrands()
}

// 打开添加对话框
const openAddDialog = () => {
  dialogTitle.value = '添加品牌'
  dialogVisible.value = true
}

// 编辑品牌
const editBrand = (brand) => {
  dialogTitle.value = '编辑品牌'
  Object.assign(brandForm, brand)
  dialogVisible.value = true
}

// 查看商品
const viewProducts = (brand) => {
  ElMessage.info(`查看 ${brand.name} 品牌的商品信息`)
}

// 切换状态
const toggleStatus = async (brand) => {
  const action = brand.status === 1 ? '停用' : '启用'
  try {
    await ElMessageBox.confirm(
      `确定要${action}品牌 "${brand.name}" 吗？`,
      '状态确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟状态切换
    brand.status = brand.status === 1 ? 0 : 1
    // 保存数据到本地存储
    saveToStorage(brands.value)
    ElMessage.success(`${action}成功`)
  } catch {
    // 用户取消操作
  }
}

// 删除品牌
const deleteBrand = async (brand) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除品牌 "${brand.name}" 吗？此操作不可逆！`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    // 模拟删除操作
    const index = brands.value.findIndex(b => b.id === brand.id)
    if (index !== -1) {
      brands.value.splice(index, 1)
      pagination.total = brands.value.length
      // 保存数据到本地存储
      saveToStorage(brands.value)
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消操作
  }
}

// 保存品牌
const saveBrand = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    saving.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟数据更新
    if (brandForm.id) {
      // 编辑模式
      const index = brands.value.findIndex(b => b.id === brandForm.id)
      if (index !== -1) {
        brands.value[index] = { ...brandForm, product_count: brands.value[index].product_count, status: brands.value[index].status }
      }
      ElMessage.success('编辑成功')
    } else {
      // 添加模式
      const newBrand = {
        ...brandForm,
        id: Date.now(),
        product_count: 0,
        status: 1
      }
      brands.value.unshift(newBrand)
      pagination.total = brands.value.length
      ElMessage.success('添加成功')
    }
    
    // 保存数据到本地存储
    saveToStorage(brands.value)
    
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
  Object.assign(brandForm, {
    id: null,
    code: '',
    name: '',
    name_en: '',
    country: '',
    founded_year: null,
    sort: 0,
    logo: '',
    description: ''
  })
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  loadBrands()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadBrands()
}

onMounted(() => {
  loadBrands()
})
</script>

<style lang="scss" scoped>
.brands-page {
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
  .brands-page {
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