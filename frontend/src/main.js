import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import './styles/index.scss'
import { initAllData, checkDataIntegrity } from './utils/initData'

const app = createApp(App)

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
})

// 初始化系统基础数据
try {
  // 检查数据完整性
  if (!checkDataIntegrity()) {
    console.log('🔧 检测到数据不完整，正在初始化...')
    initAllData()
  }
} catch (error) {
  console.error('数据初始化失败:', error)
}

app.mount('#app')