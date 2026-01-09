import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/winston.config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  // Security
  app.use(helmet());

  // Global Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000', 
      'http://localhost:3001', 
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005', // Accountant Dashboard
    ],
    credentials: true,
  });

  // API Prefix & Versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('الصفحات الخضراء API')
    .setDescription('واجهة برمجة تطبيقات دليل الأنشطة التجارية في سوريا')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'المصادقة والتسجيل')
    .addTag('users', 'إدارة المستخدمين')
    .addTag('governorates', 'المحافظات')
    .addTag('cities', 'المدن')
    .addTag('districts', 'الأحياء')
    .addTag('categories', 'التصنيفات')
    .addTag('businesses', 'الأنشطة التجارية')
    .addTag('reviews', 'المراجعات')
    .addTag('ads', 'الإعلانات')
    .addTag('settings', 'الإعدادات')
    .addTag('pages', 'الصفحات')
    .addTag('upload', 'رفع الملفات')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 الصفحات الخضراء API تعمل على: http://localhost:${port}`);
  console.log(`📚 Swagger Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
// env update
