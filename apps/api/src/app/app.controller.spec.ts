import { Test, TestingModule } from '@nestjs/testing';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { REQUEST } from '@nestjs/core';

describe('AppController', () => {
    let app: TestingModule;

    beforeAll(async () => {
        app = await Test.createTestingModule({
            controllers: [AppController],
            providers: [
                AppService,
                {
                    provide: REQUEST,
                    useValue: {},
                },
            ],
        }).compile();
    });

    describe('getData', () => {
        it('should show "Welcome to api!" with ', () => {
            // arrange
            const mockResponse = { message: 'Welcome to api!' };
            const appController = app.get<AppController>(AppController);
            const appService = app.get<AppService>(AppService);
            jest.spyOn(appService, 'getHello').mockImplementation(() => mockResponse);

            // act
            const result = appController.getData();

            // asset
            expect(result).toEqual(mockResponse);
        });
    });
});
