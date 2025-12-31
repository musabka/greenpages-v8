/**
 * Syrian Governorates, Cities, and Districts Seed Data
 * المحافظات السورية والمدن والأحياء
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// المحافظات السورية مع المدن والأحياء
const governoratesData = [
  {
    nameAr: 'دمشق',
    nameEn: 'Damascus',
    slug: 'damascus',
    code: 'DM',
    cities: [
      {
        nameAr: 'دمشق',
        nameEn: 'Damascus',
        slug: 'damascus-city',
        districts: [
          { nameAr: 'المزة', nameEn: 'Mezzeh', slug: 'mezzeh' },
          { nameAr: 'المالكي', nameEn: 'Malki', slug: 'malki' },
          { nameAr: 'أبو رمانة', nameEn: 'Abu Rummaneh', slug: 'abu-rummaneh' },
          { nameAr: 'الشعلان', nameEn: 'Shaalan', slug: 'shaalan' },
          { nameAr: 'الصالحية', nameEn: 'Salihiyah', slug: 'salihiyah' },
          { nameAr: 'القصاع', nameEn: 'Qassaa', slug: 'qassaa' },
          { nameAr: 'باب توما', nameEn: 'Bab Touma', slug: 'bab-touma' },
          { nameAr: 'باب شرقي', nameEn: 'Bab Sharqi', slug: 'bab-sharqi' },
          { nameAr: 'الميدان', nameEn: 'Midan', slug: 'midan' },
          { nameAr: 'كفرسوسة', nameEn: 'Kafr Souseh', slug: 'kafr-souseh' },
          { nameAr: 'المهاجرين', nameEn: 'Muhajirin', slug: 'muhajirin' },
          { nameAr: 'ركن الدين', nameEn: 'Rukn al-Din', slug: 'rukn-al-din' },
          { nameAr: 'برزة', nameEn: 'Barzeh', slug: 'barzeh' },
          { nameAr: 'القابون', nameEn: 'Qaboun', slug: 'qaboun' },
          { nameAr: 'جوبر', nameEn: 'Jobar', slug: 'jobar' },
          { nameAr: 'الدويلعة', nameEn: 'Dwelaa', slug: 'dwelaa' },
          { nameAr: 'التجارة', nameEn: 'Tijara', slug: 'tijara' },
          { nameAr: 'الحريقة', nameEn: 'Hariqa', slug: 'hariqa' },
        ],
      },
    ],
  },
  {
    nameAr: 'ريف دمشق',
    nameEn: 'Rif Dimashq',
    slug: 'rif-dimashq',
    code: 'RD',
    cities: [
      {
        nameAr: 'جرمانا',
        nameEn: 'Jaramana',
        slug: 'jaramana',
        districts: [
          { nameAr: 'جرمانا البلد', nameEn: 'Jaramana Downtown', slug: 'jaramana-downtown' },
          { nameAr: 'الورود', nameEn: 'Al Woroud', slug: 'jaramana-woroud' },
          { nameAr: 'الزهور', nameEn: 'Al Zuhour', slug: 'jaramana-zuhour' },
        ],
      },
      {
        nameAr: 'داريا',
        nameEn: 'Darayya',
        slug: 'darayya',
        districts: [
          { nameAr: 'داريا البلد', nameEn: 'Darayya Downtown', slug: 'darayya-downtown' },
        ],
      },
      {
        nameAr: 'صحنايا',
        nameEn: 'Sahnaya',
        slug: 'sahnaya',
        districts: [
          { nameAr: 'صحنايا البلد', nameEn: 'Sahnaya Downtown', slug: 'sahnaya-downtown' },
        ],
      },
      {
        nameAr: 'قدسيا',
        nameEn: 'Qudsaya',
        slug: 'qudsaya',
        districts: [
          { nameAr: 'قدسيا البلد', nameEn: 'Qudsaya Downtown', slug: 'qudsaya-downtown' },
        ],
      },
      {
        nameAr: 'دوما',
        nameEn: 'Douma',
        slug: 'douma',
        districts: [
          { nameAr: 'دوما البلد', nameEn: 'Douma Downtown', slug: 'douma-downtown' },
        ],
      },
      {
        nameAr: 'حرستا',
        nameEn: 'Harasta',
        slug: 'harasta',
        districts: [
          { nameAr: 'حرستا البلد', nameEn: 'Harasta Downtown', slug: 'harasta-downtown' },
        ],
      },
      {
        nameAr: 'عربين',
        nameEn: 'Arbin',
        slug: 'arbin',
        districts: [
          { nameAr: 'عربين البلد', nameEn: 'Arbin Downtown', slug: 'arbin-downtown' },
        ],
      },
      {
        nameAr: 'سقبا',
        nameEn: 'Saqba',
        slug: 'saqba',
        districts: [
          { nameAr: 'سقبا البلد', nameEn: 'Saqba Downtown', slug: 'saqba-downtown' },
        ],
      },
    ],
  },
  {
    nameAr: 'حلب',
    nameEn: 'Aleppo',
    slug: 'aleppo',
    code: 'AL',
    cities: [
      {
        nameAr: 'حلب',
        nameEn: 'Aleppo',
        slug: 'aleppo-city',
        districts: [
          { nameAr: 'العزيزية', nameEn: 'Aziziyah', slug: 'aziziyah' },
          { nameAr: 'الحمدانية', nameEn: 'Hamdaniyah', slug: 'hamdaniyah' },
          { nameAr: 'الفرقان', nameEn: 'Furqan', slug: 'furqan' },
          { nameAr: 'السريان', nameEn: 'Suryan', slug: 'suryan' },
          { nameAr: 'الجميلية', nameEn: 'Jamiliyah', slug: 'jamiliyah' },
          { nameAr: 'السبيل', nameEn: 'Sabil', slug: 'sabil' },
          { nameAr: 'الشهباء', nameEn: 'Shahba', slug: 'shahba' },
          { nameAr: 'صلاح الدين', nameEn: 'Salah al-Din', slug: 'salah-al-din' },
          { nameAr: 'الميدان', nameEn: 'Maydan', slug: 'aleppo-maydan' },
          { nameAr: 'المشارقة', nameEn: 'Mashareqa', slug: 'mashareqa' },
          { nameAr: 'بستان القصر', nameEn: 'Bustan al-Qasr', slug: 'bustan-qasr' },
          { nameAr: 'الكلاسة', nameEn: 'Kallasah', slug: 'kallasah' },
        ],
      },
      {
        nameAr: 'منبج',
        nameEn: 'Manbij',
        slug: 'manbij',
        districts: [
          { nameAr: 'منبج البلد', nameEn: 'Manbij Downtown', slug: 'manbij-downtown' },
        ],
      },
      {
        nameAr: 'الباب',
        nameEn: 'Al-Bab',
        slug: 'al-bab',
        districts: [
          { nameAr: 'الباب البلد', nameEn: 'Al-Bab Downtown', slug: 'al-bab-downtown' },
        ],
      },
      {
        nameAr: 'أعزاز',
        nameEn: 'Azaz',
        slug: 'azaz',
        districts: [
          { nameAr: 'أعزاز البلد', nameEn: 'Azaz Downtown', slug: 'azaz-downtown' },
        ],
      },
    ],
  },
  {
    nameAr: 'حمص',
    nameEn: 'Homs',
    slug: 'homs',
    code: 'HM',
    cities: [
      {
        nameAr: 'حمص',
        nameEn: 'Homs',
        slug: 'homs-city',
        districts: [
          { nameAr: 'الحمرا', nameEn: 'Hamra', slug: 'homs-hamra' },
          { nameAr: 'الوعر', nameEn: 'Waer', slug: 'waer' },
          { nameAr: 'الإنشاءات', nameEn: 'Inshaaat', slug: 'inshaaat' },
          { nameAr: 'بابا عمرو', nameEn: 'Baba Amr', slug: 'baba-amr' },
          { nameAr: 'كرم الزيتون', nameEn: 'Karm al-Zeitoun', slug: 'karm-zeitoun' },
          { nameAr: 'الخالدية', nameEn: 'Khalidiya', slug: 'khalidiya' },
          { nameAr: 'عكرمة', nameEn: 'Akrama', slug: 'akrama' },
          { nameAr: 'الزهراء', nameEn: 'Zahraa', slug: 'homs-zahraa' },
        ],
      },
      {
        nameAr: 'تدمر',
        nameEn: 'Palmyra',
        slug: 'palmyra',
        districts: [
          { nameAr: 'تدمر البلد', nameEn: 'Palmyra Downtown', slug: 'palmyra-downtown' },
        ],
      },
      {
        nameAr: 'القصير',
        nameEn: 'Al-Qusayr',
        slug: 'qusayr',
        districts: [
          { nameAr: 'القصير البلد', nameEn: 'Al-Qusayr Downtown', slug: 'qusayr-downtown' },
        ],
      },
    ],
  },
  {
    nameAr: 'حماة',
    nameEn: 'Hama',
    slug: 'hama',
    code: 'HA',
    cities: [
      {
        nameAr: 'حماة',
        nameEn: 'Hama',
        slug: 'hama-city',
        districts: [
          { nameAr: 'الحاضر', nameEn: 'Hader', slug: 'hader' },
          { nameAr: 'المرابط', nameEn: 'Murabet', slug: 'murabet' },
          { nameAr: 'الكيلانية', nameEn: 'Kilaniya', slug: 'kilaniya' },
          { nameAr: 'العليليات', nameEn: 'Alaliyat', slug: 'alaliyat' },
          { nameAr: 'الضاهرية', nameEn: 'Dahiriya', slug: 'dahiriya' },
          { nameAr: 'الحميدية', nameEn: 'Hamidiya', slug: 'hamidiya' },
        ],
      },
      {
        nameAr: 'سلمية',
        nameEn: 'Salamiyah',
        slug: 'salamiyah',
        districts: [
          { nameAr: 'سلمية البلد', nameEn: 'Salamiyah Downtown', slug: 'salamiyah-downtown' },
        ],
      },
      {
        nameAr: 'مصياف',
        nameEn: 'Masyaf',
        slug: 'masyaf',
        districts: [
          { nameAr: 'مصياف البلد', nameEn: 'Masyaf Downtown', slug: 'masyaf-downtown' },
        ],
      },
    ],
  },
  {
    nameAr: 'اللاذقية',
    nameEn: 'Latakia',
    slug: 'latakia',
    code: 'LA',
    cities: [
      {
        nameAr: 'اللاذقية',
        nameEn: 'Latakia',
        slug: 'latakia-city',
        districts: [
          { nameAr: 'الزراعة', nameEn: 'Ziraah', slug: 'ziraah' },
          { nameAr: 'الأمريكان', nameEn: 'American', slug: 'american' },
          { nameAr: 'الصليبة', nameEn: 'Salibeh', slug: 'salibeh' },
          { nameAr: 'الرمل الشمالي', nameEn: 'North Raml', slug: 'north-raml' },
          { nameAr: 'الرمل الجنوبي', nameEn: 'South Raml', slug: 'south-raml' },
          { nameAr: 'الشيخ ضاهر', nameEn: 'Sheikh Daher', slug: 'sheikh-daher' },
          { nameAr: 'المشروع العاشر', nameEn: 'Project 10', slug: 'project-10' },
        ],
      },
      {
        nameAr: 'جبلة',
        nameEn: 'Jableh',
        slug: 'jableh',
        districts: [
          { nameAr: 'جبلة البلد', nameEn: 'Jableh Downtown', slug: 'jableh-downtown' },
        ],
      },
      {
        nameAr: 'القرداحة',
        nameEn: 'Qardaha',
        slug: 'qardaha',
        districts: [
          { nameAr: 'القرداحة البلد', nameEn: 'Qardaha Downtown', slug: 'qardaha-downtown' },
        ],
      },
    ],
  },
  {
    nameAr: 'طرطوس',
    nameEn: 'Tartus',
    slug: 'tartus',
    code: 'TA',
    cities: [
      {
        nameAr: 'طرطوس',
        nameEn: 'Tartus',
        slug: 'tartus-city',
        districts: [
          { nameAr: 'الكورنيش', nameEn: 'Corniche', slug: 'corniche' },
          { nameAr: 'الثورة', nameEn: 'Thawra', slug: 'thawra' },
          { nameAr: 'المشتل', nameEn: 'Mashtal', slug: 'mashtal' },
          { nameAr: 'الشريفة', nameEn: 'Sharifeh', slug: 'sharifeh' },
          { nameAr: 'القادسية', nameEn: 'Qadisiya', slug: 'qadisiya' },
        ],
      },
      {
        nameAr: 'بانياس',
        nameEn: 'Baniyas',
        slug: 'baniyas',
        districts: [
          { nameAr: 'بانياس البلد', nameEn: 'Baniyas Downtown', slug: 'baniyas-downtown' },
        ],
      },
      {
        nameAr: 'صافيتا',
        nameEn: 'Safita',
        slug: 'safita',
        districts: [
          { nameAr: 'صافيتا البلد', nameEn: 'Safita Downtown', slug: 'safita-downtown' },
        ],
      },
    ],
  },
  {
    nameAr: 'دير الزور',
    nameEn: 'Deir ez-Zor',
    slug: 'deir-ez-zor',
    code: 'DZ',
    cities: [
      {
        nameAr: 'دير الزور',
        nameEn: 'Deir ez-Zor',
        slug: 'deir-ez-zor-city',
        districts: [
          { nameAr: 'الجورة', nameEn: 'Jourah', slug: 'jourah' },
          { nameAr: 'الحميدية', nameEn: 'Hamidiya', slug: 'dz-hamidiya' },
          { nameAr: 'الموظفين', nameEn: 'Muwazafin', slug: 'muwazafin' },
          { nameAr: 'الرشدية', nameEn: 'Rashdiya', slug: 'rashdiya' },
        ],
      },
      {
        nameAr: 'الميادين',
        nameEn: 'Mayadin',
        slug: 'mayadin',
        districts: [
          { nameAr: 'الميادين البلد', nameEn: 'Mayadin Downtown', slug: 'mayadin-downtown' },
        ],
      },
      {
        nameAr: 'البوكمال',
        nameEn: 'Abu Kamal',
        slug: 'abu-kamal',
        districts: [
          { nameAr: 'البوكمال البلد', nameEn: 'Abu Kamal Downtown', slug: 'abu-kamal-downtown' },
        ],
      },
    ],
  },
  {
    nameAr: 'الحسكة',
    nameEn: 'Al-Hasakah',
    slug: 'hasakah',
    code: 'HS',
    cities: [
      {
        nameAr: 'الحسكة',
        nameEn: 'Al-Hasakah',
        slug: 'hasakah-city',
        districts: [
          { nameAr: 'الناصرة', nameEn: 'Nasira', slug: 'nasira' },
          { nameAr: 'العزيزية', nameEn: 'Aziziya', slug: 'hasakah-aziziya' },
          { nameAr: 'النشوة', nameEn: 'Nashwa', slug: 'nashwa' },
          { nameAr: 'غويران', nameEn: 'Ghweran', slug: 'ghweran' },
        ],
      },
      {
        nameAr: 'القامشلي',
        nameEn: 'Qamishli',
        slug: 'qamishli',
        districts: [
          { nameAr: 'القامشلي البلد', nameEn: 'Qamishli Downtown', slug: 'qamishli-downtown' },
          { nameAr: 'الهلالية', nameEn: 'Hilaliya', slug: 'hilaliya' },
          { nameAr: 'قدور بك', nameEn: 'Qadur Bek', slug: 'qadur-bek' },
        ],
      },
      {
        nameAr: 'رأس العين',
        nameEn: 'Ras al-Ayn',
        slug: 'ras-al-ayn',
        districts: [
          { nameAr: 'رأس العين البلد', nameEn: 'Ras al-Ayn Downtown', slug: 'ras-al-ayn-downtown' },
        ],
      },
    ],
  },
  {
    nameAr: 'الرقة',
    nameEn: 'Raqqa',
    slug: 'raqqa',
    code: 'RA',
    cities: [
      {
        nameAr: 'الرقة',
        nameEn: 'Raqqa',
        slug: 'raqqa-city',
        districts: [
          { nameAr: 'المشلب', nameEn: 'Mashlab', slug: 'mashlab' },
          { nameAr: 'الدرعية', nameEn: 'Dariya', slug: 'raqqa-dariya' },
          { nameAr: 'الرميلة', nameEn: 'Rumayla', slug: 'rumayla' },
          { nameAr: 'الثكنة', nameEn: 'Thakana', slug: 'thakana' },
        ],
      },
      {
        nameAr: 'الطبقة',
        nameEn: 'Tabqa',
        slug: 'tabqa',
        districts: [
          { nameAr: 'الطبقة البلد', nameEn: 'Tabqa Downtown', slug: 'tabqa-downtown' },
        ],
      },
    ],
  },
  {
    nameAr: 'إدلب',
    nameEn: 'Idlib',
    slug: 'idlib',
    code: 'ID',
    cities: [
      {
        nameAr: 'إدلب',
        nameEn: 'Idlib',
        slug: 'idlib-city',
        districts: [
          { nameAr: 'إدلب البلد', nameEn: 'Idlib Downtown', slug: 'idlib-downtown' },
          { nameAr: 'الضاهرية', nameEn: 'Dahiriya', slug: 'idlib-dahiriya' },
          { nameAr: 'الحرية', nameEn: 'Hurriya', slug: 'hurriya' },
        ],
      },
      {
        nameAr: 'معرة النعمان',
        nameEn: 'Maarat al-Numan',
        slug: 'maarat-numan',
        districts: [
          { nameAr: 'معرة النعمان البلد', nameEn: 'Maarat al-Numan Downtown', slug: 'maarat-numan-downtown' },
        ],
      },
      {
        nameAr: 'أريحا',
        nameEn: 'Ariha',
        slug: 'ariha',
        districts: [
          { nameAr: 'أريحا البلد', nameEn: 'Ariha Downtown', slug: 'ariha-downtown' },
        ],
      },
      {
        nameAr: 'جسر الشغور',
        nameEn: 'Jisr al-Shughur',
        slug: 'jisr-shughur',
        districts: [
          { nameAr: 'جسر الشغور البلد', nameEn: 'Jisr al-Shughur Downtown', slug: 'jisr-shughur-downtown' },
        ],
      },
    ],
  },
  {
    nameAr: 'درعا',
    nameEn: 'Daraa',
    slug: 'daraa',
    code: 'DA',
    cities: [
      {
        nameAr: 'درعا',
        nameEn: 'Daraa',
        slug: 'daraa-city',
        districts: [
          { nameAr: 'درعا البلد', nameEn: 'Daraa Downtown', slug: 'daraa-downtown' },
          { nameAr: 'المحطة', nameEn: 'Mahatta', slug: 'mahatta' },
          { nameAr: 'طريق السد', nameEn: 'Tariq al-Sad', slug: 'tariq-sad' },
          { nameAr: 'السبيل', nameEn: 'Sabil', slug: 'daraa-sabil' },
        ],
      },
      {
        nameAr: 'إنخل',
        nameEn: 'Inkhil',
        slug: 'inkhil',
        districts: [
          { nameAr: 'إنخل البلد', nameEn: 'Inkhil Downtown', slug: 'inkhil-downtown' },
        ],
      },
      {
        nameAr: 'الصنمين',
        nameEn: 'Sanamayn',
        slug: 'sanamayn',
        districts: [
          { nameAr: 'الصنمين البلد', nameEn: 'Sanamayn Downtown', slug: 'sanamayn-downtown' },
        ],
      },
    ],
  },
  {
    nameAr: 'السويداء',
    nameEn: 'As-Suwayda',
    slug: 'suwayda',
    code: 'SW',
    cities: [
      {
        nameAr: 'السويداء',
        nameEn: 'As-Suwayda',
        slug: 'suwayda-city',
        districts: [
          { nameAr: 'السويداء البلد', nameEn: 'Suwayda Downtown', slug: 'suwayda-downtown' },
          { nameAr: 'الشعب', nameEn: 'Shaab', slug: 'shaab' },
          { nameAr: 'المرج', nameEn: 'Marj', slug: 'marj' },
        ],
      },
      {
        nameAr: 'شهبا',
        nameEn: 'Shahba',
        slug: 'shahba-city',
        districts: [
          { nameAr: 'شهبا البلد', nameEn: 'Shahba Downtown', slug: 'shahba-downtown' },
        ],
      },
      {
        nameAr: 'صلخد',
        nameEn: 'Salkhad',
        slug: 'salkhad',
        districts: [
          { nameAr: 'صلخد البلد', nameEn: 'Salkhad Downtown', slug: 'salkhad-downtown' },
        ],
      },
    ],
  },
  {
    nameAr: 'القنيطرة',
    nameEn: 'Quneitra',
    slug: 'quneitra',
    code: 'QU',
    cities: [
      {
        nameAr: 'القنيطرة',
        nameEn: 'Quneitra',
        slug: 'quneitra-city',
        districts: [
          { nameAr: 'القنيطرة البلد', nameEn: 'Quneitra Downtown', slug: 'quneitra-downtown' },
        ],
      },
      {
        nameAr: 'خان أرنبة',
        nameEn: 'Khan Arnabah',
        slug: 'khan-arnabah',
        districts: [
          { nameAr: 'خان أرنبة البلد', nameEn: 'Khan Arnabah Downtown', slug: 'khan-arnabah-downtown' },
        ],
      },
    ],
  },
];

export async function seedLocations() {
  console.log('🌍 Seeding locations (Governorates, Cities, Districts)...');

  for (const gov of governoratesData) {
    // إنشاء المحافظة
    const governorate = await prisma.governorate.upsert({
      where: { slug: gov.slug },
      update: {
        nameAr: gov.nameAr,
        nameEn: gov.nameEn,
      },
      create: {
        nameAr: gov.nameAr,
        nameEn: gov.nameEn,
        slug: gov.slug,
        isActive: true,
      },
    });

    console.log(`  ✓ Governorate: ${gov.nameAr}`);

    // إنشاء المدن
    for (const city of gov.cities) {
      const createdCity = await prisma.city.upsert({
        where: { slug: city.slug },
        update: {
          nameAr: city.nameAr,
          nameEn: city.nameEn,
          governorateId: governorate.id,
        },
        create: {
          nameAr: city.nameAr,
          nameEn: city.nameEn,
          slug: city.slug,
          governorateId: governorate.id,
          isActive: true,
        },
      });

      console.log(`    ✓ City: ${city.nameAr}`);

      // إنشاء الأحياء
      for (const district of city.districts) {
        await prisma.district.upsert({
          where: { slug: district.slug },
          update: {
            nameAr: district.nameAr,
            nameEn: district.nameEn,
            cityId: createdCity.id,
          },
          create: {
            nameAr: district.nameAr,
            nameEn: district.nameEn,
            slug: district.slug,
            cityId: createdCity.id,
            isActive: true,
          },
        });
      }

      console.log(`      ✓ ${city.districts.length} districts added`);
    }
  }

  console.log('✅ Locations seeded successfully!');
}

// تشغيل مستقل
if (require.main === module) {
  seedLocations()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e);
      prisma.$disconnect();
      process.exit(1);
    });
}
