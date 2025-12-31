import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
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
