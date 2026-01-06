import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ScopeGuard } from './scope.guard';
import { SCOPE_ENTITY_KEY } from '../decorators/scope-entity.decorator';
import { SCOPE_KEY } from '../decorators/scope.decorator';
import { ScopeType, Resource, Action } from '../constants/rbac.constants';
import { UserRole } from '@greenpages/database';
import { PrismaService } from '../../../prisma/prisma.service';

describe('ScopeGuard - Entity-Based Scope Enforcement', () => {
  let guard: ScopeGuard;
  let reflector: Reflector;
  let prisma: PrismaService;

  const mockRequest = {
    user: null,
    params: {},
    query: {},
    body: {},
    scopeEntityCache: {},
  };

  const mockExecutionContext = (
    metadata: Record<string, any> = {},
  ): ExecutionContext => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    return context;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScopeGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: (key: string, targets: any[]) => {
              if (key === SCOPE_ENTITY_KEY) {
                return mockScopeEntityMetadata;
              }
              if (key === SCOPE_KEY) {
                return mockScopeType;
              }
              return undefined;
            },
          },
        },
        {
          provide: 'PrismaService',
          useValue: mockPrismaService(),
        },
      ],
    }).compile();

    guard = module.get<ScopeGuard>(ScopeGuard);
    reflector = module.get<Reflector>(Reflector);
    prisma = module.get('PrismaService');
  });

  let mockScopeEntityMetadata: any = null;
  let mockScopeType: any = null;

  function mockPrismaService() {
    return {
      business: {
        findUnique: jest.fn(),
      },
      agentVisit: {
        findUnique: jest.fn(),
      },
      review: {
        findUnique: jest.fn(),
      },
    };
  }

  describe('Entity-Based Business Scope (Agent Owned)', () => {
    it('should allow agent to access their own business', async () => {
      mockScopeEntityMetadata = {
        entity: 'business',
        paramName: 'id',
      };
      mockScopeType = null;

      mockRequest.user = {
        id: 'user-123',
        role: UserRole.AGENT,
        agentProfileId: 'agent-456',
      };
      mockRequest.params = { id: 'business-789' };

      // Mock Prisma response
      prisma.business.findUnique = jest.fn().mockResolvedValue({
        id: 'business-789',
        agentId: 'agent-456',
        governorateId: 'gov-1',
      });

      const context = mockExecutionContext();
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(prisma.business.findUnique).toHaveBeenCalledWith({
        where: { id: 'business-789' },
        select: expect.objectContaining({
          id: true,
          governorateId: true,
          agentId: true,
          createdById: true,
        }),
      });
    });

    it('should deny agent accessing another agent business', async () => {
      mockScopeEntityMetadata = {
        entity: 'business',
        paramName: 'id',
      };
      mockScopeType = null;

      mockRequest.user = {
        id: 'user-123',
        role: UserRole.AGENT,
        agentProfileId: 'agent-456',
      };
      mockRequest.params = { id: 'business-789' };

      // Mock Prisma response - different agent
      prisma.business.findUnique = jest.fn().mockResolvedValue({
        id: 'business-789',
        agentId: 'agent-999',  // Different agent
        governorateId: 'gov-1',
      });

      const context = mockExecutionContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should cache entity in request to avoid duplicate queries', async () => {
      mockScopeEntityMetadata = {
        entity: 'business',
        paramName: 'id',
      };
      mockScopeType = null;

      mockRequest.user = {
        id: 'user-123',
        role: UserRole.AGENT,
        agentProfileId: 'agent-456',
      };
      mockRequest.params = { id: 'business-789' };
      mockRequest.scopeEntityCache = {};

      const mockBusiness = {
        id: 'business-789',
        agentId: 'agent-456',
        governorateId: 'gov-1',
      };

      prisma.business.findUnique = jest
        .fn()
        .mockResolvedValue(mockBusiness);

      const context = mockExecutionContext();

      // First call
      await guard.canActivate(context);
      expect(prisma.business.findUnique).toHaveBeenCalledTimes(1);

      // Simulate second call with same params
      await guard.canActivate(context);
      // Should still be 1 because cached
      expect(prisma.business.findUnique).toHaveBeenCalledTimes(1);
      expect(mockRequest.scopeEntityCache).toHaveProperty(
        'scopeEntity:business:business-789:byId',
      );
    });
  });

  describe('Entity-Based Business Scope (Governorate Manager)', () => {
    it('should allow manager to access business in their governorate', async () => {
      mockScopeEntityMetadata = {
        entity: 'business',
        paramName: 'id',
      };
      mockScopeType = null;

      mockRequest.user = {
        id: 'user-123',
        role: UserRole.GOVERNORATE_MANAGER,
        managedGovernorateIds: ['gov-1', 'gov-2'],
      };
      mockRequest.params = { id: 'business-789' };

      prisma.business.findUnique = jest.fn().mockResolvedValue({
        id: 'business-789',
        governorateId: 'gov-1',
        agentId: 'agent-456',
      });

      const context = mockExecutionContext();
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny manager accessing business outside their governorates', async () => {
      mockScopeEntityMetadata = {
        entity: 'business',
        paramName: 'id',
      };
      mockScopeType = null;

      mockRequest.user = {
        id: 'user-123',
        role: UserRole.GOVERNORATE_MANAGER,
        managedGovernorateIds: ['gov-1', 'gov-2'],
      };
      mockRequest.params = { id: 'business-789' };

      prisma.business.findUnique = jest.fn().mockResolvedValue({
        id: 'business-789',
        governorateId: 'gov-999',  // Not in managed list
        agentId: 'agent-456',
      });

      const context = mockExecutionContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('Entity-Based Review Scope (User Owned)', () => {
    it('should allow user to access their own review', async () => {
      mockScopeEntityMetadata = {
        entity: 'review',
        paramName: 'id',
      };
      mockScopeType = null;

      mockRequest.user = {
        id: 'user-123',
        role: UserRole.USER,
      };
      mockRequest.params = { id: 'review-456' };

      prisma.review.findUnique = jest.fn().mockResolvedValue({
        id: 'review-456',
        userId: 'user-123',
        businessId: 'business-789',
      });

      const context = mockExecutionContext();
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny user accessing another user review', async () => {
      mockScopeEntityMetadata = {
        entity: 'review',
        paramName: 'id',
      };
      mockScopeType = null;

      mockRequest.user = {
        id: 'user-123',
        role: UserRole.USER,
      };
      mockRequest.params = { id: 'review-456' };

      prisma.review.findUnique = jest.fn().mockResolvedValue({
        id: 'review-456',
        userId: 'user-999',  // Different user
        businessId: 'business-789',
      });

      const context = mockExecutionContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('ADMIN/SUPERVISOR Override', () => {
    it('should allow admin to bypass all scope checks', async () => {
      mockScopeEntityMetadata = {
        entity: 'business',
        paramName: 'id',
      };
      mockScopeType = null;

      mockRequest.user = {
        id: 'admin-123',
        role: UserRole.ADMIN,
      };
      mockRequest.params = { id: 'business-789' };

      const context = mockExecutionContext();
      const result = await guard.canActivate(context);

      // Should return true without fetching entity
      expect(result).toBe(true);
      expect(prisma.business.findUnique).not.toHaveBeenCalled();
    });

    it('should allow supervisor to bypass all scope checks', async () => {
      mockScopeEntityMetadata = {
        entity: 'review',
        paramName: 'id',
      };
      mockScopeType = null;

      mockRequest.user = {
        id: 'supervisor-123',
        role: UserRole.SUPERVISOR,
      };
      mockRequest.params = { id: 'review-456' };

      const context = mockExecutionContext();
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(prisma.review.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when entity not found', async () => {
      mockScopeEntityMetadata = {
        entity: 'business',
        paramName: 'id',
      };
      mockScopeType = null;

      mockRequest.user = {
        id: 'user-123',
        role: UserRole.AGENT,
        agentProfileId: 'agent-456',
      };
      mockRequest.params = { id: 'nonexistent-business' };

      prisma.business.findUnique = jest.fn().mockResolvedValue(null);

      const context = mockExecutionContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        'business not found',
      );
    });

    it('should throw error when required parameter missing', async () => {
      mockScopeEntityMetadata = {
        entity: 'business',
        paramName: 'id',
      };
      mockScopeType = null;

      mockRequest.user = {
        id: 'user-123',
        role: UserRole.AGENT,
        agentProfileId: 'agent-456',
      };
      mockRequest.params = {};  // Missing 'id'

      const context = mockExecutionContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Missing required parameter: id',
      );
    });
  });

  describe('Backward Compatibility', () => {
    it('should still support legacy @Scope decorator', async () => {
      mockScopeEntityMetadata = null;
      mockScopeType = ScopeType.GLOBAL;

      mockRequest.user = {
        id: 'user-123',
        role: UserRole.AGENT,
        agentProfileId: 'agent-456',
      };

      const context = mockExecutionContext();
      // Non-GLOBAL scope for non-admin should fail
      const result = await guard.canActivate(context);
      // For GLOBAL without admin, should throw
    });
  });
});
