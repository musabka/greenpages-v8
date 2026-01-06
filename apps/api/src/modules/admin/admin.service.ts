import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessStatus, ReviewStatus, UserStatus } from '@greenpages/database';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalBusinesses,
      pendingBusinesses,
      approvedBusinesses,
      totalUsers,
      activeUsers,
      totalReviews,
      pendingReviews,
      totalViews,
      todayViews,
    ] = await Promise.all([
      this.prisma.business.count(),
      this.prisma.business.count({ where: { status: BusinessStatus.PENDING } }),
      this.prisma.business.count({ where: { status: BusinessStatus.APPROVED } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      this.prisma.review.count(),
      this.prisma.review.count({ where: { status: ReviewStatus.PENDING } }),
      this.prisma.business.aggregate({ _sum: { viewsCount: true } }),
      this.getTodayViews(),
    ]);

    return {
      businesses: {
        total: totalBusinesses,
        pending: pendingBusinesses,
        approved: approvedBusinesses,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      reviews: {
        total: totalReviews,
        pending: pendingReviews,
      },
      views: {
        total: totalViews._sum.viewsCount || 0,
        today: todayViews,
      },
    };
  }

  private async getTodayViews(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.prisma.businessView.aggregate({
      where: {
        date: today,
      },
      _sum: {
        count: true,
      },
    });

    return result._sum.count || 0;
  }

  async getPendingBusinesses(limit = 10) {
    return this.prisma.business.findMany({
      where: { status: BusinessStatus.PENDING },
      include: {
        categories: { select: { category: { select: { id: true, nameAr: true } } } },
        governorate: { select: { id: true, nameAr: true } },
        city: { select: { id: true, nameAr: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getPendingReviews(limit = 10) {
    return this.prisma.review.findMany({
      where: { status: ReviewStatus.PENDING },
      include: {
        business: { select: { id: true, nameAr: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getPendingBusinessesCount() {
    const count = await this.prisma.business.count({
      where: { status: BusinessStatus.PENDING },
    });

    return { count };
  }

  async getPendingReviewsCount() {
    const count = await this.prisma.review.count({
      where: { status: ReviewStatus.PENDING },
    });

    return { count };
  }

  async getChartData(period: 'day' | 'week' | 'month' = 'week') {
    if (period === 'day') {
      return this.getHourlyChartData(24);
    }

    if (period === 'month') {
      return this.getWeeklyChartData(4);
    }

    // Default: last 7 days
    return this.getDailyChartData(7);
  }

  private async getHourlyChartData(hours: number) {
    const now = new Date();
    const currentHour = new Date(now);
    currentHour.setMinutes(0, 0, 0);

    const data = [] as { name: string; businesses: number; users: number; reviews: number }[];

    for (let i = hours - 1; i >= 0; i--) {
      const start = new Date(currentHour);
      start.setHours(start.getHours() - i);
      const end = new Date(start);
      end.setHours(end.getHours() + 1);

      const [businesses, users, reviews] = await Promise.all([
        this.prisma.business.count({ where: { createdAt: { gte: start, lt: end } } }),
        this.prisma.user.count({ where: { createdAt: { gte: start, lt: end } } }),
        this.prisma.review.count({ where: { createdAt: { gte: start, lt: end } } }),
      ]);

      const name = start.toLocaleTimeString('ar-SY', { hour: '2-digit' });
      data.push({ name, businesses, users, reviews });
    }

    return data;
  }

  private async getDailyChartData(days: number) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const data = [] as { name: string; businesses: number; users: number; reviews: number }[];

    for (let i = days - 1; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - i);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const [businesses, users, reviews] = await Promise.all([
        this.prisma.business.count({ where: { createdAt: { gte: start, lt: end } } }),
        this.prisma.user.count({ where: { createdAt: { gte: start, lt: end } } }),
        this.prisma.review.count({ where: { createdAt: { gte: start, lt: end } } }),
      ]);

      const name = dayNames[start.getDay()];
      data.push({ name, businesses, users, reviews });
    }

    return data;
  }

  private async getWeeklyChartData(weeks: number) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const data = [] as { name: string; businesses: number; users: number; reviews: number }[];

    for (let i = weeks - 1; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);

      const [businesses, users, reviews] = await Promise.all([
        this.prisma.business.count({ where: { createdAt: { gte: start, lt: end } } }),
        this.prisma.user.count({ where: { createdAt: { gte: start, lt: end } } }),
        this.prisma.review.count({ where: { createdAt: { gte: start, lt: end } } }),
      ]);

      const weekNumber = weeks - i;
      data.push({ name: `الأسبوع ${weekNumber}`, businesses, users, reviews });
    }

    return data;
  }

  async getRecentActivity(limit = 10) {
    // Get recent businesses, reviews, and users
    const [recentBusinesses, recentReviews, recentUsers] = await Promise.all([
      this.prisma.business.findMany({
        select: {
          id: true,
          nameAr: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      }),
      this.prisma.review.findMany({
        select: {
          id: true,
          status: true,
          createdAt: true,
          business: { select: { nameAr: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    // Combine and sort by date
    const activities = [
      ...recentBusinesses.map((b) => ({
        id: b.id,
        type: 'business',
        action: b.status === BusinessStatus.PENDING ? 'تم إضافة نشاط جديد' : 'تم تحديث',
        target: b.nameAr,
        time: b.updatedAt,
      })),
      ...recentReviews.map((r) => ({
        id: r.id,
        type: r.status === ReviewStatus.APPROVED ? 'approve' : r.status === ReviewStatus.REJECTED ? 'reject' : 'review',
        action: r.status === ReviewStatus.APPROVED ? 'تم الموافقة على تقييم' : r.status === ReviewStatus.REJECTED ? 'تم رفض تقييم' : 'تقييم جديد على',
        target: r.business.nameAr,
        time: r.createdAt,
      })),
      ...recentUsers.map((u) => ({
        id: u.id,
        type: 'user',
        action: 'مستخدم جديد',
        target: `${u.firstName} ${u.lastName}`,
        time: u.createdAt,
      })),
    ];

    // Sort by time and return top items
    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, limit)
      .map((a) => ({
        ...a,
        time: this.formatTimeAgo(a.time),
      }));
  }

  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return new Date(date).toLocaleDateString('ar-SY');
  }
}
