import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, User, UserStatus, UserRole } from '@greenpages/database';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput & { managedGovernorateIds?: string[], companyCommissionRate?: number, agentSalary?: number, agentCommission?: number }): Promise<User> {
    // Hash the password if provided
    const { managedGovernorateIds, companyCommissionRate, agentSalary, agentCommission, ...userData } = data;
    const hashedData = {
      ...userData,
      password: userData.password ? await bcrypt.hash(userData.password as string, 12) : userData.password,
    };
    
    // Create user and their role-specific profile in a transaction
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({
        where: { email: hashedData.email },
      });
      if (existing) {
        throw new ConflictException('البريد الإلكتروني مستخدم مسبقاً');
      }

      const existingPhone = await tx.user.findFirst({
        where: { phone: hashedData.phone },
      });
      if (existingPhone) {
        throw new ConflictException('رقم الهاتف مستخدم مسبقاً');
      }

      const user = await tx.user.create({ data: hashedData });
      
      // Create role-specific profile automatically
      if (user.role === UserRole.AGENT) {
        const agentProfile = await tx.agentProfile.create({
          data: {
            userId: user.id,
            baseSalary: agentSalary ?? 0,
            commissionRate: agentCommission ?? 10,
            isActive: true,
          },
        });
        
        // Create agent governorate records
        const governoratesToAssign = managedGovernorateIds && managedGovernorateIds.length > 0
          ? managedGovernorateIds
          : (user.governorateId ? [user.governorateId] : []);
        
        if (governoratesToAssign.length > 0) {
          await tx.agentGovernorate.createMany({
            data: governoratesToAssign.map(governorateId => ({
              agentProfileId: agentProfile.id,
              governorateId,
              isActive: true,
            })),
          });
        }
      }
      
      // Create governorate manager profiles for managed governorates
      if (user.role === UserRole.GOVERNORATE_MANAGER) {
        const governoratesToManage = managedGovernorateIds && managedGovernorateIds.length > 0
          ? managedGovernorateIds
          : (user.governorateId ? [user.governorateId] : []);
        
        if (governoratesToManage.length > 0) {
          await tx.governorateManager.createMany({
            data: governoratesToManage.map(governorateId => ({
              userId: user.id,
              governorateId,
              isActive: true,
              companyCommissionRate: companyCommissionRate || 15,
            })),
          });
        }
      }
      
      return user;
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        where: { ...where, deletedAt: null },
        orderBy: orderBy || { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          firstName: true,
          lastName: true,
          displayName: true,
          avatar: true,
          emailVerified: true,
          phoneVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          governorateId: true,
          cityId: true,
          districtId: true,
          governorate: { select: { id: true, nameAr: true, nameEn: true } },
          city: { select: { id: true, nameAr: true, nameEn: true } },
          district: { select: { id: true, nameAr: true, nameEn: true } },
          governorateManagers: { select: { governorateId: true, companyCommissionRate: true } },
          agentProfile: { select: { governorates: { select: { governorateId: true } } } },
        },
      }),
      this.prisma.user.count({ where: { ...where, deletedAt: null } }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page: skip ? Math.floor(skip / (take || 20)) + 1 : 1,
        pageSize: take || 20,
        totalPages: Math.ceil(total / (take || 20)),
      },
    };
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        governorateManagers: true,
        agentProfile: {
          include: {
            governorates: true
          }
        }
      }
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { phone, deletedAt: null },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput & { managedGovernorateIds?: string[], companyCommissionRate?: number, agentSalary?: number, agentCommission?: number }): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const { managedGovernorateIds, companyCommissionRate, agentSalary, agentCommission, ...updateData } = data;
    console.log('Update user called:', { id, managedGovernorateIds, role: user.role });

    return this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: updateData,
      });

      // Handle Managed Governorates for Governorate Manager
      if (updatedUser.role === UserRole.GOVERNORATE_MANAGER && managedGovernorateIds) {
        console.log('Updating manager governorates:', managedGovernorateIds);
        // Delete existing
        await tx.governorateManager.deleteMany({
          where: { userId: id }
        });
        
        // Create new
        if (managedGovernorateIds.length > 0) {
          await tx.governorateManager.createMany({
            data: managedGovernorateIds.map(governorateId => ({
              userId: id,
              governorateId,
              isActive: true,
              companyCommissionRate: companyCommissionRate || 15,
            })),
          });
        }
      } else if (updatedUser.role === UserRole.GOVERNORATE_MANAGER && companyCommissionRate !== undefined) {
        // Just update the rate if ids didn't change
        await tx.governorateManager.updateMany({
          where: { userId: id },
          data: { companyCommissionRate }
        });
      }

      // Handle Managed Governorates for Agent
      if (updatedUser.role === UserRole.AGENT && managedGovernorateIds) {
        console.log('Updating agent governorates:', managedGovernorateIds);
        const agentProfile = await tx.agentProfile.findUnique({ where: { userId: id } });
        console.log('Agent profile found:', agentProfile?.id);
        if (agentProfile) {
          await tx.agentGovernorate.deleteMany({
            where: { agentProfileId: agentProfile.id }
          });
          
          if (managedGovernorateIds.length > 0) {
            await tx.agentGovernorate.createMany({
              data: managedGovernorateIds.map(governorateId => ({
                agentProfileId: agentProfile.id,
                governorateId,
                isActive: true,
              })),
            });
            console.log('Created agent governorates:', managedGovernorateIds.length);
          }
        }
      }

      // Update Agent Salary and Commission
      if (updatedUser.role === UserRole.AGENT && (agentSalary !== undefined || agentCommission !== undefined)) {
        const agentProfile = await tx.agentProfile.findUnique({ where: { userId: id } });
        if (agentProfile) {
          await tx.agentProfile.update({
            where: { userId: id },
            data: {
              baseSalary: agentSalary !== undefined ? agentSalary : undefined,
              commissionRate: agentCommission !== undefined ? agentCommission : undefined,
            }
          });
        } else {
          // Create agent profile if it doesn't exist
          await tx.agentProfile.create({
            data: {
              userId: id,
              baseSalary: agentSalary ?? 0,
              commissionRate: agentCommission ?? 10,
              isActive: true,
            }
          });
        }
      }

      return updatedUser;
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  /**
   * Invalidate all existing tokens by incrementing tokenVersion
   * Call this when user's role or permissions change
   */
  async invalidateTokens(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    // Soft delete + free unique fields + invalidate tokens
    const timestamp = Date.now();
    const safeEmail = `${user.email}__deleted__${timestamp}`;
    const safePhone = `${user.phone}__deleted__${timestamp}`;
    await this.prisma.user.update({
      where: { id },
      data: { 
        email: safeEmail,
        phone: safePhone,
        deletedAt: new Date(), 
        status: UserStatus.INACTIVE,
        tokenVersion: { increment: 1 } // Invalidate all sessions
      },
    });
  }

  async countByRole() {
    const counts = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
      where: { deletedAt: null },
    });

    return counts.reduce((acc, curr) => {
      acc[curr.role] = curr._count.role;
      return acc;
    }, {} as Record<string, number>);
  }
}