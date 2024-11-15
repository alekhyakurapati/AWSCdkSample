import { Test } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
    let service: AppService;

    beforeAll(async () => {
        const app = await Test.createTestingModule({
            providers: [AppService],
        }).compile();

        service = app.get<AppService>(AppService);
    });

    describe('getHello', () => {
        it('should return "API is running!"', () => {
            // arrange
            const expectedResult = { message: 'API is running!' };
            // act
            const result = service.getHello();
            // asset
            expect(result).toEqual(expectedResult);
        });
    });
});
