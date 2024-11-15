import { SchemaSummary } from '@eai-event-integration-platform/interfaces';
import { useAtomValue } from 'jotai';
import { domainFilterAtom, schemaSearchQueryAtom, schemaSortOptionAtom, appFilterAtom } from '../atoms';
import { SchemaSortingOption } from '../types';
import { extractSchemaShortName } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { useFetchAllSchemas } from '@eai-event-integration-platform/integration-hub/data';

export const useFetchSortedSchemas = () => {
    const query = useFetchAllSchemas();
    const domainFilterValue = useAtomValue(domainFilterAtom);
    const appFilterValue = useAtomValue(appFilterAtom);
    const queryFilterValue = useAtomValue(schemaSearchQueryAtom);
    const sortOption = useAtomValue(schemaSortOptionAtom);

    const appFilter = (schema: SchemaSummary) =>
        appFilterValue.length > 0 ? appFilterValue.includes(schema.AppName ?? '') : true;

    const domainFilter = (schema: SchemaSummary) =>
        domainFilterValue.length > 0 ? domainFilterValue.includes((schema.Domain ?? '').split('.', 3).join('.')) : true;

    const textFilter = (schema: SchemaSummary) =>
        queryFilterValue
            ? schema.SchemaName?.toLowerCase().includes(queryFilterValue.toLowerCase()) ||
              schema.Description?.toLowerCase().includes(queryFilterValue.toLowerCase())
            : true;

    function schemaSort(o1: SchemaSummary, o2: SchemaSummary) {
        switch (sortOption) {
            case SchemaSortingOption.LAST_UPDATED_DESC: {
                if (!o1.LastUpdated || !o2.LastUpdated) {
                    return 0;
                }
                return new Date(o2.LastUpdated).getTime() - new Date(o1.LastUpdated).getTime();
            }
            case SchemaSortingOption.ALPHABETICAL_DESC: {
                return (
                    extractSchemaShortName(o2.SchemaName || '').localeCompare(
                        extractSchemaShortName(o1.SchemaName || ''),
                    ) ?? 0
                );
            }
            case SchemaSortingOption.ALPHABETICAL_ASC: {
                return (
                    extractSchemaShortName(o1.SchemaName || '').localeCompare(
                        extractSchemaShortName(o2.SchemaName || ''),
                    ) ?? 0
                );
            }
            default:
                return 0;
        }
    }

    return {
        ...query,
        data: query.data?.filter(appFilter).filter(domainFilter).filter(textFilter).sort(schemaSort),
    };
};
