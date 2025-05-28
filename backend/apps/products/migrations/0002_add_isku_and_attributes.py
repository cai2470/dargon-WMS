# Generated migration for adding iSKU and product attributes

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='isku',
            field=models.CharField(blank=True, help_text='内部SKU编码', max_length=100, null=True, verbose_name='iSKU'),
        ),
        migrations.AddField(
            model_name='product',
            name='product_attributes',
            field=models.JSONField(blank=True, default=dict, help_text='存储商品的各种属性，如颜色、尺寸等', verbose_name='商品属性'),
        ),
        migrations.AddField(
            model_name='product',
            name='images',
            field=models.JSONField(blank=True, default=list, help_text='存储多张商品图片的URL列表', verbose_name='商品图片列表'),
        ),
        migrations.AlterField(
            model_name='product',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='products/', verbose_name='主图片'),
        ),
        migrations.CreateModel(
            name='ProductAttribute',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('attribute_name', models.CharField(max_length=50, verbose_name='属性名称')),
                ('attribute_value', models.CharField(max_length=100, verbose_name='属性值')),
                ('sort_order', models.IntegerField(default=0, verbose_name='排序')),
                ('is_visible', models.BooleanField(default=True, verbose_name='是否显示')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attributes', to='products.product', verbose_name='商品')),
            ],
            options={
                'verbose_name': '商品属性',
                'verbose_name_plural': '商品属性',
                'db_table': 'products_product_attribute',
                'ordering': ['sort_order', 'attribute_name'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='productattribute',
            unique_together={('product', 'attribute_name')},
        ),
    ] 