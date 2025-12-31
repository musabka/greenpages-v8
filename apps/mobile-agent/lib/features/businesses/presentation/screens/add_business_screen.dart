import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';

import '../../../../core/theme/app_theme.dart';

class AddBusinessScreen extends StatefulWidget {
  const AddBusinessScreen({super.key});

  @override
  State<AddBusinessScreen> createState() => _AddBusinessScreenState();
}

class _AddBusinessScreenState extends State<AddBusinessScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Form controllers
  final _nameArController = TextEditingController();
  final _nameEnController = TextEditingController();
  final _descriptionArController = TextEditingController();
  final _descriptionEnController = TextEditingController();
  final _phoneController = TextEditingController();
  final _mobileController = TextEditingController();
  final _emailController = TextEditingController();
  final _websiteController = TextEditingController();
  final _addressController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _nameArController.dispose();
    _nameEnController.dispose();
    _descriptionArController.dispose();
    _descriptionEnController.dispose();
    _phoneController.dispose();
    _mobileController.dispose();
    _emailController.dispose();
    _websiteController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('إضافة نشاط تجاري'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primaryColor,
          tabs: const [
            Tab(text: 'المعلومات الأساسية'),
            Tab(text: 'الموقع'),
            Tab(text: 'الاتصال'),
            Tab(text: 'ساعات العمل'),
            Tab(text: 'الصور'),
          ],
        ),
      ),
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildBasicInfoTab(),
                  _buildLocationTab(),
                  _buildContactTab(),
                  _buildHoursTab(),
                  _buildMediaTab(),
                ],
              ),
            ),
            _buildBottomBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildBasicInfoTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'معلومات النشاط التجاري',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _nameArController,
            decoration: const InputDecoration(
              labelText: 'الاسم بالعربية *',
              hintText: 'مثال: مطعم الشام',
              prefixIcon: Icon(Iconsax.building),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'الرجاء إدخال اسم النشاط بالعربية';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _nameEnController,
            textDirection: TextDirection.ltr,
            decoration: const InputDecoration(
              labelText: 'الاسم بالإنجليزية',
              hintText: 'Example: Al Sham Restaurant',
              prefixIcon: Icon(Iconsax.building),
            ),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            decoration: const InputDecoration(
              labelText: 'التصنيف *',
              prefixIcon: Icon(Iconsax.category),
            ),
            items: const [
              DropdownMenuItem(value: '1', child: Text('مطاعم ومقاهي')),
              DropdownMenuItem(value: '2', child: Text('صحة وطب')),
              DropdownMenuItem(value: '3', child: Text('إلكترونيات')),
              DropdownMenuItem(value: '4', child: Text('تسوق')),
              DropdownMenuItem(value: '5', child: Text('خدمات')),
            ],
            onChanged: (value) {},
            validator: (value) {
              if (value == null) return 'الرجاء اختيار التصنيف';
              return null;
            },
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _descriptionArController,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: 'الوصف بالعربية *',
              hintText: 'وصف مختصر عن النشاط التجاري...',
              alignLabelWithHint: true,
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'الرجاء إدخال وصف النشاط';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _descriptionEnController,
            maxLines: 4,
            textDirection: TextDirection.ltr,
            decoration: const InputDecoration(
              labelText: 'الوصف بالإنجليزية',
              hintText: 'Brief description...',
              alignLabelWithHint: true,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLocationTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'موقع النشاط التجاري',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            decoration: const InputDecoration(
              labelText: 'المحافظة *',
              prefixIcon: Icon(Iconsax.location),
            ),
            items: const [
              DropdownMenuItem(value: '1', child: Text('دمشق')),
              DropdownMenuItem(value: '2', child: Text('ريف دمشق')),
              DropdownMenuItem(value: '3', child: Text('حلب')),
              DropdownMenuItem(value: '4', child: Text('حمص')),
              DropdownMenuItem(value: '5', child: Text('اللاذقية')),
            ],
            onChanged: (value) {},
            validator: (value) {
              if (value == null) return 'الرجاء اختيار المحافظة';
              return null;
            },
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            decoration: const InputDecoration(
              labelText: 'المدينة *',
              prefixIcon: Icon(Iconsax.location),
            ),
            items: const [
              DropdownMenuItem(value: '1', child: Text('دمشق')),
              DropdownMenuItem(value: '2', child: Text('المزة')),
              DropdownMenuItem(value: '3', child: Text('أبو رمانة')),
            ],
            onChanged: (value) {},
            validator: (value) {
              if (value == null) return 'الرجاء اختيار المدينة';
              return null;
            },
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            decoration: const InputDecoration(
              labelText: 'المنطقة',
              prefixIcon: Icon(Iconsax.location),
            ),
            items: const [
              DropdownMenuItem(value: '1', child: Text('المزة أوتوستراد')),
              DropdownMenuItem(value: '2', child: Text('المزة فيلات')),
              DropdownMenuItem(value: '3', child: Text('المزة 86')),
            ],
            onChanged: (value) {},
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _addressController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'العنوان التفصيلي *',
              hintText: 'شارع، بناء، طابق...',
              prefixIcon: Icon(Iconsax.location),
              alignLabelWithHint: true,
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'الرجاء إدخال العنوان';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          Card(
            child: InkWell(
              onTap: () {
                // TODO: Open map picker
              },
              borderRadius: BorderRadius.circular(12),
              child: const Padding(
                padding: EdgeInsets.all(16),
                child: Row(
                  children: [
                    Icon(
                      Iconsax.map,
                      color: AppTheme.primaryColor,
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'تحديد الموقع على الخريطة',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'اضغط لتحديد موقع النشاط على الخريطة',
                            style: TextStyle(
                              fontSize: 13,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Icon(Iconsax.arrow_left_2),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'معلومات الاتصال',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            textDirection: TextDirection.ltr,
            decoration: const InputDecoration(
              labelText: 'الهاتف الأرضي',
              hintText: '+963 11 1234567',
              prefixIcon: Icon(Iconsax.call),
            ),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _mobileController,
            keyboardType: TextInputType.phone,
            textDirection: TextDirection.ltr,
            decoration: const InputDecoration(
              labelText: 'الموبايل *',
              hintText: '+963 988 123456',
              prefixIcon: Icon(Iconsax.mobile),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'الرجاء إدخال رقم الموبايل';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            textDirection: TextDirection.ltr,
            decoration: const InputDecoration(
              labelText: 'البريد الإلكتروني',
              hintText: 'email@example.com',
              prefixIcon: Icon(Iconsax.sms),
            ),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _websiteController,
            keyboardType: TextInputType.url,
            textDirection: TextDirection.ltr,
            decoration: const InputDecoration(
              labelText: 'الموقع الإلكتروني',
              hintText: 'www.example.com',
              prefixIcon: Icon(Iconsax.global),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'وسائل التواصل الاجتماعي',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          TextFormField(
            textDirection: TextDirection.ltr,
            decoration: const InputDecoration(
              labelText: 'Facebook',
              hintText: 'facebook.com/page',
              prefixIcon: Icon(Iconsax.facebook),
            ),
          ),
          const SizedBox(height: 12),
          TextFormField(
            textDirection: TextDirection.ltr,
            decoration: const InputDecoration(
              labelText: 'Instagram',
              hintText: '@username',
              prefixIcon: Icon(Iconsax.instagram),
            ),
          ),
          const SizedBox(height: 12),
          TextFormField(
            textDirection: TextDirection.ltr,
            decoration: const InputDecoration(
              labelText: 'WhatsApp',
              hintText: '+963 988 123456',
              prefixIcon: Icon(Iconsax.whatsapp),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHoursTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'ساعات العمل',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          ...[
            'السبت',
            'الأحد',
            'الإثنين',
            'الثلاثاء',
            'الأربعاء',
            'الخميس',
            'الجمعة',
          ].map((day) => _WorkingHourItem(day: day)),
        ],
      ),
    );
  }

  Widget _buildMediaTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'صور النشاط التجاري',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'أضف صوراً واضحة للنشاط التجاري لجذب المزيد من العملاء',
            style: TextStyle(
              fontSize: 14,
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: InkWell(
              onTap: () {
                // TODO: Pick images
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                height: 150,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: AppTheme.borderColor,
                    width: 2,
                    style: BorderStyle.solid,
                  ),
                ),
                child: const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Iconsax.gallery_add,
                        size: 48,
                        color: AppTheme.primaryColor,
                      ),
                      SizedBox(height: 12),
                      Text(
                        'اضغط لإضافة صور',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'يمكنك إضافة حتى 10 صور',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'شعار النشاط (اختياري)',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: InkWell(
              onTap: () {
                // TODO: Pick logo
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                height: 120,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: AppTheme.borderColor,
                    width: 2,
                  ),
                ),
                child: const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Iconsax.image,
                        size: 40,
                        color: AppTheme.primaryColor,
                      ),
                      SizedBox(height: 8),
                      Text(
                        'اضغط لإضافة شعار',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Row(
        children: [
          if (_tabController.index > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: () {
                  _tabController.animateTo(_tabController.index - 1);
                },
                child: const Text('السابق'),
              ),
            ),
          if (_tabController.index > 0) const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: _isLoading
                  ? null
                  : () {
                      if (_tabController.index < 4) {
                        _tabController.animateTo(_tabController.index + 1);
                      } else {
                        _handleSubmit();
                      }
                    },
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : Text(_tabController.index < 4 ? 'التالي' : 'حفظ'),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isLoading = true);

    // Simulate API call
    await Future.delayed(const Duration(seconds: 2));

    if (mounted) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('تم إضافة النشاط التجاري بنجاح'),
          backgroundColor: AppTheme.successColor,
        ),
      );
      context.go('/businesses');
    }
  }
}

class _WorkingHourItem extends StatefulWidget {
  final String day;

  const _WorkingHourItem({required this.day});

  @override
  State<_WorkingHourItem> createState() => _WorkingHourItemState();
}

class _WorkingHourItemState extends State<_WorkingHourItem> {
  bool _isOpen = true;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    widget.day,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                ),
                Switch(
                  value: _isOpen,
                  onChanged: (value) {
                    setState(() => _isOpen = value);
                  },
                ),
              ],
            ),
            if (_isOpen) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      decoration: const InputDecoration(
                        labelText: 'من',
                        hintText: '09:00',
                        prefixIcon: Icon(Iconsax.clock),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      decoration: const InputDecoration(
                        labelText: 'إلى',
                        hintText: '18:00',
                        prefixIcon: Icon(Iconsax.clock),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
