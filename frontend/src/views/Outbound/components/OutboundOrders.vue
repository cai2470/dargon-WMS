<template>
  <div class="outbound-orders">
    <!-- 搜索筛选区域 -->
    <el-card class="search-card">
      <el-form :model="searchForm" label-width="80px" :inline="true">
        <el-form-item label="出库单号">
          <el-input 
            v-model="searchForm.order_no" 
            placeholder="请输入出库单号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input 
            v-model="searchForm.customer_name" 
            placeholder="请输入客户名称"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="出库状态">
          <el-select 
            v-model="searchForm.status" 
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option 
              v-for="status in statusOptions" 
              :key="status.value"
              :label="status.label" 
              :value="status.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="出库类型">
          <el-select 
            v-model="searchForm.outbound_type" 
            placeholder="出库类型"
            clearable
            style="width: 120px"
          >
            <el-option 
              v-for="type in typeOptions" 
              :key="type.value"
              :label="type.label" 
              :value="type.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchOrders">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮区域 -->
    <el-card class="action-card">
      <div class="action-header">
        <h3>出库单管理</h3>
        <div class="action-buttons">
          <el-button type="primary" @click="createOrder">
            <el-icon><Plus /></el-icon>
            新建出库单
          </el-button>
          <el-button type="success" @click="batchExport" :disabled="selectedRows.length === 0">
            <el-icon><Download /></el-icon>
            批量导出
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 出库单列表 -->
    <el-card class="table-card">
      <el-table 
        :data="orderList" 
        stripe 
        v-loading="loading" 
        size="small"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="#" type="index" width="50" />
        <el-table-column prop="order_no" label="出库单号" width="130" />
        <el-table-column prop="customer_name" label="客户名称" width="120" />
        <el-table-column prop="warehouse_name" label="出库仓库" width="100" />
        <el-table-column prop="outbound_type" label="出库类型" width="100">
          <template #default="scope">
            <el-tag size="small" :type="getTypeColor(scope.row.outbound_type)">
              {{ getTypeText(scope.row.outbound_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_quantity" label="总数量" width="80" align="right" />
        <el-table-column prop="total_amount" label="总金额" width="100" align="right">
          <template #default="scope">
            ¥{{ (scope.row.total_amount || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="scope">
            <el-tag 
              :type="getPriorityColor(scope.row.priority)"
              effect="plain"
              size="small"
            >
              {{ getPriorityText(scope.row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-tag :type="getStatusColor(scope.row.status)" size="small">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_by" label="创建人" width="80" />
        <el-table-column prop="created_at" label="创建时间" width="130" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button size="small" type="info" @click="viewOrder(scope.row)">查看</el-button>
            <el-button 
              v-if="scope.row.status === 'draft'" 
              size="small" 
              type="primary" 
              @click="editOrder(scope.row)"
            >
              编辑
            </el-button>
            <el-button 
              v-if="scope.row.status === 'draft'" 
              size="small" 
              type="success" 
              @click="confirmOrder(scope.row)"
            >
              确认
            </el-button>
            <el-button 
              v-if="scope.row.status === 'draft'" 
              size="small" 
              type="danger" 
              @click="deleteOrder(scope.row)"
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

    <!-- 新建/编辑出库单对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="1000px"
      @close="resetForm"
    >
      <el-form :model="orderForm" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="客户名称" prop="customer_name">
              <el-input 
                v-model="orderForm.customer_name" 
                placeholder="请输入客户名称" 
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="出库仓库" prop="warehouse_id">
              <el-select v-model="orderForm.warehouse_id" placeholder="请选择仓库" style="width: 100%">
                <el-option 
                  v-for="warehouse in warehouses" 
                  :key="warehouse.id"
                  :label="warehouse.name" 
                  :value="warehouse.id" 
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="出库类型" prop="outbound_type">
              <el-select v-model="orderForm.outbound_type" placeholder="请选择类型" style="width: 100%">
                <el-option 
                  v-for="type in typeOptions" 
                  :key="type.value"
                  :label="type.label" 
                  :value="type.value" 
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="orderForm.priority" placeholder="选择优先级" style="width: 100%">
                <el-option 
                  v-for="priority in priorityOptions" 
                  :key="priority.value"
                  :label="priority.label" 
                  :value="priority.value" 
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="预计出库时间">
              <el-date-picker 
                v-model="orderForm.expected_date" 
                type="datetime"
                placeholder="选择日期时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="运费">
              <el-input-number 
                v-model="orderForm.shipping_fee" 
                :precision="2"
                :min="0" 
                placeholder="请输入运费"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="收货地址">
          <el-input 
            v-model="orderForm.delivery_address" 
            type="textarea" 
            :rows="2"
            placeholder="请输入收货地址"
          />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input 
            v-model="orderForm.remark" 
            type="textarea" 
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
        
        <!-- 商品明细 -->
        <el-form-item label="商品明细">
          <div class="product-details">
            <div class="detail-header">
              <el-button size="small" type="primary" @click="addProduct">
                <el-icon><Plus /></el-icon>
                添加商品
              </el-button>
            </div>

            <!-- 商品明细表格 - 第一排：基础信息 -->
            <div class="product-table-section">
              <h4 class="section-title">商品基础信息</h4>
              <el-table :data="orderForm.products" border size="small" class="product-table-basic">
                <el-table-column type="index" label="序号" width="50" />
                <el-table-column prop="product_code" label="商品编码" width="110" />
                <el-table-column prop="isku" label="iSKU" width="120" />
                <el-table-column prop="product_name" label="商品名称" min-width="160" />
                <el-table-column label="图片" width="70">
                  <template #default="scope">
                    <el-image 
                      v-if="scope.row.image" 
                      :src="scope.row.image" 
                      style="width: 35px; height: 35px" 
                      fit="cover"
                      preview-disabled
                    />
                  </template>
                </el-table-column>
                <el-table-column label="属性" width="120">
                  <template #default="scope">
                    <div v-if="scope.row.attributes && scope.row.attributes.length > 0">
                      <el-tag 
                        v-for="attr in scope.row.attributes.slice(0, 2)" 
                        :key="attr.name"
                        size="small"
                        style="margin-right: 5px;"
                      >
                        {{ attr.value }}
                      </el-tag>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="unit" label="单位" width="60" />
                <el-table-column label="操作" width="80">
                  <template #default="scope">
                    <el-button 
                      size="small" 
                      type="danger" 
                      @click="removeProduct(scope.$index)"
                    >
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- 商品明细表格 - 第二排：库位与数量信息 -->
            <div class="product-table-section">
              <h4 class="section-title">库位与出库信息</h4>
              <el-table :data="orderForm.products" border size="small" class="product-table-location">
                <el-table-column type="index" label="序号" width="50" />
                <el-table-column prop="product_name" label="商品名称" width="140" show-overflow-tooltip />
                <el-table-column prop="warehouse_name" label="仓库" width="100" />
                <el-table-column prop="zone_name" label="库区" width="80" />
                <el-table-column prop="location_name" label="库位" width="80" />
                <el-table-column prop="available_stock" label="可用库存" width="100" align="right">
                  <template #default="scope">
                    <el-tag 
                      :type="scope.row.available_stock > 10 ? 'success' : scope.row.available_stock > 0 ? 'warning' : 'danger'"
                      size="small"
                    >
                      {{ scope.row.available_stock }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="出库数量" width="130">
                  <template #default="scope">
                    <el-input-number 
                      v-model="scope.row.quantity" 
                      :min="1" 
                      :max="scope.row.available_stock"
                      size="small"
                      style="width: 100%"
                      @change="calculateAmount(scope.row)"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="单价" width="130">
                  <template #default="scope">
                    <el-input-number 
                      v-model="scope.row.unit_price" 
                      :precision="2"
                      :min="0" 
                      size="small"
                      style="width: 100%"
                      @change="calculateAmount(scope.row)"
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="amount" label="金额" width="130" align="right">
                  <template #default="scope">
                    <span style="font-weight: 600; color: #409EFF;">
                      ¥{{ (scope.row.amount || 0).toFixed(2) }}
                    </span>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- 总计信息 -->
            <div class="product-summary">
              <el-row :gutter="20">
                <el-col :span="12">
                  <div class="summary-item">
                    <span class="summary-label">总商品种类：</span>
                    <span class="summary-value">{{ orderForm.products.length }} 种</span>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="summary-item">
                    <span class="summary-label">总出库数量：</span>
                    <span class="summary-value">{{ orderForm.products.reduce((sum, p) => sum + (p.quantity || 0), 0) }} 件</span>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="summary-item">
                    <span class="summary-label">商品总金额：</span>
                    <span class="summary-value total-amount">¥{{ orderForm.products.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2) }}</span>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="summary-item">
                    <span class="summary-label">运费：</span>
                    <span class="summary-value">¥{{ (orderForm.shipping_fee || 0).toFixed(2) }}</span>
                  </div>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveOrder" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 选择商品对话框 -->
    <el-dialog 
      title="选择商品" 
      v-model="productSelectVisible" 
      width="1000px"
    >
      <!-- 筛选区域 -->
      <el-form :inline="true" style="margin-bottom: 15px;">
        <el-form-item label="商品名称">
          <el-input 
            v-model="productSearchForm.name" 
            placeholder="搜索商品名称"
            clearable
            style="width: 200px"
            @input="filterProducts"
          />
        </el-form-item>
        <el-form-item label="商品编码">
          <el-input 
            v-model="productSearchForm.code" 
            placeholder="搜索商品编码"
            clearable
            style="width: 150px"
            @input="filterProducts"
          />
        </el-form-item>
        <el-form-item label="库位">
          <el-input 
            v-model="productSearchForm.location" 
            placeholder="搜索库位"
            clearable
            style="width: 120px"
            @input="filterProducts"
          />
        </el-form-item>
      </el-form>

      <el-table 
        :data="filteredProducts" 
        @selection-change="handleProductSelection"
        max-height="500"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="code" label="编码" width="100" />
        <el-table-column prop="isku" label="iSKU" width="100" />
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column label="图片" width="60">
          <template #default="scope">
            <el-image 
              v-if="scope.row.image" 
              :src="scope.row.image" 
              style="width: 30px; height: 30px" 
              fit="cover"
              preview-disabled
            />
          </template>
        </el-table-column>
        <el-table-column label="属性" width="100">
          <template #default="scope">
            <div v-if="scope.row.attributes && scope.row.attributes.length > 0">
              <el-tag 
                v-for="attr in scope.row.attributes.slice(0, 1)" 
                :key="attr.name"
                size="small"
              >
                {{ attr.value }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="warehouse_name" label="仓库" width="100" />
        <el-table-column prop="zone_name" label="库区" width="80" />
        <el-table-column prop="location_name" label="库位" width="80" />
        <el-table-column prop="unit" label="单位" width="60" />
        <el-table-column prop="available_stock" label="可用库存" width="100" align="right">
          <template #default="scope">
            <el-tag 
              :type="scope.row.available_stock > 10 ? 'success' : scope.row.available_stock > 0 ? 'warning' : 'danger'"
              size="small"
            >
              {{ scope.row.available_stock }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="参考价格" width="100" align="right">
          <template #default="scope">
            ¥{{ (scope.row.price || 0).toFixed(2) }}
          </template>
        </el-table-column>
      </el-table>
      
      <template #footer>
        <el-button @click="productSelectVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmProductSelection">确定</el-button>
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
const productSelectVisible = ref(false)
const formRef = ref()
const selectedRows = ref([])
const selectedProducts = ref([])
const editingId = ref(null)

// 商品搜索表单
const productSearchForm = reactive({
  name: '',
  code: '',
  location: ''
})

// 搜索表单
const searchForm = reactive({
  order_no: '',
  customer_name: '',
  status: '',
  outbound_type: '',
  date_range: []
})

// 出库单表单
const orderForm = reactive({
  customer_name: '',
  warehouse_id: null,
  outbound_type: '',
  priority: 'medium',
  expected_date: '',
  shipping_fee: 0,
  delivery_address: '',
  remark: '',
  products: []
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 数据列表
const orderList = ref([])
const warehouses = ref([])
const availableProducts = ref([])
const filteredProducts = ref([])

// 选项数据
const statusOptions = ref([
  { label: '草稿', value: 'draft' },
  { label: '预发货', value: 'pre_delivery' },
  { label: '待拣货', value: 'picking' },
  { label: '待打包', value: 'packing' },
  { label: '待发货', value: 'shipping' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' }
])

const typeOptions = ref([
  { label: '销售出库', value: 'sale' },
  { label: '调拨出库', value: 'transfer' },
  { label: '退货出库', value: 'return' },
  { label: '其他出库', value: 'other' }
])

const priorityOptions = ref([
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' }
])

// 表单验证规则
const rules = {
  customer_name: [
    { required: true, message: '请输入客户名称', trigger: 'blur' }
  ],
  warehouse_id: [
    { required: true, message: '请选择出库仓库', trigger: 'change' }
  ],
  outbound_type: [
    { required: true, message: '请选择出库类型', trigger: 'change' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ]
}

// 计算属性
const dialogTitle = computed(() => {
  return editingId.value ? '编辑出库单' : '新建出库单'
})

// 商品搜索过滤
const filterProducts = () => {
  const { name, code, location } = productSearchForm
  
  filteredProducts.value = availableProducts.value.filter(product => {
    const nameMatch = !name || product.name.toLowerCase().includes(name.toLowerCase())
    const codeMatch = !code || product.code.toLowerCase().includes(code.toLowerCase())
    const locationMatch = !location || product.location_name.toLowerCase().includes(location.toLowerCase())
    
    return nameMatch && codeMatch && locationMatch
  })
}

// 加载基础数据
const loadBasicData = async () => {
  try {
    // 从localStorage加载仓库数据
    const warehouseData = JSON.parse(localStorage.getItem('wms_warehouses') || '[]')
    warehouses.value = warehouseData.filter(w => {
      const status = w.status
      return status === '启用' || status === 1 || status === 'active' || status === '正常'
    }).map(w => ({
      id: w.id,
      name: w.name,
      code: w.code
    }))

    // 从localStorage加载商品数据和库存数据
    const productsData = JSON.parse(localStorage.getItem('wms_products') || '[]')
    const inventoryData = JSON.parse(localStorage.getItem('inventory_stock') || '[]')
    
    // 计算每个商品的可用库存
    availableProducts.value = productsData.map(product => {
      // 计算该商品在所有仓库的总可用库存
      const productInventory = inventoryData.filter(inv => 
        inv.product_code === product.code || inv.product_id === product.id
      )
      const totalAvailableStock = productInventory.reduce((sum, inv) => 
        sum + (inv.available_stock || 0), 0
      )
      
      return {
        id: product.id,
        code: product.code,
        isku: product.isku,
        name: product.name,
        unit: product.unit || '个',
        price: parseFloat(product.price || 0),
        available_stock: totalAvailableStock,
        image: product.image,
        attributes: product.attributes || []
      }
    }).filter(p => p.available_stock > 0) // 只显示有库存的商品

    console.log('加载基础数据完成:', {
      warehouses: warehouses.value.length,
      products: availableProducts.value.length
    })
  } catch (error) {
    console.error('加载基础数据失败:', error)
    ElMessage.error('加载基础数据失败')
  }
}

// 根据仓库加载商品
const loadProductsByWarehouse = async (warehouseId) => {
  try {
    const productsData = JSON.parse(localStorage.getItem('wms_products') || '[]')
    const inventoryData = JSON.parse(localStorage.getItem('inventory_stock') || '[]')
    
    console.log('=== 加载仓库商品库存 ===')
    console.log('选择的仓库ID:', warehouseId)
    console.log('库存数据条数:', inventoryData.length)
    
    // 根据指定仓库的库存数据生成商品列表（按库位分组）
    const warehouseProducts = []
    
    // 筛选指定仓库的库存记录
    const warehouseInventory = inventoryData.filter(inv => 
      inv.warehouse_id == warehouseId && (inv.available_stock || 0) > 0
    )
    
    console.log(`仓库 ${warehouseId} 的库存记录:`, warehouseInventory.length)
    
    warehouseInventory.forEach(inventoryItem => {
      // 查找对应的商品信息
      const productInfo = productsData.find(product => 
        product.code === inventoryItem.product_code || 
        product.id === inventoryItem.product_id
      )
      
      if (productInfo) {
        warehouseProducts.push({
          id: `${inventoryItem.id}_${inventoryItem.location_id}`, // 唯一标识：库存ID+库位ID
          product_id: productInfo.id,
          code: productInfo.code,
          isku: productInfo.isku || inventoryItem.product_code,
          name: productInfo.name || inventoryItem.product_name,
          unit: productInfo.unit || inventoryItem.unit || '个',
          price: parseFloat(productInfo.price || 0),
          available_stock: inventoryItem.available_stock || 0,
          image: productInfo.image,
          attributes: productInfo.attributes || [],
          warehouse_id: inventoryItem.warehouse_id,
          warehouse_name: inventoryItem.warehouse_name,
          zone_id: inventoryItem.zone_id,
          zone_name: inventoryItem.zone_name,
          location_id: inventoryItem.location_id,
          location_name: inventoryItem.location_name,
          inventory_id: inventoryItem.id // 保存库存记录ID，用于后续库存扣减
        })
      }
    })
    
    // 按库位排序
    warehouseProducts.sort((a, b) => {
      if (a.warehouse_name !== b.warehouse_name) {
        return a.warehouse_name.localeCompare(b.warehouse_name)
      }
      if (a.zone_name !== b.zone_name) {
        return a.zone_name.localeCompare(b.zone_name)
      }
      return a.location_name.localeCompare(b.location_name)
    })
    
    availableProducts.value = warehouseProducts
    filteredProducts.value = warehouseProducts // 初始化过滤结果
    
    console.log(`仓库 ${warehouseId} 可选商品（按库位）:`, warehouseProducts.length)
    console.log('商品详情:', warehouseProducts.slice(0, 3)) // 显示前3个作为示例
    
    if (warehouseProducts.length === 0) {
      ElMessage.warning('该仓库暂无可用库存商品')
    } else {
      ElMessage.success(`已加载 ${warehouseProducts.length} 个库位的商品库存`)
    }
    
  } catch (error) {
    console.error('加载仓库商品失败:', error)
    ElMessage.error('加载商品列表失败')
  }
}

// 加载出库单列表
const loadOrderList = async () => {
  loading.value = true
  try {
    // 从localStorage获取出库单数据
    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    
    // 补充仓库名称
    let processedOrders = orders.map(order => {
      const warehouse = warehouses.value.find(w => w.id === order.warehouse_id)
      return {
        ...order,
        warehouse_name: warehouse ? warehouse.name : '未知仓库',
        total_quantity: order.products ? order.products.reduce((sum, p) => sum + (p.quantity || 0), 0) : 0,
        total_amount: order.products ? order.products.reduce((sum, p) => sum + (p.amount || 0), 0) : 0
      }
    })

    // 应用筛选条件
    if (searchForm.order_no) {
      processedOrders = processedOrders.filter(order => 
        order.order_no.toLowerCase().includes(searchForm.order_no.toLowerCase())
      )
    }
    if (searchForm.customer_name) {
      processedOrders = processedOrders.filter(order => 
        order.customer_name.toLowerCase().includes(searchForm.customer_name.toLowerCase())
      )
    }
    if (searchForm.status) {
      processedOrders = processedOrders.filter(order => order.status === searchForm.status)
    }
    if (searchForm.outbound_type) {
      processedOrders = processedOrders.filter(order => order.outbound_type === searchForm.outbound_type)
    }

    orderList.value = processedOrders
    pagination.total = processedOrders.length

  } catch (error) {
    console.error('加载出库单列表失败:', error)
    ElMessage.error('加载出库单列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索出库单
const searchOrders = () => {
  loadOrderList()
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    order_no: '',
    customer_name: '',
    status: '',
    outbound_type: '',
    date_range: []
  })
  loadOrderList()
}

// 选择行变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 新建出库单
const createOrder = () => {
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

// 编辑出库单
const editOrder = (order) => {
  editingId.value = order.id
  Object.assign(orderForm, {
    customer_name: order.customer_name,
    warehouse_id: order.warehouse_id,
    outbound_type: order.outbound_type,
    priority: order.priority,
    expected_date: order.expected_date,
    shipping_fee: order.shipping_fee || 0,
    delivery_address: order.delivery_address,
    remark: order.remark,
    products: order.products || []
  })
  dialogVisible.value = true
}

// 查看出库单
const viewOrder = (order) => {
  const productList = order.products ? order.products.map(p => 
    `${p.product_name} (${p.product_code}) - 数量: ${p.quantity}${p.unit}`
  ).join('\n') : '无商品'

  ElMessageBox.alert(
    `出库单号：${order.order_no}
客户名称：${order.customer_name}
出库仓库：${order.warehouse_name}
出库类型：${getTypeText(order.outbound_type)}
总数量：${order.total_quantity}
总金额：¥${(order.total_amount || 0).toFixed(2)}
运费：¥${(order.shipping_fee || 0).toFixed(2)}
状态：${getStatusText(order.status)}
创建时间：${order.created_at}

商品明细：
${productList}`,
    '出库单详情',
    {
      confirmButtonText: '确定',
      type: 'info'
    }
  )
}

// 确认出库单
const confirmOrder = async (order) => {
  try {
    await ElMessageBox.confirm(
      `确定要确认出库单 "${order.order_no}" 吗？确认后将进入预发货状态，并自动扣减库存。`,
      '确认出库单',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    console.log('=== 开始确认出库单并扣减库存 ===')
    console.log('出库单信息:', order)

    // 获取库存数据
    const inventoryData = JSON.parse(localStorage.getItem('inventory_stock') || '[]')
    console.log('当前库存数据条数:', inventoryData.length)

    // 扣减库存
    let hasError = false
    const stockReductions = [] // 记录库存扣减操作

    if (order.products && order.products.length > 0) {
      order.products.forEach(product => {
        console.log(`处理商品: ${product.product_name} (${product.product_code})`)
        console.log(`需要出库数量: ${product.quantity}`)
        console.log(`库存记录ID: ${product.inventory_id}`)
        console.log(`库位信息: ${product.warehouse_name}-${product.zone_name}-${product.location_name}`)

        // 根据库存记录ID找到对应的库存数据
        let inventoryIndex = -1
        if (product.inventory_id) {
          inventoryIndex = inventoryData.findIndex(inv => inv.id === product.inventory_id)
        } else {
          // 如果没有inventory_id，则根据商品和库位信息查找
          inventoryIndex = inventoryData.findIndex(inv => 
            (inv.product_code === product.product_code || inv.product_id === product.product_id) &&
            inv.warehouse_id === product.warehouse_id &&
            inv.location_id === product.location_id
          )
        }

        if (inventoryIndex !== -1) {
          const inventory = inventoryData[inventoryIndex]
          console.log(`找到库存记录:`, inventory)
          
          // 检查可用库存是否足够
          if (inventory.available_stock >= product.quantity) {
            // 扣减库存
            const originalStock = inventory.available_stock
            const originalCurrentStock = inventory.current_stock
            
            inventoryData[inventoryIndex].available_stock -= product.quantity
            inventoryData[inventoryIndex].current_stock -= product.quantity
            
            // 记录扣减操作
            stockReductions.push({
              product: product.product_name,
              location: `${product.warehouse_name}-${product.zone_name}-${product.location_name}`,
              quantity: product.quantity,
              beforeStock: originalStock,
              afterStock: inventoryData[inventoryIndex].available_stock
            })

            console.log(`库存扣减成功: ${product.product_name}`)
            console.log(`可用库存: ${originalStock} -> ${inventoryData[inventoryIndex].available_stock}`)
            console.log(`当前库存: ${originalCurrentStock} -> ${inventoryData[inventoryIndex].current_stock}`)
          } else {
            console.error(`库存不足: ${product.product_name}, 需要: ${product.quantity}, 可用: ${inventory.available_stock}`)
            ElMessage.error(`商品 ${product.product_name} 在库位 ${product.location_name} 库存不足`)
            hasError = true
            return
          }
        } else {
          console.error(`未找到库存记录: ${product.product_name}`)
          ElMessage.error(`未找到商品 ${product.product_name} 的库存记录`)
          hasError = true
          return
        }
      })
    }

    // 如果有错误，停止操作
    if (hasError) {
      return
    }

    // 保存更新后的库存数据
    localStorage.setItem('inventory_stock', JSON.stringify(inventoryData))
    console.log('库存数据已更新并保存')

    // 更新出库单状态
    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    const index = orders.findIndex(o => o.id === order.id)
    if (index !== -1) {
      orders[index].status = 'pre_delivery'
      orders[index].confirmed_at = new Date().toLocaleString()
      orders[index].stock_reduced = true // 标记库存已扣减
      orders[index].stock_reductions = stockReductions // 记录扣减明细
      localStorage.setItem('outbound_orders', JSON.stringify(orders))
      console.log('出库单状态已更新:', orders[index])
    }

    // 显示扣减明细
    const reductionDetails = stockReductions.map(reduction => 
      `${reduction.product} (${reduction.location}): ${reduction.beforeStock} -> ${reduction.afterStock} (-${reduction.quantity})`
    ).join('\n')

    ElMessage.success({
      message: `出库单已确认，库存已自动扣减！\n\n扣减明细：\n${reductionDetails}`,
      duration: 5000,
      showClose: true
    })

    loadOrderList()
    emit('refresh')
  } catch {
    // 用户取消操作
  }
}

// 删除出库单
const deleteOrder = async (order) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除出库单 "${order.order_no}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 删除出库单
    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
    const filteredOrders = orders.filter(o => o.id !== order.id)
    localStorage.setItem('outbound_orders', JSON.stringify(filteredOrders))

    ElMessage.success('出库单已删除')
    loadOrderList()
    emit('refresh')
  } catch {
    // 用户取消操作
  }
}

// 添加商品
const addProduct = () => {
  if (!orderForm.warehouse_id) {
    ElMessage.warning('请先选择出库仓库')
    return
  }
  
  // 根据选择的仓库筛选商品
  loadProductsByWarehouse(orderForm.warehouse_id)
  productSelectVisible.value = true
}

// 商品选择变化
const handleProductSelection = (selection) => {
  selectedProducts.value = selection
}

// 确认商品选择
const confirmProductSelection = () => {
  if (selectedProducts.value.length === 0) {
    ElMessage.warning('请选择要添加的商品')
    return
  }
  
  let addedCount = 0
  
  selectedProducts.value.forEach(product => {
    // 检查是否已经添加过相同库位的商品
    const exists = orderForm.products.find(p => 
      p.product_id === product.product_id && 
      p.warehouse_id === product.warehouse_id &&
      p.location_id === product.location_id
    )
    
    if (!exists) {
      orderForm.products.push({
        product_id: product.product_id,
        product_code: product.code,
        isku: product.isku,
        product_name: product.name,
        unit: product.unit,
        available_stock: product.available_stock,
        quantity: 1,
        unit_price: product.price,
        amount: product.price,
        image: product.image,
        attributes: product.attributes || [],
        warehouse_id: product.warehouse_id,
        warehouse_name: product.warehouse_name,
        zone_id: product.zone_id,
        zone_name: product.zone_name,
        location_id: product.location_id,
        location_name: product.location_name,
        inventory_id: product.inventory_id // 保存库存记录ID
      })
      addedCount++
    }
  })
  
  // 重置搜索表单和选择
  Object.assign(productSearchForm, {
    name: '',
    code: '',
    location: ''
  })
  productSelectVisible.value = false
  selectedProducts.value = []
  
  ElMessage.success(`已添加 ${addedCount} 个商品库位`)
}

// 移除商品
const removeProduct = (index) => {
  orderForm.products.splice(index, 1)
}

// 计算金额
const calculateAmount = (product) => {
  product.amount = (product.quantity || 0) * (product.unit_price || 0)
}

// 保存出库单
const saveOrder = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    if (orderForm.products.length === 0) {
      ElMessage.warning('请添加商品明细')
      return
    }

    // 检查库存
    const invalidProducts = orderForm.products.filter(p => p.quantity > p.available_stock)
    if (invalidProducts.length > 0) {
      ElMessage.warning('部分商品出库数量超过可用库存')
      return
    }

    saving.value = true

    // 计算总金额
    const totalAmount = orderForm.products.reduce((sum, p) => sum + (p.amount || 0), 0)

    const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')

    if (editingId.value) {
      // 编辑模式
      const index = orders.findIndex(o => o.id === editingId.value)
      if (index !== -1) {
        orders[index] = {
          ...orders[index],
          ...orderForm,
          total_amount: totalAmount,
          updated_at: new Date().toLocaleString()
        }
      }
      ElMessage.success('出库单更新成功')
    } else {
      // 新建模式
      const newOrder = {
        id: Date.now(),
        order_no: `OUT${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(orders.length + 1).padStart(3, '0')}`,
        ...orderForm,
        total_amount: totalAmount,
        status: 'draft',
        created_by: '系统管理员',
        created_at: new Date().toLocaleString(),
        updated_at: new Date().toLocaleString()
      }
      orders.unshift(newOrder) // 插入到数组开头，显示在表格第一行
      ElMessage.success(`出库单 ${newOrder.order_no} 创建成功`)
    }

    localStorage.setItem('outbound_orders', JSON.stringify(orders))
    dialogVisible.value = false
    loadOrderList()
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
  Object.assign(orderForm, {
    customer_name: '',
    warehouse_id: null,
    outbound_type: '',
    priority: 'medium',
    expected_date: '',
    shipping_fee: 0,
    delivery_address: '',
    remark: '',
    products: []
  })
}

// 批量导出
const batchExport = () => {
  ElMessage.info('批量导出功能开发中...')
}

// 获取状态颜色
const getStatusColor = (status) => {
  const colorMap = {
    'draft': 'info',
    'pre_delivery': 'warning',
    'picking': 'primary',
    'packing': 'warning',
    'shipping': 'success',
    'completed': 'success',
    'cancelled': 'danger'
  }
  return colorMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'draft': '草稿',
    'pre_delivery': '预发货',
    'picking': '待拣货',
    'packing': '待打包',
    'shipping': '待发货',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return textMap[status] || '未知'
}

// 获取类型颜色
const getTypeColor = (type) => {
  const colorMap = {
    'sale': 'success',
    'transfer': 'primary',
    'return': 'warning',
    'other': 'info'
  }
  return colorMap[type] || 'info'
}

// 获取类型文本
const getTypeText = (type) => {
  const textMap = {
    'sale': '销售出库',
    'transfer': '调拨出库',
    'return': '退货出库',
    'other': '其他出库'
  }
  return textMap[type] || '未知'
}

// 获取优先级颜色
const getPriorityColor = (priority) => {
  const colorMap = {
    'high': 'danger',
    'medium': 'warning',
    'low': 'success'
  }
  return colorMap[priority] || 'info'
}

// 获取优先级文本
const getPriorityText = (priority) => {
  const textMap = {
    'high': '高',
    'medium': '中',
    'low': '低'
  }
  return textMap[priority] || '未知'
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  loadOrderList()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadOrderList()
}

// 暴露方法给父组件调用
defineExpose({
  loadOrderList,
  loadBasicData
})

onMounted(async () => {
  try {
    await loadBasicData()
    await loadOrderList()
  } catch (error) {
    console.error('初始化数据加载失败:', error)
    ElMessage.error('页面数据加载失败')
  }
})
</script>

<style lang="scss" scoped>
.outbound-orders {
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
  
  .product-details {
    .detail-header {
      margin-bottom: 15px;
    }
    
    .product-table-section {
      margin-bottom: 20px;
      
      .section-title {
        margin: 0 0 10px 0;
        padding: 8px 12px;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        color: #606266;
        font-size: 14px;
        font-weight: 600;
        border-radius: 4px;
        border-left: 4px solid #409EFF;
      }
      
      .product-table-basic {
        margin-bottom: 0;
      }
      
      .product-table-location {
        margin-bottom: 0;
      }
    }
    
    .product-summary {
      margin-top: 15px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 6px;
      border: 1px solid #e9ecef;
      
      .summary-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .summary-label {
          font-size: 13px;
          color: #606266;
          font-weight: 500;
        }
        
        .summary-value {
          font-size: 14px;
          color: #303133;
          font-weight: 600;
          
          &.total-amount {
            color: #409EFF;
            font-size: 16px;
            font-weight: 700;
          }
        }
      }
    }
  }
}
</style> 