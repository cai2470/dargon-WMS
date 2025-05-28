<template>
  <div class="categories-page">
    <div class="page-header">
      <h1>商品分类</h1>
      <el-button type="primary" @click="openAddDialog">
        <el-icon><Plus /></el-icon>
        添加分类
      </el-button>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card">
      <el-form :model="searchForm" label-width="80px" :inline="true">
        <el-form-item label="分类名称">
          <el-input 
            v-model="searchForm.name" 
            placeholder="请输入分类名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="分类状态">
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
          <el-button type="primary" @click="searchCategories">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 分类列表 -->
    <el-card class="table-card">
      <el-table :data="categories" stripe v-loading="loading" row-key="id" :tree-props="{children: 'children', hasChildren: 'hasChildren'}">
        <el-table-column prop="name" label="分类名称" min-width="200" />
        <el-table-column prop="code" label="分类编码" width="120" />
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column prop="product_count" label="商品数量" width="100" align="center" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="editCategory(scope.row)">编辑</el-button>
            <el-button size="small" type="success" @click="addSubCategory(scope.row)">添加子分类</el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === 1 ? 'warning' : 'success'"
              @click="toggleStatus(scope.row)"
            >
              {{ scope.row.status === 1 ? '停用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteCategory(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑分类对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="500px"
      @close="resetForm"
    >
      <el-form :model="categoryForm" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="父级分类" v-if="isSubCategory">
          <el-input v-model="parentCategoryName" disabled />
        </el-form-item>
        <el-form-item label="分类编码" prop="code">
          <el-input v-model="categoryForm.code" placeholder="请输入分类编码" />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="categoryForm.sort" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="categoryForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCategory" :loading="saving">确定</el-button>
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
const dialogTitle = ref('添加分类')
const formRef = ref()
const isSubCategory = ref(false)
const parentCategoryName = ref('')

// 搜索表单
const searchForm = reactive({
  name: '',
  status: ''
})

// 分类表单
const categoryForm = reactive({
  id: null,
  parent_id: null,
  code: '',
  name: '',
  sort: 0,
  description: ''
})

// 分类列表
const categories = ref([])

// 表单验证规则
const rules = {
  code: [
    { required: true, message: '请输入分类编码', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' }
  ]
}

// 从本地存储加载数据
const loadFromStorage = () => {
  const stored = localStorage.getItem('wms_categories')
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
    localStorage.setItem('wms_categories', JSON.stringify(data))
  } catch (error) {
    console.error('保存到本地存储失败:', error)
  }
}

// 获取默认数据
const getDefaultCategories = () => [
  {
    id: 1,
    parent_id: null,
    code: 'ELECTRONICS',
    name: '手机数码',
    sort: 1,
    description: '手机、平板、智能穿戴等数码产品',
    product_count: 15,
    status: 1,
    children: [
      {
        id: 11,
        parent_id: 1,
        code: 'PHONE',
        name: '手机',
        sort: 1,
        description: '智能手机产品',
        product_count: 8,
        status: 1
      },
      {
        id: 12,
        parent_id: 1,
        code: 'TABLET',
        name: '平板电脑',
        sort: 2,
        description: '平板电脑产品',
        product_count: 5,
        status: 1
      },
      {
        id: 13,
        parent_id: 1,
        code: 'WEARABLE',
        name: '智能穿戴',
        sort: 3,
        description: '智能手表、手环等',
        product_count: 2,
        status: 1
      }
    ]
  },
  {
    id: 2,
    parent_id: null,
    code: 'COMPUTER',
    name: '电脑办公',
    sort: 2,
    description: '电脑、办公设备等',
    product_count: 12,
    status: 1,
    children: [
      {
        id: 21,
        parent_id: 2,
        code: 'LAPTOP',
        name: '笔记本电脑',
        sort: 1,
        description: '笔记本电脑产品',
        product_count: 6,
        status: 1
      },
      {
        id: 22,
        parent_id: 2,
        code: 'DESKTOP',
        name: '台式机',
        sort: 2,
        description: '台式机产品',
        product_count: 4,
        status: 1
      },
      {
        id: 23,
        parent_id: 2,
        code: 'OFFICE',
        name: '办公设备',
        sort: 3,
        description: '打印机、投影仪等',
        product_count: 2,
        status: 1
      }
    ]
  },
  {
    id: 3,
    parent_id: null,
    code: 'APPLIANCE',
    name: '家用电器',
    sort: 3,
    description: '空调、冰箱、洗衣机等家电',
    product_count: 8,
    status: 1,
    children: [
      {
        id: 31,
        parent_id: 3,
        code: 'KITCHEN',
        name: '厨房电器',
        sort: 1,
        description: '微波炉、电饭煲等',
        product_count: 3,
        status: 1
      },
      {
        id: 32,
        parent_id: 3,
        code: 'LIVING',
        name: '生活电器',
        sort: 2,
        description: '空调、洗衣机等',
        product_count: 5,
        status: 1
      }
    ]
  },
  {
    id: 4,
    parent_id: null,
    code: 'CLOTHING',
    name: '服装鞋帽',
    sort: 4,
    description: '服装、鞋子、帽子等',
    product_count: 0,
    status: 0
  }
]

// 加载分类列表
const loadCategories = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 先尝试从本地存储加载，如果没有则使用默认数据
    let data = loadFromStorage()
    if (!data || data.length === 0) {
      data = getDefaultCategories()
      saveToStorage(data)
    }
    
    categories.value = data
    
  } catch (error) {
    ElMessage.error('加载分类列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索分类
const searchCategories = () => {
  loadCategories()
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    name: '',
    status: ''
  })
  loadCategories()
}

// 打开添加对话框
const openAddDialog = () => {
  dialogTitle.value = '添加分类'
  isSubCategory.value = false
  dialogVisible.value = true
}

// 添加子分类
const addSubCategory = (parent) => {
  dialogTitle.value = '添加子分类'
  isSubCategory.value = true
  parentCategoryName.value = parent.name
  categoryForm.parent_id = parent.id
  dialogVisible.value = true
}

// 编辑分类
const editCategory = (category) => {
  dialogTitle.value = '编辑分类'
  isSubCategory.value = !!category.parent_id
  if (isSubCategory.value) {
    const parent = findParentCategory(category.parent_id)
    parentCategoryName.value = parent ? parent.name : ''
  }
  Object.assign(categoryForm, category)
  dialogVisible.value = true
}

// 查找父分类
const findParentCategory = (parentId) => {
  for (const category of categories.value) {
    if (category.id === parentId) {
      return category
    }
  }
  return null
}

// 切换状态
const toggleStatus = async (category) => {
  const action = category.status === 1 ? '停用' : '启用'
  try {
    await ElMessageBox.confirm(
      `确定要${action}分类 "${category.name}" 吗？`,
      '状态确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟状态切换
    category.status = category.status === 1 ? 0 : 1
    // 保存数据到本地存储
    saveToStorage(categories.value)
    ElMessage.success(`${action}成功`)
  } catch {
    // 用户取消操作
  }
}

// 删除分类
const deleteCategory = async (category) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分类 "${category.name}" 吗？此操作不可逆！`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    // 递归删除函数
    const removeCategory = (list, targetId) => {
      for (let i = 0; i < list.length; i++) {
        if (list[i].id === targetId) {
          list.splice(i, 1)
          return true
        }
        if (list[i].children && list[i].children.length > 0) {
          if (removeCategory(list[i].children, targetId)) {
            return true
          }
        }
      }
      return false
    }
    
    removeCategory(categories.value, category.id)
    // 保存数据到本地存储
    saveToStorage(categories.value)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消操作
  }
}

// 保存分类
const saveCategory = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    saving.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟数据更新
    if (categoryForm.id) {
      // 编辑模式 - 递归更新
      const updateCategory = (list, target) => {
        for (let item of list) {
          if (item.id === target.id) {
            Object.assign(item, target)
            return true
          }
          if (item.children && item.children.length > 0) {
            if (updateCategory(item.children, target)) {
              return true
            }
          }
        }
        return false
      }
      
      updateCategory(categories.value, { ...categoryForm, product_count: 0, status: 1 })
      ElMessage.success('编辑成功')
    } else {
      // 添加模式
      const newCategory = {
        ...categoryForm,
        id: Date.now(),
        product_count: 0,
        status: 1
      }
      
      if (categoryForm.parent_id) {
        // 添加子分类
        const addToParent = (list, parentId, child) => {
          for (let item of list) {
            if (item.id === parentId) {
              if (!item.children) item.children = []
              item.children.push(child)
              return true
            }
            if (item.children && item.children.length > 0) {
              if (addToParent(item.children, parentId, child)) {
                return true
              }
            }
          }
          return false
        }
        
        addToParent(categories.value, categoryForm.parent_id, newCategory)
      } else {
        // 添加主分类
        categories.value.push(newCategory)
      }
      
      ElMessage.success('添加成功')
    }
    
    // 保存数据到本地存储
    saveToStorage(categories.value)
    
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
  Object.assign(categoryForm, {
    id: null,
    parent_id: null,
    code: '',
    name: '',
    sort: 0,
    description: ''
  })
  isSubCategory.value = false
  parentCategoryName.value = ''
}

onMounted(() => {
  loadCategories()
})
</script>

<style lang="scss" scoped>
.categories-page {
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

// 响应式设计
@media (max-width: 768px) {
  .categories-page {
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