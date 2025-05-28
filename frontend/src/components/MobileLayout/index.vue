<template>
  <div class="mobile-layout">
    <!-- 顶部导航栏 -->
    <div class="mobile-header">
      <div class="header-left">
        <el-icon @click="toggleMenu" class="menu-icon">
          <Menu />
        </el-icon>
        <span class="title">小神龙WMS</span>
      </div>
      
      <div class="header-right">
        <el-icon @click="showUserMenu" class="user-icon">
          <User />
        </el-icon>
      </div>
    </div>
    
    <!-- 侧边菜单抽屉 -->
    <el-drawer
      v-model="menuVisible"
      :with-header="false"
      direction="ltr"
      size="280px"
      class="mobile-menu-drawer"
    >
      <div class="mobile-menu">
        <div class="menu-header">
          <div class="logo">
            <img src="/logo.png" alt="小神龙仓库管理系统">
            <span>小神龙WMS</span>
          </div>
        </div>
        
        <el-menu
          :default-active="activeMenu"
          router
          @select="handleMenuSelect"
        >
          <el-menu-item index="/dashboard">
            <el-icon><House /></el-icon>
            <span>工作台</span>
          </el-menu-item>
          
          <el-sub-menu index="warehouse">
            <template #title>
              <el-icon><OfficeBuilding /></el-icon>
              <span>仓库管理</span>
            </template>
            <el-menu-item index="/warehouse/list">仓库列表</el-menu-item>
            <el-menu-item index="/warehouse/zones">库区管理</el-menu-item>
            <el-menu-item index="/warehouse/locations">库位管理</el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="products">
            <template #title>
              <el-icon><Box /></el-icon>
              <span>商品管理</span>
            </template>
            <el-menu-item index="/products/list">商品列表</el-menu-item>
            <el-menu-item index="/products/categories">商品分类</el-menu-item>
            <el-menu-item index="/products/suppliers">供应商</el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="inventory">
            <template #title>
              <el-icon><Goods /></el-icon>
              <span>库存管理</span>
            </template>
            <el-menu-item index="/inventory/stock">库存查询</el-menu-item>
            <el-menu-item index="/inventory/movements">库存变动</el-menu-item>
            <el-menu-item index="/inventory/alerts">库存预警</el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="scanner">
            <template #title>
              <el-icon><Camera /></el-icon>
              <span>扫码操作</span>
            </template>
            <el-menu-item index="/scanner/inbound">扫码入库</el-menu-item>
            <el-menu-item index="/scanner/outbound">扫码出库</el-menu-item>
            <el-menu-item index="/scanner/query">扫码查询</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </div>
    </el-drawer>
    
    <!-- 主要内容区域 -->
    <div class="mobile-content">
      <router-view />
    </div>
    
    <!-- 底部导航栏 -->
    <div class="mobile-tabbar">
      <div 
        class="tab-item"
        :class="{ active: activeTab === 'dashboard' }"
        @click="$router.push('/dashboard')"
      >
        <el-icon><House /></el-icon>
        <span>首页</span>
      </div>
      
      <div 
        class="tab-item"
        :class="{ active: activeTab === 'products' }"
        @click="$router.push('/mobile/products')"
      >
        <el-icon><Box /></el-icon>
        <span>商品</span>
      </div>
      
      <div 
        class="tab-item"
        :class="{ active: activeTab === 'inventory' }"
        @click="$router.push('/mobile/inventory')"
      >
        <el-icon><Goods /></el-icon>
        <span>库存</span>
      </div>
      
      <div 
        class="tab-item"
        :class="{ active: activeTab === 'operations' }"
        @click="toggleOperations"
      >
        <el-icon><Operation /></el-icon>
        <span>操作</span>
      </div>
      
      <div 
        class="tab-item"
        :class="{ active: activeTab === 'profile' }"
        @click="$router.push('/profile')"
      >
        <el-icon><User /></el-icon>
        <span>我的</span>
      </div>
    </div>
    
    <!-- 用户菜单弹窗 -->
    <el-dialog
      v-model="userMenuVisible"
      title="用户菜单"
      width="90%"
      class="mobile-dialog"
    >
      <div class="user-menu-content">
        <div class="user-info">
          <el-avatar :src="userInfo.avatar" :size="60">
            {{ userInfo.username?.charAt(0)?.toUpperCase() }}
          </el-avatar>
          <div class="user-details">
            <div class="username">{{ userInfo.username }}</div>
            <div class="role">{{ userInfo.role || '用户' }}</div>
          </div>
        </div>
        
        <div class="menu-actions">
          <el-button type="primary" @click="$router.push('/profile')">
            个人中心
          </el-button>
          <el-button @click="$router.push('/settings')">
            系统设置
          </el-button>
          <el-button type="danger" @click="handleLogout">
            退出登录
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 菜单显示状态
const menuVisible = ref(false)
const userMenuVisible = ref(false)

// 用户信息
const userInfo = computed(() => userStore.userInfo)

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 当前激活的底部标签
const activeTab = computed(() => {
  const path = route.path
  if (path.startsWith('/mobile/dashboard') || path === '/mobile') return 'dashboard'
  if (path.startsWith('/mobile/products')) return 'products'
  if (path.startsWith('/mobile/inventory')) return 'inventory'
  if (path.startsWith('/mobile/inbound') || path.startsWith('/mobile/outbound')) return 'operations'
  if (path.startsWith('/profile')) return 'profile'
  return 'dashboard'
})

// 切换菜单
const toggleMenu = () => {
  menuVisible.value = !menuVisible.value
}

// 显示用户菜单
const showUserMenu = () => {
  userMenuVisible.value = true
}

// 切换操作菜单
const toggleOperations = () => {
  // 显示操作菜单
  ElMessageBox.confirm('请选择操作类型', '操作选择', {
    distinguishCancelAndClose: true,
    confirmButtonText: '入库管理',
    cancelButtonText: '出库管理',
    type: 'info'
  }).then(() => {
    router.push('/mobile/inbound')
  }).catch(action => {
    if (action === 'cancel') {
      router.push('/mobile/outbound')
    }
  })
}

// 菜单选择后关闭抽屉
const handleMenuSelect = () => {
  menuVisible.value = false
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userStore.logout()
    router.push('/login')
    ElMessage.success('退出登录成功')
    userMenuVisible.value = false
  } catch (error) {
    // 用户取消
  }
}
</script>

<style lang="scss" scoped>
.mobile-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.mobile-header {
  height: 44px;
  background-color: #409EFF;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  color: white;
  position: sticky;
  top: 0;
  z-index: 1000;
  
  .header-left {
    display: flex;
    align-items: center;
    
    .menu-icon {
      font-size: 18px;
      margin-right: 10px;
      cursor: pointer;
    }
    
    .title {
      font-size: 16px;
      font-weight: bold;
    }
  }
  
  .header-right {
    .user-icon {
      font-size: 18px;
      cursor: pointer;
    }
  }
}

.mobile-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  padding-bottom: 60px; // 底部导航栏高度
}

.mobile-tabbar {
  height: 50px;
  background-color: white;
  display: flex;
  align-items: center;
  border-top: 1px solid #e4e7ed;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  
  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #909399;
    font-size: 12px;
    
    &.active {
      color: #409EFF;
    }
    
    .el-icon {
      font-size: 18px;
      margin-bottom: 2px;
    }
  }
}

.mobile-menu {
  height: 100%;
  
  .menu-header {
    height: 120px;
    background: linear-gradient(45deg, #409EFF, #67C23A);
    display: flex;
    align-items: center;
    justify-content: center;
    
    .logo {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: white;
      
      img {
        height: 48px;
        margin-bottom: 8px;
      }
      
      span {
        font-size: 16px;
        font-weight: bold;
      }
    }
  }
  
  .el-menu {
    border-right: none;
  }
}

.user-menu-content {
  .user-info {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    
    .user-details {
      margin-left: 15px;
      
      .username {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .role {
        color: #909399;
        font-size: 14px;
      }
    }
  }
  
  .menu-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    
    .el-button {
      width: 100%;
    }
  }
}

:deep(.mobile-menu-drawer) {
  .el-drawer__body {
    padding: 0;
  }
}

:deep(.mobile-dialog) {
  .el-dialog {
    margin: 5vh auto;
    border-radius: 10px;
  }
}
</style>