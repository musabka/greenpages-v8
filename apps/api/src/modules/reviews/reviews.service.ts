import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Review, ReviewStatus } from '@greenpages/database';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<Review> {
    const review = await this.prisma.review.create({
      data,
      include: {
        user: { select: { id: true, displayName: true, firstName: true, lastName: true, avatar: true } },
        business: true,
      },
    });

    // Update business stats
    await this.updateBusinessStats(data.businessId);

    return review;
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    businessId?: string;
    userId?: string;
    status?: ReviewStatus;
  }) {
    const { skip, take, businessId, userId, status } = params;
    const where: Prisma.ReviewWhereInput = {};

    if (businessId) where.businessId = businessId;
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, displayName: true, firstName: true, lastName: true, avatar: true } },
          business: { select: { id: true, nameAr: true, slug: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return { data: reviews, meta: { total } };
  }

  async findByBusinessSlug(businessSlug: string, status: ReviewStatus = ReviewStatus.APPROVED) {
    const business = await this.prisma.business.findUnique({ where: { slug: businessSlug } });
    if (!business) throw new NotFoundException('النشاط التجاري غير موجود');

    return this.prisma.review.findMany({
      where: { businessId: business.id, status },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, displayName: true, firstName: true, lastName: true, avatar: true } } },
    });
  }

  async findById(id: string): Promise<Review | null> {
    return this.prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, displayName: true, avatar: true } },
        business: true,
      },
    });
  }

  async updateStatus(id: string, status: ReviewStatus): Promise<Review> {
    const review = await this.findById(id);
    if (!review) throw new NotFoundException('المراجعة غير موجودة');

    const updated = await this.prisma.review.update({
      where: { id },
      data: { status },
      include: { user: true, business: true },
    });

    await this.updateBusinessStats(review.businessId);
    return updated;
  }

  async reply(id: string, replyAr: string, replyEn?: string): Promise<Review> {
    const review = await this.findById(id);
    if (!review) throw new NotFoundException('المراجعة غير موجودة');

    return this.prisma.review.update({
      where: { id },
      data: { replyAr, replyEn, repliedAt: new Date() },
      include: { user: true, business: true },
    });
  }

  async delete(id: string, userId: string, isAdmin: boolean): Promise<void> {
    const review = await this.findById(id);
    if (!review) throw new NotFoundException('المراجعة غير موجودة');

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('غير مصرح لك بحذف هذه المراجعة');
    }

    await this.prisma.review.delete({ where: { id } });
    await this.updateBusinessStats(review.businessId);
  }

  private async updateBusinessStats(businessId: string) {
    const stats = await this.prisma.review.aggregate({
      where: { businessId, status: ReviewStatus.APPROVED },
      _avg: { rating: true },
      _count: { id: true },
    });

    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        averageRating: stats._avg.rating || 0,
        reviewsCount: stats._count.id,
      },
    });
  }
}
