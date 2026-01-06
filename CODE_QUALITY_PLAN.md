# 💎 خطة تحسين جودة الأكواد - الصفحات الخضراء v8

**تاريخ الإعداد:** 4 يناير 2026  
**الهدف:** رفع مستوى جودة الكود إلى معايير احترافية عالمية

---

## 📊 التقييم الحالي

### ✅ نقاط القوة:
- استخدام TypeScript
- بنية Monorepo منظمة
- Prisma ORM للـ type safety
- تنظيم ملفات جيد (modules pattern)
- استخدام DTOs

### ❌ المشاكل المكتشفة:
- ⚠️ **لا يوجد أي اختبارات (Tests)**
- ⚠️ **عدم وجود Linting/Formatting موحد**
- ⚠️ **نقص في Documentation**
- ⚠️ **Error Handling غير موحد**
- ⚠️ **Performance issues محتملة**
- ⚠️ **عدم وجود Code Reviews**

**التقييم العام:** 5.5/10  
**الهدف المطلوب:** 9/10

---

## 🎯 خطة التحسين الشاملة

### المرحلة 1: Setup & Configuration (أسبوع 1)

#### 1.1 إعداد ESLint
```bash
# Install ESLint packages
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin --filter=api
pnpm add -D eslint-config-prettier eslint-plugin-prettier --filter=api
```

```javascript
// .eslintrc.js

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
  },
};
```

#### 1.2 إعداد Prettier
```bash
pnpm add -D prettier --filter=api
```

```json
// .prettierrc

{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

#### 1.3 إعداد Husky & Lint-Staged
```bash
pnpm add -D husky lint-staged --filter=api
npx husky install
```

```json
// package.json

{
  "scripts": {
    "prepare": "husky install",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\""
  },
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit

#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged
pnpm test:affected
```

---

### المرحلة 2: Testing Infrastructure (أسبوع 2-3)

#### 2.1 إعداد Jest للـ Unit Tests
```bash
pnpm add -D @nestjs/testing jest @types/jest ts-jest --filter=api
```

```javascript
// jest.config.js

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/*.interface.ts',
    '!**/dto/**',
    '!**/entities/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

#### 2.2 كتابة Unit Tests - مثال كامل

```typescript
// apps/api/src/modules/businesses/businesses.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessStatus } from '@greenpages/database';

describe('BusinessesService', () => {
  let service: BusinessesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    business: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BusinessesService>(BusinessesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new business', async () => {
      const dto = {
        nameAr: 'Test Business',
        governorateId: 'gov-1',
        cityId: 'city-1',
        slug: 'test-business',
      };

      const expected = {
        id: '123',
        ...dto,
        status: BusinessStatus.DRAFT,
        createdAt: new Date(),
      };

      mockPrismaService.business.create.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
      expect(mockPrismaService.business.create).toHaveBeenCalledWith({
        data: expect.objectContaining(dto),
        include: expect.any(Object),
      });
    });

    it('should throw BadRequestException if slug already exists', async () => {
      const dto = {
        nameAr: 'Test Business',
        slug: 'existing-slug',
      };

      mockPrismaService.business.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['slug'] },
      });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('should return a business by id', async () => {
      const id = '123';
      const expected = {
        id,
        nameAr: 'Test Business',
        status: BusinessStatus.APPROVED,
      };

      mockPrismaService.business.findUnique.mockResolvedValue(expected);

      const result = await service.findById(id);

      expect(result).toEqual(expected);
      expect(mockPrismaService.business.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if business not found', async () => {
      const id = 'non-existing';
      mockPrismaService.business.findUnique.mockResolvedValue(null);

      await expect(service.findById(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update business status to APPROVED', async () => {
      const id = '123';
      const status = BusinessStatus.APPROVED;

      const business = {
        id,
        status: BusinessStatus.PENDING,
      };

      const updated = {
        ...business,
        status,
        publishedAt: new Date(),
      };

      mockPrismaService.business.findUnique.mockResolvedValue(business);
      mockPrismaService.business.update.mockResolvedValue(updated);

      const result = await service.updateStatus(id, status);

      expect(result.status).toBe(status);
      expect(result.publishedAt).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('should return business statistics', async () => {
      mockPrismaService.business.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80)  // approved
        .mockResolvedValueOnce(15)  // pending
        .mockResolvedValueOnce(10)  // featured
        .mockResolvedValueOnce(50); // verified

      const stats = await service.getStats();

      expect(stats).toEqual({
        total: 100,
        approved: 80,
        pending: 15,
        featured: 10,
        verified: 50,
      });
    });
  });
});
```

#### 2.3 Integration Tests

```typescript
// apps/api/test/businesses.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('BusinessesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    
    prisma = app.get<PrismaService>(PrismaService);
    
    await app.init();

    // Get admin token
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password' });

    adminToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('/businesses (POST)', () => {
    it('should create a new business', () => {
      return request(app.getHttpServer())
        .post('/businesses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nameAr: 'Test Business',
          governorateId: 'existing-gov-id',
          cityId: 'existing-city-id',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.nameAr).toBe('Test Business');
          expect(res.body.id).toBeDefined();
        });
    });

    it('should return 400 if required fields are missing', () => {
      return request(app.getHttpServer())
        .post('/businesses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nameAr: 'Test Business',
          // missing governorateId and cityId
        })
        .expect(400);
    });

    it('should return 401 if not authenticated', () => {
      return request(app.getHttpServer())
        .post('/businesses')
        .send({
          nameAr: 'Test Business',
        })
        .expect(401);
    });
  });

  describe('/businesses/:id (GET)', () => {
    it('should get a business by id', async () => {
      // Create a test business
      const business = await prisma.business.create({
        data: {
          nameAr: 'Test Business',
          slug: 'test-business-' + Date.now(),
          governorateId: 'existing-gov-id',
          cityId: 'existing-city-id',
        },
      });

      return request(app.getHttpServer())
        .get(`/businesses/${business.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(business.id);
          expect(res.body.nameAr).toBe('Test Business');
        });
    });

    it('should return 404 if business not found', () => {
      return request(app.getHttpServer())
        .get('/businesses/non-existing-id')
        .expect(404);
    });
  });
});
```

#### 2.4 Coverage Goals

```json
// package.json scripts

{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "test:affected": "jest --onlyChanged"
  }
}
```

**أهداف التغطية:**
- Unit Tests: 80%+
- Integration Tests: 70%+
- E2E Tests: Critical paths

---

### المرحلة 3: Code Quality Improvements (أسبوع 4-5)

#### 3.1 تحسين Error Handling

**قبل:**
```typescript
// مثال لكود غير موحد
async findById(id: string) {
  const business = await this.prisma.business.findUnique({ where: { id } });
  if (!business) {
    throw new NotFoundException('Business not found');
  }
  return business;
}
```

**بعد:**
```typescript
// إنشاء Exception Filters موحدة

// exceptions/business-not-found.exception.ts
export class BusinessNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      statusCode: 404,
      error: 'BUSINESS_NOT_FOUND',
      message: 'النشاط التجاري غير موجود',
      messageEn: 'Business not found',
      details: { id },
    });
  }
}

// common/filters/http-exception.filter.ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ...(typeof exceptionResponse === 'object' ? exceptionResponse : { message: exceptionResponse }),
    };

    this.logger.error(
      `${request.method} ${request.url}`,
      JSON.stringify(errorResponse),
      'HttpExceptionFilter',
    );

    response.status(status).json(errorResponse);
  }
}

// استخدام
async findById(id: string) {
  const business = await this.prisma.business.findUnique({ where: { id } });
  if (!business) {
    throw new BusinessNotFoundException(id);
  }
  return business;
}
```

#### 3.2 إضافة Type Safety كامل

```typescript
// قبل: استخدام any
async create(data: any) {
  return this.prisma.business.create({ data });
}

// بعد: Types صارمة
import { Prisma } from '@greenpages/database';

async create(data: Prisma.BusinessCreateInput): Promise<Business> {
  return this.prisma.business.create({
    data,
    include: this.getFullInclude(),
  });
}

private getFullInclude(): Prisma.BusinessInclude {
  return {
    governorate: true,
    city: true,
    district: true,
    categories: {
      include: {
        category: true,
      },
    },
    branches: true,
    workingHours: true,
  };
}
```

#### 3.3 تحسين DTOs مع Validation كامل

```typescript
// dto/create-business.dto.ts

import { 
  IsString, 
  IsNotEmpty, 
  IsUUID, 
  IsOptional, 
  IsEmail,
  IsPhoneNumber,
  MaxLength,
  MinLength,
  IsLatitude,
  IsLongitude,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBusinessDto {
  @ApiProperty({
    description: 'اسم النشاط بالعربية',
    example: 'مطعم الشام',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'اسم النشاط مطلوب' })
  @MinLength(3, { message: 'اسم النشاط يجب أن يكون 3 أحرف على الأقل' })
  @MaxLength(100, { message: 'اسم النشاط لا يمكن أن يتجاوز 100 حرف' })
  nameAr: string;

  @ApiPropertyOptional({
    description: 'اسم النشاط بالإنجليزية',
    example: 'Al-Sham Restaurant',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameEn?: string;

  @ApiProperty({ description: 'معرف المحافظة' })
  @IsUUID(4, { message: 'معرف المحافظة غير صحيح' })
  governorateId: string;

  @ApiProperty({ description: 'معرف المدينة' })
  @IsUUID(4, { message: 'معرف المدينة غير صحيح' })
  cityId: string;

  @ApiPropertyOptional({ description: 'معرف الحي' })
  @IsOptional()
  @IsUUID(4)
  districtId?: string;

  @ApiPropertyOptional({ description: 'خط العرض' })
  @IsOptional()
  @IsLatitude({ message: 'خط العرض غير صحيح' })
  latitude?: number;

  @ApiPropertyOptional({ description: 'خط الطول' })
  @IsOptional()
  @IsLongitude({ message: 'خط الطول غير صحيح' })
  longitude?: number;

  @ApiPropertyOptional({
    description: 'معرفات التصنيفات',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  categoryIds?: string[];
}
```

#### 3.4 استخدام Custom Decorators

```typescript
// common/decorators/user.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);

// الاستخدام في Controller
@Get('me')
@UseGuards(JwtAuthGuard)
async getProfile(@CurrentUser() user: User) {
  return user;
}

@Get('my-businesses')
@UseGuards(JwtAuthGuard)
async getMyBusinesses(@CurrentUser('id') userId: string) {
  return this.businessesService.findByUserId(userId);
}
```

#### 3.5 إضافة Swagger Documentation كاملة

```typescript
// main.ts

const config = new DocumentBuilder()
  .setTitle('Green Pages API')
  .setDescription('Comprehensive API for Green Pages Directory')
  .setVersion('1.0')
  .addBearerAuth()
  .addTag('auth', 'Authentication endpoints')
  .addTag('businesses', 'Business management')
  .addTag('users', 'User management')
  .addTag('categories', 'Categories')
  .addTag('packages', 'Subscription packages')
  .addTag('reviews', 'Reviews and ratings')
  .addTag('notifications', 'Notifications')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document, {
  customSiteTitle: 'Green Pages API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
});

// Controller example
@ApiTags('businesses')
@Controller('businesses')
export class BusinessesController {
  
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new business',
    description: 'Creates a new business entry. Requires ADMIN or AGENT role.',
  })
  @ApiResponse({
    status: 201,
    description: 'Business created successfully',
    type: Business,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async create(
    @Body() createBusinessDto: CreateBusinessDto,
    @CurrentUser() user: User,
  ) {
    return this.businessesService.create(createBusinessDto, user.id);
  }
}
```

---

### المرحلة 4: Performance Optimization (أسبوع 6)

#### 4.1 Database Query Optimization

```typescript
// قبل: N+1 Query Problem
async getAllBusinesses() {
  const businesses = await this.prisma.business.findMany();
  
  for (const business of businesses) {
    business.categories = await this.prisma.businessCategory.findMany({
      where: { businessId: business.id },
      include: { category: true },
    });
  }
  
  return businesses;
}

// بعد: Optimized with includes
async getAllBusinesses() {
  return this.prisma.business.findMany({
    include: {
      categories: {
        include: {
          category: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
              slug: true,
            },
          },
        },
      },
      governorate: {
        select: { id: true, nameAr: true },
      },
      city: {
        select: { id: true, nameAr: true },
      },
    },
  });
}
```

#### 4.2 Caching Strategy

```typescript
// common/interceptors/cache.interceptor.ts

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = this.generateCacheKey(request);

    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return of(cached);
    }

    return next.handle().pipe(
      tap(async (response) => {
        await this.cacheManager.set(cacheKey, response, 3600); // 1 hour
      }),
    );
  }

  private generateCacheKey(request: any): string {
    return `${request.url}:${JSON.stringify(request.query)}`;
  }
}

// الاستخدام
@Get()
@UseInterceptors(CacheInterceptor)
async findAll(@Query() query: QueryDto) {
  return this.businessesService.findAll(query);
}
```

#### 4.3 Pagination Best Practices

```typescript
// dto/pagination.dto.ts

export class PaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

// Response type
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Service
async findAll(pagination: PaginationDto): Promise<PaginatedResponse<Business>> {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    this.prisma.business.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.business.count(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
```

#### 4.4 Database Indexing

```sql
-- Add missing indexes for better performance

-- businesses table
CREATE INDEX idx_businesses_status_created 
  ON businesses(status, created_at DESC);

CREATE INDEX idx_businesses_governorate_city 
  ON businesses(governorate_id, city_id);

CREATE INDEX idx_businesses_featured_verified 
  ON businesses(is_featured, is_verified) 
  WHERE status = 'APPROVED';

-- reviews table
CREATE INDEX idx_reviews_business_status 
  ON reviews(business_id, status);

CREATE INDEX idx_reviews_rating 
  ON reviews(business_id, rating) 
  WHERE status = 'APPROVED';

-- notifications
CREATE INDEX idx_notifications_user_read 
  ON notifications(user_id, is_read);

CREATE INDEX idx_notifications_scheduled 
  ON notifications(scheduled_at) 
  WHERE sent_at IS NULL;
```

---

### المرحلة 5: Documentation (أسبوع 7)

#### 5.1 JSDoc Comments

```typescript
/**
 * Service for managing business entities
 * 
 * @class BusinessesService
 * @description Handles all business-related operations including CRUD,
 *              status management, and statistics
 */
@Injectable()
export class BusinessesService {
  
  /**
   * Creates a new business
   * 
   * @param {CreateBusinessDto} createBusinessDto - Business creation data
   * @param {string} userId - ID of the user creating the business
   * @returns {Promise<Business>} The created business entity
   * @throws {BadRequestException} If validation fails or slug already exists
   * @throws {NotFoundException} If governorate or city not found
   * 
   * @example
   * ```typescript
   * const business = await businessesService.create({
   *   nameAr: 'مطعم الشام',
   *   governorateId: 'gov-123',
   *   cityId: 'city-456',
   * }, 'user-789');
   * ```
   */
  async create(
    createBusinessDto: CreateBusinessDto,
    userId: string,
  ): Promise<Business> {
    // implementation
  }

  /**
   * Updates business status
   * 
   * @param {string} id - Business ID
   * @param {BusinessStatus} status - New status
   * @returns {Promise<Business>} Updated business
   * @throws {NotFoundException} If business not found
   * 
   * @remarks
   * When status is changed to APPROVED, the publishedAt timestamp is set
   */
  async updateStatus(id: string, status: BusinessStatus): Promise<Business> {
    // implementation
  }
}
```

#### 5.2 README Files

```markdown
# businesses Module

## Overview
This module handles all business-related operations in the Green Pages system.

## Features
- CRUD operations for businesses
- Status management (Draft, Pending, Approved, Rejected)
- Statistics and analytics
- Search and filtering
- Package integration

## API Endpoints

### Create Business
```http
POST /api/businesses
Authorization: Bearer {token}
Content-Type: application/json

{
  "nameAr": "مطعم الشام",
  "governorateId": "uuid",
  "cityId": "uuid"
}
```

### Get Business by ID
```http
GET /api/businesses/:id
```

[Full documentation in Swagger at /api/docs]

## Services

### BusinessesService
Main service for business operations.

**Methods:**
- `create(dto, userId)` - Create new business
- `findAll(query)` - Get businesses with filters
- `findById(id)` - Get single business
- `update(id, dto)` - Update business
- `updateStatus(id, status)` - Change status
- `delete(id)` - Soft delete business
- `getStats()` - Get statistics

## Database Schema
[Link to schema.prisma]

## Tests
```bash
# Unit tests
pnpm test businesses.service

# E2E tests
pnpm test:e2e businesses

# Coverage
pnpm test:cov
```

## Examples
See `examples/` directory for usage examples.
```

---

### المرحلة 6: Code Review Process (مستمر)

#### 6.1 Pull Request Template

```markdown
## Description
<!-- Describe your changes in detail -->

## Type of change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Testing
<!-- Describe the tests you ran -->

## Screenshots (if applicable)

## Related Issues
Closes #
```

#### 6.2 Code Review Guidelines

**للمراجع:**
1. ✅ Check code style and formatting
2. ✅ Verify tests are present and passing
3. ✅ Check for security issues
4. ✅ Verify error handling
5. ✅ Check for performance issues
6. ✅ Verify documentation is updated
7. ✅ Check for breaking changes

**للمطور:**
1. Keep PRs small (< 400 lines)
2. Write descriptive commit messages
3. Add tests for new features
4. Update documentation
5. Respond to review comments promptly

---

## 📊 مقاييس النجاح (Success Metrics)

### Code Quality Metrics:

| المؤشر | الحالي | الهدف |
|--------|--------|-------|
| Test Coverage | 0% | 80%+ |
| ESLint Errors | غير معروف | 0 |
| Code Duplication | غير معروف | < 5% |
| Cyclomatic Complexity | غير معروف | < 10 |
| Technical Debt Ratio | غير معروف | < 5% |
| Documentation Coverage | 10% | 90%+ |

### Performance Metrics:

| المؤشر | الحالي | الهدف |
|--------|--------|-------|
| API Response Time (p95) | غير معروف | < 200ms |
| Database Query Time | غير معروف | < 50ms |
| Page Load Time | غير معروف | < 2s |
| Bundle Size | غير معروف | < 500KB |

---

## 🎯 الجدول الزمني للتنفيذ

| الأسبوع | المهمة | المخرجات |
|---------|--------|----------|
| 1 | Setup & Config | ESLint, Prettier, Husky configured |
| 2-3 | Testing Infrastructure | Jest configured, 50+ tests written |
| 4-5 | Code Quality | Error handling, Types, DTOs improved |
| 6 | Performance | Caching, Indexing, Optimization |
| 7 | Documentation | JSDoc, README, Examples |
| 8+ | Continuous | Code reviews, Refactoring |

---

## ✅ خطوات العمل

### الأسبوع الأول:
- [ ] إعداد ESLint
- [ ] إعداد Prettier
- [ ] إعداد Husky & Lint-staged
- [ ] تشغيل Lint على الكود الحالي وإصلاح الأخطاء الحرجة

### الأسبوع الثاني:
- [ ] إعداد Jest
- [ ] كتابة 20 Unit Test على الأقل
- [ ] إعداد Coverage reporting

### الأسبوع الثالث:
- [ ] كتابة 30 Unit Test إضافية
- [ ] إعداد E2E Testing
- [ ] كتابة 10 E2E Tests

### الأسبوع الرابع:
- [ ] تحسين Error Handling
- [ ] إضافة Type Safety كامل
- [ ] تحسين DTOs

### الأسبوع الخامس:
- [ ] إضافة Custom Decorators
- [ ] تحسين Swagger Docs
- [ ] Code refactoring

### الأسبوع السادس:
- [ ] Database optimization
- [ ] Caching implementation
- [ ] Pagination improvements

### الأسبوع السابع:
- [ ] JSDoc comments
- [ ] README files
- [ ] Examples

---

## 🎓 التدريب والتوثيق

### للفريق:
1. **Workshop: Testing Best Practices** (4 ساعات)
2. **Workshop: Clean Code Principles** (4 ساعات)
3. **Code Review Training** (2 ساعات)

### الموارد:
- NestJS Best Practices Guide
- TypeScript Style Guide
- Testing Guide
- Code Review Checklist

---

**الإصدار:** 1.0  
**تاريخ آخر تحديث:** 4 يناير 2026
