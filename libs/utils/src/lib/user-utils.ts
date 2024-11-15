import { BadRequestException } from '@nestjs/common';
import { AuthUser } from '@eai-event-integration-platform/api/auth';

export function generateChangedBy(user: AuthUser | undefined) {
    if (!user) {
        throw new BadRequestException('User not defined');
    }
    return `${user.name} <${user.username}>`;
}
