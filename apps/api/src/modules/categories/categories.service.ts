import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Category } from '@greenpages/database';
import slugify from 'slugify';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<Category> {
    const slug = data.slug || slugify(data.nameAr, { lower: true, strict: true });
    
    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('التصنيف موجود مسبقاً');
    }

    return this.prisma.category.create({
      data: { ...data, slug },
      include: { parent: true },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    parentId?: string | null;
    featured?: boolean;
    active?: boolean;
  }) {
    const { skip, take, parentId, featured, active } = params;
    const where: Prisma.CategoryWhereInput = {};

    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    if (featured !== undefined) {
      where.isFeatured = featured;
    }

    if (active !== undefined) {
      where.isActive = active;
    }

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        skip,
        take,
        where,
        orderBy: { sortOrder: 'asc' },
        include: {
          parent: true,
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
          _count: { select: { businesses: true, children: true } },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return { data: categories, meta: { total } };
  }

  async findAllTree() {
    const categories = await this.prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: { select: { businesses: true } },
          },
        },
        _count: { select: { businesses: true } },
      },
    });

    return categories;
  }

  async findById(id: string): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { businesses: true } },
      },
    });
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { businesses: true } },
      },
    });
  }

  async update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    const category = await this.findById(id);
    if (!category) {
      throw new NotFoundException('التصنيف غير موجود');
    }

    return this.prisma.category.update({
      where: { id },
      data,
      include: { parent: true },
    });
  }

  async delete(id: string): Promise<void> {
    const category = await this.findById(id);
    if (!category) {
      throw new NotFoundException('التصنيف غير موجود');
    }

    await this.prisma.category.delete({ where: { id } });
  }
}
