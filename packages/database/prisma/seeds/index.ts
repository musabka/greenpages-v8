/**
 * Main Seed Orchestrator
 * يشغل جميع ملفات الـ seed بالترتيب الصحيح
 */

import { PrismaClient } from '@prisma/client';
import { seedLocations } from './locations';
import { seedCategories } from './categories';
import { seedBusinesses } from './businesses';
import { seedPackages } from './packages';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedAdminUser() {
  const email = 'admin@greenpages.sy';
  const phone = '+963999999999';
  const plainPassword = 'Admin123!';
  const hashedPassword = await bcrypt.hash(plainPassword, 12);
  
  // Get Damascus governorate
  const damascus = await prisma.governorate.findFirst({ where: { slug: 'damascus' } });

  await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      phone,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      phoneVerified: true,
      firstName: 'مدير',
      lastName: 'النظام',
      governorateId: damascus?.id,
    },
    create: {
      email,
      phone,
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      phoneVerified: true,
      displayName: 'System Admin',
      firstName: 'مدير',
      lastName: 'النظام',
      governorateId: damascus?.id,
    },
  });

  console.log(`\n🔐 Admin account ready: ${email} / ${plainPassword}`);
}

async function main() {
  console.log('🌱 Starting database seeding...\n');
  console.log('=' .repeat(50));

  try {
    // 1. المحافظات والمدن والأحياء (يجب أن يكون أولاً)
    console.log('\n📍 Step 1: Seeding locations...');
    await seedLocations();
    console.log('');

    // 2. التصنيفات
    console.log('📂 Step 2: Seeding categories...');
    await seedCategories();
    console.log('');

    // 3. الباقات
    console.log('📦 Step 3: Seeding packages...');
    await seedPackages(prisma);
    console.log('');

    // 4. الشركات التجريبية
    console.log('🏢 Step 4: Seeding demo businesses...');
    await seedBusinesses();
    console.log('');

    // 5. المستخدم الإداري (بعد المحافظات)
    console.log('👤 Step 5: Seeding admin user...');
    await seedAdminUser();
    console.log('');

    console.log('=' .repeat(50));
    console.log('\n✅ All seeds completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
