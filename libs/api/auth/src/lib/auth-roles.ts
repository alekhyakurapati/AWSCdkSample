import { SetMetadata } from '@nestjs/common';

export enum Role {
    Viewer = 'Event.Viewer',
    User = 'Event.User',
    Admin = 'Event.Admin',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
