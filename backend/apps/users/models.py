"""
用户管理模型
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    """自定义用户模型"""
    
    GENDER_CHOICES = [
        ('M', '男'),
        ('F', '女'),
        ('O', '其他'),
    ]
    
    STATUS_CHOICES = [
        ('active', '正常'),
        ('inactive', '禁用'),
        ('pending', '待审核'),
    ]
    
    # 基础信息
    phone = models.CharField('手机号', max_length=11, unique=True, null=True, blank=True)
    avatar = models.ImageField('头像', upload_to='avatars/', null=True, blank=True)
    gender = models.CharField('性别', max_length=1, choices=GENDER_CHOICES, null=True, blank=True)
    birth_date = models.DateField('出生日期', null=True, blank=True)
    
    # 员工信息
    employee_id = models.CharField('员工编号', max_length=20, unique=True, null=True, blank=True)
    department = models.CharField('部门', max_length=50, null=True, blank=True)
    position = models.CharField('职位', max_length=50, null=True, blank=True)
    
    # 状态信息
    status = models.CharField('状态', max_length=10, choices=STATUS_CHOICES, default='active')
    last_login_ip = models.GenericIPAddressField('最后登录IP', null=True, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'users_user'
        verbose_name = '用户'
        verbose_name_plural = '用户'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.username


class Role(models.Model):
    """角色模型"""
    
    name = models.CharField('角色名称', max_length=50, unique=True)
    code = models.CharField('角色代码', max_length=50, unique=True)
    description = models.TextField('角色描述', null=True, blank=True)
    is_active = models.BooleanField('是否启用', default=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'users_role'
        verbose_name = '角色'
        verbose_name_plural = '角色'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class Permission(models.Model):
    """权限模型"""
    
    name = models.CharField('权限名称', max_length=50)
    code = models.CharField('权限代码', max_length=100, unique=True)
    module = models.CharField('所属模块', max_length=50)
    description = models.TextField('权限描述', null=True, blank=True)
    is_active = models.BooleanField('是否启用', default=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    
    class Meta:
        db_table = 'users_permission'
        verbose_name = '权限'
        verbose_name_plural = '权限'
        ordering = ['module', 'code']
    
    def __str__(self):
        return f"{self.module} - {self.name}"


class UserRole(models.Model):
    """用户角色关联模型"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='用户')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, verbose_name='角色')
    assigned_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, 
        related_name='assigned_roles', verbose_name='分配人'
    )
    assigned_at = models.DateTimeField('分配时间', auto_now_add=True)
    
    class Meta:
        db_table = 'users_user_role'
        verbose_name = '用户角色'
        verbose_name_plural = '用户角色'
        unique_together = ['user', 'role']


class RolePermission(models.Model):
    """角色权限关联模型"""
    
    role = models.ForeignKey(Role, on_delete=models.CASCADE, verbose_name='角色')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, verbose_name='权限')
    granted_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        verbose_name='授权人'
    )
    granted_at = models.DateTimeField('授权时间', auto_now_add=True)
    
    class Meta:
        db_table = 'users_role_permission'
        verbose_name = '角色权限'
        verbose_name_plural = '角色权限'
        unique_together = ['role', 'permission']


class LoginLog(models.Model):
    """登录日志模型"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='用户')
    login_time = models.DateTimeField('登录时间', auto_now_add=True)
    logout_time = models.DateTimeField('登出时间', null=True, blank=True)
    ip_address = models.GenericIPAddressField('IP地址')
    user_agent = models.TextField('用户代理', null=True, blank=True)
    login_result = models.BooleanField('登录结果', default=True)
    failure_reason = models.CharField('失败原因', max_length=200, null=True, blank=True)
    
    class Meta:
        db_table = 'users_login_log'
        verbose_name = '登录日志'
        verbose_name_plural = '登录日志'
        ordering = ['-login_time']