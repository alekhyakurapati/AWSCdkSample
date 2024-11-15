import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AzureADStrategy } from './strategies/azure-ad.strategy';
import { AuthController } from './auth.controller';

@Module({
    imports: [PassportModule],
    controllers: [AuthController],
    providers: [AuthService, AzureADStrategy],
    exports: [AuthService],
})
export class AuthModule {}
