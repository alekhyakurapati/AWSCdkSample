import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, ROLES_KEY } from '../auth-roles';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        return this.isAllowed(requiredRoles, request.user?.roles);
    }

    isAllowed(requiredRoles: string[], userRoles: string[] = []) {
        return requiredRoles.some((requiredRole) => {
            for (const userRole of userRoles) {
                // matches users with Event.User.[SystemName] role to Event.User
                if (userRole.startsWith(requiredRole)) {
                    return true;
                }
            }
            return false;
        });
    }
}
