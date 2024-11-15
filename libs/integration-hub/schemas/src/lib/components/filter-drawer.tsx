import { useFetchAllSchemas, useFetchDomainsTree } from '@eai-event-integration-platform/integration-hub/data';
import { Domain } from '@eai-event-integration-platform/interfaces';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    FormGroup,
    IconButton,
    Stack,
    Typography,
} from '@mui/material';
import { useAtom, useSetAtom } from 'jotai';
import lodash from 'lodash';
import { appFilterAtom, domainFilterAtom, drawerOpenAtom } from '../atoms';
import { BusinessDomainFilter } from './schema-filters/business-domain-filter';
import { SourceApplicationFilter } from './schema-filters/source-application-filter';

export const FilterDrawer = () => {
    const setDrawerOpen = useSetAtom(drawerOpenAtom);
    const [sourceAppSchemaFilterValue, setSourceAppSchemaFilter] = useAtom(appFilterAtom);
    const [businessDomainSchemaFilterValue, setBusinessDomainSchemaFilter] = useAtom(domainFilterAtom);
    const { data: schemas } = useFetchAllSchemas();
    const { data: initialDomains } = useFetchDomainsTree();
    const appFilterCount = sourceAppSchemaFilterValue.length;
    const domainFilterCount = businessDomainSchemaFilterValue.length;

    if (!schemas || !initialDomains) return null;

    const uniqueDomains = new Set(
        schemas
            .map((item) => (item.Domain ? item.Domain.split('.', 3).join('.') : undefined))
            .filter((item) => !!item) as string[],
    );

    const filterDomain = (paths: Set<string>, domains: Domain[]): Domain[] => {
        const domainCopy = structuredClone(domains);
        const activeDomain = domainCopy
            .map((domain) => {
                domain.Children = filterDomain(paths, domain.Children ?? []);
                return domain;
            })
            .filter((domain) => paths.has(domain.Path) || (domain.Children ?? []).length > 0);
        return activeDomain;
    };

    const sourceApplications = lodash.uniq(schemas.map((schema) => schema.AppName));

    const clearAllFilters = () => {
        setBusinessDomainSchemaFilter([] as string[]);
        setSourceAppSchemaFilter([] as string[]);
    };

    return (
        <Stack padding={2} spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h3">Filter</Typography>
                <IconButton onClick={() => setDrawerOpen(false)}>
                    <CloseIcon />
                </IconButton>
            </Stack>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    {`Source Application${appFilterCount > 0 ? ` (${appFilterCount})` : ''}`}
                </AccordionSummary>
                <AccordionDetails>
                    <FormGroup>
                        {sourceApplications.map((sourceApplication) => (
                            <SourceApplicationFilter key={sourceApplication} sourceApplication={sourceApplication} />
                        ))}
                    </FormGroup>
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    {`Business Domain${domainFilterCount > 0 ? ` (${domainFilterCount})` : ''}`}
                </AccordionSummary>
                <AccordionDetails>
                    <FormGroup>
                        {filterDomain(uniqueDomains, initialDomains).map((domain) => {
                            return <BusinessDomainFilter key={domain.Path} {...domain} />;
                        })}
                    </FormGroup>
                </AccordionDetails>
            </Accordion>
            <Button onClick={clearAllFilters}>Clear All Filters</Button>
        </Stack>
    );
};
