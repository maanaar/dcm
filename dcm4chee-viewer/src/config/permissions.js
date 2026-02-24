/**
 * App-level permission definitions.
 * Each permission maps to a screen/feature. Stored in Keycloak user attributes.
 * Admins always have all permissions + the Users admin page.
 */
export const APP_PERMISSIONS = [
  // Dashboard
  { id: 'dashboard',       label: 'Dashboard',              section: 'Dashboard' },

  // Navigation
  { id: 'patients',        label: 'Patients',               section: 'Navigation' },
  { id: 'studies',         label: 'Studies',                section: 'Navigation' },

  // Configuration
  { id: 'devices',         label: 'Devices',                section: 'Configuration' },
  { id: 'app-entities',    label: 'Application Entities',   section: 'Configuration' },
  { id: 'hl7-application', label: 'HL7 Application',        section: 'Configuration' },
  { id: 'routing-rules',   label: 'Routing Rules',          section: 'Configuration' },
  { id: 'transform-rules', label: 'Transform Rules',        section: 'Configuration' },
  { id: 'export-rules',    label: 'Export Rules',           section: 'Configuration' },
];

export const ALL_PERMISSION_IDS = APP_PERMISSIONS.map(p => p.id);

/** Returns the current user's permissions from localStorage (array of IDs). */
export const getUserPermissions = () => {
  try {
    return JSON.parse(localStorage.getItem('userPermissions') || '[]');
  } catch {
    return [];
  }
};

/** Check if the current user has a specific permission. Admins always pass. */
export const hasPermission = (permId) => {
  if (localStorage.getItem('isAdmin') === 'true') return true;
  return getUserPermissions().includes(permId);
};
