import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { ScheduleModule } from '@nestjs/schedule';
import { winstonConfig } from './common/logger/winston.config';

// Core Modules
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

// Geography Modules
import { GovernoratesModule } from './modules/governorates/governorates.module';
import { CitiesModule } from './modules/cities/cities.module';
import { DistrictsModule } from './modules/districts/districts.module';

// Business Modules
import { CategoriesModule } from './modules/categories/categories.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { ReviewsModule } from './modules/reviews/reviews.module';

// Content Modules
import { AdsModule } from './modules/ads/ads.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PagesModule } from './modules/pages/pages.module';

// Admin Module
import { AdminModule } from './modules/admin/admin.module';

// Packages Module
import { PackagesModule } from './modules/packages/packages.module';

// Renewals Module
import { RenewalsModule } from './modules/renewals/renewals.module';

// Notifications Module
import { NotificationsModule } from './modules/notifications/notifications.module';

// Business Portal Module
import { BusinessPortalModule } from './modules/business-portal/business-portal.module';

// Role-based Portal Modules
import { GovernorateManagerModule } from './modules/governorate-manager/governorate-manager.module';
import { AgentPortalModule } from './modules/agent-portal/agent-portal.module';

// Financial Module
import { FinancialModule } from './modules/financial/financial.module';

// Commissions Module
import { CommissionsModule } from './modules/commissions/commissions.module';

// Capabilities Module
import { CapabilitiesModule } from './modules/capabilities/capabilities.module';

// Wallet Module
import { WalletModule } from './modules/wallet/wallet.module';

// Accounting Module
import { AccountingModule } from './modules/accounting/accounting.module';

// Utility Modules
import { UploadModule } from './modules/upload/upload.module';
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Redis
    RedisModule.forRoot({
      type: 'single',
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    }),

    // Logging
    WinstonModule.forRoot(winstonConfig),

    // Scheduled Tasks
    ScheduleModule.forRoot(),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60000'),
        limit: parseInt(process.env.THROTTLE_LIMIT || '100'),
      },
    ]),

    // Core
    PrismaModule,
    AuthModule,
    UsersModule,

    // Geography
    GovernoratesModule,
    CitiesModule,
    DistrictsModule,

    // Business
    CategoriesModule,
    BusinessesModule,
    ReviewsModule,

    // Content
    AdsModule,
    SettingsModule,
    PagesModule,

    // Admin
    AdminModule,

    // Packages & Renewals
    PackagesModule,
    RenewalsModule,

    // Notifications
    NotificationsModule,

    // Business Portal
    BusinessPortalModule,

    // Role-based Portals
    GovernorateManagerModule,
    AgentPortalModule,

    // Financial
    FinancialModule,

    // Commissions
    CommissionsModule,

    // Capabilities
    CapabilitiesModule,

    // Wallet
    WalletModule,

    // Accounting
    AccountingModule,

    // Utility
    UploadModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
