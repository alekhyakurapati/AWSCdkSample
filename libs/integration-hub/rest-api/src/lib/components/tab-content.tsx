import { ButtonWithIcon } from '@eai-event-integration-platform/integration-hub/shared-ui';
import AddCircleOutline from '@mui/icons-material/AddCircleOutline';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { Link } from 'react-router-dom';
import { activeTabAtom } from '../atoms';
import { AuthorisationTab } from './authorisation-tab';
import { TargetAPIsTab } from './target-apis-tab';

export const tabs = [
    {
        id: 'api-authorisations',
        label: 'API Authorisations',
        link: '/events/targets/rest-api/authorisations',
        component: <AuthorisationTab />,
        newButtonLabel: 'Add A New API Authorisation',
    },
    {
        id: 'target-apis',
        label: 'Targets APIs',
        link: '/events/targets/rest-api/',
        component: <TargetAPIsTab />,
        newButtonLabel: 'Add A New REST API',
    },
];

export const TabContent = () => {
    const [activeTab, setActiveTab] = useAtom(activeTabAtom);

    const handleChange = (_event: React.SyntheticEvent, index: number) => {
        setActiveTab(index);
    };

    return (
        <Box sx={{ marginBottom: 4 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={handleChange} aria-label="manage-auth-targets-tab-selector">
                    {tabs.map(({ id, label, link }) => {
                        return (
                            <Tab
                                key={id}
                                label={label}
                                id={`tab-${id}`}
                                aria-controls={`tab-panel-${id}`}
                                component={Link}
                                to={link}
                            />
                        );
                    })}

                    <ButtonWithIcon
                        variant="contained"
                        sx={{ width: '280', height: '35px', marginLeft: 'auto', marginTop: '8px' }}
                        LinkComponent={Link}
                        to={
                            activeTab === 0
                                ? `/events/targets/rest-api/authorisations/create`
                                : `/events/targets/rest-api/create`
                        }
                        startIcon={<AddCircleOutline />}
                    >
                        <Typography variant="body1">{tabs[activeTab].newButtonLabel}</Typography>
                    </ButtonWithIcon>
                </Tabs>
            </Box>

            {tabs.map(({ id, component }, index) => {
                return (
                    <div
                        key={id}
                        id={`tab-panel-${id}`}
                        hidden={index !== activeTab}
                        role="tabpanel"
                        aria-labelledby={id}
                    >
                        {component}
                    </div>
                );
            })}
        </Box>
    );
};
