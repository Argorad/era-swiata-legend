export type UserRole = 0 | 1 | 2;

export const userRoleLabels: Record<UserRole, string> = {
    0: "Administrator",
    1: "GameMaster",
    2: "Player",
};
