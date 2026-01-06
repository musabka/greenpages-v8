import { PrismaClient, PackageStatus, FeatureKey, LimitKey } from '@prisma/client';

export async function seedPackages(prisma: PrismaClient) {
  console.log('📦 زراعة بيانات الباقات...');

  const packages = [
    {
      slug: 'free',
      nameAr: 'الباقة المجانية',
      nameEn: 'Free Package',
      descriptionAr: 'الباقة الأساسية الدائمة لجميع الأنشطة التجارية',
      price: 0,
      durationDays: 0,
      isDefault: true,
      isPublic: true,
      status: PackageStatus.ACTIVE,
      sortOrder: 1,
      features: [
        { featureKey: FeatureKey.SHOW_ADDRESS, isEnabled: true },
        { featureKey: FeatureKey.SHOW_PHONE, isEnabled: true },
        { featureKey: FeatureKey.SHOW_WORKING_HOURS, isEnabled: true },
      ],
      limits: [
        { limitKey: LimitKey.MAX_GALLERY_PHOTOS, limitValue: 3 },
        { limitKey: LimitKey.MAX_BRANCHES, limitValue: 1 },
      ]
    },
    {
      slug: 'silver',
      nameAr: 'الباقة الفضية',
      nameEn: 'Silver Package',
      descriptionAr: 'باقة مميزة للشركات المتوسطة مع ميزات إضافية',
      price: 100000,
      durationDays: 30,
      isDefault: false,
      isPublic: true,
      status: PackageStatus.ACTIVE,
      sortOrder: 2,
      features: [
        { featureKey: FeatureKey.SHOW_ADDRESS, isEnabled: true },
        { featureKey: FeatureKey.SHOW_PHONE, isEnabled: true },
        { featureKey: FeatureKey.SHOW_WHATSAPP, isEnabled: true },
        { featureKey: FeatureKey.SHOW_WORKING_HOURS, isEnabled: true },
        { featureKey: FeatureKey.SHOW_GALLERY, isEnabled: true },
        { featureKey: FeatureKey.SHOW_MAP, isEnabled: true },
      ],
      limits: [
        { limitKey: LimitKey.MAX_GALLERY_PHOTOS, limitValue: 10 },
        { limitKey: LimitKey.MAX_BRANCHES, limitValue: 3 },
        { limitKey: LimitKey.MAX_PRODUCTS, limitValue: 20 },
      ]
    },
    {
      slug: 'gold',
      nameAr: 'الباقة الذهبية',
      nameEn: 'Gold Package',
      descriptionAr: 'الباقة الكاملة مع ظهور مميز ودعم فني متواصل',
      price: 250000,
      durationDays: 30,
      isDefault: false,
      isPublic: true,
      status: PackageStatus.ACTIVE,
      sortOrder: 3,
      features: [
        { featureKey: FeatureKey.AD_ALLOWED, isEnabled: true },
        { featureKey: FeatureKey.SHOW_DESCRIPTION, isEnabled: true },
        { featureKey: FeatureKey.SHOW_GALLERY, isEnabled: true },
        { featureKey: FeatureKey.SHOW_TEAM, isEnabled: true },
        { featureKey: FeatureKey.SHOW_PRODUCTS, isEnabled: true },
        { featureKey: FeatureKey.SHOW_BRANCHES, isEnabled: true },
        { featureKey: FeatureKey.SHOW_WORKING_HOURS, isEnabled: true },
        { featureKey: FeatureKey.SHOW_REVIEWS, isEnabled: true },
        { featureKey: FeatureKey.SHOW_PHONE, isEnabled: true },
        { featureKey: FeatureKey.SHOW_WHATSAPP, isEnabled: true },
        { featureKey: FeatureKey.SHOW_EMAIL, isEnabled: true },
        { featureKey: FeatureKey.SHOW_WEBSITE, isEnabled: true },
        { featureKey: FeatureKey.SHOW_SOCIAL_LINKS, isEnabled: true },
        { featureKey: FeatureKey.SHOW_MAP, isEnabled: true },
        { featureKey: FeatureKey.SHOW_ADDRESS, isEnabled: true },
      ],
      limits: [
        { limitKey: LimitKey.MAX_GALLERY_PHOTOS, limitValue: 50 },
        { limitKey: LimitKey.MAX_BRANCHES, limitValue: 10 },
        { limitKey: LimitKey.MAX_PRODUCTS, limitValue: 100 },
        { limitKey: LimitKey.MAX_ADS, limitValue: 5 },
      ]
    }
  ];

  for (const pkgData of packages) {
    const { features, limits, ...pkg } = pkgData;
    
    const createdPkg = await prisma.package.upsert({
      where: { slug: pkg.slug },
      update: pkg,
      create: pkg,
    });

    // Seed features
    for (const feature of features) {
      console.log('Feature being inserted:', JSON.stringify(feature, null, 2));
      await prisma.packageFeature.create({
        data: {
          packageId: createdPkg.id,
          featureKey: feature.featureKey,
          isEnabled: feature.isEnabled,
        },
      });
    }

    // Seed limits
    for (const limit of limits) {
      await prisma.packageLimit.upsert({
        where: {
          packageId_limitKey: {
            packageId: createdPkg.id,
            limitKey: limit.limitKey,
          }
        },
        update: limit,
        create: { ...limit, packageId: createdPkg.id },
      });
    }
  }

  console.log('✅ تم زراعة الباقات بنجاح');
}
