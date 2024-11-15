import { REQUEST } from '@nestjs/core';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthUser } from './auth-user';

@Injectable()
export class AuthService {
    constructor(private configService: ConfigService, @Inject(REQUEST) private request: Request) {}

    getProfile(): AuthUser {
        return this.request.user as AuthUser;
    }
}
