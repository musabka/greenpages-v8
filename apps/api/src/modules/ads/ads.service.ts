import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Ad, AdStatus, AdPosition, FeatureKey, LimitKey } from '@greenpages/database';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { PackagesService } from '../packages/packages.service';

@Injectable()
export class AdsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly packagesService: PackagesService,
  ) {}

  async create(dto: CreateAdDto): Promise<Ad> {
    const { targetGovernorateIds, targetCityIds, targetAllLocations, businessId, ...adData } = dto;
    
    if (businessId) {
      // 1. Check if ads are allowed in the package
      const adAllowed = await this.packagesService.canBusinessUseFeature(businessId, FeatureKey.AD_ALLOWED);
      if (!adAllowed) {
        throw new ForbiddenException('بناءً على باقتك الحالية، لا يمكنك إضافة إعلانات');
      }

      // 2. Check active ads count limit
      const maxAds = await this.packagesService.getBusinessLimit(businessId, LimitKey.MAX_ADS);
      const activeAdsCount = await this.prisma.ad.count({
        where: { businessId, status: AdStatus.ACTIVE }
      });

      if (activeAdsCount >= maxAds) {
        throw new ForbiddenException(`لقد وصلت للحد الأقصى للإعلانات النشطة المسموح بها في باقتك (${maxAds})`);
      }
    }
    
    return this.prisma.ad.create({
      data: {
        titleAr: adData.titleAr,
        titleEn: adData.titleEn,
        descriptionAr: adData.descriptionAr,
        descriptionEn: adData.descriptionEn,
        type: adData.type,
        position: adData.position,
        imageDesktop: adData.imageDesktop,
        imageMobile: adData.imageMobile,
        linkUrl: adData.linkUrl,
        status: adData.status,
        priority: adData.priority,
        startDate: new Date(adData.startDate),
        endDate: new Date(adData.endDate),
        targetAllLocations: targetAllLocations ?? true,
        ...(businessId ? { business: { connect: { id: businessId } } } : {}),
        // إنشاء العلاقات مع المحافظات المستهدفة
        ...(targetGovernorateIds?.length ? {
          targetGovernorates: {
            create: targetGovernorateIds.map(governorateId => ({
              governorate: { connect: { id: governorateId } }
            }))
          }
        } : {}),
        // إنشاء العلاقات مع المدن المستهدفة
        ...(targetCityIds?.length ? {
          targetCities: {
            create: targetCityIds.map(cityId => ({
              city: { connect: { id: cityId } }
            }))
          }
        } : {}),
      },
      include: {
        business: true,
        targetGovernorates: { include: { governorate: true } },
        targetCities: { include: { city: true } },
      },
    });
  }

  async findAll(params: { skip?: number; take?: number; status?: AdStatus; position?: AdPosition }) {
    const { skip, take, status, position } = params;
    const where: Prisma.AdWhereInput = {};

    if (status) where.status = status;
    if (position) where.position = position;

    const [ads, total] = await Promise.all([
      this.prisma.ad.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          business: { select: { id: true, nameAr: true, slug: true } },
          targetGovernorates: { include: { governorate: { select: { id: true, nameAr: true } } } },
          targetCities: { include: { city: { select: { id: true, nameAr: true } } } },
        },
      }),
      this.prisma.ad.count({ where }),
    ]);

    return { data: ads, meta: { total } };
  }

  /**
   * جلب الإعلانات النشطة مع فلترة حسب موقع المستخدم
   * @param position موضع الإعلان
   * @param userGovernorateId معرف محافظة المستخدم (اختياري)
   * @param userCityId معرف مدينة المستخدم (اختياري)
   */
  async findActive(position?: AdPosition, userGovernorateId?: string, userCityId?: string) {
    const now = new Date();
    
    // جلب الإعلانات النشطة
    const ads = await this.prisma.ad.findMany({
      where: {
        status: AdStatus.ACTIVE,
        startDate: { lte: now },
        endDate: { gte: now },
        ...(position ? { position } : {}),
      },
      orderBy: { priority: 'desc' },
      include: {
        business: { select: { id: true, nameAr: true, slug: true } },
        targetGovernorates: { select: { governorateId: true } },
        targetCities: { select: { cityId: true } },
      },
    });

    // فلترة الإعلانات حسب موقع المستخدم
    const filteredAds = ads.filter(ad => {
      // إذا كان الإعلان يستهدف كل المواقع - يظهر للجميع
      if (ad.targetAllLocations) return true;
      
      // إذا كان المستخدم ليس لديه موقع محدد - لا يظهر له الإعلان المستهدف
      if (!userGovernorateId && !userCityId) return false;
      
      const targetGovIds = ad.targetGovernorates.map(tg => tg.governorateId);
      const targetCityIds = ad.targetCities.map(tc => tc.cityId);
      
      // تحقق من المدينة أولاً (أكثر دقة)
      if (targetCityIds.length > 0 && userCityId) {
        if (targetCityIds.includes(userCityId)) return true;
      }
      
      // تحقق من المحافظة
      if (targetGovIds.length > 0 && userGovernorateId) {
        if (targetGovIds.includes(userGovernorateId)) return true;
      }
      
      return false;
    });

    // إزالة بيانات الاستهداف من الاستجابة
    return filteredAds.map(({ targetGovernorates, targetCities, ...ad }) => ad);
  }

  async findById(id: string): Promise<Ad | null> {
    return this.prisma.ad.findUnique({
      where: { id },
      include: {
        business: true,
        targetGovernorates: { include: { governorate: true } },
        targetCities: { include: { city: true } },
      },
    });
  }

  async update(id: string, dto: UpdateAdDto): Promise<Ad> {
    const ad = await this.findById(id);
    if (!ad) throw new NotFoundException('الإعلان غير موجود');
    
    const { targetGovernorateIds, targetCityIds, targetAllLocations, businessId, startDate, endDate, ...updateData } = dto;
    
    // حذف العلاقات القديمة إذا تم تحديد قوائم جديدة
    if (targetGovernorateIds !== undefined) {
      await this.prisma.adGovernorate.deleteMany({ where: { adId: id } });
    }
    if (targetCityIds !== undefined) {
      await this.prisma.adCity.deleteMany({ where: { adId: id } });
    }
    
    return this.prisma.ad.update({
      where: { id },
      data: {
        ...updateData,
        ...(startDate ? { startDate: new Date(startDate) } : {}),
        ...(endDate ? { endDate: new Date(endDate) } : {}),
        ...(targetAllLocations !== undefined ? { targetAllLocations } : {}),
        ...(businessId ? { business: { connect: { id: businessId } } } : {}),
        // إضافة المحافظات الجديدة
        ...(targetGovernorateIds?.length ? {
          targetGovernorates: {
            create: targetGovernorateIds.map(governorateId => ({
              governorate: { connect: { id: governorateId } }
            }))
          }
        } : {}),
        // إضافة المدن الجديدة
        ...(targetCityIds?.length ? {
          targetCities: {
            create: targetCityIds.map(cityId => ({
              city: { connect: { id: cityId } }
            }))
          }
        } : {}),
      },
      include: {
        business: true,
        targetGovernorates: { include: { governorate: true } },
        targetCities: { include: { city: true } },
      },
    });
  }

  async delete(id: string): Promise<void> {
    const ad = await this.findById(id);
    if (!ad) throw new NotFoundException('الإعلان غير موجود');
    await this.prisma.ad.delete({ where: { id } });
  }

  async incrementClick(id: string): Promise<void> {
    await this.prisma.ad.update({ where: { id }, data: { clicks: { increment: 1 } } });
  }

  async incrementImpression(id: string): Promise<void> {
    await this.prisma.ad.update({ where: { id }, data: { impressions: { increment: 1 } } });
  }

  /**
   * إحصائيات الإعلانات حسب المنطقة
   */
  async getTargetingStats() {
    const [totalAds, targetedAds, globalAds] = await Promise.all([
      this.prisma.ad.count(),
      this.prisma.ad.count({ where: { targetAllLocations: false } }),
      this.prisma.ad.count({ where: { targetAllLocations: true } }),
    ]);

    return {
      totalAds,
      targetedAds,
      globalAds,
    };
  }
}
