/**
 * Demo Businesses Seed Data
 * 10 شركات تجريبية مع بياناتها الكاملة
 */

import {
  PrismaClient,
  BusinessStatus,
  DayOfWeek,
  ContactType,
} from '@prisma/client';

const prisma = new PrismaClient();

// بيانات الشركات التجريبية
const businessesData = [
  {
    nameAr: 'مطعم الشام الأصيل',
    nameEn: 'Al-Sham Authentic Restaurant',
    slug: 'alsham-restaurant',
    descriptionAr:
      'مطعم متخصص في المأكولات الشامية التقليدية. نقدم أشهى الأطباق السورية الأصيلة مع جو عائلي مميز. جميع أطباقنا محضرة من مكونات طازجة يومياً.',
    descriptionEn:
      'A restaurant specializing in traditional Levantine cuisine. We offer the most delicious authentic Syrian dishes with a distinctive family atmosphere.',
    categorySlug: 'eastern-restaurants',
    governorateSlug: 'damascus',
    citySlug: 'damascus-city',
    districtSlug: 'mezzeh',
    addressAr: 'شارع الفردوس، بناء 15، المزة',
    addressEn: 'Al-Ferdous Street, Building 15, Mezzeh',
    latitude: 33.5102,
    longitude: 36.266,
    contacts: [
      { type: ContactType.PHONE, value: '+963 11 612 3456', isPrimary: true },
      { type: ContactType.MOBILE, value: '+963 933 123 456' },
      { type: ContactType.WHATSAPP, value: '+963 933 123 456' },
      { type: ContactType.EMAIL, value: 'info@alsham-restaurant.sy' },
      { type: ContactType.WEBSITE, value: 'https://alsham-restaurant.sy' },
      {
        type: ContactType.FACEBOOK,
        value: 'https://facebook.com/alshamrestaurant',
      },
      {
        type: ContactType.INSTAGRAM,
        value: 'https://instagram.com/alshamrestaurant',
      },
    ],
    workingHours: [
      { day: DayOfWeek.SUNDAY, open: '10:00', close: '23:00' },
      { day: DayOfWeek.MONDAY, open: '10:00', close: '23:00' },
      { day: DayOfWeek.TUESDAY, open: '10:00', close: '23:00' },
      { day: DayOfWeek.WEDNESDAY, open: '10:00', close: '23:00' },
      { day: DayOfWeek.THURSDAY, open: '10:00', close: '00:00' },
      { day: DayOfWeek.FRIDAY, open: '12:00', close: '00:00' },
      { day: DayOfWeek.SATURDAY, open: '10:00', close: '23:00' },
    ],
    isFeatured: true,
  },
  {
    nameAr: 'صيدلية الحياة',
    nameEn: 'Al-Hayat Pharmacy',
    slug: 'alhayat-pharmacy',
    descriptionAr:
      'صيدلية متكاملة تقدم جميع الأدوية والمستحضرات الطبية. نوفر خدمة توصيل للمنازل على مدار الساعة. صيادلة متخصصون لتقديم الاستشارات المجانية.',
    descriptionEn:
      'A comprehensive pharmacy offering all medicines and medical products. We provide 24/7 home delivery service.',
    categorySlug: 'pharmacies',
    governorateSlug: 'damascus',
    citySlug: 'damascus-city',
    districtSlug: 'malki',
    addressAr: 'شارع بغداد، المالكي',
    addressEn: 'Baghdad Street, Malki',
    latitude: 33.5138,
    longitude: 36.2714,
    contacts: [
      { type: ContactType.PHONE, value: '+963 11 333 4567', isPrimary: true },
      { type: ContactType.MOBILE, value: '+963 944 567 890' },
      { type: ContactType.WHATSAPP, value: '+963 944 567 890' },
      { type: ContactType.EMAIL, value: 'pharmacy@alhayat.sy' },
    ],
    workingHours: [
      { day: DayOfWeek.SUNDAY, open: '08:00', close: '22:00' },
      { day: DayOfWeek.MONDAY, open: '08:00', close: '22:00' },
      { day: DayOfWeek.TUESDAY, open: '08:00', close: '22:00' },
      { day: DayOfWeek.WEDNESDAY, open: '08:00', close: '22:00' },
      { day: DayOfWeek.THURSDAY, open: '08:00', close: '22:00' },
      { day: DayOfWeek.FRIDAY, open: '10:00', close: '22:00' },
      { day: DayOfWeek.SATURDAY, open: '08:00', close: '22:00' },
    ],
    isFeatured: true,
  },
  {
    nameAr: 'كافيه لاتيه',
    nameEn: 'Latte Cafe',
    slug: 'latte-cafe',
    descriptionAr:
      'كافيه عصري بأجواء هادئة ومريحة. نقدم أفضل أنواع القهوة المختصة والمشروبات الساخنة والباردة مع تشكيلة متنوعة من الحلويات.',
    descriptionEn:
      'A modern cafe with a quiet and comfortable atmosphere. We offer the best specialty coffee and hot and cold drinks.',
    categorySlug: 'cafes',
    governorateSlug: 'damascus',
    citySlug: 'damascus-city',
    districtSlug: 'abu-rummaneh',
    addressAr: 'شارع المتنبي، أبو رمانة',
    addressEn: 'Al-Mutanabbi Street, Abu Rummaneh',
    latitude: 33.5158,
    longitude: 36.2845,
    contacts: [
      { type: ContactType.PHONE, value: '+963 11 222 8899', isPrimary: true },
      { type: ContactType.MOBILE, value: '+963 955 111 222' },
      { type: ContactType.WHATSAPP, value: '+963 955 111 222' },
      { type: ContactType.EMAIL, value: 'hello@lattecafe.sy' },
      { type: ContactType.WEBSITE, value: 'https://lattecafe.sy' },
      { type: ContactType.INSTAGRAM, value: 'https://instagram.com/lattecafe.sy' },
    ],
    workingHours: [
      { day: DayOfWeek.SUNDAY, open: '07:00', close: '00:00' },
      { day: DayOfWeek.MONDAY, open: '07:00', close: '00:00' },
      { day: DayOfWeek.TUESDAY, open: '07:00', close: '00:00' },
      { day: DayOfWeek.WEDNESDAY, open: '07:00', close: '00:00' },
      { day: DayOfWeek.THURSDAY, open: '07:00', close: '01:00' },
      { day: DayOfWeek.FRIDAY, open: '09:00', close: '01:00' },
      { day: DayOfWeek.SATURDAY, open: '07:00', close: '00:00' },
    ],
    isFeatured: false,
  },
  {
    nameAr: 'مركز الدكتور أحمد للعيون',
    nameEn: 'Dr. Ahmad Eye Center',
    slug: 'dr-ahmad-eye-center',
    descriptionAr:
      'مركز متخصص في طب وجراحة العيون. نقدم أحدث التقنيات في تصحيح النظر والليزك وعمليات الماء الأبيض والأزرق. فريق طبي متخصص بخبرة تزيد عن 20 عاماً.',
    descriptionEn:
      'A specialized center in ophthalmology and eye surgery. We offer the latest technologies in vision correction and LASIK.',
    categorySlug: 'eye-clinics',
    governorateSlug: 'damascus',
    citySlug: 'damascus-city',
    districtSlug: 'shaalan',
    addressAr: 'شارع العابد، الشعلان، بناء الفيحاء',
    addressEn: 'Al-Abed Street, Shaalan, Al-Fayha Building',
    latitude: 33.5128,
    longitude: 36.2892,
    contacts: [
      { type: ContactType.PHONE, value: '+963 11 231 5678', isPrimary: true },
      { type: ContactType.MOBILE, value: '+963 988 765 432' },
      { type: ContactType.EMAIL, value: 'clinic@drahmad-eyes.sy' },
      { type: ContactType.WEBSITE, value: 'https://drahmad-eyes.sy' },
    ],
    workingHours: [
      { day: DayOfWeek.SUNDAY, open: '09:00', close: '17:00' },
      { day: DayOfWeek.MONDAY, open: '09:00', close: '17:00' },
      { day: DayOfWeek.TUESDAY, open: '09:00', close: '17:00' },
      { day: DayOfWeek.WEDNESDAY, open: '09:00', close: '17:00' },
      { day: DayOfWeek.THURSDAY, open: '09:00', close: '14:00' },
      { day: DayOfWeek.FRIDAY, isClosed: true },
      { day: DayOfWeek.SATURDAY, open: '09:00', close: '14:00' },
    ],
    isFeatured: true,
  },
  {
    nameAr: 'متجر التقنية',
    nameEn: 'Tech Store',
    slug: 'tech-store',
    descriptionAr:
      'متجر متخصص في بيع الأجهزة الإلكترونية والهواتف الذكية والإكسسوارات. وكيل معتمد لأكبر الماركات العالمية. خدمة ما بعد البيع وضمان حقيقي.',
    descriptionEn:
      'A store specializing in selling electronic devices, smartphones and accessories. Authorized dealer for major global brands.',
    categorySlug: 'electronics',
    governorateSlug: 'aleppo',
    citySlug: 'aleppo-city',
    districtSlug: 'aziziyah',
    addressAr: 'شارع القوتلي، العزيزية',
    addressEn: 'Al-Quwatli Street, Aziziyah',
    latitude: 36.2021,
    longitude: 37.1343,
    contacts: [
      { type: ContactType.PHONE, value: '+963 21 265 4321', isPrimary: true },
      { type: ContactType.MOBILE, value: '+963 936 543 210' },
      { type: ContactType.WHATSAPP, value: '+963 936 543 210' },
      { type: ContactType.EMAIL, value: 'sales@techstore.sy' },
      { type: ContactType.WEBSITE, value: 'https://techstore.sy' },
    ],
    workingHours: [
      { day: DayOfWeek.SUNDAY, open: '09:00', close: '21:00' },
      { day: DayOfWeek.MONDAY, open: '09:00', close: '21:00' },
      { day: DayOfWeek.TUESDAY, open: '09:00', close: '21:00' },
      { day: DayOfWeek.WEDNESDAY, open: '09:00', close: '21:00' },
      { day: DayOfWeek.THURSDAY, open: '09:00', close: '21:00' },
      { day: DayOfWeek.FRIDAY, open: '14:00', close: '21:00' },
      { day: DayOfWeek.SATURDAY, open: '09:00', close: '21:00' },
    ],
    isFeatured: true,
  },
  {
    nameAr: 'مكتب الأمانة العقاري',
    nameEn: 'Al-Amana Real Estate',
    slug: 'alamana-realestate',
    descriptionAr:
      'مكتب عقاري متخصص في بيع وتأجير الشقق والفلل والمحلات التجارية. خبرة تزيد عن 15 عاماً في السوق العقاري السوري.',
    descriptionEn:
      'A real estate office specializing in selling and renting apartments, villas and commercial shops.',
    categorySlug: 'real-estate-offices',
    governorateSlug: 'homs',
    citySlug: 'homs-city',
    districtSlug: 'waer',
    addressAr: 'حي الوعر، شارع الزهراء',
    addressEn: 'Al-Waer District, Al-Zahra Street',
    latitude: 34.7525,
    longitude: 36.72,
    contacts: [
      { type: ContactType.PHONE, value: '+963 31 555 1234', isPrimary: true },
      { type: ContactType.MOBILE, value: '+963 922 333 444' },
      { type: ContactType.WHATSAPP, value: '+963 922 333 444' },
      { type: ContactType.EMAIL, value: 'info@alamana-re.sy' },
    ],
    workingHours: [
      { day: DayOfWeek.SUNDAY, open: '09:00', close: '18:00' },
      { day: DayOfWeek.MONDAY, open: '09:00', close: '18:00' },
      { day: DayOfWeek.TUESDAY, open: '09:00', close: '18:00' },
      { day: DayOfWeek.WEDNESDAY, open: '09:00', close: '18:00' },
      { day: DayOfWeek.THURSDAY, open: '09:00', close: '15:00' },
      { day: DayOfWeek.FRIDAY, isClosed: true },
      { day: DayOfWeek.SATURDAY, open: '09:00', close: '15:00' },
    ],
    isFeatured: false,
  },
  {
    nameAr: 'معهد لغات المستقبل',
    nameEn: 'Future Language Institute',
    slug: 'future-language-institute',
    descriptionAr:
      'معهد متخصص في تعليم اللغات الأجنبية (إنجليزي، فرنسي، ألماني، تركي). دورات مكثفة ومسائية. شهادات معتمدة دولياً.',
    descriptionEn:
      'An institute specializing in teaching foreign languages. Intensive and evening courses with internationally recognized certificates.',
    categorySlug: 'language-institutes',
    governorateSlug: 'latakia',
    citySlug: 'latakia-city',
    districtSlug: 'ziraah',
    addressAr: 'شارع 8 آذار، الزراعة',
    addressEn: '8 March Street, Ziraah',
    latitude: 35.5317,
    longitude: 35.79,
    contacts: [
      { type: ContactType.PHONE, value: '+963 41 478 9012', isPrimary: true },
      { type: ContactType.MOBILE, value: '+963 911 222 333' },
      { type: ContactType.EMAIL, value: 'info@future-lang.sy' },
      { type: ContactType.WEBSITE, value: 'https://future-lang.sy' },
    ],
    workingHours: [
      { day: DayOfWeek.SUNDAY, open: '08:00', close: '20:00' },
      { day: DayOfWeek.MONDAY, open: '08:00', close: '20:00' },
      { day: DayOfWeek.TUESDAY, open: '08:00', close: '20:00' },
      { day: DayOfWeek.WEDNESDAY, open: '08:00', close: '20:00' },
      { day: DayOfWeek.THURSDAY, open: '08:00', close: '20:00' },
      { day: DayOfWeek.FRIDAY, isClosed: true },
      { day: DayOfWeek.SATURDAY, open: '09:00', close: '14:00' },
    ],
    isFeatured: true,
  },
  {
    nameAr: 'مركز اللياقة الذهبي',
    nameEn: 'Golden Fitness Center',
    slug: 'golden-fitness',
    descriptionAr:
      'نادي رياضي متكامل مجهز بأحدث الأجهزة الرياضية. صالات منفصلة للرجال والنساء. مدربين معتمدين دولياً. ساونا ومسبح.',
    descriptionEn:
      'A complete sports club equipped with the latest sports equipment. Separate halls for men and women.',
    categorySlug: 'sports-clubs',
    governorateSlug: 'damascus',
    citySlug: 'damascus-city',
    districtSlug: 'kafr-souseh',
    addressAr: 'أوتوستراد المزة، كفرسوسة',
    addressEn: 'Mezzeh Highway, Kafr Souseh',
    latitude: 33.4985,
    longitude: 36.2652,
    contacts: [
      { type: ContactType.PHONE, value: '+963 11 613 7890', isPrimary: true },
      { type: ContactType.MOBILE, value: '+963 966 789 012' },
      { type: ContactType.WHATSAPP, value: '+963 966 789 012' },
      { type: ContactType.EMAIL, value: 'info@goldenfitness.sy' },
      {
        type: ContactType.INSTAGRAM,
        value: 'https://instagram.com/goldenfitness.sy',
      },
    ],
    workingHours: [
      { day: DayOfWeek.SUNDAY, open: '06:00', close: '23:00' },
      { day: DayOfWeek.MONDAY, open: '06:00', close: '23:00' },
      { day: DayOfWeek.TUESDAY, open: '06:00', close: '23:00' },
      { day: DayOfWeek.WEDNESDAY, open: '06:00', close: '23:00' },
      { day: DayOfWeek.THURSDAY, open: '06:00', close: '23:00' },
      { day: DayOfWeek.FRIDAY, open: '08:00', close: '22:00' },
      { day: DayOfWeek.SATURDAY, open: '06:00', close: '23:00' },
    ],
    isFeatured: true,
  },
  {
    nameAr: 'شركة البرمجيات المتقدمة',
    nameEn: 'Advanced Software Company',
    slug: 'advanced-software',
    descriptionAr:
      'شركة متخصصة في تطوير البرمجيات وتطبيقات الموبايل والمواقع الإلكترونية. خبرة تزيد عن 10 سنوات في السوق المحلي والدولي.',
    descriptionEn:
      'A company specializing in software development, mobile applications and websites.',
    categorySlug: 'software-companies',
    governorateSlug: 'damascus',
    citySlug: 'damascus-city',
    districtSlug: 'muhajirin',
    addressAr: 'شارع العابد، المهاجرين',
    addressEn: 'Al-Abed Street, Muhajirin',
    latitude: 33.5245,
    longitude: 36.2856,
    contacts: [
      { type: ContactType.PHONE, value: '+963 11 445 6789', isPrimary: true },
      { type: ContactType.MOBILE, value: '+963 977 654 321' },
      { type: ContactType.EMAIL, value: 'info@advancedsw.sy' },
      { type: ContactType.WEBSITE, value: 'https://advancedsw.sy' },
      {
        type: ContactType.LINKEDIN,
        value: 'https://linkedin.com/company/advancedsw',
      },
    ],
    workingHours: [
      { day: DayOfWeek.SUNDAY, open: '09:00', close: '17:00' },
      { day: DayOfWeek.MONDAY, open: '09:00', close: '17:00' },
      { day: DayOfWeek.TUESDAY, open: '09:00', close: '17:00' },
      { day: DayOfWeek.WEDNESDAY, open: '09:00', close: '17:00' },
      { day: DayOfWeek.THURSDAY, open: '09:00', close: '17:00' },
      { day: DayOfWeek.FRIDAY, isClosed: true },
      { day: DayOfWeek.SATURDAY, isClosed: true },
    ],
    isFeatured: true,
  },
  {
    nameAr: 'فندق الياسمين',
    nameEn: 'Jasmine Hotel',
    slug: 'jasmine-hotel',
    descriptionAr:
      'فندق 4 نجوم في قلب دمشق القديمة. غرف فاخرة مع إطلالة على المدينة. مطعم راقي وخدمة غرف على مدار الساعة. صالة مؤتمرات واجتماعات.',
    descriptionEn:
      'A 4-star hotel in the heart of old Damascus. Luxury rooms with city views. Fine dining restaurant and 24-hour room service.',
    categorySlug: 'hotels',
    governorateSlug: 'damascus',
    citySlug: 'damascus-city',
    districtSlug: 'bab-touma',
    addressAr: 'باب توما، قرب كنيسة المريمية',
    addressEn: 'Bab Touma, Near Al-Mariamiye Church',
    latitude: 33.5127,
    longitude: 36.3131,
    contacts: [
      { type: ContactType.PHONE, value: '+963 11 542 0000', isPrimary: true },
      { type: ContactType.MOBILE, value: '+963 933 420 000' },
      { type: ContactType.WHATSAPP, value: '+963 933 420 000' },
      { type: ContactType.EMAIL, value: 'reservations@jasminehotel.sy' },
      { type: ContactType.WEBSITE, value: 'https://jasminehotel.sy' },
      { type: ContactType.FACEBOOK, value: 'https://facebook.com/jasminehotel' },
      {
        type: ContactType.INSTAGRAM,
        value: 'https://instagram.com/jasminehotel',
      },
    ],
    workingHours: [
      { day: DayOfWeek.SUNDAY, is24Hours: true },
      { day: DayOfWeek.MONDAY, is24Hours: true },
      { day: DayOfWeek.TUESDAY, is24Hours: true },
      { day: DayOfWeek.WEDNESDAY, is24Hours: true },
      { day: DayOfWeek.THURSDAY, is24Hours: true },
      { day: DayOfWeek.FRIDAY, is24Hours: true },
      { day: DayOfWeek.SATURDAY, is24Hours: true },
    ],
    isFeatured: true,
  },
];

export async function seedBusinesses() {
  console.log('🏢 Seeding demo businesses...');

  // الحصول على المستخدم الأول كمالك للشركات التجريبية
  let owner = await prisma.user.findFirst({
    where: { role: 'BUSINESS' },
  });

  // إذا لم يوجد مالك، استخدام أي مستخدم موجود أو إنشاء واحد
  if (!owner) {
    // محاولة الحصول على أي مستخدم
    owner = await prisma.user.findFirst();
    
    if (!owner) {
      // Get Damascus governorate for demo owner
      const damascus = await prisma.governorate.findFirst({ where: { slug: 'damascus' } });
      
      // إنشاء مستخدم جديد مع كلمة مرور مشفرة مسبقاً
      // كلمة المرور: Demo@123456
      const hashedPassword = '$2b$10$EpDdS2ckjP6ZzQlr8J5N5O8HX2FqNr1VpLR8FpBU9GZq5vZr5QHqO';

      owner = await prisma.user.create({
        data: {
          email: 'demo-owner@greenpages.sy',
          password: hashedPassword,
          firstName: 'مالك',
          lastName: 'تجريبي',
          phone: '+963999000000',
          role: 'BUSINESS',
          status: 'ACTIVE',
          governorateId: damascus?.id,
        },
      });
      console.log('  ✓ Created demo business owner (demo-owner@greenpages.sy / Demo@123456)');
    }
  }

  for (const businessData of businessesData) {
    // البحث عن التصنيف
    const category = await prisma.category.findUnique({
      where: { slug: businessData.categorySlug },
    });

    if (!category) {
      console.log(`  ⚠ Category not found: ${businessData.categorySlug}, skipping ${businessData.nameAr}`);
      continue;
    }

    // البحث عن الموقع
    const governorate = await prisma.governorate.findUnique({
      where: { slug: businessData.governorateSlug },
    });

    const city = await prisma.city.findUnique({
      where: { slug: businessData.citySlug },
    });

    const district = businessData.districtSlug
      ? await prisma.district.findUnique({
          where: { slug: businessData.districtSlug },
        })
      : null;

    if (!governorate || !city) {
      console.log(`  ⚠ Location not found for: ${businessData.nameAr}`);
      continue;
    }

    // التحقق من وجود الشركة
    const existingBusiness = await prisma.business.findUnique({
      where: { slug: businessData.slug },
    });

    let business;

    if (existingBusiness) {
      // تحديث الشركة الموجودة
      business = await prisma.business.update({
        where: { slug: businessData.slug },
        data: {
          nameAr: businessData.nameAr,
          nameEn: businessData.nameEn,
          descriptionAr: businessData.descriptionAr,
          descriptionEn: businessData.descriptionEn,
          addressAr: businessData.addressAr,
          addressEn: businessData.addressEn,
          latitude: businessData.latitude,
          longitude: businessData.longitude,
          isFeatured: businessData.isFeatured,
          governorateId: governorate.id,
          cityId: city.id,
          districtId: district?.id,
        },
      });
    } else {
      // إنشاء شركة جديدة
      business = await prisma.business.create({
        data: {
          nameAr: businessData.nameAr,
          nameEn: businessData.nameEn,
          slug: businessData.slug,
          descriptionAr: businessData.descriptionAr,
          descriptionEn: businessData.descriptionEn,
          addressAr: businessData.addressAr,
          addressEn: businessData.addressEn,
          latitude: businessData.latitude,
          longitude: businessData.longitude,
          isFeatured: businessData.isFeatured,
          status: BusinessStatus.APPROVED,
          isVerified: true,
          ownerId: owner.id,
          governorateId: governorate.id,
          cityId: city.id,
          districtId: district?.id,
        },
      });
    }

    // ربط التصنيف بالشركة
    await prisma.businessCategory.upsert({
      where: {
        businessId_categoryId: {
          businessId: business.id,
          categoryId: category.id,
        },
      },
      update: { isPrimary: true },
      create: {
        businessId: business.id,
        categoryId: category.id,
        isPrimary: true,
      },
    });

    // حذف جهات الاتصال القديمة وإضافة الجديدة
    await prisma.businessContact.deleteMany({
      where: { businessId: business.id },
    });

    for (let i = 0; i < businessData.contacts.length; i++) {
      const contact = businessData.contacts[i];
      await prisma.businessContact.create({
        data: {
          businessId: business.id,
          type: contact.type,
          value: contact.value,
          isPrimary: contact.isPrimary || false,
          sortOrder: i,
        },
      });
    }

    // حذف ساعات العمل القديمة وإضافة الجديدة
    await prisma.businessWorkingHours.deleteMany({
      where: { businessId: business.id },
    });

    for (const hours of businessData.workingHours) {
      await prisma.businessWorkingHours.create({
        data: {
          businessId: business.id,
          dayOfWeek: hours.day,
          openTime: hours.open || null,
          closeTime: hours.close || null,
          isClosed: hours.isClosed || false,
          is24Hours: hours.is24Hours || false,
        },
      });
    }

    console.log(`  ✓ ${businessData.nameAr}`);
    
    // حقن مشاهدات تجريبية
    await seedBusinessViews(business.id);
  }

  console.log('✅ Demo businesses seeded successfully!');
}

async function seedBusinessViews(businessId: string) {
  const today = new Date();
  
  // توليد مشاهدات لآخر 30 يوم
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const count = Math.floor(Math.random() * 50) + 10; // عدد عشوائي بين 10 و 60

    await prisma.businessView.upsert({
      where: {
        businessId_date: {
          businessId,
          date,
        },
      },
      update: { count },
      create: {
        businessId,
        date,
        count,
      },
    });
  }
}

// تشغيل مستقل
if (require.main === module) {
  seedBusinesses()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e);
      prisma.$disconnect();
      process.exit(1);
    });
}
