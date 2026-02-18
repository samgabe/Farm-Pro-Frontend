export const ROLE_PERMISSIONS = {
  owner: ['dashboard', 'animals', 'health', 'breeding', 'production', 'expenses', 'sales', 'reports', 'users'],
  manager: ['dashboard', 'animals', 'health', 'breeding', 'production', 'expenses', 'sales', 'reports', 'users'],
  veterinarian: ['dashboard', 'animals', 'health', 'reports'],
  worker: ['dashboard', 'animals', 'production']
}

export const ROLE_ACTIONS = {
  owner: ['animals.write', 'health.write', 'breeding.write', 'production.create', 'production.manage', 'expenses.write', 'sales.write', 'users.manage', 'reports.generate'],
  manager: ['animals.write', 'health.write', 'breeding.write', 'production.create', 'production.manage', 'expenses.write', 'sales.write', 'reports.generate'],
  veterinarian: ['health.write'],
  worker: ['production.create']
}

export function hasRouteAccess(role, routeKey) {
  const allowed = ROLE_PERMISSIONS[role] || []
  return allowed.includes(routeKey)
}

export function hasActionAccess(role, actionKey) {
  const allowed = ROLE_ACTIONS[role] || []
  return allowed.includes(actionKey)
}

export function canManageUsers(role) {
  return hasActionAccess(role, 'users.manage')
}
