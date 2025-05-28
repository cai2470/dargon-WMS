"""
用户管理后台配置
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Role, Permission, UserRole, RolePermission, LoginLog


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """用户后台管理"""
    
    list_display = ('username', 'email', 'first_name', 'last_name', 'phone', 'department', 'status', 'is_active')
    list_filter = ('status', 'is_active', 'is_staff', 'department', 'created_at')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone', 'employee_id')
    ordering = ('-created_at',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('扩展信息', {
            'fields': ('phone', 'avatar', 'gender', 'birth_date', 'employee_id', 'department', 'position', 'status')
        }),
        ('时间信息', {
            'fields': ('last_login_ip', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'last_login_ip')


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    """角色后台管理"""
    
    list_display = ('name', 'code', 'description', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'code', 'description')
    ordering = ('-created_at',)


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    """权限后台管理"""
    
    list_display = ('name', 'code', 'module', 'is_active', 'created_at')
    list_filter = ('module', 'is_active', 'created_at')
    search_fields = ('name', 'code', 'description')
    ordering = ('module', 'code')


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    """用户角色后台管理"""
    
    list_display = ('user', 'role', 'assigned_by', 'assigned_at')
    list_filter = ('role', 'assigned_at')
    search_fields = ('user__username', 'role__name')
    ordering = ('-assigned_at',)


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    """角色权限后台管理"""
    
    list_display = ('role', 'permission', 'granted_by', 'granted_at')
    list_filter = ('role', 'permission__module', 'granted_at')
    search_fields = ('role__name', 'permission__name')
    ordering = ('-granted_at',)


@admin.register(LoginLog)
class LoginLogAdmin(admin.ModelAdmin):
    """登录日志后台管理"""
    
    list_display = ('user', 'login_time', 'logout_time', 'ip_address', 'login_result')
    list_filter = ('login_result', 'login_time')
    search_fields = ('user__username', 'ip_address')
    ordering = ('-login_time',)
    readonly_fields = ('user', 'login_time', 'logout_time', 'ip_address', 'user_agent', 'login_result', 'failure_reason')