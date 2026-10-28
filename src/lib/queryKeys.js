export const qk = {
  profile: ['profile'],
  users: {
    profile: ['profile'],
  },
  incidents: {
    all: ['incidents'],
    my: (params) => ['incidents', 'my', params ?? {}],
    detail: (id) => ['incidents', 'detail', String(id)],
    history: (id) => ['incidents', 'history', String(id)],
    responderLocation: (id) => ['incidents', 'responderLocation', String(id)],
  },
  admin: {
    all: ['admin'],
    dashboard: ['admin', 'dashboard'],
    analytics: ['admin', 'analytics'],
    report: (year, month) => ['admin', 'report', { year, month }],
    incidents: (params) => ['admin', 'incidents', params ?? {}],
    incident: (id) => ['admin', 'incident', String(id)],
    users: (params) => ['admin', 'users', params ?? {}],
    user: (id) => ['admin', 'user', String(id)],
    availableResponders: (type) => ['admin', 'availableResponders', type || 'all'],
    nearby: (params) => ['admin', 'nearby', params ?? {}],
  },
  responder: {
    all: ['responder'],
    dashboard: ['responder', 'dashboard'],
    assignments: (params) => ['responder', 'assignments', params ?? {}],
    assignment: (id) => ['responder', 'assignment', String(id)],
    completed: (params) => ['responder', 'completed', params ?? {}],
  },
  notifications: {
    all: ['notifications'],
    list: (params) => ['notifications', 'list', params ?? {}],
    unreadCount: ['notifications', 'unreadCount'],
  },
};
