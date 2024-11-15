import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AuthUser } from './auth-user';
import { AuthService } from './auth.service';

describe('AuthService', () => {
    let service: AuthService;
    const mockUser: AuthUser = {
        name: 'test user',
        username: 'test',
        roles: ['userrole'],
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                AuthService,
                ConfigService,
                {
                    provide: 'REQUEST',
                    useValue: {
                        user: mockUser,
                    },
                },
            ],
        }).compile();

        service = module.get(AuthService);
    });

    it('should be defined', () => {
        expect(service).toBeTruthy();
    });

    it('getProfile should return a user profile', () => {
        expect(service.getProfile()).toEqual(mockUser);
    });
});
