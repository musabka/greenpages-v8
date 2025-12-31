import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, City } from '@greenpages/database';
import slugify from 'slugify';

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<City> {
    const slug = data.slug || slugify(data.nameAr, { lower: true, strict: true });
    
    const existing = await this.prisma.city.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('المدينة موجودة مسبقاً');
    }

    return this.prisma.city.create({
      data: { ...data, slug },
      include: { governorate: true },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    governorateId?: string;
    includeDistricts?: boolean;
  }) {
    const { skip, take, governorateId, includeDistricts } = params;
    const where: Prisma.CityWhereInput = {};

    if (governorateId) {
      where.governorateId = governorateId;
    }

    const [cities, total] = await Promise.all([
      this.prisma.city.findMany({
        skip,
        take,
        where,
        orderBy: { sortOrder: 'asc' },
        include: {
          governorate: true,
          ...(includeDistricts ? {
            districts: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          } : {}),
          _count: { select: { businesses: true, districts: true } },
        },
      }),
      this.prisma.city.count({ where }),
    ]);

    return {
      data: cities,
      meta: { total, page: skip ? Math.floor(skip / (take || 20)) + 1 : 1, pageSize: take || 20 },
    };
  }

  async findById(id: string): Promise<City | null> {
    return this.prisma.city.findUnique({
      where: { id },
      include: {
        governorate: true,
        districts: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async findBySlug(slug: string): Promise<City | null> {
    return this.prisma.city.findUnique({
      where: { slug },
      include: {
        governorate: true,
        districts: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async update(id: string, data: Prisma.CityUpdateInput): Promise<City> {
    const city = await this.findById(id);
    if (!city) {
      throw new NotFoundException('المدينة غير موجودة');
    }

    return this.prisma.city.update({ where: { id }, data, include: { governorate: true } });
  }

  async delete(id: string): Promise<void> {
    const city = await this.findById(id);
    if (!city) {
      throw new NotFoundException('المدينة غير موجودة');
    }

    await this.prisma.city.delete({ where: { id } });
  }
}
