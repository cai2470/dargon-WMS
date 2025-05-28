<template>
  <div class="roles-container">
    <div class="page-header">
      <h2>角色管理</h2>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        添加角色
      </el-button>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :model="searchForm" inline>
        <el-form-item label="角色名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入角色名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.is_active" placeholder="请选择状态" clearable>
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 角色列表 -->
    <div class="table-container">
      <el-table
        :data="roleList"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" min-width="120" />
        <el-table-column prop="description" label="角色描述" min-width="200" />
        <el-table-column label="权限数量" width="100">
          <template #default="{ row }">
            <el-tag type="info">{{ row.permissions?.length || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="用户数量" width="100">
          <template #default="{ row }">
            <el-tag type="success">{{ row.user_count || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="showPermissionDialog(row)"
            >
              权限配置
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click="showEditDialog(row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
              :disabled="row.is_system"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
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
    </div>

    <!-- 添加/编辑角色对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="500px"
      :before-close="handleDialogClose"
    >
      <el-form
        ref="roleFormRef"
        :model="roleForm"
        :rules="roleRules"
        label-width="80px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input
            v-model="roleForm.name"
            placeholder="请输入角色名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input
            v-model="roleForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="状态" prop="is_active">
          <el-switch
            v-model="roleForm.is_active"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleDialogClose">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 权限配置对话框 -->
    <el-dialog
      title="权限配置"
      v-model="permissionDialogVisible"
      width="800px"
      :before-close="handlePermissionDialogClose"
    >
      <div class="permission-container">
        <div class="permission-header">
          <h4>为角色 "{{ currentRole?.name }}" 配置权限</h4>
          <div class="permission-actions">
            <el-button size="small" @click="expandAll">全部展开</el-button>
            <el-button size="small" @click="collapseAll">全部收起</el-button>
            <el-button size="small" type="primary" @click="checkAll">全选</el-button>
            <el-button size="small" @click="uncheckAll">取消全选</el-button>
          </div>
        </div>
        
        <el-tree
          ref="permissionTreeRef"
          :data="permissionTree"
          :props="treeProps"
          node-key="id"
          show-checkbox
          :default-checked-keys="checkedPermissions"
          :default-expand-all="false"
          class="permission-tree"
        >
          <template #default="{ node, data }">
            <span class="tree-node">
              <el-icon v-if="data.icon" class="node-icon">
                <component :is="data.icon" />
              </el-icon>
              <span>{{ data.name }}</span>
              <el-tag v-if="data.codename" size="small" type="info" class="permission-tag">
                {{ data.codename }}
              </el-tag>
            </span>
          </template>
        </el-tree>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handlePermissionDialogClose">取消</el-button>
          <el-button type="primary" @click="handlePermissionSubmit" :loading="permissionSubmitting">
            保存权限
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, User, Setting, Document, Warehouse, Box } from '@element-plus/icons-vue'
import { roleApi, permissionApi } from '@/api'
import { formatDateTime } from '@/utils'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const permissionSubmitting = ref(false)
const roleList = ref([])
const permissionList = ref([])
const permissionTree = ref([])

// 搜索表单
const searchForm = reactive({
  name: '',
  is_active: null
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 角色表单
const dialogVisible = ref(false)
const roleFormRef = ref()
const roleForm = reactive({
  id: null,
  name: '',
  description: '',
  is_active: true
})

const roleRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 50, message: '角色名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述不能超过 200 个字符', trigger: 'blur' }
  ]
}

// 权限配置
const permissionDialogVisible = ref(false)
const permissionTreeRef = ref()
const currentRole = ref(null)
const checkedPermissions = ref([])

const treeProps = {
  children: 'children',
  label: 'name'
}

// 计算属性
const dialogTitle = computed(() => {
  return roleForm.id ? '编辑角色' : '添加角色'
})

// 方法
const getRoleList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.size,
      ...searchForm
    }
    
    // 过滤空值
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null) {
        delete params[key]
      }
    })
    
    const response = await roleApi.list(params)
    roleList.value = response.results
    pagination.total = response.count
  } catch (error) {
    ElMessage.error('获取角色列表失败')
    console.error('获取角色列表失败:', error)
  } finally {
    loading.value = false
  }
}

const getPermissionList = async () => {
  try {
    const response = await permissionApi.list({ page_size: 1000 })
    permissionList.value = response.results
    buildPermissionTree()
  } catch (error) {
    ElMessage.error('获取权限列表失败')
    console.error('获取权限列表失败:', error)
  }
}

const buildPermissionTree = () => {
  const tree = []
  const moduleMap = new Map()
  
  // 按模块分组权限
  permissionList.value.forEach(permission => {
    const [app, model, action] = permission.codename.split('_')
    const moduleKey = `${app}_${model}`
    
    if (!moduleMap.has(moduleKey)) {
      moduleMap.set(moduleKey, {
        id: moduleKey,
        name: getModuleName(app, model),
        icon: getModuleIcon(app),
        children: []
      })
    }
    
    moduleMap.get(moduleKey).children.push({
      id: permission.id,
      name: permission.name,
      codename: permission.codename
    })
  })
  
  permissionTree.value = Array.from(moduleMap.values())
}

const getModuleName = (app, model) => {
  const moduleNames = {
    'users_user': '用户管理',
    'users_role': '角色管理',
    'warehouse_warehouse': '仓库管理',
    'warehouse_zone': '区域管理',
    'warehouse_location': '库位管理',
    'products_product': '商品管理',
    'products_category': '分类管理',
    'products_brand': '品牌管理',
    'products_supplier': '供应商管理',
    'inventory_stock': '库存管理',
    'inventory_movement': '库存移动',
    'inbound_order': '入库管理',
    'outbound_order': '出库管理',
    'reports_report': '报表管理'
  }
  return moduleNames[`${app}_${model}`] || `${app}_${model}`
}

const getModuleIcon = (app) => {
  const icons = {
    'users': User,
    'warehouse': Warehouse,
    'products': Box,
    'inventory': Document,
    'inbound': Document,
    'outbound': Document,
    'reports': Document,
    'system': Setting
  }
  return icons[app] || Document
}

const handleSearch = () => {
  pagination.page = 1
  getRoleList()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    name: '',
    is_active: null
  })
  handleSearch()
}

const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  getRoleList()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  getRoleList()
}

const showAddDialog = () => {
  Object.assign(roleForm, {
    id: null,
    name: '',
    description: '',
    is_active: true
  })
  dialogVisible.value = true
}

const showEditDialog = (row) => {
  Object.assign(roleForm, {
    id: row.id,
    name: row.name,
    description: row.description,
    is_active: row.is_active
  })
  dialogVisible.value = true
}

const handleDialogClose = () => {
  dialogVisible.value = false
  roleFormRef.value?.resetFields()
}

const handleSubmit = async () => {
  try {
    await roleFormRef.value.validate()
    submitting.value = true
    
    const data = { ...roleForm }
    delete data.id
    
    if (roleForm.id) {
      await roleApi.update(roleForm.id, data)
      ElMessage.success('角色更新成功')
    } else {
      await roleApi.create(data)
      ElMessage.success('角色创建成功')
    }
    
    handleDialogClose()
    getRoleList()
  } catch (error) {
    if (error.response?.data) {
      const errors = error.response.data
      Object.keys(errors).forEach(key => {
        ElMessage.error(`${key}: ${errors[key].join(', ')}`)
      })
    } else {
      ElMessage.error('操作失败')
    }
    console.error('角色操作失败:', error)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色 "${row.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await roleApi.delete(row.id)
    ElMessage.success('角色删除成功')
    getRoleList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error('删除角色失败:', error)
    }
  }
}

const showPermissionDialog = async (row) => {
  currentRole.value = row
  checkedPermissions.value = row.permissions?.map(p => p.id) || []
  permissionDialogVisible.value = true
  
  if (permissionList.value.length === 0) {
    await getPermissionList()
  }
}

const handlePermissionDialogClose = () => {
  permissionDialogVisible.value = false
  currentRole.value = null
  checkedPermissions.value = []
}

const expandAll = () => {
  permissionTreeRef.value?.setExpandedKeys(permissionTree.value.map(item => item.id))
}

const collapseAll = () => {
  permissionTreeRef.value?.setExpandedKeys([])
}

const checkAll = () => {
  const allPermissionIds = []
  permissionTree.value.forEach(module => {
    module.children.forEach(permission => {
      allPermissionIds.push(permission.id)
    })
  })
  permissionTreeRef.value?.setCheckedKeys(allPermissionIds)
}

const uncheckAll = () => {
  permissionTreeRef.value?.setCheckedKeys([])
}

const handlePermissionSubmit = async () => {
  try {
    permissionSubmitting.value = true
    const checkedKeys = permissionTreeRef.value?.getCheckedKeys() || []
    
    await roleApi.updatePermissions(currentRole.value.id, {
      permission_ids: checkedKeys
    })
    
    ElMessage.success('权限配置成功')
    handlePermissionDialogClose()
    getRoleList()
  } catch (error) {
    ElMessage.error('权限配置失败')
    console.error('权限配置失败:', error)
  } finally {
    permissionSubmitting.value = false
  }
}

// 生命周期
onMounted(() => {
  getRoleList()
})
</script>

<style scoped>
.roles-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.search-bar {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-container {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-container {
  padding: 20px;
  text-align: right;
  border-top: 1px solid #ebeef5;
}

.permission-container {
  max-height: 500px;
  overflow-y: auto;
}

.permission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.permission-header h4 {
  margin: 0;
  color: #303133;
}

.permission-actions {
  display: flex;
  gap: 10px;
}

.permission-tree {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.node-icon {
  color: #409eff;
}

.permission-tag {
  margin-left: auto;
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 