"""
仓库管理URL配置
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'warehouses', views.WarehouseViewSet)
router.register(r'zones', views.ZoneViewSet)
router.register(r'locations', views.LocationViewSet)
router.register(r'equipment', views.WarehouseEquipmentViewSet)
router.register(r'operation-logs', views.WarehouseOperationLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]