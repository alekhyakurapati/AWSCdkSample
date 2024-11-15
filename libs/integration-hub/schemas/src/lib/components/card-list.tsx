import { Box, Pagination, Skeleton, Stack, Typography } from '@mui/material';
import { ChangeEvent, useEffect, useCallback } from 'react';
import { useFetchSortedSchemas } from '../hooks';
import { useAtom, useAtomValue } from 'jotai';
import {
    appFilterAtom,
    domainFilterAtom,
    schemaPageAtom,
    schemaSearchQueryAtom,
    schemaPageScrollBarAtom,
} from '../atoms';
import { SchemaCard } from './schema-card';

const RESULTS_ON_PAGE = 10;

export const SchemaCardList = () => {
    const { data: schemas, isLoading, isError } = useFetchSortedSchemas();
    const [page, setPage] = useAtom(schemaPageAtom);
    const appFilter = useAtomValue(appFilterAtom);
    const domainFilter = useAtomValue(domainFilterAtom);
    const searchQuery = useAtomValue(schemaSearchQueryAtom);
    const schemaPageScrollBar = useAtomValue(schemaPageScrollBarAtom);

    const handleChangePage = useCallback(
        (_event: ChangeEvent<unknown> | null, newPage: number) => {
            setPage(newPage);
            if (schemaPageScrollBar) {
                schemaPageScrollBar.scrollTop(0);
            }
        },
        [setPage, schemaPageScrollBar],
    );

    useEffect(() => setPage(1), [appFilter, domainFilter, searchQuery, setPage]);

    if (isError) return <Typography>Encountered an error, please try refreshing</Typography>;

    if (isLoading || !schemas) {
        return (
            <Stack spacing={2}>
                {Array(12)
                    .fill(null)
                    .map((_, i) => (
                        <Skeleton key={i} variant="rectangular" height={220} />
                    ))}
            </Stack>
        );
    }

    if (schemas.length === 0) return <Typography sx={{ textAlign: 'center' }}>No Schemas Found.</Typography>;

    return (
        <Stack spacing={2}>
            {schemas
                .slice((page - 1) * RESULTS_ON_PAGE, (page - 1) * RESULTS_ON_PAGE + RESULTS_ON_PAGE)
                .map((schema) => (
                    <SchemaCard key={schema.SchemaName} schema={schema} />
                ))}
            <Box display="flex" justifyContent="center">
                <Pagination
                    count={schemas.length > 0 ? Math.ceil(schemas.length / RESULTS_ON_PAGE) : 0}
                    page={page}
                    onChange={handleChangePage}
                    color="primary"
                />
            </Box>
        </Stack>
    );
};
