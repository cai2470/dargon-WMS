<template>
  <div class="permissions-page">
    <div class="page-header">
      <h1>权限管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="createPermission">
          <el-icon><Plus /></el-icon>
          新建权限
        </el-button>
        <el-button type="success" @click="expandAll">
          <el-icon><FolderOpened /></el-icon>
          展开全部
        </el-button>
        <el-button type="info" @click="collapseAll">
          <el-icon><Folder /></el-icon>
          收起全部
        </el-button>
      </div>
    </div>

    <!-- 权限树形表格 -->
    <el-card class="permissions-card">
      <el-table 
        :data="permissionList" 
        stripe 
        v-loading="loading"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
        ref="permissionTableRef"
      >
        <el-table-column prop="name" label="权限名称" min-width="200">
          <template #default="scope">
            <div class="permission-name">
              <el-icon>
                <component :is="getPermissionIcon(scope.row.type)" />
              </el-icon>
              <span>{{ scope.row.name }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="code" label="权限代码" width="200" />
        
        <el-table-column prop="type" label="类型" width="100">
          <template #default="scope">
            <el-tag :type="getTypeTagType(scope.row.type)">
              {{ getTypeText(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="description" label="描述" min-width="200" />
        
        <el-table-column prop="sort_order" label="排序" width="80" align="right" />
        
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-switch 
              v-model="scope.row.status" 
              :active-value="1" 
              :inactive-value="0"
              @change="togglePermissionStatus(scope.row)"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="editPermission(scope.row)">
              编辑
            </el-button>
            <el-button 
              v-if="scope.row.type === 'module'" 
              size="small" 
              type="success" 
              @click="addChildPermission(scope.row)"
            >
              添加子权限
            </el-button>
            <el-button size="small" type="danger" @click="deletePermission(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建/编辑权限对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="permissionDialogVisible" 
      width="600px"
      @close="resetPermissionForm"
    >
      <el-form :model="permissionForm" :rules="permissionRules" ref="permissionFormRef" label-width="100px">
        <el-form-item label="父级权限" prop="parent_id" v-if="permissionForm.parent_id">
          <el-select v-model="permissionForm.parent_id" placeholder="选择父级权限" disabled>
            <el-option 
              v-for="item in moduleList" 
              :key="item.id"
              :label="item.name" 
              :value="item.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="权限类型" prop="type">
          <el-radio-group v-model="permissionForm.type">
            <el-radio label="module">模块</el-radio>
            <el-radio label="permission">权限</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="permissionForm.name" placeholder="请输入权限名称" />
        </el-form-item>
        
        <el-form-item label="权限代码" prop="code">
          <el-input v-model="permissionForm.code" placeholder="请输入权限代码" />
          <div class="form-tip">
            模块代码示例：warehouse, products<br>
            权限代码示例：warehouse:view, products:create
          </div>
        </el-form-item>
        
        <el-form-item label="权限描述" prop="description">
          <el-input 
            v-model="permissionForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入权限描述"
          />
        </el-form-item>
        
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="permissionForm.sort_order" :min="0" :max="999" />
        </el-form-item>
        
        <el-form-item label="状态">
          <el-switch 
            v-model="permissionForm.status" 
            :active-value="1" 
            :inactive-value="0"
            active-text="启用" 
            inactive-text="禁用" 
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePermission" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 权限使用情况统计 -->
    <el-card title="权限使用统计" class="stats-card">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-icon module">
            <el-icon><Folder /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.moduleCount }}</div>
            <div class="stat-label">权限模块</div>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-icon permission">
            <el-icon><Key /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.permissionCount }}</div>
            <div class="stat-label">权限项目</div>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-icon role">
            <el-icon><UserFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.roleCount }}</div>
            <div class="stat-label">关联角色</div>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-icon active">
            <el-icon><Check /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.activeCount }}</div>
            <div class="stat-label">启用权限</div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getStorageData, setStorageData } from '@/utils/storage'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const permissionDialogVisible = ref(false)
const permissionFormRef = ref()
const permissionTableRef = ref()

// 权限列表
const permissionList = ref([])
const moduleList = ref([])

// 权限表单
const permissionForm = reactive({
  id: null,
  parent_id: null,
  name: '',
  code: '',
  type: 'permission',
  description: '',
  sort_order: 0,
  status: 1
})

// 统计数据
const stats = reactive({
  moduleCount: 0,
  permissionCount: 0,
  roleCount: 0,
  activeCount: 0
})

// 表单验证规则
const permissionRules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入权限代码', trigger: 'blur' },
    { pattern: /^[a-z_:]+$/, message: '权限代码只能包含小写字母、下划线和冒号', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择权限类型', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入权限描述', trigger: 'blur' }
  ]
}

// 对话框标题
const dialogTitle = computed(() => {
  return permissionForm.id ? '编辑权限' : '新建权限'
})

// 获取权限图标
const getPermissionIcon = (type) => {
  return type === 'module' ? 'Folder' : 'Key'
}

// 获取类型标签类型
const getTypeTagType = (type) => {
  return type === 'module' ? 'primary' : 'success'
}

// 获取类型文本
const getTypeText = (type) => {
  return type === 'module' ? '模块' : '权限'
}

// 初始化权限数据
const initPermissionData = () => {
  const defaultPermissions = [
    {
      id: 'warehouse',
      name: '仓库管理',
      code: 'warehouse',
      type: 'module',
      description: '仓库、库区、库位管理',
      sort_order: 1,
      status: 1,
      parent_id: null,
      children: [
        { 
          id: 'warehouse:view', 
          name: '查看仓库', 
          code: 'warehouse:view', 
          type: 'permission', 
          description: '查看仓库列表和详情',
          sort_order: 1,
          status: 1,
          parent_id: 'warehouse'
        },
        { 
          id: 'warehouse:create', 
          name: '创建仓库', 
          code: 'warehouse:create', 
          type: 'permission', 
          description: '创建新仓库',
          sort_order: 2,
          status: 1,
          parent_id: 'warehouse'
        },
        { 
          id: 'warehouse:update', 
          name: '编辑仓库', 
          code: 'warehouse:update', 
          type: 'permission', 
          description: '编辑仓库信息',
          sort_order: 3,
          status: 1,
          parent_id: 'warehouse'
        },
        { 
          id: 'warehouse:delete', 
          name: '删除仓库', 
          code: 'warehouse:delete', 
          type: 'permission', 
          description: '删除仓库',
          sort_order: 4,
          status: 1,
          parent_id: 'warehouse'
        }
      ]
    },
    {
      id: 'products',
      name: '商品管理',
      code: 'products',
      type: 'module',
      description: '商品、分类、供应商管理',
      sort_order: 2,
      status: 1,
      parent_id: null,
      children: [
        { 
          id: 'products:view', 
          name: '查看商品', 
          code: 'products:view', 
          type: 'permission', 
          description: '查看商品列表和详情',
          sort_order: 1,
          status: 1,
          parent_id: 'products'
        },
        { 
          id: 'products:create', 
          name: '创建商品', 
          code: 'products:create', 
          type: 'permission', 
          description: '创建新商品',
          sort_order: 2,
          status: 1,
          parent_id: 'products'
        },
        { 
          id: 'products:update', 
          name: '编辑商品', 
          code: 'products:update', 
          type: 'permission', 
          description: '编辑商品信息',
          sort_order: 3,
          status: 1,
          parent_id: 'products'
        },
        { 
          id: 'products:delete', 
          name: '删除商品', 
          code: 'products:delete', 
          type: 'permission', 
          description: '删除商品',
          sort_order: 4,
          status: 1,
          parent_id: 'products'
        }
      ]
    },
    {
      id: 'system',
      name: '系统管理',
      code: 'system',
      type: 'module',
      description: '用户、角色、权限管理',
      sort_order: 10,
      status: 1,
      parent_id: null,
      children: [
        { 
          id: 'users:manage', 
          name: '用户管理', 
          code: 'users:manage', 
          type: 'permission', 
          description: '管理系统用户',
          sort_order: 1,
          status: 1,
          parent_id: 'system'
        },
        { 
          id: 'roles:manage', 
          name: '角色管理', 
          code: 'roles:manage', 
          type: 'permission', 
          description: '管理系统角色',
          sort_order: 2,
          status: 1,
          parent_id: 'system'
        },
        { 
          id: 'permissions:manage', 
          name: '权限管理', 
          code: 'permissions:manage', 
          type: 'permission', 
          description: '管理系统权限',
          sort_order: 3,
          status: 1,
          parent_id: 'system'
        }
      ]
    }
  ]
  
  return defaultPermissions
}

// 加载权限列表
const loadPermissionList = async () => {
  loading.value = true
  try {
    // 从存储中加载权限数据
    let permissions = getStorageData('permissions')
    
    // 如果没有数据，初始化默认权限
    if (!permissions || permissions.length === 0) {
      permissions = initPermissionData()
      setStorageData('permissions', permissions)
    }
    
    permissionList.value = permissions
    
    // 提取模块列表
    moduleList.value = permissions.filter(p => p.type === 'module')
    
    // 更新统计数据
    updateStats(permissions)
  } catch (error) {
    ElMessage.error('加载权限列表失败')
  } finally {
    loading.value = false
  }
}

// 更新统计数据
const updateStats = (permissions) => {
  let moduleCount = 0
  let permissionCount = 0
  let activeCount = 0
  
  const countPermissions = (items) => {
    items.forEach(item => {
      if (item.type === 'module') {
        moduleCount++
      } else {
        permissionCount++
      }
      
      if (item.status === 1) {
        activeCount++
      }
      
      if (item.children) {
        countPermissions(item.children)
      }
    })
  }
  
  countPermissions(permissions)
  
  stats.moduleCount = moduleCount
  stats.permissionCount = permissionCount
  stats.activeCount = activeCount
  stats.roleCount = (getStorageData('roles') || []).length
}

// 展开全部
const expandAll = () => {
  // 由于Element Plus的树形表格展开功能限制，这里简单提示
  ElMessage.info('请手动点击展开按钮')
}

// 收起全部
const collapseAll = () => {
  // 由于Element Plus的树形表格收起功能限制，这里简单提示
  ElMessage.info('请手动点击收起按钮')
}

// 新建权限
const createPermission = () => {
  resetPermissionForm()
  permissionDialogVisible.value = true
}

// 编辑权限
const editPermission = (permission) => {
  Object.assign(permissionForm, {
    id: permission.id,
    parent_id: permission.parent_id,
    name: permission.name,
    code: permission.code,
    type: permission.type,
    description: permission.description,
    sort_order: permission.sort_order,
    status: permission.status
  })
  permissionDialogVisible.value = true
}

// 添加子权限
const addChildPermission = (parentPermission) => {
  resetPermissionForm()
  permissionForm.parent_id = parentPermission.id
  permissionForm.type = 'permission'
  permissionDialogVisible.value = true
}

// 切换权限状态
const togglePermissionStatus = async (permission) => {
  try {
    // 更新权限状态
    const permissions = getStorageData('permissions') || []
    updatePermissionInTree(permissions, permission.id, { status: permission.status })
    setStorageData('permissions', permissions)
    ElMessage.success('状态更新成功')
  } catch (error) {
    ElMessage.error('状态更新失败')
    // 恢复原状态
    permission.status = permission.status === 1 ? 0 : 1
  }
}

// 递归更新权限树中的权限
const updatePermissionInTree = (tree, id, updateData) => {
  for (let item of tree) {
    if (item.id === id) {
      Object.assign(item, updateData)
      return true
    }
    if (item.children && updatePermissionInTree(item.children, id, updateData)) {
      return true
    }
  }
  return false
}

// 删除权限
const deletePermission = async (permission) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除权限 "${permission.name}" 吗？删除后不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 删除权限
    const permissions = getStorageData('permissions') || []
    removePermissionFromTree(permissions, permission.id)
    setStorageData('permissions', permissions)
    loadPermissionList()
    ElMessage.success('权限删除成功')
  } catch {
    // 用户取消操作
  }
}

// 从权限树中移除权限
const removePermissionFromTree = (tree, id) => {
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].id === id) {
      tree.splice(i, 1)
      return true
    }
    if (tree[i].children && removePermissionFromTree(tree[i].children, id)) {
      return true
    }
  }
  return false
}

// 保存权限
const savePermission = async () => {
  if (!permissionFormRef.value) return
  
  try {
    await permissionFormRef.value.validate()
    saving.value = true
    
    const permissions = getStorageData('permissions') || []
    
    if (permissionForm.id) {
      // 编辑模式
      updatePermissionInTree(permissions, permissionForm.id, {
        name: permissionForm.name,
        code: permissionForm.code,
        type: permissionForm.type,
        description: permissionForm.description,
        sort_order: permissionForm.sort_order,
        status: permissionForm.status
      })
    } else {
      // 新建模式
      const newPermission = {
        id: Date.now().toString(),
        parent_id: permissionForm.parent_id,
        name: permissionForm.name,
        code: permissionForm.code,
        type: permissionForm.type,
        description: permissionForm.description,
        sort_order: permissionForm.sort_order,
        status: permissionForm.status
      }
      
      if (permissionForm.parent_id) {
        // 添加到父级权限的children中
        addPermissionToParent(permissions, permissionForm.parent_id, newPermission)
      } else {
        // 添加为顶级权限
        permissions.push(newPermission)
      }
    }
    
    setStorageData('permissions', permissions)
    loadPermissionList()
    permissionDialogVisible.value = false
    ElMessage.success(permissionForm.id ? '权限更新成功' : '权限创建成功')
  } catch (error) {
    if (error !== false) {
      ElMessage.error('保存失败')
    }
  } finally {
    saving.value = false
  }
}

// 添加权限到父级
const addPermissionToParent = (tree, parentId, newPermission) => {
  for (let item of tree) {
    if (item.id === parentId) {
      if (!item.children) {
        item.children = []
      }
      item.children.push(newPermission)
      return true
    }
    if (item.children && addPermissionToParent(item.children, parentId, newPermission)) {
      return true
    }
  }
  return false
}

// 重置权限表单
const resetPermissionForm = () => {
  if (permissionFormRef.value) {
    permissionFormRef.value.resetFields()
  }
  Object.assign(permissionForm, {
    id: null,
    parent_id: null,
    name: '',
    code: '',
    type: 'permission',
    description: '',
    sort_order: 0,
    status: 1
  })
}

onMounted(() => {
  loadPermissionList()
})
</script>

<style lang="scss" scoped>
.permissions-page {
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

.permissions-card, .stats-card {
  margin-bottom: 20px;
}

.permission-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
  line-height: 1.4;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  
  .stat-item {
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
      
      &.module {
        background: linear-gradient(45deg, #409EFF, #66B1FF);
      }
      
      &.permission {
        background: linear-gradient(45deg, #67C23A, #85CE61);
      }
      
      &.role {
        background: linear-gradient(45deg, #E6A23C, #EEBE77);
      }
      
      &.active {
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

// 响应式设计
@media (max-width: 768px) {
  .permissions-page {
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
      flex-wrap: wrap;
    }
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
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