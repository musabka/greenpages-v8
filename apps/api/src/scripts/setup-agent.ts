import { PrismaClient } from '@greenpages/database';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function setupAgent() {
  try {
    console.log('🚀 Setting up agent user and profile...\n');

    // 1. Check if agent exists
    let agent = await prisma.user.findFirst({
      where: {
        email: 'agent1@greenpages.sy',
      },
    });

    if (!agent) {
      console.log('Creating agent user...');
      
      agent = await prisma.user.create({
        data: {
          email: 'agent1@greenpages.sy',
          password: 'password123', // Will be hashed automatically
          role: 'AGENT',
          firstName: 'مندوب',
          lastName: 'تجريبي',
          phone: '+963999000001',
          status: 'ACTIVE',
          emailVerified: true,
        },
      });
      
      console.log(`✓ Created agent user: ${agent.email}`);
      console.log(`  Password: password123`);
    } else {
      console.log(`✓ Agent user exists: ${agent.email}`);
    }

    // 2. Check if AgentProfile exists
    let profile = await prisma.agentProfile.findUnique({
      where: { userId: agent.id },
    });

    if (!profile) {
      console.log('\nCreating AgentProfile...');
      
      profile = await prisma.agentProfile.create({
        data: {
          userId: agent.id,
          baseSalary: 5000, // راتب شهري أساسي
          commissionRate: 10, // عمولة 10%
          isActive: true,
        },
      });
      
      console.log(`✓ Created AgentProfile`);
    } else {
      console.log(`✓ AgentProfile already exists`);
    }

    // 3. Link to governorates
    const governorates = await prisma.governorate.findMany({
      where: { isActive: true },
    });

    console.log(`\n✓ Found ${governorates.length} active governorates`);

    if (governorates.length > 0) {
      const existingLinks = await prisma.agentGovernorate.findMany({
        where: { agentProfileId: profile.id },
      });

      if (existingLinks.length === 0) {
        console.log('Linking agent to all governorates...');
        
        await prisma.agentGovernorate.createMany({
          data: governorates.map(gov => ({
            agentProfileId: profile.id,
            governorateId: gov.id,
            isActive: true,
          })),
        });
        
        console.log(`✓ Linked agent to ${governorates.length} governorates`);
      } else {
        console.log(`✓ Already linked to ${existingLinks.length} governorates`);
      }
    }

    console.log('\n✅ Setup complete!');
    console.log('\n📋 Agent Login Details:');
    console.log(`   URL: http://localhost:3004/login`);
    console.log(`   Email: agent1@greenpages.sy`);
    console.log(`   Password: password123`);
    console.log(`\n🎯 Agent can now access the dashboard!`);

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

setupAgent();
