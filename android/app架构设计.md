# Android PDA应用架构设计

## 整体架构

### MVVM + Repository 架构
```
View (Activity/Fragment)
    ↓
ViewModel (处理UI逻辑)
    ↓
Repository (数据仓库)
    ↓
Data Sources (API + Local Database)
```

## 核心模块设计

### 1. 扫码模块 (Scanner)
```java
// 扫码接口
public interface ScannerInterface {
    void startScan();
    void stopScan();
    void onScanResult(String barcode, String format);
    void onScanError(String error);
}

// 扫码实现类
public class Code128Scanner implements ScannerInterface {
    private CameraX camera;
    private BarcodeDetector detector;
    
    @Override
    public void startScan() {
        // 启动摄像头扫描
        camera.startPreview();
        detector.startDetection();
    }
    
    @Override
    public void onScanResult(String barcode, String format) {
        // 处理扫描结果
        validateBarcode(barcode);
        saveToHistory(barcode);
        notifyListener(barcode);
    }
}
```

### 2. 数据同步模块
```java
// 同步管理器
public class SyncManager {
    private ApiService apiService;
    private LocalDatabase localDb;
    private ConnectivityManager connectivity;
    
    public void syncData() {
        if (isOnline()) {
            syncToServer();
        } else {
            saveToLocalQueue();
        }
    }
    
    private void syncToServer() {
        // 上传本地数据到服务器
        List<PendingOperation> pending = localDb.getPendingOperations();
        for (PendingOperation op : pending) {
            try {
                uploadOperation(op);
                localDb.markAsSynced(op.getId());
            } catch (Exception e) {
                handleSyncError(op, e);
            }
        }
    }
}
```

### 3. 入库模块
```java
// 入库活动
public class InboundActivity extends BaseActivity {
    private InboundViewModel viewModel;
    private ScannerFragment scannerFragment;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupScanner();
        observeViewModel();
    }
    
    private void onBarcodeScanned(String barcode) {
        viewModel.processInbound(barcode);
    }
}

// 入库ViewModel
public class InboundViewModel extends ViewModel {
    private Repository repository;
    private MutableLiveData<InboundResult> result = new MutableLiveData<>();
    
    public void processInbound(String barcode) {
        // 验证条码
        if (!BarcodeValidator.isValid(barcode)) {
            result.setValue(InboundResult.error("无效条码"));
            return;
        }
        
        // 查询商品信息
        repository.getProductByBarcode(barcode)
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe(product -> {
                if (product != null) {
                    result.setValue(InboundResult.success(product));
                } else {
                    result.setValue(InboundResult.error("商品不存在"));
                }
            });
    }
}
```

### 4. 本地数据库设计
```java
// 商品实体
@Entity(tableName = "products")
public class Product {
    @PrimaryKey
    public String code;
    public String name;
    public String category;
    public String barcode;
    public int stock;
    public boolean synced;
    public long lastUpdate;
}

// 操作记录实体
@Entity(tableName = "operations")
public class Operation {
    @PrimaryKey
    public String id;
    public String type; // INBOUND, OUTBOUND
    public String productCode;
    public String locationCode;
    public int quantity;
    public long timestamp;
    public boolean synced;
    public String operator;
}

// 数据访问对象
@Dao
public interface ProductDao {
    @Query("SELECT * FROM products WHERE barcode = :barcode")
    LiveData<Product> getProductByBarcode(String barcode);
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertProduct(Product product);
    
    @Query("SELECT * FROM products WHERE synced = 0")
    List<Product> getUnsyncedProducts();
}
```

## 关键功能实现

### 1. 条码扫描实现
```java
public class BarcodeScanner {
    private static final String[] SUPPORTED_FORMATS = {"CODE_128"};
    
    public void startScanning(SurfaceView surfaceView, ScanCallback callback) {
        Camera camera = Camera.open();
        camera.setPreviewDisplay(surfaceView.getHolder());
        
        // 配置扫描参数
        Camera.Parameters params = camera.getParameters();
        params.setFocusMode(Camera.Parameters.FOCUS_MODE_CONTINUOUS_PICTURE);
        params.setSceneMode(Camera.Parameters.SCENE_MODE_BARCODE);
        camera.setParameters(params);
        
        // 启动预览
        camera.startPreview();
        
        // 设置扫描回调
        camera.setOneShotPreviewCallback(data -> {
            processFrame(data, callback);
        });
    }
    
    private void processFrame(byte[] data, ScanCallback callback) {
        // 使用ZXing处理图像数据
        BinaryBitmap bitmap = createBitmapFromData(data);
        Result result = reader.decode(bitmap);
        
        if (result != null && isValidFormat(result.getBarcodeFormat())) {
            callback.onScanSuccess(result.getText());
        }
    }
}
```

### 2. 网络请求封装
```java
public class ApiClient {
    private static final String BASE_URL = "http://your-server:8000/api/v1/";
    private Retrofit retrofit;
    private String authToken;
    
    public Observable<Product> getProductByBarcode(String barcode) {
        return apiService.getProductByBarcode(barcode)
            .subscribeOn(Schedulers.io())
            .observeOn(AndroidSchedulers.mainThread())
            .doOnError(this::handleApiError);
    }
    
    public Observable<ApiResponse> submitInbound(InboundRequest request) {
        return apiService.submitInbound(authToken, request)
            .subscribeOn(Schedulers.io())
            .observeOn(AndroidSchedulers.mainThread());
    }
    
    private void handleApiError(Throwable error) {
        if (error instanceof HttpException) {
            HttpException httpError = (HttpException) error;
            if (httpError.code() == 401) {
                // Token过期，重新登录
                redirectToLogin();
            }
        }
    }
}
```

### 3. 离线数据管理
```java
public class OfflineManager {
    private LocalDatabase database;
    private SharedPreferences preferences;
    
    public void saveOfflineOperation(Operation operation) {
        operation.synced = false;
        operation.timestamp = System.currentTimeMillis();
        database.operationDao().insert(operation);
    }
    
    public void syncWhenOnline() {
        if (NetworkUtils.isConnected()) {
            List<Operation> pending = database.operationDao().getUnsyncedOperations();
            
            for (Operation op : pending) {
                try {
                    ApiResponse response = apiClient.syncOperation(op).blockingGet();
                    if (response.isSuccess()) {
                        op.synced = true;
                        database.operationDao().update(op);
                    }
                } catch (Exception e) {
                    // 记录同步失败
                    Log.e("Sync", "同步操作失败: " + op.id, e);
                }
            }
        }
    }
}
```

## UI设计要点

### 1. PDA友好界面
- 大按钮设计（最小48dp）
- 高对比度配色
- 简洁清晰的布局
- 支持横屏模式

### 2. 扫码界面
```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical">
    
    <!-- 扫码预览区域 -->
    <SurfaceView
        android:id="@+id/scanner_surface"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1" />
    
    <!-- 扫码框架 -->
    <com.xiaoshenlong.wms.ui.widget.ScannerOverlay
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
    
    <!-- 操作按钮 -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:padding="16dp">
        
        <Button
            android:id="@+id/btn_flash"
            android:layout_width="0dp"
            android:layout_height="60dp"
            android:layout_weight="1"
            android:text="闪光灯"
            android:textSize="16sp" />
        
        <Button
            android:id="@+id/btn_manual"
            android:layout_width="0dp"
            android:layout_height="60dp"
            android:layout_weight="1"
            android:layout_marginStart="8dp"
            android:text="手动输入"
            android:textSize="16sp" />
    </LinearLayout>
    
</LinearLayout>
```

### 3. 操作反馈
```java
public class FeedbackManager {
    private Vibrator vibrator;
    private SoundPool soundPool;
    private int successSoundId;
    private int errorSoundId;
    
    public void playSuccessSound() {
        soundPool.play(successSoundId, 1.0f, 1.0f, 1, 0, 1.0f);
        vibrator.vibrate(100); // 短震动
    }
    
    public void playErrorSound() {
        soundPool.play(errorSoundId, 1.0f, 1.0f, 1, 0, 1.0f);
        vibrator.vibrate(new long[]{0, 200, 100, 200}, -1); // 长震动
    }
}
```

## 性能优化

### 1. 内存管理
- 及时释放摄像头资源
- 图片缓存大小限制
- 避免内存泄漏

### 2. 电池优化
- 后台任务管理
- 合理的同步频率
- 摄像头自动关闭

### 3. 网络优化
- 请求缓存策略
- 图片压缩上传
- 断线重连机制

这个架构设计确保了Android PDA应用的稳定性、性能和用户体验。