<template>
  <div class="login-container">
    <div class="login-form-wrapper">
      <div class="login-form">
        <div class="login-header">
          <div class="logo-icon">🐉</div>
          <h2>小神龙仓库管理系统</h2>
          <p>Warehouse Management System</p>
        </div>
        
        <el-form 
          ref="loginFormRef" 
          :model="loginForm" 
          :rules="loginRules"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              size="large"
              prefix-icon="User"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              prefix-icon="Lock"
              show-password
            />
          </el-form-item>
          
          <el-form-item>
            <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              size="large" 
              :loading="loading"
              @click="handleLogin"
              class="login-button"
            >
              {{ loading ? '登录中...' : '登录' }}
            </el-button>
          </el-form-item>
        </el-form>
        
        <div class="demo-account">
          <el-divider>演示账户</el-divider>
          <div class="demo-buttons">
            <el-button 
              size="small" 
              @click="fillDemoAccount('admin')"
              type="info"
              plain
            >
              管理员: admin / admin123
            </el-button>
            <el-button 
              size="small" 
              @click="fillDemoAccount('user')"
              type="success"
              plain
            >
              用户: zhang_san / 123456
            </el-button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="login-footer">
      <p>&copy; 2024 小神龙仓库管理系统. All rights reserved.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

// 表单引用
const loginFormRef = ref()

// 加载状态
const loading = ref(false)

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: '',
  remember: false
})

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

// 填充演示账户
const fillDemoAccount = (type) => {
  if (type === 'admin') {
    loginForm.username = 'admin'
    loginForm.password = 'admin123'
  } else {
    loginForm.username = 'zhang_san'
    loginForm.password = '123456'
  }
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.login(loginForm)
        ElMessage.success('登录成功')
        
        // 检测设备类型，移动设备跳转到移动端
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        if (isMobile) {
          router.push('/mobile/dashboard')
        } else {
          router.push('/')
        }
      } catch (error) {
        ElMessage.error(error.message || '登录失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.login-form-wrapper {
  width: 100%;
  max-width: 400px;
}

.login-form {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  
  .login-header {
    text-align: center;
    margin-bottom: 30px;
    
    .logo-icon {
      font-size: 64px;
      margin-bottom: 16px;
      display: block;
    }
    
    h2 {
      color: #303133;
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
    }
    
    p {
      color: #909399;
      margin: 0;
      font-size: 14px;
    }
  }
  
  .login-button {
    width: 100%;
    height: 44px;
    font-size: 16px;
  }
  
  .demo-account {
    margin-top: 20px;
    
    .demo-buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
      
      .el-button {
        width: 100%;
      }
    }
  }
}

.login-footer {
  margin-top: 40px;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

// 响应式设计
@media (max-width: 480px) {
  .login-form {
    padding: 30px 20px;
    margin: 0 10px;
    
    .login-header {
      h2 {
        font-size: 20px;
      }
    }
  }
}
</style>