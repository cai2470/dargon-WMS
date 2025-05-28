<template>
  <div class="scanner-container">
    <!-- 扫码界面 -->
    <div v-if="!showManualInput" class="scanner-view">
      <div class="scanner-header">
        <h3>{{ title }}</h3>
        <el-button @click="toggleManualInput" size="small" type="primary">
          手动输入
        </el-button>
      </div>
      
      <div class="scanner-area">
        <div ref="scannerRef" class="scanner-viewport"></div>
        <div class="scanner-overlay">
          <div class="scan-line"></div>
          <div class="scan-corners">
            <div class="corner top-left"></div>
            <div class="corner top-right"></div>
            <div class="corner bottom-left"></div>
            <div class="corner bottom-right"></div>
          </div>
        </div>
      </div>
      
      <div class="scanner-tips">
        <p>请将条码对准扫描框</p>
        <p v-if="lastScannedCode">上次扫描: {{ lastScannedCode }}</p>
      </div>
      
      <div class="scanner-controls">
        <el-button @click="startScan" :disabled="isScanning" type="success">
          {{ isScanning ? '扫描中...' : '开始扫描' }}
        </el-button>
        <el-button @click="stopScan" :disabled="!isScanning" type="warning">
          停止扫描
        </el-button>
        <el-button @click="toggleFlash" v-if="hasFlash">
          {{ flashOn ? '关闭闪光灯' : '开启闪光灯' }}
        </el-button>
      </div>
    </div>

    <!-- 手动输入界面 -->
    <div v-else class="manual-input-view">
      <div class="input-header">
        <h3>手动输入条码</h3>
        <el-button @click="toggleManualInput" size="small">
          返回扫描
        </el-button>
      </div>
      
      <div class="input-form">
        <el-form @submit.prevent="handleManualSubmit">
          <el-form-item label="条码内容">
            <el-input
              v-model="manualCode"
              placeholder="请输入条码内容"
              clearable
              autofocus
              @keyup.enter="handleManualSubmit"
            >
              <template #append>
                <el-button @click="handleManualSubmit" type="primary">
                  确认
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-form>
        
        <div class="recent-codes" v-if="recentCodes.length > 0">
          <h4>最近扫描</h4>
          <div class="code-list">
            <div
              v-for="code in recentCodes"
              :key="code.id"
              class="code-item"
              @click="selectRecentCode(code.value)"
            >
              <span class="code-value">{{ code.value }}</span>
              <span class="code-time">{{ formatTime(code.time) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 扫描结果显示 -->
    <div v-if="scanResult" class="scan-result">
      <el-alert
        :title="scanResult.success ? '扫描成功' : '扫描失败'"
        :type="scanResult.success ? 'success' : 'error'"
        :description="scanResult.message"
        show-icon
        :closable="false"
      />
    </div>

    <!-- 扫描历史 -->
    <div class="scan-history" v-if="showHistory && scanHistory.length > 0">
      <h4>扫描历史</h4>
      <div class="history-list">
        <div
          v-for="item in scanHistory"
          :key="item.id"
          class="history-item"
        >
          <div class="item-code">{{ item.code }}</div>
          <div class="item-info">
            <span class="item-time">{{ formatDateTime(item.time) }}</span>
            <span class="item-status" :class="item.success ? 'success' : 'error'">
              {{ item.success ? '成功' : '失败' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import Quagga from 'quagga'
import { formatDateTime } from '@/utils'

// Props
const props = defineProps({
  title: {
    type: String,
    default: '条码扫描'
  },
  codeTypes: {
    type: Array,
    default: () => ['code_128', 'ean_reader', 'ean_8_reader', 'code_39_reader']
  },
  showHistory: {
    type: Boolean,
    default: true
  },
  autoStart: {
    type: Boolean,
    default: true
  },
  continuous: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['scan-success', 'scan-error', 'scan-result'])

// 响应式数据
const scannerRef = ref()
const isScanning = ref(false)
const showManualInput = ref(false)
const manualCode = ref('')
const lastScannedCode = ref('')
const hasFlash = ref(false)
const flashOn = ref(false)

const scanResult = ref(null)
const scanHistory = ref([])
const recentCodes = ref([])

// 扫描配置
const scannerConfig = reactive({
  inputStream: {
    name: "Live",
    type: "LiveStream",
    target: null,
    constraints: {
      width: 640,
      height: 480,
      facingMode: "environment"
    }
  },
  locator: {
    patchSize: "medium",
    halfSample: true
  },
  numOfWorkers: 2,
  frequency: 10,
  decoder: {
    readers: props.codeTypes
  },
  locate: true
})

// 方法
const initScanner = async () => {
  if (!scannerRef.value) return

  try {
    scannerConfig.inputStream.target = scannerRef.value
    
    await new Promise((resolve, reject) => {
      Quagga.init(scannerConfig, (err) => {
        if (err) {
          console.error('Scanner initialization failed:', err)
          reject(err)
        } else {
          resolve()
        }
      })
    })

    // 检查是否支持闪光灯
    const track = Quagga.CameraAccess.getActiveTrack()
    if (track && track.getCapabilities) {
      const capabilities = track.getCapabilities()
      hasFlash.value = !!capabilities.torch
    }

    // 监听扫描结果
    Quagga.onDetected(handleScanResult)
    Quagga.onProcessed(handleScanProcessed)

    if (props.autoStart) {
      startScan()
    }
  } catch (error) {
    console.error('Failed to initialize scanner:', error)
    ElMessage.error('摄像头初始化失败，请检查设备权限')
  }
}

const startScan = () => {
  if (isScanning.value) return
  
  try {
    Quagga.start()
    isScanning.value = true
    clearScanResult()
  } catch (error) {
    console.error('Failed to start scanner:', error)
    ElMessage.error('启动扫描失败')
  }
}

const stopScan = () => {
  if (!isScanning.value) return
  
  try {
    Quagga.stop()
    isScanning.value = false
  } catch (error) {
    console.error('Failed to stop scanner:', error)
  }
}

const handleScanResult = (result) => {
  const code = result.codeResult.code
  
  if (!code || code === lastScannedCode.value) return
  
  lastScannedCode.value = code
  
  // 添加到历史记录
  addToHistory(code, true)
  addToRecentCodes(code)
  
  // 显示结果
  showScanResult(true, `扫描成功: ${code}`)
  
  // 发送事件
  emit('scan-success', code)
  emit('scan-result', { code, success: true })
  
  // 如果不是连续扫描模式，停止扫描
  if (!props.continuous) {
    stopScan()
  }
}

const handleScanProcessed = (result) => {
  // 可以在这里处理扫描过程中的反馈
}

const handleManualSubmit = () => {
  if (!manualCode.value.trim()) {
    ElMessage.warning('请输入条码内容')
    return
  }
  
  const code = manualCode.value.trim()
  lastScannedCode.value = code
  
  // 添加到历史记录
  addToHistory(code, true, 'manual')
  addToRecentCodes(code)
  
  // 显示结果
  showScanResult(true, `手动输入成功: ${code}`)
  
  // 发送事件
  emit('scan-success', code)
  emit('scan-result', { code, success: true, type: 'manual' })
  
  // 清空输入
  manualCode.value = ''
}

const selectRecentCode = (code) => {
  manualCode.value = code
}

const toggleManualInput = () => {
  showManualInput.value = !showManualInput.value
  
  if (showManualInput.value) {
    stopScan()
  } else {
    nextTick(() => {
      if (props.autoStart) {
        startScan()
      }
    })
  }
}

const toggleFlash = async () => {
  if (!hasFlash.value) return
  
  try {
    const track = Quagga.CameraAccess.getActiveTrack()
    if (track && track.applyConstraints) {
      await track.applyConstraints({
        advanced: [{ torch: !flashOn.value }]
      })
      flashOn.value = !flashOn.value
    }
  } catch (error) {
    console.error('Failed to toggle flash:', error)
    ElMessage.error('闪光灯控制失败')
  }
}

const showScanResult = (success, message) => {
  scanResult.value = { success, message }
  
  setTimeout(() => {
    clearScanResult()
  }, 3000)
}

const clearScanResult = () => {
  scanResult.value = null
}

const addToHistory = (code, success, type = 'scan') => {
  const item = {
    id: Date.now(),
    code,
    success,
    type,
    time: new Date()
  }
  
  scanHistory.value.unshift(item)
  
  // 限制历史记录数量
  if (scanHistory.value.length > 50) {
    scanHistory.value = scanHistory.value.slice(0, 50)
  }
}

const addToRecentCodes = (code) => {
  // 移除重复项
  recentCodes.value = recentCodes.value.filter(item => item.value !== code)
  
  // 添加到开头
  recentCodes.value.unshift({
    id: Date.now(),
    value: code,
    time: new Date()
  })
  
  // 限制数量
  if (recentCodes.value.length > 10) {
    recentCodes.value = recentCodes.value.slice(0, 10)
  }
}

const formatTime = (time) => {
  return time.toLocaleTimeString()
}

const cleanup = () => {
  try {
    if (isScanning.value) {
      Quagga.stop()
    }
    Quagga.offDetected(handleScanResult)
    Quagga.offProcessed(handleScanProcessed)
  } catch (error) {
    console.error('Cleanup error:', error)
  }
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    initScanner()
  })
})

onUnmounted(() => {
  cleanup()
})

// 暴露方法给父组件
defineExpose({
  startScan,
  stopScan,
  toggleFlash,
  clearHistory: () => {
    scanHistory.value = []
    recentCodes.value = []
  }
})
</script>

<style scoped>
.scanner-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.scanner-view {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.scanner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.scanner-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.scanner-area {
  flex: 1;
  position: relative;
  background: #000;
  min-height: 300px;
}

.scanner-viewport {
  width: 100%;
  height: 100%;
}

.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.scan-line {
  position: absolute;
  top: 50%;
  left: 10%;
  right: 10%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ff0000, transparent);
  animation: scan-line 2s linear infinite;
}

@keyframes scan-line {
  0%, 100% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}

.scan-corners {
  position: absolute;
  top: 20%;
  left: 20%;
  right: 20%;
  bottom: 20%;
}

.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid #00ff00;
}

.corner.top-left {
  top: 0;
  left: 0;
  border-right: none;
  border-bottom: none;
}

.corner.top-right {
  top: 0;
  right: 0;
  border-left: none;
  border-bottom: none;
}

.corner.bottom-left {
  bottom: 0;
  left: 0;
  border-right: none;
  border-top: none;
}

.corner.bottom-right {
  bottom: 0;
  right: 0;
  border-left: none;
  border-top: none;
}

.scanner-tips {
  padding: 10px;
  text-align: center;
  background: #f9f9f9;
  border-bottom: 1px solid #ddd;
}

.scanner-tips p {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}

.scanner-controls {
  padding: 15px;
  display: flex;
  gap: 10px;
  justify-content: center;
  background: #fff;
}

.manual-input-view {
  flex: 1;
  padding: 20px;
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.input-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.recent-codes {
  margin-top: 20px;
}

.recent-codes h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #666;
}

.code-list {
  max-height: 200px;
  overflow-y: auto;
}

.code-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 5px;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.code-item:hover {
  background: #e6f7ff;
}

.code-value {
  font-family: monospace;
  font-weight: bold;
}

.code-time {
  font-size: 12px;
  color: #999;
}

.scan-result {
  margin: 10px;
}

.scan-history {
  margin: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.scan-history h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #666;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.item-code {
  font-family: monospace;
  font-weight: bold;
  flex: 1;
}

.item-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.item-time {
  font-size: 12px;
  color: #999;
}

.item-status {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 2px;
}

.item-status.success {
  background: #f6ffed;
  color: #52c41a;
}

.item-status.error {
  background: #fff2f0;
  color: #ff4d4f;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .scanner-controls {
    flex-direction: column;
  }
  
  .scanner-controls .el-button {
    width: 100%;
  }
  
  .code-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .item-info {
    align-items: flex-start;
  }
}
</style> 