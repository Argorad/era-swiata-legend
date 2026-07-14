import type { UserRole } from "./UserRole";

export interface AuthStatus {
    enabled: boolean;
    roles: string[];
    message: string;
}

export interface AuthSession {
    id: string;
    displayName: string;
    email: string | null;
    role: UserRole;
    mustChangePassword: boolean;
}

export interface AuthMeResponse {
    enabled: boolean;
    user: AuthSession | null;
}

export interface LoginRequest {
    login: string;
    password: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface UserAdmin {
    id: string;
    displayName: string;
    email: string | null;
    role: UserRole;
    isActive: boolean;
    mustChangePassword: boolean;
    createdAt: string;
    updatedAt: string | null;
}

export interface CreateUserRequest {
    displayName: string;
    email: string | null;
    password: string;
    role: UserRole;
    isActive: boolean;
    mustChangePassword: boolean;
}

export interface UpdateUserRequest {
    displayName: string;
    email: string | null;
    password: string | null;
    role: UserRole;
    isActive: boolean;
    mustChangePassword: boolean;
}
