import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, District } from '@greenpages/database';
import slugify from 'slugify';

@Injectable()
export class DistrictsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<District> {
    const slug = data.slug || slugify(data.nameAr, { lower: true, strict: true });
    
    const existing = await this.prisma.district.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('الحي موجود مسبقاً');
    }

    return this.prisma.district.create({
      data: { ...data, slug },
      include: { city: { include: { governorate: true } } },
    });
  }

  async findAll(params: { skip?: number; take?: number; cityId?: string }) {
    const { skip, take, cityId } = params;
    const where: Prisma.DistrictWhereInput = {};

    if (cityId) {
      where.cityId = cityId;
    }

    const [districts, total] = await Promise.all([
      this.prisma.district.findMany({
        skip,
        take,
        where,
        orderBy: { sortOrder: 'asc' },
        include: {
          city: { include: { governorate: true } },
          _count: { select: { businesses: true } },
        },
      }),
      this.prisma.district.count({ where }),
    ]);

    return { data: districts, meta: { total } };
  }

  async findById(id: string): Promise<District | null> {
    return this.prisma.district.findUnique({
      where: { id },
      include: { city: { include: { governorate: true } } },
    });
  }

  async findBySlug(slug: string): Promise<District | null> {
    return this.prisma.district.findUnique({
      where: { slug },
      include: { city: { include: { governorate: true } } },
    });
  }

  async update(id: string, data: Prisma.DistrictUpdateInput): Promise<District> {
    const district = await this.findById(id);
    if (!district) {
      throw new NotFoundException('الحي غير موجود');
    }

    return this.prisma.district.update({
      where: { id },
      data,
      include: { city: { include: { governorate: true } } },
    });
  }

  async delete(id: string): Promise<void> {
    const district = await this.findById(id);
    if (!district) {
      throw new NotFoundException('الحي غير موجود');
    }

    await this.prisma.district.delete({ where: { id } });
  }
}
