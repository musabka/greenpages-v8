// Quick test to check packages in database
const { PrismaClient } = require('../../packages/database/node_modules/@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://greenpages:greenpages_secret_2025@localhost:5434/greenpages'
    }
  }
});

async function main() {
  console.log('=== فحص الباقات في قاعدة البيانات ===\n');
  
  const packages = await prisma.package.findMany({
    select: {
      id: true,
      nameAr: true,
      isDefault: true,
      durationDays: true,
      price: true,
      status: true,
    },
    orderBy: { isDefault: 'desc' }
  });

  if (packages.length === 0) {
    console.log('❌ لا توجد باقات في قاعدة البيانات!');
    console.log('يجب تشغيل: pnpm seed\n');
  } else {
    packages.forEach((pkg, i) => {
      console.log(`${i + 1}. ${pkg.nameAr}`);
      console.log(`   - ID: ${pkg.id}`);
      console.log(`   - افتراضية: ${pkg.isDefault ? '✅ نعم' : '❌ لا'}`);
      console.log(`   - المدة: ${pkg.durationDays} يوم`);
      console.log(`   - السعر: ${pkg.price} ل.س`);
      console.log(`   - الحالة: ${pkg.status}`);
      console.log('');
    });
  }

  console.log('\n=== فحص اشتراكات الأنشطة التجارية ===\n');

  const businessPackages = await prisma.businessPackage.findMany({
    where: { isActive: true },
    include: {
      business: {
        select: { nameAr: true, nameEn: true }
      },
      package: {
        select: { nameAr: true, isDefault: true }
      }
    },
    orderBy: { endDate: 'asc' },
    take: 10
  });

  if (businessPackages.length === 0) {
    console.log('❌ لا توجد اشتراكات نشطة');
  } else {
    businessPackages.forEach((bp, i) => {
      console.log(`${i + 1}. ${bp.business.nameAr}`);
      console.log(`   - الباقة: ${bp.package.nameAr}${bp.package.isDefault ? ' (افتراضية)' : ''}`);
      console.log(`   - تاريخ البدء: ${bp.startDate ? new Date(bp.startDate).toLocaleDateString('ar-SY') : 'غير محدد'}`);
      console.log(`   - تاريخ الانتهاء: ${bp.endDate ? new Date(bp.endDate).toLocaleDateString('ar-SY') : '♾️ دائمة'}`);
      console.log(`   - نشط: ${bp.isActive ? '✅' : '❌'}`);
      console.log('');
    });
  }

  await prisma.$disconnect();
}

main().catch(console.error);
