import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Governorate } from '@greenpages/database';
import slugify from 'slugify';

@Injectable()
export class GovernoratesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.GovernorateCreateInput): Promise<Governorate> {
    const slug = data.slug || slugify(data.nameAr, { lower: true, strict: true });
    
    const existing = await this.prisma.governorate.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('المحافظة موجودة مسبقاً');
    }

    return this.prisma.governorate.create({
      data: { ...data, slug },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.GovernorateWhereInput;
    orderBy?: Prisma.GovernorateOrderByWithRelationInput;
    includeCities?: boolean;
  }) {
    const { skip, take, where, orderBy, includeCities } = params;

    const [governorates, total] = await Promise.all([
      this.prisma.governorate.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { sortOrder: 'asc' },
        include: includeCities ? {
          cities: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: {
              districts: {
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
          _count: { select: { businesses: true } },
        } : {
          _count: { select: { cities: true, businesses: true } },
        },
      }),
      this.prisma.governorate.count({ where }),
    ]);

    return {
      data: governorates,
      meta: {
        total,
        page: skip ? Math.floor(skip / (take || 20)) + 1 : 1,
        pageSize: take || 20,
        totalPages: Math.ceil(total / (take || 20)),
      },
    };
  }

  async findAllActive() {
    return this.prisma.governorate.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        cities: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async findById(id: string): Promise<Governorate | null> {
    return this.prisma.governorate.findUnique({
      where: { id },
      include: {
        cities: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            districts: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });
  }

  async findBySlug(slug: string): Promise<Governorate | null> {
    return this.prisma.governorate.findUnique({
      where: { slug },
      include: {
        cities: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async update(id: string, data: Prisma.GovernorateUpdateInput): Promise<Governorate> {
    const governorate = await this.findById(id);
    if (!governorate) {
      throw new NotFoundException('المحافظة غير موجودة');
    }

    return this.prisma.governorate.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    const governorate = await this.findById(id);
    if (!governorate) {
      throw new NotFoundException('المحافظة غير موجودة');
    }

    await this.prisma.governorate.delete({ where: { id } });
  }
}
