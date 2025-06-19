/**
 * 定义系统中所有可用的权限资源和对应的操作。
 * 这是权限系统的"字典"。
 */
export const SYSTEM_PERMISSIONS = {
  user: {
    label: '用户管理',
    actions: [
      { key: 'create', label: '创建用户' },
      { key: 'read', label: '查看用户列表' },
      { key: 'update', label: '修改用户信息' },
      { key: 'delete', label: '删除用户' },
      { key: 'manage_status', label: '启用/禁用用户' },
      { key: 'reset_password', label: '重置密码' },
    ],
  },
  role: {
    label: '角色管理',
    actions: [
      { key: 'create', label: '创建角色' },
      { key: 'read', label: '查看角色列表' },
      { key: 'update', label: '修改角色' },
      { key: 'delete', label: '删除角色' },
    ],
  },
  group: {
    label: '部门/用户组管理',
    actions: [
      { key: 'create', label: '创建部门' },
      { key: 'read', label: '查看部门列表/树' },
      { key: 'update', label: '修改部门' },
      { key: 'delete', label: '删除部门' },
    ],
  },
  permission: {
    label: '权限分配',
    actions: [{ key: 'manage', label: '分配角色权限' }],
  },
  project: {
    label: '项目管理',
    actions: [
      { key: 'create', label: '创建项目' },
      { key: 'read', label: '查看项目' },
      { key: 'update', label: '修改项目' },
      { key: 'delete', label: '删除项目' },
    ],
  },
  workbench: {
    label: '工作台',
    actions: [{ key: 'access', label: '访问工作台' }],
  },
  all: {
    label: '所有权限',
    actions: [{ key: 'manage', label: '管理所有内容' }],
  },
};
