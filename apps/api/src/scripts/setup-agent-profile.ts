import { PrismaClient } from '@greenpages/database';

const prisma = new PrismaClient();

async function createAgentProfile() {
  try {
    // 1. Find the agent user
    const agent = await prisma.user.findFirst({
      where: {
        email: 'agent1@greenpages.sy',
        role: 'AGENT',
      },
    });

    if (!agent) {
      console.log('❌ Agent user not found. Please create one first.');
      console.log('\nTo create an agent user, run:');
      console.log('INSERT INTO users (email, password_hash, role, first_name, last_name) VALUES (\'agent1@greenpages.sy\', \'$2b$10$...hash...\', \'AGENT\', \'مندوب\', \'تجريبي\');');
      return;
    }

    console.log(`✓ Found agent user: ${agent.email}`);

    // 2. Check if profile already exists
    const existingProfile = await prisma.agentProfile.findUnique({
      where: { userId: agent.id },
    });

    if (existingProfile) {
      console.log('✓ AgentProfile already exists');
      
      // Get governorates count
      const governorates = await prisma.agentGovernorate.count({
        where: { agentProfileId: existingProfile.id },
      });
      
      console.log(`✓ Agent has access to ${governorates} governorates`);
      console.log('\n✅ All set! You can login now.');
      return;
    }

    // 3. Create AgentProfile
    const profile = await prisma.agentProfile.create({
      data: {
        userId: agent.id,
        baseSalary: 0,
        commissionRate: 10,
        isActive: true,
      },
    });

    console.log(`✓ Created AgentProfile: ${profile.id}`);

    // 4. Get all governorates
    const governorates = await prisma.governorate.findMany({
      where: { isActive: true },
    });

    console.log(`✓ Found ${governorates.length} governorates`);

    // 5. Link agent to all governorates (for testing)
    if (governorates.length > 0) {
      const links = await Promise.all(
        governorates.map(gov =>
          prisma.agentGovernorate.create({
            data: {
              agentProfileId: profile.id,
              governorateId: gov.id,
              isActive: true,
            },
          })
        )
      );

      console.log(`✓ Linked agent to ${links.length} governorates`);
    }

    console.log('\n✅ AgentProfile setup complete!');
    console.log(`\nYou can now login at: http://localhost:3004/login`);
    console.log(`Email: agent1@greenpages.sy`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

createAgentProfile();
