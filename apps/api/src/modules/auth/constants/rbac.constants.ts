export enum Resource {
  USERS = 'users',
  BUSINESSES = 'businesses',
  GOVERNORATES = 'governorates',
  GEOGRAPHY = 'geography',
  PACKAGES = 'packages',
  SETTINGS = 'settings',
  REPORTS = 'reports',
  AGENTS = 'agents',
  COMMISSIONS = 'commissions',
  VISITS = 'visits',
  RENEWALS = 'renewals',
  REVIEWS = 'reviews',
}

export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE_ROLES = 'manage_roles',
  APPROVE = 'approve',
  REJECT = 'reject',
  ASSIGN = 'assign',
  PAY = 'pay',
  EXPORT = 'export',
  REPLY = 'reply',
}

export enum ScopeType {
  GLOBAL = 'GLOBAL',           // وصول كامل (Admin)
  GOVERNORATE = 'GOVERNORATE', // مقيد بالمحافظة
  OWNED = 'OWNED',             // مقيد بالملكية الشخصية
}

export const PERMISSIONS_MATRIX = {
  ADMIN: {
    [Resource.USERS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.MANAGE_ROLES],
    [Resource.BUSINESSES]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.APPROVE, Action.REJECT],
    [Resource.GOVERNORATES]: [Action.READ, Action.UPDATE],
    [Resource.GEOGRAPHY]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.PACKAGES]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
    [Resource.SETTINGS]: [Action.READ, Action.UPDATE],
    [Resource.REPORTS]: [Action.READ, Action.EXPORT],
    [Resource.AGENTS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.ASSIGN],
    [Resource.COMMISSIONS]: [Action.READ, Action.APPROVE, Action.PAY],
    [Resource.VISITS]: [Action.CREATE, Action.READ],
    [Resource.RENEWALS]: [Action.READ, Action.UPDATE],
  },
  SUPERVISOR: {
    [Resource.USERS]: [Action.CREATE, Action.READ, Action.UPDATE],
    [Resource.BUSINESSES]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE, Action.APPROVE, Action.REJECT],
    [Resource.GOVERNORATES]: [Action.READ],
    [Resource.GEOGRAPHY]: [Action.READ],
    [Resource.PACKAGES]: [Action.READ],
    [Resource.REPORTS]: [Action.READ, Action.EXPORT],
    [Resource.AGENTS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.ASSIGN],
    [Resource.COMMISSIONS]: [Action.READ],
    [Resource.VISITS]: [Action.READ],
    [Resource.RENEWALS]: [Action.READ],
  },
  GOVERNORATE_MANAGER: {
    [Resource.BUSINESSES]: [Action.READ, Action.UPDATE],
    [Resource.AGENTS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.ASSIGN],
    [Resource.RENEWALS]: [Action.READ, Action.UPDATE],
    [Resource.REPORTS]: [Action.READ],
  },
  AGENT: {
    [Resource.BUSINESSES]: [Action.CREATE, Action.READ, Action.UPDATE],
    [Resource.VISITS]: [Action.CREATE, Action.READ],
    [Resource.RENEWALS]: [Action.READ, Action.UPDATE],
    [Resource.COMMISSIONS]: [Action.READ],
  },
  BUSINESS: {
    [Resource.BUSINESSES]: [Action.READ, Action.UPDATE], // Profile management
    // Add specific business actions if needed
  },
  USER: {
    // Public user actions
  }
};
