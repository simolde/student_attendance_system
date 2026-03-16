export const ROLES = {
    SUPER_ADMIN: "SUPER_ADMIN",
    ADMIN: "ADMIN",
    TEACHER: "TEACHER",
    STAFF: "STAFF",
    STUDENT: "STUDENT",
} as const;

export function hasRole(userRole: string, allowedRoles: string[]) {
    return allowedRoles.includes(userRole);
}