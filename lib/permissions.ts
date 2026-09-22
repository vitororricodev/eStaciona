export type UserRole = 'owner' | 'manager' | 'operator';

export type Permission =
  | 'access:operation'
  | 'access:admin'
  | 'manage:organization'
  | 'manage:staff'
  | 'manage:staff-role'
  | 'manage:tariffs'
  | 'manage:services'
  | 'view:reports'
  | 'view:audit'
  | 'cash:withdraw';

const permissions: Record<UserRole, ReadonlySet<Permission>> = {
  owner: new Set([
    'access:operation',
    'access:admin',
    'manage:organization',
    'manage:staff',
    'manage:staff-role',
    'manage:tariffs',
    'manage:services',
    'view:reports',
    'view:audit',
    'cash:withdraw',
  ]),
  manager: new Set([
    'access:operation',
    'access:admin',
    'manage:organization',
    'manage:staff',
    'manage:tariffs',
    'manage:services',
    'view:reports',
    'view:audit',
    'cash:withdraw',
  ]),
  operator: new Set(['access:operation']),
};

export function isUserRole(value: unknown): value is UserRole {
  return value === 'owner' || value === 'manager' || value === 'operator';
}

export function hasPermission(role: string | null | undefined, permission: Permission) {
  return isUserRole(role) && permissions[role].has(permission);
}
