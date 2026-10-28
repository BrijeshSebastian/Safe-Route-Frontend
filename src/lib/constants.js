export const ROLES = Object.freeze({
  REPORTER: 'reporter',
  RESPONDER: 'responder',
  ADMIN: 'admin',
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.REPORTER]: 'Reporter',
  [ROLES.RESPONDER]: 'Responder',
  [ROLES.ADMIN]: 'Administrator',
});

export const INCIDENT_TYPES = Object.freeze({
  ROAD_ACCIDENT: 'road_accident',
  FIRE: 'fire',
  MEDICAL_EMERGENCY: 'medical_emergency',
  FLOOD: 'flood',
  EARTHQUAKE: 'earthquake',
  CRIME: 'crime',
  GAS_LEAK: 'gas_leak',
  ELECTRICAL_HAZARD: 'electrical_hazard',
  OTHER: 'other',
});

export const INCIDENT_TYPE_LABELS = Object.freeze({
  [INCIDENT_TYPES.ROAD_ACCIDENT]: 'Road Accident',
  [INCIDENT_TYPES.FIRE]: 'Fire Emergency',
  [INCIDENT_TYPES.MEDICAL_EMERGENCY]: 'Medical Emergency',
  [INCIDENT_TYPES.FLOOD]: 'Flood',
  [INCIDENT_TYPES.EARTHQUAKE]: 'Earthquake',
  [INCIDENT_TYPES.CRIME]: 'Crime / Safety',
  [INCIDENT_TYPES.GAS_LEAK]: 'Gas Leak',
  [INCIDENT_TYPES.ELECTRICAL_HAZARD]: 'Electrical Hazard',
  [INCIDENT_TYPES.OTHER]: 'Other Emergency',
});

export const SEVERITIES = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
});

export const SEVERITY_LABELS = Object.freeze({
  [SEVERITIES.LOW]: 'Low',
  [SEVERITIES.MEDIUM]: 'Medium',
  [SEVERITIES.HIGH]: 'High',
  [SEVERITIES.CRITICAL]: 'Critical',
});

export const INCIDENT_STATUSES = Object.freeze({
  PENDING: 'pending',
  VERIFIED: 'verified',
  ASSIGNED: 'assigned',
  ACCEPTED: 'accepted',
  ON_THE_WAY: 'on_the_way',
  REACHED: 'reached',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
});

export const STATUS_LABELS = Object.freeze({
  [INCIDENT_STATUSES.PENDING]: 'Pending Verification',
  [INCIDENT_STATUSES.VERIFIED]: 'Verified',
  [INCIDENT_STATUSES.ASSIGNED]: 'Assigned',
  [INCIDENT_STATUSES.ACCEPTED]: 'Accepted',
  [INCIDENT_STATUSES.ON_THE_WAY]: 'On the way',
  [INCIDENT_STATUSES.REACHED]: 'Reached Location',
  [INCIDENT_STATUSES.RESOLVED]: 'Resolved',
  [INCIDENT_STATUSES.REJECTED]: 'Rejected',
  [INCIDENT_STATUSES.CANCELLED]: 'Cancelled',
});

export const INCIDENT_STATUS_LABELS = STATUS_LABELS;

export const ASSIGNMENT_STATUSES = Object.freeze({
  ASSIGNED: 'assigned',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
});

export const ASSIGNMENT_STATUS_LABELS = Object.freeze({
  [ASSIGNMENT_STATUSES.ASSIGNED]: 'Assigned',
  [ASSIGNMENT_STATUSES.ACCEPTED]: 'Accepted',
  [ASSIGNMENT_STATUSES.REJECTED]: 'Rejected',
  [ASSIGNMENT_STATUSES.COMPLETED]: 'Completed',
});

export const RESPONDER_TYPES = Object.freeze({
  AMBULANCE: 'ambulance',
  POLICE: 'police',
  FIRE: 'fire',
});

export const RESPONDER_TYPE_LABELS = Object.freeze({
  [RESPONDER_TYPES.AMBULANCE]: 'Ambulance (EMS)',
  [RESPONDER_TYPES.POLICE]: 'Police Unit',
  [RESPONDER_TYPES.FIRE]: 'Fire Rescue',
});

export const SUGGESTED_RESPONDER_BY_INCIDENT_TYPE = Object.freeze({
  [INCIDENT_TYPES.MEDICAL_EMERGENCY]: RESPONDER_TYPES.AMBULANCE,
  [INCIDENT_TYPES.ROAD_ACCIDENT]: RESPONDER_TYPES.AMBULANCE,
  [INCIDENT_TYPES.CRIME]: RESPONDER_TYPES.POLICE,
  [INCIDENT_TYPES.FIRE]: RESPONDER_TYPES.FIRE,
  [INCIDENT_TYPES.GAS_LEAK]: RESPONDER_TYPES.FIRE,
  [INCIDENT_TYPES.ELECTRICAL_HAZARD]: RESPONDER_TYPES.FIRE,
  [INCIDENT_TYPES.FLOOD]: RESPONDER_TYPES.FIRE,
  [INCIDENT_TYPES.EARTHQUAKE]: RESPONDER_TYPES.FIRE,
  [INCIDENT_TYPES.OTHER]: null,
});

export const TERMINAL_STATUSES = Object.freeze([
  INCIDENT_STATUSES.RESOLVED,
  INCIDENT_STATUSES.REJECTED,
  INCIDENT_STATUSES.CANCELLED,
]);

export const STATUS_COLORS = Object.freeze({
  [INCIDENT_STATUSES.PENDING]: 'butter',
  [INCIDENT_STATUSES.VERIFIED]: 'sky',
  [INCIDENT_STATUSES.ASSIGNED]: 'lavender',
  [INCIDENT_STATUSES.ACCEPTED]: 'mint',
  [INCIDENT_STATUSES.ON_THE_WAY]: 'peach',
  [INCIDENT_STATUSES.REACHED]: 'sky',
  [INCIDENT_STATUSES.RESOLVED]: 'mint',
  [INCIDENT_STATUSES.REJECTED]: 'rose',
  [INCIDENT_STATUSES.CANCELLED]: 'slate',
});

export const SEVERITY_COLORS = Object.freeze({
  [SEVERITIES.LOW]: 'mint',
  [SEVERITIES.MEDIUM]: 'butter',
  [SEVERITIES.HIGH]: 'peach',
  [SEVERITIES.CRITICAL]: 'rose',
});

export const TYPE_ICONS = Object.freeze({
  [INCIDENT_TYPES.FIRE]: 'Flame',
  [INCIDENT_TYPES.ROAD_ACCIDENT]: 'Car',
  [INCIDENT_TYPES.MEDICAL_EMERGENCY]: 'HeartPulse',
  [INCIDENT_TYPES.FLOOD]: 'Waves',
  [INCIDENT_TYPES.EARTHQUAKE]: 'Activity',
  [INCIDENT_TYPES.CRIME]: 'ShieldAlert',
  [INCIDENT_TYPES.GAS_LEAK]: 'Wind',
  [INCIDENT_TYPES.ELECTRICAL_HAZARD]: 'Zap',
  [INCIDENT_TYPES.OTHER]: 'AlertCircle',
});

export const ROLE_HOME = Object.freeze({
  [ROLES.REPORTER]: '/reporter/incidents',
  [ROLES.RESPONDER]: '/responder',
  [ROLES.ADMIN]: '/admin',
});

export const REFRESH_TOKEN_KEY = 'saferoute_refresh_token';
export const PAGE_SIZE_DEFAULT = 10;

export const sanitizePhone = (phone) => (phone ? String(phone).replace(/[\s-]/g, '') : '');

export const ROLE_BADGE_META = Object.freeze({
  [ROLES.REPORTER]: { label: 'Reporter', tone: 'slate', variant: 'slate' },
  [ROLES.RESPONDER]: { label: 'Responder', tone: 'sky', variant: 'sky' },
  [ROLES.ADMIN]: { label: 'Administrator', tone: 'lavender', variant: 'lavender' },
});

export const RESPONDER_TYPE_META = Object.freeze({
  [RESPONDER_TYPES.AMBULANCE]: { label: 'Ambulance', tone: 'peach', variant: 'peach' },
  [RESPONDER_TYPES.POLICE]: { label: 'Police', tone: 'sky', variant: 'sky' },
  [RESPONDER_TYPES.FIRE]: { label: 'Fire Rescue', tone: 'rose', variant: 'rose' },
});

