import { Controller, Get, Logger, UseGuards } from '@nestjs/common';
import { Roles, Role } from './auth-roles';
import { AuthService } from './auth.service';
import { AzureADGuard } from './guards/azure-ad.guard';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(private readonly authService: AuthService) {}

    @Get('profile')
    @Roles(Role.Viewer)
    @UseGuards(AzureADGuard, RolesGuard)
    getProfile() {
        this.logger.log('Getting user profile');
        return this.authService.getProfile();
    }

    // @Get('token')
    // getToken() {
    //     this.authService.getTokenOnBehalfOf();
    //     return 'asdfasdfasdfsadfasdf';
    // }
}
