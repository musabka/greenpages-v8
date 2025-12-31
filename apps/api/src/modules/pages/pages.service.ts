import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Page } from '@greenpages/database';
import slugify from 'slugify';

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<Page> {
    const slug = data.slug || slugify(data.titleAr, { lower: true, strict: true });
    const existing = await this.prisma.page.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('الصفحة موجودة مسبقاً');
    return this.prisma.page.create({ data: { ...data, slug } });
  }

  async findAll(publishedOnly?: boolean) {
    const where: Prisma.PageWhereInput = {};
    if (publishedOnly) where.isPublished = true;
    return this.prisma.page.findMany({ where, orderBy: { sortOrder: 'asc' } });
  }

  async findById(id: string): Promise<Page | null> {
    return this.prisma.page.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Page | null> {
    return this.prisma.page.findFirst({ where: { slug, isPublished: true } });
  }

  async update(id: string, data: Prisma.PageUpdateInput): Promise<Page> {
    const page = await this.findById(id);
    if (!page) throw new NotFoundException('الصفحة غير موجودة');
    return this.prisma.page.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    const page = await this.findById(id);
    if (!page) throw new NotFoundException('الصفحة غير موجودة');
    await this.prisma.page.delete({ where: { id } });
  }
}
