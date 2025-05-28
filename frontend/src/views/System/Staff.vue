<template>
  <div class="staff-management">
    <!-- 搜索筛选区域 -->
    <el-card class="search-card">
      <el-form :model="searchForm" label-width="80px" :inline="true">
        <el-form-item label="员工姓名">
          <el-input 
            v-model="searchForm.name" 
            placeholder="请输入员工姓名"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="工号">
          <el-input 
            v-model="searchForm.staff_no" 
            placeholder="请输入工号"
            clearable
            style="width: 120px"
          />
        </el-form-item>
        <el-form-item label="部门">
          <el-select 
            v-model="searchForm.department" 
            placeholder="请选择部门"
            clearable
            style="width: 120px"
          >
            <el-option 
              v-for="dept in departments" 
              :key="dept.value"
              :label="dept.label" 
              :value="dept.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="职位">
          <el-select 
            v-model="searchForm.position" 
            placeholder="请选择职位"
            clearable
            style="width: 120px"
          >
            <el-option 
              v-for="pos in positions" 
              :key="pos.value"
              :label="pos.label" 
              :value="pos.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select 
            v-model="searchForm.status" 
            placeholder="请选择状态"
            clearable
            style="width: 100px"
          >
            <el-option label="在职" value="active" />
            <el-option label="离职" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchStaff">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮区域 -->
    <el-card class="action-card">
      <div class="action-header">
        <h3>员工管理</h3>
        <div class="action-buttons">
          <el-button type="primary" @click="createStaff">
            <el-icon><Plus /></el-icon>
            新增员工
          </el-button>
          <el-button type="success" @click="batchImport">
            <el-icon><Upload /></el-icon>
            批量导入
          </el-button>
          <el-button type="info" @click="exportStaff" :disabled="selectedRows.length === 0">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 员工列表 -->
    <el-card class="table-card">
      <el-table 
        :data="staffList" 
        stripe 
        v-loading="loading" 
        size="small"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="#" type="index" width="50" />
        <el-table-column prop="staff_no" label="工号" width="120" />
        <el-table-column label="头像" width="80">
          <template #default="scope">
            <el-avatar 
              :src="scope.row.avatar" 
              :size="40"
            >
              {{ scope.row.name?.charAt(0) }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="60">
          <template #default="scope">
            <el-tag 
              :type="scope.row.gender === '男' ? 'primary' : 'danger'"
              size="small"
            >
              {{ scope.row.gender }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="department" label="部门" width="100" />
        <el-table-column prop="position" label="职位" width="100" />
        <el-table-column label="权限角色" width="120">
          <template #default="scope">
            <el-tag 
              v-for="role in scope.row.roles" 
              :key="role"
              :type="getRoleColor(role)"
              size="small"
              style="margin-right: 5px;"
            >
              {{ getRoleText(role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="hire_date" label="入职日期" width="110" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-tag 
              :type="scope.row.status === 'active' ? 'success' : 'danger'"
              size="small"
            >
              {{ scope.row.status === 'active' ? '在职' : '离职' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" type="info" @click="viewStaff(scope.row)">查看</el-button>
            <el-button size="small" type="primary" @click="editStaff(scope.row)">编辑</el-button>
            <el-button 
              v-if="scope.row.status === 'active'"
              size="small" 
              type="warning" 
              @click="toggleStatus(scope.row)"
            >
              离职
            </el-button>
            <el-button 
              v-else
              size="small" 
              type="success" 
              @click="toggleStatus(scope.row)"
            >
              复职
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

    <!-- 新建/编辑员工对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="800px"
      @close="resetForm"
    >
      <el-form :model="staffForm" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工号" prop="staff_no">
              <el-input 
                v-model="staffForm.staff_no" 
                placeholder="请输入工号" 
                :disabled="editingId !== null"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="staffForm.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="staffForm.gender">
                <el-radio label="男">男</el-radio>
                <el-radio label="女">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="年龄">
              <el-input-number 
                v-model="staffForm.age" 
                :min="18" 
                :max="65" 
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="入职日期" prop="hire_date">
              <el-date-picker 
                v-model="staffForm.hire_date" 
                type="date"
                placeholder="选择入职日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="staffForm.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="staffForm.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="部门" prop="department">
              <el-select v-model="staffForm.department" placeholder="请选择部门" style="width: 100%">
                <el-option 
                  v-for="dept in departments" 
                  :key="dept.value"
                  :label="dept.label" 
                  :value="dept.value" 
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="职位" prop="position">
              <el-select v-model="staffForm.position" placeholder="请选择职位" style="width: 100%">
                <el-option 
                  v-for="pos in positions" 
                  :key="pos.value"
                  :label="pos.label" 
                  :value="pos.value" 
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="权限角色" prop="roles">
          <el-checkbox-group v-model="staffForm.roles">
            <el-checkbox 
              v-for="role in roleOptions" 
              :key="role.value"
              :label="role.value"
            >
              {{ role.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="身份证号">
          <el-input v-model="staffForm.id_card" placeholder="请输入身份证号" />
        </el-form-item>
        
        <el-form-item label="地址">
          <el-input 
            v-model="staffForm.address" 
            type="textarea" 
            :rows="2"
            placeholder="请输入地址"
          />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input 
            v-model="staffForm.remark" 
            type="textarea" 
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveStaff" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const emit = defineEmits(['refresh'])

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const formRef = ref()
const selectedRows = ref([])
const editingId = ref(null)

// 搜索表单
const searchForm = reactive({
  name: '',
  staff_no: '',
  department: '',
  position: '',
  status: ''
})

// 员工表单
const staffForm = reactive({
  staff_no: '',
  name: '',
  gender: '男',
  age: null,
  phone: '',
  email: '',
  department: '',
  position: '',
  roles: [],
  hire_date: '',
  id_card: '',
  address: '',
  remark: '',
  status: 'active'
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 数据列表
const staffList = ref([])

// 选项数据
const departments = ref([
  { label: '仓储部', value: 'warehouse' },
  { label: '运输部', value: 'transport' },
  { label: '质检部', value: 'quality' },
  { label: '客服部', value: 'service' },
  { label: '管理部', value: 'management' },
  { label: '财务部', value: 'finance' }
])

const positions = ref([
  { label: '仓库管理员', value: 'warehouse_manager' },
  { label: '卸货人员', value: 'unloader' },
  { label: '拣货人员', value: 'picker' },
  { label: '打包人员', value: 'packer' },
  { label: '质检员', value: 'inspector' },
  { label: '司机', value: 'driver' },
  { label: '客服专员', value: 'service_agent' },
  { label: '财务专员', value: 'accountant' },
  { label: '主管', value: 'supervisor' },
  { label: '经理', value: 'manager' }
])

const roleOptions = ref([
  { label: '系统管理员', value: 'admin' },
  { label: '仓库管理员', value: 'warehouse_manager' },
  { label: '操作员', value: 'operator' },
  { label: '查看者', value: 'viewer' }
])

// 表单验证规则
const rules = {
  staff_no: [
    { required: true, message: '请输入工号', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (editingId.value) {
          callback()
          return
        }
        const exists = staffList.value.some(staff => staff.staff_no === value)
        if (exists) {
          callback(new Error('工号已存在'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  department: [
    { required: true, message: '请选择部门', trigger: 'change' }
  ],
  position: [
    { required: true, message: '请选择职位', trigger: 'change' }
  ],
  roles: [
    { required: true, message: '请选择权限角色', trigger: 'change' }
  ],
  hire_date: [
    { required: true, message: '请选择入职日期', trigger: 'change' }
  ]
}

// 计算属性
const dialogTitle = computed(() => {
  return editingId.value ? '编辑员工' : '新增员工'
})

// 获取角色颜色
const getRoleColor = (role) => {
  const colorMap = {
    'admin': 'danger',
    'warehouse_manager': 'warning',
    'operator': 'primary',
    'viewer': 'info'
  }
  return colorMap[role] || 'info'
}

// 获取角色文本
const getRoleText = (role) => {
  const textMap = {
    'admin': '管理员',
    'warehouse_manager': '仓库管理',
    'operator': '操作员',
    'viewer': '查看者'
  }
  return textMap[role] || role
}

// 初始化默认数据
const initDefaultData = () => {
  const defaultStaff = [
    {
      id: 1,
      staff_no: 'WMS001',
      name: '张三',
      gender: '男',
      age: 28,
      phone: '13800138001',
      email: 'zhangsan@example.com',
      department: 'warehouse',
      position: 'warehouse_manager',
      roles: ['warehouse_manager'],
      hire_date: '2023-01-15',
      id_card: '110101199001011234',
      address: '北京市朝阳区某某街道',
      status: 'active',
      remark: '经验丰富的仓库管理员',
      created_at: '2023-01-15',
      avatar: ''
    },
    {
      id: 2,
      staff_no: 'WMS002',
      name: '李四',
      gender: '男',
      age: 25,
      phone: '13800138002',
      email: 'lisi@example.com',
      department: 'warehouse',
      position: 'unloader',
      roles: ['operator'],
      hire_date: '2023-03-20',
      id_card: '110101199801011234',
      address: '北京市海淀区某某小区',
      status: 'active',
      remark: '负责卸货作业',
      created_at: '2023-03-20',
      avatar: ''
    },
    {
      id: 3,
      staff_no: 'WMS003',
      name: '王五',
      gender: '女',
      age: 24,
      phone: '13800138003',
      email: 'wangwu@example.com',
      department: 'warehouse',
      position: 'picker',
      roles: ['operator'],
      hire_date: '2023-05-10',
      id_card: '110101199901011234',
      address: '北京市西城区某某路',
      status: 'active',
      remark: '负责拣货作业',
      created_at: '2023-05-10',
      avatar: ''
    },
    {
      id: 4,
      staff_no: 'WMS004',
      name: '赵六',
      gender: '男',
      age: 30,
      phone: '13800138004',
      email: 'zhaoliu@example.com',
      department: 'transport',
      position: 'driver',
      roles: ['operator'],
      hire_date: '2023-02-01',
      id_card: '110101199301011234',
      address: '北京市东城区某某胡同',
      status: 'active',
      remark: '物流运输司机',
      created_at: '2023-02-01',
      avatar: ''
    }
  ]

  // 检查是否已有员工数据
  const existingStaff = JSON.parse(localStorage.getItem('wms_staff') || '[]')
  if (existingStaff.length === 0) {
    localStorage.setItem('wms_staff', JSON.stringify(defaultStaff))
    console.log('已初始化默认员工数据')
  }
}

// 加载员工列表
const loadStaffList = async () => {
  loading.value = true
  try {
    const staffData = JSON.parse(localStorage.getItem('wms_staff') || '[]')
    
    // 应用筛选条件
    let filteredStaff = staffData
    
    if (searchForm.name) {
      filteredStaff = filteredStaff.filter(staff => 
        staff.name.includes(searchForm.name)
      )
    }
    if (searchForm.staff_no) {
      filteredStaff = filteredStaff.filter(staff => 
        staff.staff_no.includes(searchForm.staff_no)
      )
    }
    if (searchForm.department) {
      filteredStaff = filteredStaff.filter(staff => staff.department === searchForm.department)
    }
    if (searchForm.position) {
      filteredStaff = filteredStaff.filter(staff => staff.position === searchForm.position)
    }
    if (searchForm.status) {
      filteredStaff = filteredStaff.filter(staff => staff.status === searchForm.status)
    }

    staffList.value = filteredStaff
    pagination.total = filteredStaff.length

  } catch (error) {
    console.error('加载员工列表失败:', error)
    ElMessage.error('加载员工列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索员工
const searchStaff = () => {
  loadStaffList()
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    name: '',
    staff_no: '',
    department: '',
    position: '',
    status: ''
  })
  loadStaffList()
}

// 选择行变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 新增员工
const createStaff = () => {
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

// 编辑员工
const editStaff = (staff) => {
  editingId.value = staff.id
  Object.assign(staffForm, {
    staff_no: staff.staff_no,
    name: staff.name,
    gender: staff.gender,
    age: staff.age,
    phone: staff.phone,
    email: staff.email,
    department: staff.department,
    position: staff.position,
    roles: staff.roles || [],
    hire_date: staff.hire_date,
    id_card: staff.id_card,
    address: staff.address,
    remark: staff.remark,
    status: staff.status
  })
  dialogVisible.value = true
}

// 查看员工
const viewStaff = (staff) => {
  const rolesList = staff.roles ? staff.roles.map(role => getRoleText(role)).join('、') : '无'
  const deptText = departments.value.find(d => d.value === staff.department)?.label || staff.department
  const posText = positions.value.find(p => p.value === staff.position)?.label || staff.position

  ElMessageBox.alert(
    `工号：${staff.staff_no}
姓名：${staff.name}
性别：${staff.gender}
年龄：${staff.age || '未设置'}
手机：${staff.phone}
邮箱：${staff.email || '未设置'}
部门：${deptText}
职位：${posText}
权限角色：${rolesList}
入职日期：${staff.hire_date}
身份证号：${staff.id_card || '未设置'}
地址：${staff.address || '未设置'}
状态：${staff.status === 'active' ? '在职' : '离职'}
备注：${staff.remark || '无'}`,
    '员工详情',
    {
      confirmButtonText: '确定',
      type: 'info'
    }
  )
}

// 切换员工状态
const toggleStatus = async (staff) => {
  const action = staff.status === 'active' ? '设为离职' : '复职'
  try {
    await ElMessageBox.confirm(
      `确定要${action}员工 "${staff.name}" 吗？`,
      '状态变更确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const staffData = JSON.parse(localStorage.getItem('wms_staff') || '[]')
    const index = staffData.findIndex(s => s.id === staff.id)
    if (index !== -1) {
      staffData[index].status = staff.status === 'active' ? 'inactive' : 'active'
      localStorage.setItem('wms_staff', JSON.stringify(staffData))
    }

    ElMessage.success(`员工状态已更新`)
    loadStaffList()
  } catch {
    // 用户取消操作
  }
}

// 保存员工
const saveStaff = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    saving.value = true

    const staffData = JSON.parse(localStorage.getItem('wms_staff') || '[]')

    if (editingId.value) {
      // 编辑模式
      const index = staffData.findIndex(s => s.id === editingId.value)
      if (index !== -1) {
        staffData[index] = {
          ...staffData[index],
          ...staffForm,
          updated_at: new Date().toLocaleString()
        }
      }
      ElMessage.success('员工信息更新成功')
    } else {
      // 新建模式
      const newStaff = {
        id: Date.now(),
        ...staffForm,
        created_at: new Date().toLocaleString(),
        updated_at: new Date().toLocaleString(),
        avatar: ''
      }
      staffData.unshift(newStaff)
      ElMessage.success(`员工 ${newStaff.name} 添加成功`)
    }

    localStorage.setItem('wms_staff', JSON.stringify(staffData))
    dialogVisible.value = false
    loadStaffList()
    emit('refresh')
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
  Object.assign(staffForm, {
    staff_no: '',
    name: '',
    gender: '男',
    age: null,
    phone: '',
    email: '',
    department: '',
    position: '',
    roles: [],
    hire_date: '',
    id_card: '',
    address: '',
    remark: '',
    status: 'active'
  })
}

// 批量导入
const batchImport = () => {
  ElMessage.info('批量导入功能开发中...')
}

// 导出数据
const exportStaff = () => {
  ElMessage.info('导出功能开发中...')
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  loadStaffList()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadStaffList()
}

onMounted(() => {
  initDefaultData()
  loadStaffList()
})
</script>

<style lang="scss" scoped>
.staff-management {
  .search-card, .action-card, .table-card {
    margin-bottom: 20px;
  }
  
  .action-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
      margin: 0;
      color: #303133;
      font-size: 16px;
      font-weight: 600;
    }
    
    .action-buttons {
      display: flex;
      gap: 10px;
    }
  }
  
  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
}
</style> 