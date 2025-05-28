"""
用户管理URL配置
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'roles', views.RoleViewSet)
router.register(r'permissions', views.PermissionViewSet)
router.register(r'user-roles', views.UserRoleViewSet)
router.register(r'login-logs', views.LoginLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]