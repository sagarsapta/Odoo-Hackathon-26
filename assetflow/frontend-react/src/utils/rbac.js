const permissions = {
  Admin: { pages: ['dashboard', 'org-setup', 'assets', 'booking', 'maintenance', 'audit', 'reports', 'notifications', 'profile', 'settings'], actions: ['register_asset', 'create_department', 'add_category', 'start_audit', 'view_reports', 'approve_maintenance', 'book_resource', 'raise_maintenance'] },
  'Asset Manager': { pages: ['dashboard', 'assets', 'allocation', 'booking', 'maintenance', 'audit', 'reports', 'notifications', 'profile', 'settings'], actions: ['register_asset', 'allocate_asset', 'approve_transfer', 'approve_maintenance', 'book_resource', 'raise_maintenance', 'request_transfer', 'request_return', 'approve_allocation'] },
  AssetManager: { pages: ['dashboard', 'assets', 'allocation', 'booking', 'maintenance', 'audit', 'reports', 'notifications', 'profile', 'settings'], actions: ['register_asset', 'allocate_asset', 'approve_transfer', 'approve_maintenance', 'book_resource', 'raise_maintenance', 'request_transfer', 'request_return', 'approve_allocation'] },
  'Department Head': { pages: ['dashboard', 'assets', 'allocation', 'booking', 'reports', 'notifications', 'profile', 'settings'], actions: ['approve_allocation', 'approve_transfer', 'book_resource', 'request_transfer', 'request_return'] },
  DepartmentHead: { pages: ['dashboard', 'assets', 'allocation', 'booking', 'reports', 'notifications', 'profile', 'settings'], actions: ['approve_allocation', 'approve_transfer', 'book_resource', 'request_transfer', 'request_return'] },
  Employee: { pages: ['dashboard', 'assets', 'booking', 'maintenance', 'notifications', 'profile', 'settings'], actions: ['book_resource', 'raise_maintenance', 'request_transfer', 'request_return', 'request_asset'] }
};

export const canAccess = (role, page) => Boolean(permissions[role]?.pages.includes(page));
export const can = (role, action) => Boolean(permissions[role]?.actions.includes(action));
export const pagePermissions = permissions;
