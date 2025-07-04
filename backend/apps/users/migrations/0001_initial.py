# Generated by Django 4.2 on 2025-05-23 06:25

from django.conf import settings
import django.contrib.auth.models
import django.contrib.auth.validators
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(error_messages={'unique': 'A user with that username already exists.'}, help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.', max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name='username')),
                ('first_name', models.CharField(blank=True, max_length=150, verbose_name='first name')),
                ('last_name', models.CharField(blank=True, max_length=150, verbose_name='last name')),
                ('email', models.EmailField(blank=True, max_length=254, verbose_name='email address')),
                ('is_staff', models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Designates whether this user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now, verbose_name='date joined')),
                ('phone', models.CharField(blank=True, max_length=11, null=True, unique=True, verbose_name='手机号')),
                ('avatar', models.ImageField(blank=True, null=True, upload_to='avatars/', verbose_name='头像')),
                ('gender', models.CharField(blank=True, choices=[('M', '男'), ('F', '女'), ('O', '其他')], max_length=1, null=True, verbose_name='性别')),
                ('birth_date', models.DateField(blank=True, null=True, verbose_name='出生日期')),
                ('employee_id', models.CharField(blank=True, max_length=20, null=True, unique=True, verbose_name='员工编号')),
                ('department', models.CharField(blank=True, max_length=50, null=True, verbose_name='部门')),
                ('position', models.CharField(blank=True, max_length=50, null=True, verbose_name='职位')),
                ('status', models.CharField(choices=[('active', '正常'), ('inactive', '禁用'), ('pending', '待审核')], default='active', max_length=10, verbose_name='状态')),
                ('last_login_ip', models.GenericIPAddressField(blank=True, null=True, verbose_name='最后登录IP')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新时间')),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'verbose_name': '用户',
                'verbose_name_plural': '用户',
                'db_table': 'users_user',
                'ordering': ['-created_at'],
            },
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name='Permission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, verbose_name='权限名称')),
                ('code', models.CharField(max_length=100, unique=True, verbose_name='权限代码')),
                ('module', models.CharField(max_length=50, verbose_name='所属模块')),
                ('description', models.TextField(blank=True, null=True, verbose_name='权限描述')),
                ('is_active', models.BooleanField(default=True, verbose_name='是否启用')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
            ],
            options={
                'verbose_name': '权限',
                'verbose_name_plural': '权限',
                'db_table': 'users_permission',
                'ordering': ['module', 'code'],
            },
        ),
        migrations.CreateModel(
            name='Role',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, unique=True, verbose_name='角色名称')),
                ('code', models.CharField(max_length=50, unique=True, verbose_name='角色代码')),
                ('description', models.TextField(blank=True, null=True, verbose_name='角色描述')),
                ('is_active', models.BooleanField(default=True, verbose_name='是否启用')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新时间')),
            ],
            options={
                'verbose_name': '角色',
                'verbose_name_plural': '角色',
                'db_table': 'users_role',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='LoginLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('login_time', models.DateTimeField(auto_now_add=True, verbose_name='登录时间')),
                ('logout_time', models.DateTimeField(blank=True, null=True, verbose_name='登出时间')),
                ('ip_address', models.GenericIPAddressField(verbose_name='IP地址')),
                ('user_agent', models.TextField(blank=True, null=True, verbose_name='用户代理')),
                ('login_result', models.BooleanField(default=True, verbose_name='登录结果')),
                ('failure_reason', models.CharField(blank=True, max_length=200, null=True, verbose_name='失败原因')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL, verbose_name='用户')),
            ],
            options={
                'verbose_name': '登录日志',
                'verbose_name_plural': '登录日志',
                'db_table': 'users_login_log',
                'ordering': ['-login_time'],
            },
        ),
        migrations.CreateModel(
            name='UserRole',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('assigned_at', models.DateTimeField(auto_now_add=True, verbose_name='分配时间')),
                ('assigned_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_roles', to=settings.AUTH_USER_MODEL, verbose_name='分配人')),
                ('role', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='users.role', verbose_name='角色')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL, verbose_name='用户')),
            ],
            options={
                'verbose_name': '用户角色',
                'verbose_name_plural': '用户角色',
                'db_table': 'users_user_role',
                'unique_together': {('user', 'role')},
            },
        ),
        migrations.CreateModel(
            name='RolePermission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('granted_at', models.DateTimeField(auto_now_add=True, verbose_name='授权时间')),
                ('granted_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL, verbose_name='授权人')),
                ('permission', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='users.permission', verbose_name='权限')),
                ('role', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='users.role', verbose_name='角色')),
            ],
            options={
                'verbose_name': '角色权限',
                'verbose_name_plural': '角色权限',
                'db_table': 'users_role_permission',
                'unique_together': {('role', 'permission')},
            },
        ),
    ]
