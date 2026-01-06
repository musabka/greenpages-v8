import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@greenpages/database';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * مساعدات للأدوار الشائعة - النظام الجديد فقط
 * Roles: ADMIN, SUPERVISOR, GOVERNORATE_MANAGER, AGENT, BUSINESS, USER
 */

// المدراء فقط (ADMIN)
export const AdminOnly = () => Roles(UserRole.ADMIN);

// المدراء والمشرفين
export const AdminOrSupervisor = () => Roles(
  UserRole.ADMIN, 
  UserRole.SUPERVISOR
);

// كل الموظفين (المدراء، المشرفين، مديري المحافظات، المندوبين)
export const StaffOnly = () => Roles(
  UserRole.ADMIN, 
  UserRole.SUPERVISOR, 
  UserRole.GOVERNORATE_MANAGER,
  UserRole.AGENT
);

// مديري المحافظات وما فوق
export const GovernorateManagerOrAbove = () => Roles(
  UserRole.ADMIN, 
  UserRole.SUPERVISOR, 
  UserRole.GOVERNORATE_MANAGER
);

// المندوبين وما فوق
export const AgentOrAbove = () => Roles(
  UserRole.ADMIN, 
  UserRole.SUPERVISOR, 
  UserRole.GOVERNORATE_MANAGER,
  UserRole.AGENT
);

// DEPRECATED: Use hasBusinessAccess in JWT + CapabilitiesService instead
// أصحاب الأنشطة أو الموظفين - check capabilities instead