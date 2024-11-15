// @ts-ignore HACK: generate-schema is a JS library with no type declarations
import * as generateSchema from 'generate-schema';

export const parseSchema = (exampleData: string) => {
    try {
        const json = JSON.parse(exampleData);
        const eventbridgeObj = {
            'detail-type': '',
            resources: [],
            detail: json,
            id: '',
            source: '',
            time: '',
            region: '',
            account: '',
        };

        const exampleObj = {
            examples: [json],
        };

        return JSON.stringify({ ...generateSchema.json(eventbridgeObj), ...exampleObj }, null, 4);
    } catch (error) {
        return 'Error: could not parse JSON';
    }
};
