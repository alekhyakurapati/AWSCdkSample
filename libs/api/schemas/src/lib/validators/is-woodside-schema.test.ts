import { validate } from 'class-validator';
import { CreateSchemaDto } from '../dto';

describe('tests valid woodside schema', function () {
    let mockSchemaRequest: any;
    let mockExample: CreateSchemaDto;
    beforeEach(() => {
        mockSchemaRequest = {
            $schema: 'http://json-schema.org/draft-04/schema#',
            type: 'object',
            properties: {
                'detail-type': {
                    type: 'string',
                },
                resources: {
                    type: 'array',
                    items: {},
                },
                detail: {
                    type: 'object',
                    properties: {
                        Metadata: {
                            type: 'object',
                            properties: {
                                Guid: {
                                    type: 'string',
                                },
                                Time: {
                                    type: 'string',
                                },
                                Version: {
                                    type: 'string',
                                },
                            },
                        },
                        Data: {
                            type: 'object',
                            properties: {
                                test: {
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
                id: {
                    type: 'string',
                },
                source: {
                    type: 'string',
                },
                time: {
                    type: 'string',
                },
                region: {
                    type: 'string',
                },
                account: {
                    type: 'string',
                },
            },
        };
        mockExample = new CreateSchemaDto();
    });

    it('Does not throw errors on a valid woodside schema ', async () => {
        mockExample.Content = JSON.stringify(mockSchemaRequest);
        const result = await validate(mockExample, { skipMissingProperties: true });
        expect(result.length).toBe(0);
    });

    it('Throws an error if Metadata is not in the schema ', async () => {
        delete mockSchemaRequest.properties.detail.properties.Metadata;
        mockExample.Content = JSON.stringify(mockSchemaRequest);
        const result = await validate(mockExample, { skipMissingProperties: true });
        expect(result[0].constraints).toEqual({
            isValidWoodsideSchema: 'Content is missing the following fields: \n Missing Metadata property',
        });
    });

    it('Throws an error if Metadata.Guid is not in the schema ', async () => {
        delete mockSchemaRequest.properties.detail.properties.Metadata.properties.Guid;
        mockExample.Content = JSON.stringify(mockSchemaRequest);
        const result = await validate(mockExample, { skipMissingProperties: true });
        expect(result[0].constraints).toEqual({
            isValidWoodsideSchema: 'Content is missing the following fields: \n Missing Metadata.Guid property',
        });
    });

    it('Throws an error if Metadata.Time is not in the schema ', async () => {
        delete mockSchemaRequest.properties.detail.properties.Metadata.properties.Time;
        mockExample.Content = JSON.stringify(mockSchemaRequest);
        const result = await validate(mockExample, { skipMissingProperties: true });
        expect(result[0].constraints).toEqual({
            isValidWoodsideSchema: 'Content is missing the following fields: \n Missing Metadata.Time property',
        });
    });

    it('Throws an error if Metadata.Version is not in the schema ', async () => {
        delete mockSchemaRequest.properties.detail.properties.Metadata.properties.Version;
        mockExample.Content = JSON.stringify(mockSchemaRequest);
        const result = await validate(mockExample, { skipMissingProperties: true });
        expect(result[0].constraints).toEqual({
            isValidWoodsideSchema: 'Content is missing the following fields: \n Missing Metadata.Version property',
        });
    });

    it('Throws an error if data is not in the schema ', async () => {
        delete mockSchemaRequest.properties.detail.properties.Data;
        mockExample.Content = JSON.stringify(mockSchemaRequest);
        const result = await validate(mockExample, { skipMissingProperties: true });
        expect(result[0].constraints).toEqual({
            isValidWoodsideSchema: 'Content is missing the following fields: \n Missing Data property',
        });
    });

    // it('Throws an error if data definition is not supplied', async () => {
    //     mockSchemaRequest.properties.detail.properties.Data.type = 'string';
    //     mockExample.Content = JSON.stringify(mockSchemaRequest);
    //     const result = await validate(mockExample, { skipMissingProperties: true });
    //     console.log('result', result);
    //     expect(result[0].constraints).toEqual({
    //         isValidWoodsideSchema: 'Content is missing the following fields: \n Missing Data Definition',
    //     });
    // });
});
