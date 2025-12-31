import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';

import '../../../../core/theme/app_theme.dart';

class BusinessesScreen extends StatefulWidget {
  const BusinessesScreen({super.key});

  @override
  State<BusinessesScreen> createState() => _BusinessesScreenState();
}

class _BusinessesScreenState extends State<BusinessesScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Row(
                    children: [
                      const Text(
                        'أنشطتي التجارية',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        onPressed: () {},
                        icon: const Icon(Iconsax.filter),
                      ),
                      IconButton(
                        onPressed: () {},
                        icon: const Icon(Iconsax.sort),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Search
                  TextField(
                    onChanged: (value) {
                      setState(() => _searchQuery = value);
                    },
                    decoration: InputDecoration(
                      hintText: 'ابحث في أنشطتي...',
                      prefixIcon: const Icon(Iconsax.search_normal_1),
                      suffixIcon: _searchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Iconsax.close_circle),
                              onPressed: () {
                                setState(() => _searchQuery = '');
                              },
                            )
                          : null,
                    ),
                  ),
                ],
              ),
            ),

            // Tabs
            TabBar(
              controller: _tabController,
              labelColor: AppTheme.primaryColor,
              unselectedLabelColor: AppTheme.textSecondary,
              indicatorColor: AppTheme.primaryColor,
              tabs: const [
                Tab(text: 'الكل'),
                Tab(text: 'معلقة'),
                Tab(text: 'مقبولة'),
              ],
            ),

            // Tab Views
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildBusinessList('all'),
                  _buildBusinessList('pending'),
                  _buildBusinessList('approved'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBusinessList(String filter) {
    // Mock data
    final businesses = [
      {
        'id': '1',
        'name': 'مطعم الشام',
        'category': 'مطاعم ومقاهي',
        'location': 'دمشق، المزة',
        'status': 'approved',
        'views': 245,
        'rating': 4.5,
      },
      {
        'id': '2',
        'name': 'صيدلية الحياة',
        'category': 'صحة وطب',
        'location': 'دمشق، أبو رمانة',
        'status': 'pending',
        'views': 120,
        'rating': 4.8,
      },
      {
        'id': '3',
        'name': 'كافيه لاتيه',
        'category': 'مطاعم ومقاهي',
        'location': 'حلب، العزيزية',
        'status': 'approved',
        'views': 380,
        'rating': 4.3,
      },
      {
        'id': '4',
        'name': 'محل إلكترونيات النور',
        'category': 'إلكترونيات',
        'location': 'حمص، الخالدية',
        'status': 'pending',
        'views': 95,
        'rating': 4.0,
      },
      {
        'id': '5',
        'name': 'سوبر ماركت السلام',
        'category': 'تسوق',
        'location': 'اللاذقية، الزراعة',
        'status': 'approved',
        'views': 510,
        'rating': 4.6,
      },
    ].where((b) {
      if (filter == 'pending') return b['status'] == 'pending';
      if (filter == 'approved') return b['status'] == 'approved';
      return true;
    }).where((b) {
      if (_searchQuery.isEmpty) return true;
      return (b['name'] as String)
              .toLowerCase()
              .contains(_searchQuery.toLowerCase()) ||
          (b['category'] as String)
              .toLowerCase()
              .contains(_searchQuery.toLowerCase());
    }).toList();

    if (businesses.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Iconsax.building,
              size: 80,
              color: AppTheme.textSecondary.withOpacity(0.3),
            ),
            const SizedBox(height: 16),
            Text(
              _searchQuery.isNotEmpty
                  ? 'لا توجد نتائج بحث'
                  : 'لا توجد أنشطة تجارية',
              style: TextStyle(
                fontSize: 16,
                color: AppTheme.textSecondary.withOpacity(0.7),
              ),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: businesses.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final business = businesses[index];
        return _BusinessCard(
          id: business['id'] as String,
          name: business['name'] as String,
          category: business['category'] as String,
          location: business['location'] as String,
          status: business['status'] as String,
          views: business['views'] as int,
          rating: business['rating'] as double,
        );
      },
    );
  }
}

class _BusinessCard extends StatelessWidget {
  final String id;
  final String name;
  final String category;
  final String location;
  final String status;
  final int views;
  final double rating;

  const _BusinessCard({
    required this.id,
    required this.name,
    required this.category,
    required this.location,
    required this.status,
    required this.views,
    required this.rating,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: () => context.push('/businesses/$id'),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Iconsax.building,
                      color: AppTheme.primaryColor,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          category,
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: status == 'approved'
                          ? AppTheme.successColor.withOpacity(0.1)
                          : AppTheme.warningColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      status == 'approved' ? 'مقبول' : 'معلق',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: status == 'approved'
                            ? AppTheme.successColor
                            : AppTheme.warningColor,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(
                    Iconsax.location,
                    size: 16,
                    color: AppTheme.textSecondary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    location,
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  // Rating
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.warningColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Iconsax.star_1,
                          size: 14,
                          color: AppTheme.warningColor,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          rating.toStringAsFixed(1),
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.warningColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Views
                  Row(
                    children: [
                      const Icon(
                        Iconsax.eye,
                        size: 16,
                        color: AppTheme.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '$views مشاهدة',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  // Menu
                  IconButton(
                    onPressed: () {
                      _showBusinessMenu(context);
                    },
                    icon: const Icon(Iconsax.more),
                    iconSize: 20,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showBusinessMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Iconsax.edit),
              title: const Text('تعديل'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Navigate to edit
              },
            ),
            ListTile(
              leading: const Icon(Iconsax.share),
              title: const Text('مشاركة'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Share
              },
            ),
            ListTile(
              leading: const Icon(Iconsax.chart),
              title: const Text('الإحصائيات'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Show stats
              },
            ),
            ListTile(
              leading: const Icon(Iconsax.trash, color: AppTheme.errorColor),
              title: const Text(
                'حذف',
                style: TextStyle(color: AppTheme.errorColor),
              ),
              onTap: () {
                Navigator.pop(context);
                // TODO: Delete
              },
            ),
          ],
        ),
      ),
    );
  }
}
