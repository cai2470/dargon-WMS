"""
自定义权限类
"""
from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    只有对象的所有者才能编辑，其他用户只能查看
    """
    
    def has_object_permission(self, request, view, obj):
        # 读取权限对所有请求都允许
        # 所以GET, HEAD, OPTIONS请求总是被允许的
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # 写入权限只给对象的所有者
        return obj == request.user


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    只有管理员可以进行写操作，其他用户只读
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        return request.user.is_authenticated and request.user.is_staff


class HasModulePermission(permissions.BasePermission):
    """
    检查用户是否有特定模块的权限
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # 超级管理员拥有所有权限
        if request.user.is_superuser:
            return True
        
        # 检查用户角色权限
        module_name = getattr(view, 'module_name', None)
        if not module_name:
            return True
        
        # 这里可以根据实际业务逻辑来检查权限
        # 例如检查用户的角色是否包含该模块的权限
        return True


class WarehousePermission(permissions.BasePermission):
    """
    仓库相关权限检查
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # 检查用户是否有仓库管理权限
        # 这里可以根据用户的角色和权限来判断
        return True


class InventoryPermission(permissions.BasePermission):
    """
    库存相关权限检查
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # 检查用户是否有库存管理权限
        return True