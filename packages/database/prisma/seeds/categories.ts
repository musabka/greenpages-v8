/**
 * Categories Seed Data
 * التصنيفات الرئيسية والفرعية مع الأيقونات
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// التصنيفات الرئيسية والفرعية
const categoriesData = [
  {
    nameAr: 'مطاعم ومقاهي',
    nameEn: 'Restaurants & Cafes',
    slug: 'restaurants-cafes',
    icon: 'utensils',
    iconEmoji: '🍽️',
    color: '#F97316',
    sortOrder: 1,
    children: [
      { nameAr: 'مطاعم شرقية', nameEn: 'Eastern Restaurants', slug: 'eastern-restaurants', icon: 'bowl-food' },
      { nameAr: 'مطاعم غربية', nameEn: 'Western Restaurants', slug: 'western-restaurants', icon: 'burger' },
      { nameAr: 'وجبات سريعة', nameEn: 'Fast Food', slug: 'fast-food', icon: 'pizza-slice' },
      { nameAr: 'مقاهي', nameEn: 'Cafes', slug: 'cafes', icon: 'coffee' },
      { nameAr: 'حلويات', nameEn: 'Sweets & Desserts', slug: 'sweets', icon: 'cake-candles' },
      { nameAr: 'مشاوي', nameEn: 'Grills & BBQ', slug: 'grills', icon: 'drumstick-bite' },
      { nameAr: 'مأكولات بحرية', nameEn: 'Seafood', slug: 'seafood', icon: 'fish' },
      { nameAr: 'بيتزا ومعجنات', nameEn: 'Pizza & Pastries', slug: 'pizza-pastries', icon: 'pizza-slice' },
    ],
  },
  {
    nameAr: 'صحة وطب',
    nameEn: 'Health & Medicine',
    slug: 'health-medicine',
    icon: 'hospital',
    iconEmoji: '🏥',
    color: '#EF4444',
    sortOrder: 2,
    children: [
      { nameAr: 'عيادات طبية', nameEn: 'Medical Clinics', slug: 'clinics', icon: 'stethoscope' },
      { nameAr: 'مستشفيات', nameEn: 'Hospitals', slug: 'hospitals', icon: 'hospital' },
      { nameAr: 'صيدليات', nameEn: 'Pharmacies', slug: 'pharmacies', icon: 'prescription-bottle-medical' },
      { nameAr: 'مختبرات طبية', nameEn: 'Medical Labs', slug: 'medical-labs', icon: 'flask' },
      { nameAr: 'أطباء أسنان', nameEn: 'Dentists', slug: 'dentists', icon: 'tooth' },
      { nameAr: 'بصريات', nameEn: 'Opticians', slug: 'opticians', icon: 'glasses' },
      { nameAr: 'مراكز تجميل', nameEn: 'Beauty Centers', slug: 'beauty-centers', icon: 'spa' },
      { nameAr: 'عيادات عيون', nameEn: 'Eye Clinics', slug: 'eye-clinics', icon: 'eye' },
      { nameAr: 'عيادات أطفال', nameEn: 'Pediatric Clinics', slug: 'pediatric-clinics', icon: 'baby' },
      { nameAr: 'مراكز علاج طبيعي', nameEn: 'Physiotherapy', slug: 'physiotherapy', icon: 'person-walking' },
    ],
  },
  {
    nameAr: 'تسوق',
    nameEn: 'Shopping',
    slug: 'shopping',
    icon: 'shopping-bag',
    iconEmoji: '🛍️',
    color: '#8B5CF6',
    sortOrder: 3,
    children: [
      { nameAr: 'ملابس وأزياء', nameEn: 'Clothing & Fashion', slug: 'clothing', icon: 'shirt' },
      { nameAr: 'أحذية وحقائب', nameEn: 'Shoes & Bags', slug: 'shoes-bags', icon: 'bag-shopping' },
      { nameAr: 'إلكترونيات', nameEn: 'Electronics', slug: 'electronics', icon: 'mobile' },
      { nameAr: 'أثاث ومفروشات', nameEn: 'Furniture', slug: 'furniture', icon: 'couch' },
      { nameAr: 'أجهزة منزلية', nameEn: 'Home Appliances', slug: 'home-appliances', icon: 'blender' },
      { nameAr: 'مجوهرات وساعات', nameEn: 'Jewelry & Watches', slug: 'jewelry', icon: 'gem' },
      { nameAr: 'عطور ومستحضرات', nameEn: 'Perfumes & Cosmetics', slug: 'perfumes', icon: 'spray-can-sparkles' },
      { nameAr: 'سوبرماركت', nameEn: 'Supermarkets', slug: 'supermarkets', icon: 'cart-shopping' },
      { nameAr: 'هدايا وتحف', nameEn: 'Gifts & Souvenirs', slug: 'gifts', icon: 'gift' },
      { nameAr: 'ألعاب أطفال', nameEn: 'Toys', slug: 'toys', icon: 'puzzle-piece' },
    ],
  },
  {
    nameAr: 'خدمات',
    nameEn: 'Services',
    slug: 'services',
    icon: 'wrench',
    iconEmoji: '🔧',
    color: '#3B82F6',
    sortOrder: 4,
    children: [
      { nameAr: 'صيانة سيارات', nameEn: 'Car Maintenance', slug: 'car-maintenance', icon: 'car' },
      { nameAr: 'كهربائي', nameEn: 'Electrician', slug: 'electrician', icon: 'bolt' },
      { nameAr: 'سباك', nameEn: 'Plumber', slug: 'plumber', icon: 'faucet' },
      { nameAr: 'نجار', nameEn: 'Carpenter', slug: 'carpenter', icon: 'hammer' },
      { nameAr: 'حداد', nameEn: 'Blacksmith', slug: 'blacksmith', icon: 'gavel' },
      { nameAr: 'تنظيف منازل', nameEn: 'House Cleaning', slug: 'house-cleaning', icon: 'broom' },
      { nameAr: 'تصليح إلكترونيات', nameEn: 'Electronics Repair', slug: 'electronics-repair', icon: 'screwdriver-wrench' },
      { nameAr: 'شحن ونقل', nameEn: 'Shipping & Moving', slug: 'shipping', icon: 'truck' },
      { nameAr: 'طباعة ونسخ', nameEn: 'Printing', slug: 'printing', icon: 'print' },
      { nameAr: 'تصوير', nameEn: 'Photography', slug: 'photography', icon: 'camera' },
    ],
  },
  {
    nameAr: 'تعليم',
    nameEn: 'Education',
    slug: 'education',
    icon: 'graduation-cap',
    iconEmoji: '📚',
    color: '#10B981',
    sortOrder: 5,
    children: [
      { nameAr: 'مدارس', nameEn: 'Schools', slug: 'schools', icon: 'school' },
      { nameAr: 'جامعات', nameEn: 'Universities', slug: 'universities', icon: 'university' },
      { nameAr: 'معاهد لغات', nameEn: 'Language Institutes', slug: 'language-institutes', icon: 'language' },
      { nameAr: 'مراكز تدريب', nameEn: 'Training Centers', slug: 'training-centers', icon: 'chalkboard-user' },
      { nameAr: 'روضات أطفال', nameEn: 'Kindergartens', slug: 'kindergartens', icon: 'child' },
      { nameAr: 'دورات حاسوب', nameEn: 'Computer Courses', slug: 'computer-courses', icon: 'laptop-code' },
      { nameAr: 'مكتبات', nameEn: 'Libraries & Bookstores', slug: 'libraries', icon: 'book' },
      { nameAr: 'قرطاسية', nameEn: 'Stationery', slug: 'stationery', icon: 'pen' },
    ],
  },
  {
    nameAr: 'سياحة وسفر',
    nameEn: 'Tourism & Travel',
    slug: 'tourism-travel',
    icon: 'plane',
    iconEmoji: '✈️',
    color: '#06B6D4',
    sortOrder: 6,
    children: [
      { nameAr: 'فنادق', nameEn: 'Hotels', slug: 'hotels', icon: 'hotel' },
      { nameAr: 'شقق مفروشة', nameEn: 'Furnished Apartments', slug: 'furnished-apartments', icon: 'building' },
      { nameAr: 'مكاتب سياحة', nameEn: 'Travel Agencies', slug: 'travel-agencies', icon: 'plane-departure' },
      { nameAr: 'تأجير سيارات', nameEn: 'Car Rental', slug: 'car-rental', icon: 'car-side' },
      { nameAr: 'مطارات', nameEn: 'Airports', slug: 'airports', icon: 'plane-arrival' },
      { nameAr: 'أماكن سياحية', nameEn: 'Tourist Attractions', slug: 'attractions', icon: 'landmark' },
    ],
  },
  {
    nameAr: 'عقارات',
    nameEn: 'Real Estate',
    slug: 'real-estate',
    icon: 'building',
    iconEmoji: '🏢',
    color: '#F59E0B',
    sortOrder: 7,
    children: [
      { nameAr: 'مكاتب عقارية', nameEn: 'Real Estate Offices', slug: 'real-estate-offices', icon: 'building-columns' },
      { nameAr: 'شقق للبيع', nameEn: 'Apartments for Sale', slug: 'apartments-sale', icon: 'house' },
      { nameAr: 'شقق للإيجار', nameEn: 'Apartments for Rent', slug: 'apartments-rent', icon: 'key' },
      { nameAr: 'فلل', nameEn: 'Villas', slug: 'villas', icon: 'house-chimney' },
      { nameAr: 'أراضي', nameEn: 'Land', slug: 'land', icon: 'mountain-sun' },
      { nameAr: 'محلات تجارية', nameEn: 'Commercial Shops', slug: 'commercial-shops', icon: 'store' },
    ],
  },
  {
    nameAr: 'مال وأعمال',
    nameEn: 'Finance & Business',
    slug: 'finance-business',
    icon: 'building-columns',
    iconEmoji: '💼',
    color: '#6366F1',
    sortOrder: 8,
    children: [
      { nameAr: 'بنوك', nameEn: 'Banks', slug: 'banks', icon: 'landmark' },
      { nameAr: 'صرافة', nameEn: 'Currency Exchange', slug: 'currency-exchange', icon: 'money-bill-transfer' },
      { nameAr: 'شركات تأمين', nameEn: 'Insurance Companies', slug: 'insurance', icon: 'shield-halved' },
      { nameAr: 'محاسبة ومالية', nameEn: 'Accounting', slug: 'accounting', icon: 'calculator' },
      { nameAr: 'محاماة', nameEn: 'Law Firms', slug: 'law-firms', icon: 'scale-balanced' },
      { nameAr: 'استشارات', nameEn: 'Consulting', slug: 'consulting', icon: 'handshake' },
      { nameAr: 'تسويق وإعلان', nameEn: 'Marketing & Advertising', slug: 'marketing', icon: 'bullhorn' },
    ],
  },
  {
    nameAr: 'رياضة وترفيه',
    nameEn: 'Sports & Entertainment',
    slug: 'sports-entertainment',
    icon: 'futbol',
    iconEmoji: '⚽',
    color: '#22C55E',
    sortOrder: 9,
    children: [
      { nameAr: 'نوادي رياضية', nameEn: 'Sports Clubs', slug: 'sports-clubs', icon: 'dumbbell' },
      { nameAr: 'ملاعب', nameEn: 'Sports Fields', slug: 'sports-fields', icon: 'futbol' },
      { nameAr: 'مسابح', nameEn: 'Swimming Pools', slug: 'swimming-pools', icon: 'water-ladder' },
      { nameAr: 'صالات ألعاب', nameEn: 'Game Centers', slug: 'game-centers', icon: 'gamepad' },
      { nameAr: 'سينما', nameEn: 'Cinema', slug: 'cinema', icon: 'film' },
      { nameAr: 'مدن ملاهي', nameEn: 'Amusement Parks', slug: 'amusement-parks', icon: 'ticket' },
      { nameAr: 'يوغا وتأمل', nameEn: 'Yoga & Meditation', slug: 'yoga', icon: 'om' },
    ],
  },
  {
    nameAr: 'صناعة وتجارة',
    nameEn: 'Industry & Trade',
    slug: 'industry-trade',
    icon: 'industry',
    iconEmoji: '🏭',
    color: '#64748B',
    sortOrder: 10,
    children: [
      { nameAr: 'مصانع', nameEn: 'Factories', slug: 'factories', icon: 'industry' },
      { nameAr: 'تجارة جملة', nameEn: 'Wholesale', slug: 'wholesale', icon: 'boxes-stacked' },
      { nameAr: 'استيراد وتصدير', nameEn: 'Import & Export', slug: 'import-export', icon: 'ship' },
      { nameAr: 'مواد بناء', nameEn: 'Construction Materials', slug: 'construction-materials', icon: 'trowel-bricks' },
      { nameAr: 'آلات ومعدات', nameEn: 'Machinery & Equipment', slug: 'machinery', icon: 'gears' },
      { nameAr: 'مواد غذائية', nameEn: 'Food Products', slug: 'food-products', icon: 'wheat-awn' },
    ],
  },
  {
    nameAr: 'حكومي',
    nameEn: 'Government',
    slug: 'government',
    icon: 'landmark',
    iconEmoji: '🏛️',
    color: '#DC2626',
    sortOrder: 11,
    children: [
      { nameAr: 'مديريات', nameEn: 'Directorates', slug: 'directorates', icon: 'building-flag' },
      { nameAr: 'محاكم', nameEn: 'Courts', slug: 'courts', icon: 'gavel' },
      { nameAr: 'مراكز شرطة', nameEn: 'Police Stations', slug: 'police-stations', icon: 'shield' },
      { nameAr: 'مكاتب بريد', nameEn: 'Post Offices', slug: 'post-offices', icon: 'envelope' },
      { nameAr: 'سجل مدني', nameEn: 'Civil Registry', slug: 'civil-registry', icon: 'id-card' },
      { nameAr: 'دوائر ضريبية', nameEn: 'Tax Offices', slug: 'tax-offices', icon: 'file-invoice-dollar' },
    ],
  },
  {
    nameAr: 'تقنية وانترنت',
    nameEn: 'Technology & Internet',
    slug: 'technology',
    icon: 'laptop',
    iconEmoji: '💻',
    color: '#0EA5E9',
    sortOrder: 12,
    children: [
      { nameAr: 'شركات برمجة', nameEn: 'Software Companies', slug: 'software-companies', icon: 'code' },
      { nameAr: 'مزودي انترنت', nameEn: 'Internet Providers', slug: 'internet-providers', icon: 'wifi' },
      { nameAr: 'تصميم مواقع', nameEn: 'Web Design', slug: 'web-design', icon: 'laptop-code' },
      { nameAr: 'تطبيقات موبايل', nameEn: 'Mobile Apps', slug: 'mobile-apps', icon: 'mobile-screen' },
      { nameAr: 'استضافة', nameEn: 'Web Hosting', slug: 'web-hosting', icon: 'server' },
      { nameAr: 'كمبيوتر وملحقات', nameEn: 'Computers & Accessories', slug: 'computers', icon: 'desktop' },
    ],
  },
];

export async function seedCategories() {
  console.log('📂 Seeding categories...');

  for (const category of categoriesData) {
    // إنشاء التصنيف الرئيسي
    const parentCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        nameAr: category.nameAr,
        nameEn: category.nameEn,
        icon: category.icon,
        color: category.color,
        sortOrder: category.sortOrder,
      },
      create: {
        nameAr: category.nameAr,
        nameEn: category.nameEn,
        slug: category.slug,
        icon: category.icon,
        color: category.color,
        sortOrder: category.sortOrder,
        isFeatured: true,
        isActive: true,
      },
    });

    console.log(`  ✓ Category: ${category.iconEmoji} ${category.nameAr}`);

    // إنشاء التصنيفات الفرعية
    for (let i = 0; i < category.children.length; i++) {
      const child = category.children[i];
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: {
          nameAr: child.nameAr,
          nameEn: child.nameEn,
          icon: child.icon,
          parentId: parentCategory.id,
          sortOrder: i + 1,
        },
        create: {
          nameAr: child.nameAr,
          nameEn: child.nameEn,
          slug: child.slug,
          icon: child.icon,
          parentId: parentCategory.id,
          sortOrder: i + 1,
          isActive: true,
        },
      });
    }

    console.log(`    ✓ ${category.children.length} subcategories added`);
  }

  console.log('✅ Categories seeded successfully!');
}

// تشغيل مستقل
if (require.main === module) {
  seedCategories()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e);
      prisma.$disconnect();
      process.exit(1);
    });
}
