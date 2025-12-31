import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, User, UserStatus } from '@greenpages/database';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
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

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    // Soft delete
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: UserStatus.INACTIVE },
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
