"""
小神龙WMS系统 - 主URL配置
包含API路由、认证端点、静态文件服务
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    # 管理后台
    path('admin/', admin.site.urls),
    
    # JWT认证端点
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # API接口
    path('api/users/', include('apps.users.urls')),
    path('api/warehouse/', include('apps.warehouse.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/inventory/', include('apps.inventory.urls')),
    path('api/inbound/', include('apps.inbound.urls')),
    path('api/outbound/', include('apps.outbound.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/system/', include('apps.system.urls')),
]

# 开发环境下的静态文件服务
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)