import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 بدء زراعة البيانات...');

  // ===========================================
  // المحافظات السورية
  // ===========================================
  const governorates = [
    { slug: 'damascus', nameAr: 'دمشق', nameEn: 'Damascus', latitude: 33.5138, longitude: 36.2765, sortOrder: 1 },
    { slug: 'damascus-countryside', nameAr: 'ريف دمشق', nameEn: 'Damascus Countryside', latitude: 33.5, longitude: 36.3, sortOrder: 2 },
    { slug: 'aleppo', nameAr: 'حلب', nameEn: 'Aleppo', latitude: 36.2021, longitude: 37.1343, sortOrder: 3 },
    { slug: 'homs', nameAr: 'حمص', nameEn: 'Homs', latitude: 34.7324, longitude: 36.7137, sortOrder: 4 },
    { slug: 'hama', nameAr: 'حماة', nameEn: 'Hama', latitude: 35.1318, longitude: 36.7514, sortOrder: 5 },
    { slug: 'latakia', nameAr: 'اللاذقية', nameEn: 'Latakia', latitude: 35.5317, longitude: 35.7962, sortOrder: 6 },
    { slug: 'tartous', nameAr: 'طرطوس', nameEn: 'Tartous', latitude: 34.8959, longitude: 35.8867, sortOrder: 7 },
    { slug: 'idlib', nameAr: 'إدلب', nameEn: 'Idlib', latitude: 35.9306, longitude: 36.6339, sortOrder: 8 },
    { slug: 'deir-ez-zor', nameAr: 'دير الزور', nameEn: 'Deir ez-Zor', latitude: 35.3359, longitude: 40.1408, sortOrder: 9 },
    { slug: 'al-hasakah', nameAr: 'الحسكة', nameEn: 'Al-Hasakah', latitude: 36.5067, longitude: 40.7531, sortOrder: 10 },
    { slug: 'al-raqqa', nameAr: 'الرقة', nameEn: 'Al-Raqqa', latitude: 35.9594, longitude: 39.0078, sortOrder: 11 },
    { slug: 'daraa', nameAr: 'درعا', nameEn: 'Daraa', latitude: 32.6189, longitude: 36.1021, sortOrder: 12 },
    { slug: 'as-suwayda', nameAr: 'السويداء', nameEn: 'As-Suwayda', latitude: 32.7126, longitude: 36.5662, sortOrder: 13 },
    { slug: 'quneitra', nameAr: 'القنيطرة', nameEn: 'Quneitra', latitude: 33.1257, longitude: 35.8246, sortOrder: 14 },
  ];

  for (const gov of governorates) {
    await prisma.governorate.upsert({
      where: { slug: gov.slug },
      update: gov,
      create: gov,
    });
  }
  console.log('✅ تم إنشاء المحافظات:', governorates.length);

  // ===========================================
  // إنشاء المستخدم الإداري
  // ===========================================
  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  const damascusGovForAdmin = await prisma.governorate.findFirst({ where: { slug: 'damascus' } });
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@greenpages.sy' },
    update: {},
    create: {
      email: 'admin@greenpages.sy',
      phone: '+963999999999',
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      firstName: 'مدير',
      lastName: 'النظام',
      displayName: 'مدير النظام',
      emailVerified: true,
      phoneVerified: true,
      verifiedAt: new Date(),
      governorateId: damascusGovForAdmin?.id,
    },
  });
  console.log('✅ تم إنشاء المستخدم الإداري:', admin.email);

  // ===========================================
  // المدن الرئيسية
  // ===========================================
  const damascus = await prisma.governorate.findUnique({ where: { slug: 'damascus' } });
  const aleppo = await prisma.governorate.findUnique({ where: { slug: 'aleppo' } });
  const homs = await prisma.governorate.findUnique({ where: { slug: 'homs' } });
  const latakia = await prisma.governorate.findUnique({ where: { slug: 'latakia' } });

  if (damascus) {
    const damascusCities = [
      { slug: 'damascus-city', nameAr: 'مدينة دمشق', nameEn: 'Damascus City', sortOrder: 1 },
    ];
    for (const city of damascusCities) {
      await prisma.city.upsert({
        where: { slug: city.slug },
        update: { ...city, governorateId: damascus.id },
        create: { ...city, governorateId: damascus.id },
      });
    }

    // أحياء دمشق
    const damascusCity = await prisma.city.findUnique({ where: { slug: 'damascus-city' } });
    if (damascusCity) {
      const districts = [
        { slug: 'mazzeh', nameAr: 'المزة', nameEn: 'Mazzeh', sortOrder: 1 },
        { slug: 'malki', nameAr: 'المالكي', nameEn: 'Malki', sortOrder: 2 },
        { slug: 'abu-rummaneh', nameAr: 'أبو رمانة', nameEn: 'Abu Rummaneh', sortOrder: 3 },
        { slug: 'kafr-sousa', nameAr: 'كفرسوسة', nameEn: 'Kafr Sousa', sortOrder: 4 },
        { slug: 'midan', nameAr: 'الميدان', nameEn: 'Midan', sortOrder: 5 },
        { slug: 'shaalan', nameAr: 'الشعلان', nameEn: 'Shaalan', sortOrder: 6 },
        { slug: 'muhajreen', nameAr: 'المهاجرين', nameEn: 'Muhajreen', sortOrder: 7 },
        { slug: 'baramkeh', nameAr: 'البرامكة', nameEn: 'Baramkeh', sortOrder: 8 },
        { slug: 'old-damascus', nameAr: 'دمشق القديمة', nameEn: 'Old Damascus', sortOrder: 9 },
        { slug: 'bab-touma', nameAr: 'باب توما', nameEn: 'Bab Touma', sortOrder: 10 },
      ];
      for (const district of districts) {
        await prisma.district.upsert({
          where: { slug: district.slug },
          update: { ...district, cityId: damascusCity.id },
          create: { ...district, cityId: damascusCity.id },
        });
      }
    }
  }

  if (aleppo) {
    const aleppoCities = [
      { slug: 'aleppo-city', nameAr: 'مدينة حلب', nameEn: 'Aleppo City', sortOrder: 1 },
    ];
    for (const city of aleppoCities) {
      await prisma.city.upsert({
        where: { slug: city.slug },
        update: { ...city, governorateId: aleppo.id },
        create: { ...city, governorateId: aleppo.id },
      });
    }
  }

  console.log('✅ تم إنشاء المدن والأحياء');

  // ===========================================
  // التصنيفات
  // ===========================================
  const categories = [
    { 
      slug: 'restaurants', 
      nameAr: 'مطاعم ومقاهي', 
      nameEn: 'Restaurants & Cafes',
      icon: 'utensils',
      color: '#e74c3c',
      sortOrder: 1,
      children: [
        { slug: 'restaurants-arabic', nameAr: 'مطاعم عربية', nameEn: 'Arabic Restaurants' },
        { slug: 'restaurants-western', nameAr: 'مطاعم غربية', nameEn: 'Western Restaurants' },
        { slug: 'fast-food', nameAr: 'وجبات سريعة', nameEn: 'Fast Food' },
        { slug: 'cafes', nameAr: 'مقاهي', nameEn: 'Cafes' },
        { slug: 'sweets', nameAr: 'حلويات', nameEn: 'Sweets & Desserts' },
      ]
    },
    { 
      slug: 'shopping', 
      nameAr: 'تسوق', 
      nameEn: 'Shopping',
      icon: 'shopping-bag',
      color: '#9b59b6',
      sortOrder: 2,
      children: [
        { slug: 'clothing', nameAr: 'ملابس', nameEn: 'Clothing' },
        { slug: 'electronics', nameAr: 'إلكترونيات', nameEn: 'Electronics' },
        { slug: 'jewelry', nameAr: 'مجوهرات', nameEn: 'Jewelry' },
        { slug: 'supermarkets', nameAr: 'سوبرماركت', nameEn: 'Supermarkets' },
      ]
    },
    { 
      slug: 'health', 
      nameAr: 'صحة وطب', 
      nameEn: 'Health & Medical',
      icon: 'stethoscope',
      color: '#27ae60',
      sortOrder: 3,
      children: [
        { slug: 'hospitals', nameAr: 'مستشفيات', nameEn: 'Hospitals' },
        { slug: 'clinics', nameAr: 'عيادات', nameEn: 'Clinics' },
        { slug: 'pharmacies', nameAr: 'صيدليات', nameEn: 'Pharmacies' },
        { slug: 'labs', nameAr: 'مختبرات', nameEn: 'Labs' },
        { slug: 'dentists', nameAr: 'أطباء أسنان', nameEn: 'Dentists' },
      ]
    },
    { 
      slug: 'services', 
      nameAr: 'خدمات', 
      nameEn: 'Services',
      icon: 'concierge-bell',
      color: '#3498db',
      sortOrder: 4,
      children: [
        { slug: 'banks', nameAr: 'بنوك', nameEn: 'Banks' },
        { slug: 'insurance', nameAr: 'تأمين', nameEn: 'Insurance' },
        { slug: 'legal', nameAr: 'خدمات قانونية', nameEn: 'Legal Services' },
        { slug: 'accounting', nameAr: 'محاسبة', nameEn: 'Accounting' },
      ]
    },
    { 
      slug: 'education', 
      nameAr: 'تعليم', 
      nameEn: 'Education',
      icon: 'graduation-cap',
      color: '#f39c12',
      sortOrder: 5,
      children: [
        { slug: 'schools', nameAr: 'مدارس', nameEn: 'Schools' },
        { slug: 'universities', nameAr: 'جامعات', nameEn: 'Universities' },
        { slug: 'training-centers', nameAr: 'مراكز تدريب', nameEn: 'Training Centers' },
        { slug: 'languages', nameAr: 'معاهد لغات', nameEn: 'Language Institutes' },
      ]
    },
    { 
      slug: 'real-estate', 
      nameAr: 'عقارات', 
      nameEn: 'Real Estate',
      icon: 'building',
      color: '#1abc9c',
      sortOrder: 6,
      children: [
        { slug: 'real-estate-offices', nameAr: 'مكاتب عقارية', nameEn: 'Real Estate Offices' },
        { slug: 'construction', nameAr: 'مقاولات', nameEn: 'Construction' },
        { slug: 'interior-design', nameAr: 'ديكور', nameEn: 'Interior Design' },
      ]
    },
    { 
      slug: 'automotive', 
      nameAr: 'سيارات', 
      nameEn: 'Automotive',
      icon: 'car',
      color: '#34495e',
      sortOrder: 7,
      children: [
        { slug: 'car-dealers', nameAr: 'معارض سيارات', nameEn: 'Car Dealers' },
        { slug: 'car-services', nameAr: 'خدمات سيارات', nameEn: 'Car Services' },
        { slug: 'car-parts', nameAr: 'قطع غيار', nameEn: 'Car Parts' },
        { slug: 'car-rental', nameAr: 'تأجير سيارات', nameEn: 'Car Rental' },
      ]
    },
    { 
      slug: 'tourism', 
      nameAr: 'سياحة وسفر', 
      nameEn: 'Tourism & Travel',
      icon: 'plane',
      color: '#2980b9',
      sortOrder: 8,
      children: [
        { slug: 'hotels', nameAr: 'فنادق', nameEn: 'Hotels' },
        { slug: 'travel-agencies', nameAr: 'مكاتب سياحة', nameEn: 'Travel Agencies' },
        { slug: 'resorts', nameAr: 'منتجعات', nameEn: 'Resorts' },
      ]
    },
    { 
      slug: 'technology', 
      nameAr: 'تقنية', 
      nameEn: 'Technology',
      icon: 'laptop',
      color: '#8e44ad',
      sortOrder: 9,
      children: [
        { slug: 'software', nameAr: 'برمجيات', nameEn: 'Software' },
        { slug: 'it-services', nameAr: 'خدمات تقنية', nameEn: 'IT Services' },
        { slug: 'mobile-services', nameAr: 'خدمات موبايل', nameEn: 'Mobile Services' },
      ]
    },
    { 
      slug: 'industry', 
      nameAr: 'صناعة', 
      nameEn: 'Industry',
      icon: 'industry',
      color: '#7f8c8d',
      sortOrder: 10,
      children: [
        { slug: 'factories', nameAr: 'مصانع', nameEn: 'Factories' },
        { slug: 'trading', nameAr: 'تجارة', nameEn: 'Trading' },
        { slug: 'import-export', nameAr: 'استيراد وتصدير', nameEn: 'Import & Export' },
      ]
    },
  ];

  for (const cat of categories) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        nameAr: cat.nameAr,
        nameEn: cat.nameEn,
        icon: cat.icon,
        color: cat.color,
        sortOrder: cat.sortOrder,
        isFeatured: true,
      },
      create: {
        slug: cat.slug,
        nameAr: cat.nameAr,
        nameEn: cat.nameEn,
        icon: cat.icon,
        color: cat.color,
        sortOrder: cat.sortOrder,
        isFeatured: true,
      },
    });

    if (cat.children) {
      let childOrder = 1;
      for (const child of cat.children) {
        await prisma.category.upsert({
          where: { slug: child.slug },
          update: {
            nameAr: child.nameAr,
            nameEn: child.nameEn,
            parentId: parent.id,
            sortOrder: childOrder++,
          },
          create: {
            slug: child.slug,
            nameAr: child.nameAr,
            nameEn: child.nameEn,
            parentId: parent.id,
            sortOrder: childOrder,
          },
        });
      }
    }
  }
  console.log('✅ تم إنشاء التصنيفات');

  // ===========================================
  // الإعدادات الافتراضية
  // ===========================================
  const settings = [
    { key: 'site_name', valueAr: 'الصفحات الخضراء', valueEn: 'Green Pages', group: 'general', type: 'text', isPublic: true },
    { key: 'site_description', valueAr: 'دليل الأنشطة التجارية في سوريا', valueEn: 'Business Directory in Syria', group: 'general', type: 'textarea', isPublic: true },
    { key: 'site_logo', valueAr: '/images/logo.svg', valueEn: '/images/logo.svg', group: 'general', type: 'image', isPublic: true },
    { key: 'contact_email', valueAr: 'info@greenpages.sy', valueEn: 'info@greenpages.sy', group: 'contact', type: 'text', isPublic: true },
    { key: 'contact_phone', valueAr: '+963 11 123 4567', valueEn: '+963 11 123 4567', group: 'contact', type: 'text', isPublic: true },
    { key: 'social_facebook', valueAr: 'https://facebook.com/greenpages.sy', valueEn: 'https://facebook.com/greenpages.sy', group: 'social', type: 'text', isPublic: true },
    { key: 'social_instagram', valueAr: 'https://instagram.com/greenpages.sy', valueEn: 'https://instagram.com/greenpages.sy', group: 'social', type: 'text', isPublic: true },
    { key: 'social_twitter', valueAr: 'https://twitter.com/greenpages_sy', valueEn: 'https://twitter.com/greenpages_sy', group: 'social', type: 'text', isPublic: true },
    { key: 'default_language', valueAr: 'ar', valueEn: 'ar', group: 'general', type: 'text', isPublic: true },
    { key: 'items_per_page', valueAr: '20', valueEn: '20', group: 'general', type: 'number', isPublic: false },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting,
    });
  }
  console.log('✅ تم إنشاء الإعدادات');

  // ===========================================
  // الصفحات الثابتة
  // ===========================================
  const pages = [
    {
      slug: 'about',
      titleAr: 'من نحن',
      titleEn: 'About Us',
      contentAr: '<h2>الصفحات الخضراء</h2><p>دليل الأنشطة التجارية الأول في سوريا. نهدف إلى ربط العملاء بالشركات والمؤسسات بطريقة سهلة وموثوقة.</p>',
      contentEn: '<h2>Green Pages</h2><p>The first business directory in Syria. We aim to connect customers with businesses in an easy and reliable way.</p>',
      isPublished: true,
      sortOrder: 1,
    },
    {
      slug: 'contact',
      titleAr: 'اتصل بنا',
      titleEn: 'Contact Us',
      contentAr: '<h2>تواصل معنا</h2><p>نسعد بتواصلكم معنا عبر البريد الإلكتروني أو الهاتف.</p>',
      contentEn: '<h2>Get in Touch</h2><p>We are happy to hear from you via email or phone.</p>',
      isPublished: true,
      sortOrder: 2,
    },
    {
      slug: 'privacy-policy',
      titleAr: 'سياسة الخصوصية',
      titleEn: 'Privacy Policy',
      contentAr: '<h2>سياسة الخصوصية</h2><p>نحترم خصوصيتكم ونلتزم بحماية بياناتكم الشخصية.</p>',
      contentEn: '<h2>Privacy Policy</h2><p>We respect your privacy and are committed to protecting your personal data.</p>',
      isPublished: true,
      sortOrder: 3,
    },
    {
      slug: 'terms-of-service',
      titleAr: 'شروط الاستخدام',
      titleEn: 'Terms of Service',
      contentAr: '<h2>شروط الاستخدام</h2><p>باستخدامك للموقع فإنك توافق على الشروط والأحكام التالية.</p>',
      contentEn: '<h2>Terms of Service</h2><p>By using this website, you agree to the following terms and conditions.</p>',
      isPublished: true,
      sortOrder: 4,
    },
  ];

  for (const page of pages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: page,
      create: page,
    });
  }
  console.log('✅ تم إنشاء الصفحات الثابتة');

  // ===========================================
  // إعدادات النظام
  // ===========================================
  const settings = [
    // الإعدادات العامة
    { key: 'site_name_ar', valueAr: 'الصفحات الخضراء', type: 'text', group: 'general' },
    { key: 'site_name_en', valueEn: 'Green Pages', type: 'text', group: 'general' },
    { key: 'site_description_ar', valueAr: 'دليلك الشامل للأنشطة التجارية في سوريا', type: 'textarea', group: 'general' },
    { key: 'site_description_en', valueEn: 'Your comprehensive guide to businesses in Syria', type: 'textarea', group: 'general' },
    { key: 'site_url', valueEn: 'https://greenpages.sy', type: 'text', group: 'general' },
    { key: 'default_language', valueAr: 'ar', type: 'text', group: 'general' },
    { key: 'timezone', valueAr: 'Asia/Damascus', type: 'text', group: 'general' },
    
    // معلومات التواصل
    { key: 'contact_email', valueAr: 'info@greenpages.sy', type: 'text', group: 'contact', isPublic: true },
    { key: 'contact_phone', valueAr: '+963 11 123 4567', type: 'text', group: 'contact', isPublic: true },
    { key: 'contact_whatsapp', valueAr: '+963 999 123 456', type: 'text', group: 'contact', isPublic: true },
    { key: 'contact_address_ar', valueAr: 'دمشق، سوريا', type: 'textarea', group: 'contact', isPublic: true },
    { key: 'contact_address_en', valueEn: 'Damascus, Syria', type: 'textarea', group: 'contact', isPublic: true },
    
    // التواصل الاجتماعي
    { key: 'social_facebook', valueAr: '', type: 'text', group: 'social', isPublic: true },
    { key: 'social_instagram', valueAr: '', type: 'text', group: 'social', isPublic: true },
    { key: 'social_twitter', valueAr: '', type: 'text', group: 'social', isPublic: true },
    { key: 'social_youtube', valueAr: '', type: 'text', group: 'social', isPublic: true },
    
    // المظهر
    { key: 'primary_color', valueAr: '#16a34a', type: 'text', group: 'appearance' },
    
    // الإشعارات
    { key: 'enable_email_notifications', valueAr: 'true', type: 'boolean', group: 'notifications' },
    { key: 'notify_new_business', valueAr: 'true', type: 'boolean', group: 'notifications' },
    { key: 'notify_new_review', valueAr: 'true', type: 'boolean', group: 'notifications' },
    { key: 'notify_contact_message', valueAr: 'true', type: 'boolean', group: 'notifications' },
    
    // الأمان
    { key: 'enable_two_factor_auth', valueAr: 'false', type: 'boolean', group: 'security' },
    { key: 'session_timeout_minutes', valueAr: '60', type: 'number', group: 'security' },
    { key: 'max_login_attempts', valueAr: '5', type: 'number', group: 'security' },
    { key: 'allow_registration', valueAr: 'true', type: 'boolean', group: 'security', isPublic: true },
    { key: 'require_email_verification', valueAr: 'true', type: 'boolean', group: 'security' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting as any,
    });
  }
  console.log('✅ تم إنشاء إعدادات النظام:', settings.length);

  console.log('🎉 اكتملت زراعة البيانات بنجاح!');
}

main()
  .catch((e) => {
    console.error('❌ خطأ في زراعة البيانات:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
