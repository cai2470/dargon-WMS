"""
库存管理URL配置
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'stock', views.StockViewSet)
router.register(r'movements', views.StockMovementViewSet)
router.register(r'alerts', views.StockAlertViewSet)
router.register(r'reservations', views.StockReservationViewSet)
router.register(r'counts', views.InventoryCountViewSet)
router.register(r'count-details', views.InventoryCountDetailViewSet)

urlpatterns = [
    path('', include(router.urls)),
]