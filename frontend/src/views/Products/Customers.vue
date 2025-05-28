<template>
  <div class="customers-page">
    <div class="page-header">
      <h1>客户管理</h1>
      <el-button type="primary" @click="createCustomer">
        <el-icon><Plus /></el-icon>
        新增客户
      </el-button>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card">
      <el-form :model="searchForm" label-width="80px" :inline="true">
        <el-form-item label="客户名称">
          <el-input 
            v-model="searchForm.name" 
            placeholder="请输入客户名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="客户类型">
          <el-select 
            v-model="searchForm.type" 
            placeholder="请选择客户类型"
            clearable
            style="width: 150px"
          >
            <el-option label="企业客户" value="enterprise" />
            <el-option label="个人客户" value="individual" />
            <el-option label="经销商" value="dealer" />
            <el-option label="代理商" value="agent" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户等级">
          <el-select 
            v-model="searchForm.level" 
            placeholder="请选择客户等级"
            clearable
            style="width: 120px"
          >
            <el-option label="VIP客户" value="vip" />
            <el-option label="重要客户" value="important" />
            <el-option label="普通客户" value="normal" />
            <el-option label="潜在客户" value="potential" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select 
            v-model="searchForm.status" 
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="启用" value="1" />
            <el-option label="禁用" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchCustomers">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 客户统计 -->
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon total">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ customerStats.total }}</div>
            <div class="stat-label">客户总数</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon vip">
            <el-icon><Crown /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ customerStats.vip }}</div>
            <div class="stat-label">VIP客户</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon active">
            <el-icon><Check /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ customerStats.active }}</div>
            <div class="stat-label">活跃客户</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon new">
            <el-icon><Star /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ customerStats.newThisMonth }}</div>
            <div class="stat-label">本月新增</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 客户列表 -->
    <el-card class="table-card">
      <el-table :data="customerList" stripe v-loading="loading">
        <el-table-column prop="code" label="客户编号" width="120" />
        <el-table-column prop="name" label="客户名称" min-width="180" />
        <el-table-column prop="type" label="客户类型" width="100">
          <template #default="scope">
            {{ getCustomerTypeText(scope.row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="level" label="客户等级" width="100">
          <template #default="scope">
            <el-tag :type="getLevelTagType(scope.row.level)">
              {{ getLevelText(scope.row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="contact_person" label="联系人" width="100" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="address" label="地址" min-width="200" />
        <el-table-column prop="credit_limit" label="信用额度" width="120" align="right">
          <template #default="scope">
            ¥{{ formatNumber(scope.row.credit_limit) }}
          </template>
        </el-table-column>
        <el-table-column prop="order_count" label="订单数" width="80" align="right" />
        <el-table-column prop="total_amount" label="累计金额" width="120" align="right">
          <template #default="scope">
            ¥{{ formatNumber(scope.row.total_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="150" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" type="info" @click="viewCustomer(scope.row)">查看</el-button>
            <el-button size="small" type="warning" @click="editCustomer(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === 1 ? 'danger' : 'success'"
              @click="toggleStatus(scope.row)"
            >
              {{ scope.row.status === 1 ? '禁用' : '启用' }}
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

    <!-- 新增/编辑客户对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="800px"
      @close="resetForm"
    >
      <el-form :model="customerForm" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户编号" prop="code">
              <el-input 
                v-model="customerForm.code" 
                placeholder="系统自动生成"
                :disabled="!!customerForm.id"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户名称" prop="name">
              <el-input v-model="customerForm.name" placeholder="请输入客户名称" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户类型" prop="type">
              <el-select v-model="customerForm.type" placeholder="请选择客户类型" style="width: 100%">
                <el-option label="企业客户" value="enterprise" />
                <el-option label="个人客户" value="individual" />
                <el-option label="经销商" value="dealer" />
                <el-option label="代理商" value="agent" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户等级" prop="level">
              <el-select v-model="customerForm.level" placeholder="请选择客户等级" style="width: 100%">
                <el-option label="VIP客户" value="vip" />
                <el-option label="重要客户" value="important" />
                <el-option label="普通客户" value="normal" />
                <el-option label="潜在客户" value="potential" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contact_person">
              <el-input v-model="customerForm.contact_person" placeholder="请输入联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="customerForm.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱地址" prop="email">
              <el-input v-model="customerForm.email" placeholder="请输入邮箱地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="信用额度" prop="credit_limit">
              <el-input-number 
                v-model="customerForm.credit_limit" 
                :min="0" 
                :max="10000000"
                :precision="2"
                style="width: 100%"
                placeholder="请输入信用额度"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="客户地址" prop="address">
          <el-input 
            v-model="customerForm.address" 
            type="textarea" 
            :rows="2"
            placeholder="请输入客户地址"
          />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input 
            v-model="customerForm.remark" 
            type="textarea" 
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveCustomer">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, User, Crown, Check, Star
} from '@element-plus/icons-vue'

// 格式化数字
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  return Number(num).toLocaleString()
}

// 生成客户编号
const generateCustomerCode = () => {
  const timestamp = Date.now().toString().slice(-6)
  return `CU${timestamp}`
}

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const formRef = ref()

// 搜索表单
const searchForm = reactive({
  name: '',
  type: '',
  level: '',
  status: ''
})

// 客户表单
const customerForm = reactive({
  id: null,
  code: '',
  name: '',
  type: '',
  level: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  credit_limit: 0,
  remark: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 数据列表
const customerList = ref([])

// 统计数据
const customerStats = reactive({
  total: 0,
  vip: 0,
  active: 0,
  newThisMonth: 0
})

// 对话框标题
const dialogTitle = computed(() => {
  return customerForm.id ? '编辑客户' : '新增客户'
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入客户名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择客户类型', trigger: 'change' }
  ],
  level: [
    { required: true, message: '请选择客户等级', trigger: 'change' }
  ],
  contact_person: [
    { required: true, message: '请输入联系人', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 获取客户类型文本
const getCustomerTypeText = (type) => {
  const typeMap = {
    'enterprise': '企业客户',
    'individual': '个人客户',
    'dealer': '经销商',
    'agent': '代理商'
  }
  return typeMap[type] || '未知'
}

// 获取等级标签类型
const getLevelTagType = (level) => {
  const typeMap = {
    'vip': 'danger',
    'important': 'warning',
    'normal': 'success',
    'potential': 'info'
  }
  return typeMap[level] || 'info'
}

// 获取等级文本
const getLevelText = (level) => {
  const textMap = {
    'vip': 'VIP',
    'important': '重要',
    'normal': '普通',
    'potential': '潜在'
  }
  return textMap[level] || '未知'
}

// 加载客户列表
const loadCustomerList = async () => {
  loading.value = true
  try {
    // 模拟API调用
    const mockCustomers = [
      {
        id: 1,
        code: 'CU001',
        name: '北京科技有限公司',
        type: 'enterprise',
        level: 'vip',
        contact_person: '张经理',
        phone: '13800138001',
        email: 'zhang@bjtech.com',
        address: '北京市朝阳区科技园区1号',
        credit_limit: 1000000,
        order_count: 45,
        total_amount: 2580000,
        status: 1,
        created_at: '2024-01-01 10:00:00'
      },
      {
        id: 2,
        code: 'CU002',
        name: '上海贸易公司',
        type: 'dealer',
        level: 'important',
        contact_person: '李总',
        phone: '13800138002',
        email: 'li@shtrade.com',
        address: '上海市浦东新区贸易大厦2楼',
        credit_limit: 500000,
        order_count: 28,
        total_amount: 1680000,
        status: 1,
        created_at: '2024-01-02 14:30:00'
      },
      {
        id: 3,
        code: 'CU003',
        name: '王小明',
        type: 'individual',
        level: 'normal',
        contact_person: '王小明',
        phone: '13800138003',
        email: 'wang@example.com',
        address: '广州市天河区住宅小区3栋',
        credit_limit: 50000,
        order_count: 12,
        total_amount: 85000,
        status: 1,
        created_at: '2024-01-15 09:15:00'
      }
    ]
    
    customerList.value = mockCustomers
    pagination.total = mockCustomers.length
    
    // 更新统计数据
    customerStats.total = mockCustomers.length
    customerStats.vip = mockCustomers.filter(c => c.level === 'vip').length
    customerStats.active = mockCustomers.filter(c => c.status === 1).length
    customerStats.newThisMonth = mockCustomers.filter(c => 
      new Date(c.created_at).getMonth() === new Date().getMonth()
    ).length
    
  } catch (error) {
    ElMessage.error('加载客户列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索客户
const searchCustomers = () => {
  loadCustomerList()
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    name: '',
    type: '',
    level: '',
    status: ''
  })
  loadCustomerList()
}

// 新增客户
const createCustomer = () => {
  customerForm.code = generateCustomerCode()
  dialogVisible.value = true
}

// 查看客户
const viewCustomer = (customer) => {
  ElMessageBox.alert(
    `
    客户编号：${customer.code}
    客户名称：${customer.name}
    客户类型：${getCustomerTypeText(customer.type)}
    客户等级：${getLevelText(customer.level)}
    联系人：${customer.contact_person}
    联系电话：${customer.phone}
    邮箱：${customer.email}
    地址：${customer.address}
    信用额度：¥${formatNumber(customer.credit_limit)}
    订单数量：${customer.order_count}
    累计金额：¥${formatNumber(customer.total_amount)}
    `,
    '客户详情',
    {
      confirmButtonText: '确定',
      type: 'info'
    }
  )
}

// 编辑客户
const editCustomer = (customer) => {
  Object.assign(customerForm, customer)
  dialogVisible.value = true
}

// 切换客户状态
const toggleStatus = async (customer) => {
  const action = customer.status === 1 ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(
      `确定要${action}客户 "${customer.name}" 吗？`,
      `${action}确认`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    customer.status = customer.status === 1 ? 0 : 1
    ElMessage.success(`客户已${action}`)
    loadCustomerList()
  } catch {
    // 用户取消操作
  }
}

// 保存客户
const saveCustomer = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    saving.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const action = customerForm.id ? '更新' : '创建'
    ElMessage.success(`客户${action}成功`)
    dialogVisible.value = false
    loadCustomerList()
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
  Object.assign(customerForm, {
    id: null,
    code: '',
    name: '',
    type: '',
    level: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    credit_limit: 0,
    remark: ''
  })
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  loadCustomerList()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadCustomerList()
}

onMounted(() => {
  loadCustomerList()
})
</script>

<style scoped>
.customers-page {
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

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.vip {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.active {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.new {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
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
</style> 