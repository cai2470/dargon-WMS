<template>
  <div class="users-management-page">
    <div class="page-header">
      <h1>用户管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="createUser">
          <el-icon><Plus /></el-icon>
          新增用户
        </el-button>
        <el-button type="info" @click="exportUsers">
          <el-icon><Download /></el-icon>
          导出用户
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="用户名">
          <el-input 
            v-model="filterForm.username" 
            placeholder="用户名"
            style="width: 150px"
            clearable
          />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input 
            v-model="filterForm.name" 
            placeholder="真实姓名"
            style="width: 150px"
            clearable
          />
        </el-form-item>
                <el-form-item label="角色">          <el-select v-model="filterForm.role" placeholder="选择角色" style="width: 150px" clearable>            <el-option               v-for="role in roleOptions"               :key="role.value"              :label="role.label"               :value="role.value"             />          </el-select>        </el-form-item>
                <el-form-item label="状态">          <el-select v-model="filterForm.status" placeholder="用户状态" style="width: 120px" clearable>            <el-option               v-for="status in statusOptions"               :key="status.value"              :label="status.label"               :value="status.value"             />          </el-select>        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchUsers">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户列表 -->
    <el-card class="table-card">
      <el-table 
        :data="userList" 
        stripe 
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="avatar" label="头像" width="80">
          <template #default="scope">
            <el-avatar :src="scope.row.avatar" :size="40">
              {{ scope.row.name?.charAt(0) }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="name" label="真实姓名" width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="role_name" label="角色" width="120">
          <template #default="scope">
            <el-tag :type="getRoleTagType(scope.row.role)">
              {{ scope.row.role_name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              @change="toggleUserStatus(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="last_login" label="最后登录" width="160" />
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="editUser(scope.row)">
              编辑
            </el-button>
            <el-button size="small" type="warning" @click="resetPassword(scope.row)">
              重置密码
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteUser(scope.row)"
              :disabled="scope.row.username === 'admin'"
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

    <!-- 新增/编辑用户对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="600px"
      @close="resetForm"
    >
      <el-form 
        :model="userForm" 
        :rules="userRules" 
        ref="userFormRef" 
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input 
                v-model="userForm.username" 
                placeholder="请输入用户名"
                :disabled="isEdit"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="真实姓名" prop="name">
              <el-input v-model="userForm.name" placeholder="请输入真实姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="userForm.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="userForm.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
                        <el-form-item label="角色" prop="role">              <el-select v-model="userForm.role" placeholder="选择角色" style="width: 100%">                <el-option                   v-for="role in roleOptions"                   :key="role.value"                  :label="role.label"                   :value="role.value"                 />              </el-select>            </el-form-item>
          </el-col>
          <el-col :span="12">
                        <el-form-item label="部门" prop="department">              <el-select v-model="userForm.department" placeholder="选择部门" style="width: 100%">                <el-option                   v-for="dept in departmentOptions"                   :key="dept.value"                  :label="dept.label"                   :value="dept.value"                 />              </el-select>            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" v-if="!isEdit">
          <el-col :span="12">
            <el-form-item label="密码" prop="password">
              <el-input 
                v-model="userForm.password" 
                type="password" 
                placeholder="请输入密码"
                show-password
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input 
                v-model="userForm.confirmPassword" 
                type="password" 
                placeholder="请确认密码"
                show-password
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="状态">
          <el-radio-group v-model="userForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input 
            v-model="userForm.remark" 
            type="textarea" 
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser" :loading="saving">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog 
      title="重置密码" 
      v-model="passwordDialogVisible" 
      width="400px"
    >
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
        <el-form-item label="新密码" prop="newPassword">
          <el-input 
            v-model="passwordForm.newPassword" 
            type="password" 
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="passwordForm.confirmPassword" 
            type="password" 
            placeholder="请确认新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePassword" :loading="saving">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getStatusOptions } from '@/utils/filterOptions'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const passwordDialogVisible = ref(false)
const isEdit = ref(false)
const selectedRows = ref([])
const userFormRef = ref(null)
const passwordFormRef = ref(null)

// 筛选表单
const filterForm = reactive({
  username: '',
  name: '',
  role: '',
  status: ''
})

// 用户表单
const userForm = reactive({
  id: null,
  username: '',
  name: '',
  email: '',
  phone: '',
  role: '',
  department: '',
  password: '',
  confirmPassword: '',
  status: 1,
  remark: ''
})

// 密码表单
const passwordForm = reactive({
  userId: null,
  newPassword: '',
  confirmPassword: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 用户列表
const userList = ref([])

// 筛选选项
const statusOptions = ref([])
const roleOptions = ref([])
const departmentOptions = ref([])

// 表单验证规则
const userRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== userForm.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const passwordRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑用户' : '新增用户')

// 加载用户列表
const loadUsers = async () => {
  loading.value = true
  try {
    // 从localStorage加载用户数据
    const storedUsers = localStorage.getItem('wms_users')
    let users = []
    
    if (storedUsers) {
      users = JSON.parse(storedUsers)
    } else {
      // 默认用户数据
      users = [
        {
          id: 1,
          username: 'admin',
          name: '系统管理员',
          email: 'admin@xiaoshenlong.com',
          phone: '13800138000',
          role: 'admin',
          role_name: '管理员',
          department: '管理部',
          status: 1,
          last_login: '2024-01-15 10:30:00',
          created_at: '2024-01-01 00:00:00',
          remark: '系统默认管理员账户'
        },
        {
          id: 2,
          username: 'zhang_san',
          name: '张三',
          email: 'zhangsan@xiaoshenlong.com',
          phone: '13800138001',
          role: 'warehouse_admin',
          role_name: '仓库管理员',
          department: '仓储部',
          status: 1,
          last_login: '2024-01-15 09:15:00',
          created_at: '2024-01-02 00:00:00',
          remark: '仓库管理员'
        },
        {
          id: 3,
          username: 'li_si',
          name: '李四',
          email: 'lisi@xiaoshenlong.com',
          phone: '13800138002',
          role: 'operator',
          role_name: '操作员',
          department: '仓储部',
          status: 1,
          last_login: '2024-01-15 08:45:00',
          created_at: '2024-01-03 00:00:00',
          remark: '仓库操作员'
        },
        {
          id: 4,
          username: 'wang_wu',
          name: '王五',
          email: 'wangwu@xiaoshenlong.com',
          phone: '13800138003',
          role: 'viewer',
          role_name: '查看者',
          department: '销售部',
          status: 0,
          last_login: '2024-01-14 16:20:00',
          created_at: '2024-01-04 00:00:00',
          remark: '销售部查看员'
        }
      ]
      localStorage.setItem('wms_users', JSON.stringify(users))
    }
    
    // 应用筛选条件
    let filteredUsers = users
    if (filterForm.username) {
      filteredUsers = filteredUsers.filter(u => u.username.includes(filterForm.username))
    }
    if (filterForm.name) {
      filteredUsers = filteredUsers.filter(u => u.name.includes(filterForm.name))
    }
    if (filterForm.role) {
      filteredUsers = filteredUsers.filter(u => u.role === filterForm.role)
    }
    if (filterForm.status !== '') {
      filteredUsers = filteredUsers.filter(u => u.status === parseInt(filterForm.status))
    }
    
    userList.value = filteredUsers
    pagination.total = filteredUsers.length
    
  } catch (error) {
    ElMessage.error('加载用户列表失败')
    console.error('加载用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取角色标签类型
const getRoleTagType = (role) => {
  const typeMap = {
    'admin': 'danger',
    'warehouse_admin': 'warning',
    'operator': 'primary',
    'viewer': 'info'
  }
  return typeMap[role] || 'info'
}

// 搜索用户
const searchUsers = () => {
  pagination.page = 1
  loadUsers()
}

// 重置筛选
const resetFilter = () => {
  Object.assign(filterForm, {
    username: '',
    name: '',
    role: '',
    status: ''
  })
  loadUsers()
}

// 新增用户
const createUser = () => {
  isEdit.value = false
  dialogVisible.value = true
}

// 编辑用户
const editUser = (row) => {
  isEdit.value = true
  Object.assign(userForm, {
    id: row.id,
    username: row.username,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    department: row.department,
    status: row.status,
    remark: row.remark || ''
  })
  dialogVisible.value = true
}

// 保存用户
const saveUser = async () => {
  if (!userFormRef.value) return
  
  try {
    await userFormRef.value.validate()
    saving.value = true
    
    const users = JSON.parse(localStorage.getItem('wms_users') || '[]')
    
    if (isEdit.value) {
      // 更新用户
      const index = users.findIndex(u => u.id === userForm.id)
      if (index !== -1) {
        const roleNameMap = {
          'admin': '管理员',
          'warehouse_admin': '仓库管理员',
          'operator': '操作员',
          'viewer': '查看者'
        }
        
        users[index] = {
          ...users[index],
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
          role: userForm.role,
          role_name: roleNameMap[userForm.role],
          department: userForm.department,
          status: userForm.status,
          remark: userForm.remark
        }
        
        localStorage.setItem('wms_users', JSON.stringify(users))
        ElMessage.success('用户更新成功')
      }
    } else {
      // 新增用户
      const newId = Math.max(...users.map(u => u.id), 0) + 1
      const roleNameMap = {
        'admin': '管理员',
        'warehouse_admin': '仓库管理员',
        'operator': '操作员',
        'viewer': '查看者'
      }
      
      const newUser = {
        id: newId,
        username: userForm.username,
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
        role: userForm.role,
        role_name: roleNameMap[userForm.role],
        department: userForm.department,
        status: userForm.status,
        last_login: '',
        created_at: new Date().toLocaleString(),
        remark: userForm.remark
      }
      
      users.push(newUser)
      localStorage.setItem('wms_users', JSON.stringify(users))
      ElMessage.success('用户创建成功')
    }
    
    dialogVisible.value = false
    loadUsers()
    
  } catch (error) {
    console.error('保存用户失败:', error)
  } finally {
    saving.value = false
  }
}

// 重置表单
const resetForm = () => {
  if (userFormRef.value) {
    userFormRef.value.resetFields()
  }
  Object.assign(userForm, {
    id: null,
    username: '',
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    password: '',
    confirmPassword: '',
    status: 1,
    remark: ''
  })
}

// 切换用户状态
const toggleUserStatus = async (row) => {
  try {
    const users = JSON.parse(localStorage.getItem('wms_users') || '[]')
    const index = users.findIndex(u => u.id === row.id)
    if (index !== -1) {
      users[index].status = row.status
      localStorage.setItem('wms_users', JSON.stringify(users))
      ElMessage.success(`用户${row.status ? '启用' : '禁用'}成功`)
    }
  } catch (error) {
    ElMessage.error('状态更新失败')
    row.status = row.status ? 0 : 1 // 回滚状态
  }
}

// 重置密码
const resetPassword = (row) => {
  passwordForm.userId = row.id
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordDialogVisible.value = true
}

// 保存密码
const savePassword = async () => {
  if (!passwordFormRef.value) return
  
  try {
    await passwordFormRef.value.validate()
    saving.value = true
    
    // 这里应该调用API重置密码
    ElMessage.success('密码重置成功')
    passwordDialogVisible.value = false
    
  } catch (error) {
    console.error('重置密码失败:', error)
  } finally {
    saving.value = false
  }
}

// 删除用户
const deleteUser = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户"${row.name}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const users = JSON.parse(localStorage.getItem('wms_users') || '[]')
    const filteredUsers = users.filter(u => u.id !== row.id)
    localStorage.setItem('wms_users', JSON.stringify(filteredUsers))
    
    ElMessage.success('用户删除成功')
    loadUsers()
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除用户失败')
    }
  }
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  loadUsers()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadUsers()
}

// 导出用户
const exportUsers = () => {
  ElMessage.info('用户导出功能开发中...')
}

// 加载基础数据
const loadBasicData = () => {
  // 加载状态选项
  statusOptions.value = getStatusOptions()
  
  // 加载角色选项
  roleOptions.value = [
    { label: '管理员', value: 'admin' },
    { label: '仓库管理员', value: 'warehouse_admin' },
    { label: '操作员', value: 'operator' },
    { label: '查看者', value: 'viewer' }
  ]
  
  // 加载部门选项
  departmentOptions.value = [
    { label: '管理部', value: '管理部' },
    { label: '仓储部', value: '仓储部' },
    { label: '采购部', value: '采购部' },
    { label: '销售部', value: '销售部' },
    { label: '财务部', value: '财务部' }
  ]
}

onMounted(() => {
  loadBasicData()
  loadUsers()
})
</script>

<style lang="scss" scoped>
.users-management-page {
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

.filter-card, .table-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

// 响应式设计
@media (max-width: 768px) {
  .users-management-page {
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
}
</style> 