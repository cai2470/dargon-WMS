<template>
  <div class="layout-container">
    <el-container class="layout-wrapper">
      <!-- 侧边栏 -->
      <el-aside :width="isCollapse ? '64px' : '240px'" class="sidebar">
        <div class="logo" @click="$router.push('/')">
          <div class="logo-icon" v-if="!isCollapse">🐉</div>
          <div class="logo-icon-mini" v-else>🐉</div>
          <span v-if="!isCollapse">小神龙WMS</span>
        </div>
        
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapse"
          :unique-opened="true"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
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
            <el-menu-item index="/products/brands">品牌管理</el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="inventory">
            <template #title>
              <el-icon><Goods /></el-icon>
              <span>库存管理</span>
            </template>
            <el-menu-item index="/inventory/stock">库存查询</el-menu-item>
            <el-menu-item index="/inventory/movements">库存变动</el-menu-item>
            <el-menu-item index="/inventory/alerts">库存预警</el-menu-item>
            <el-menu-item index="/inventory/count">库存盘点</el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="operations">
            <template #title>
              <el-icon><Operation /></el-icon>
              <span>出入库</span>
            </template>
            <el-menu-item index="/inbound/orders">入库管理</el-menu-item>
            <el-menu-item index="/outbound/orders">出库管理</el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="reports">
            <template #title>
              <el-icon><DataAnalysis /></el-icon>
              <span>报表中心</span>
            </template>
            <el-menu-item index="/reports/inventory">库存报表</el-menu-item>
            <el-menu-item index="/reports/inbound">入库报表</el-menu-item>
            <el-menu-item index="/reports/outbound">出库报表</el-menu-item>
            <el-menu-item index="/reports/analysis">数据分析</el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="system">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统管理</span>
            </template>
            <el-menu-item index="/system/staff">员工管理</el-menu-item>
            <el-menu-item index="/system/users">用户管理</el-menu-item>
            <el-menu-item index="/system/roles">角色管理</el-menu-item>
            <el-menu-item index="/system/permissions">权限管理</el-menu-item>
            <el-menu-item index="/system/logs">系统日志</el-menu-item>
            <el-menu-item index="/system/settings">系统设置</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>
      
      <!-- 主体内容 -->
      <el-container>
        <!-- 顶部导航 -->
        <el-header class="navbar">
          <div class="navbar-left">
            <el-icon class="hamburger" @click="toggleSidebar">
              <Expand v-if="isCollapse" />
              <Fold v-else />
            </el-icon>
            
            <el-breadcrumb class="breadcrumb" separator="/">
              <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
                {{ item.name }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          
          <div class="navbar-right">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-avatar :size="32">
                  {{ userInfo.username?.charAt(0)?.toUpperCase() }}
                </el-avatar>
                <span class="username">{{ userInfo.username }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="settings">系统设置</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        
        <!-- 内容区域 -->
        <el-main class="app-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
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

// 侧边栏折叠状态
const isCollapse = ref(false)

// 用户信息
const userInfo = computed(() => userStore.userInfo)

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 面包屑导航
const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  return matched.map(item => ({
    name: item.meta.title,
    path: item.path
  }))
})

// 切换侧边栏
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

// 用户菜单操作
const handleCommand = async (command) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人中心功能开发中...')
      break
    case 'settings':
      router.push('/system/settings')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await userStore.logout()
        router.push('/login')
        ElMessage.success('退出登录成功')
      } catch (error) {
        // 用户取消
      }
      break
  }
}
</script>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;
  
  .layout-wrapper {
    height: 100%;
  }
}

.sidebar {
  background-color: #304156;
  transition: width 0.28s;
  
  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background-color: #2b2f3a;
    color: #fff;
    
    .logo-icon, .logo-icon-mini {
      font-size: 32px;
      margin-right: 8px;
    }
    
    span {
      font-size: 16px;
      font-weight: bold;
    }
  }
  
  .el-menu {
    border-right: none;
  }
}

.navbar {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  
  .navbar-left {
    display: flex;
    align-items: center;
    
    .hamburger {
      font-size: 20px;
      cursor: pointer;
      margin-right: 20px;
      
      &:hover {
        color: #409EFF;
      }
    }
    
    .breadcrumb {
      font-size: 14px;
    }
  }
  
  .navbar-right {
    .user-info {
      display: flex;
      align-items: center;
      cursor: pointer;
      
      .username {
        margin: 0 8px;
        font-size: 14px;
      }
    }
  }
}

.app-main {
  background-color: #f4f4f5;
  padding: 20px;
  overflow-y: auto;
}

// 响应式设计
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    z-index: 1001;
    top: 0;
    left: 0;
    height: 100vh;
  }
  
  .navbar {
    padding: 0 15px;
    
    .breadcrumb {
      display: none;
    }
  }
  
  .app-main {
    padding: 15px;
  }
}
</style>