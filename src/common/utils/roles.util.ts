import { Role } from '@prisma/client';

/**
 * Checks if a role has admin-level privileges.
 * Both ADMIN and SUB_ADMIN have admin-level access.
 */
export function hasAdminAccess(role: Role): boolean {
  return role === Role.ADMIN || role === Role.SUB_ADMIN;
}

/**
 * Checks if a role can create another role.
 * Only ADMIN can create ADMIN or SUB_ADMIN users.
 * SUB_ADMIN can only create USER accounts.
 */
export function canCreateRole(actorRole: Role, targetRole: Role): boolean {
  // Only ADMIN can create ADMIN or SUB_ADMIN
  if (targetRole === Role.ADMIN || targetRole === Role.SUB_ADMIN) {
    return actorRole === Role.ADMIN;
  }

  // Both ADMIN and SUB_ADMIN can create USER accounts
  if (targetRole === Role.USER) {
    return hasAdminAccess(actorRole);
  }

  return false;
}

