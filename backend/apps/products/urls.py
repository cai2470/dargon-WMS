"""
商品管理URL配置
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet)
router.register(r'suppliers', views.SupplierViewSet)
router.register(r'brands', views.BrandViewSet)
router.register(r'products', views.ProductViewSet)
router.register(r'barcodes', views.BarcodeViewSet)
router.register(r'product-suppliers', views.ProductSupplierViewSet)

urlpatterns = [
    path('', include(router.urls)),
]