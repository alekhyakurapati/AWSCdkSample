import { authAtom } from '@eai-event-integration-platform/auth-ui';
import { NAVBAR_HEIGHT } from '@eai-event-integration-platform/integration-hub/shared-ui';
import { Box, Drawer, Stack, useTheme } from '@mui/material';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import Scrollbars from 'react-custom-scrollbars-2';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useWindowSize } from 'usehooks-ts';
import { activeSchemaAtom, activeTabAtom, drawerOpenAtom, schemaPageScrollBarAtom } from '../atoms';
import { SchemaCardList } from '../components/card-list';
import { CardListControls } from '../components/card-list-controls';
import { FilterDrawer } from '../components/filter-drawer';
import { PublishDialog } from '../components/publish-dialog';
import { SchemaInfoPane } from '../components/schema-info-pane';
import { TabContent } from '../components/tabs/tab-content';
import { TabSelector } from '../components/tabs/tab-selector';
import { UnregisteredUserWarning } from '../components/unregister-user-warning';
import { useFetchSortedSchemas } from '../hooks';

const DRAWER_WIDTH = 380;
const LIST_WIDTH = 440;
const SCHEMA_VIEW_MIN_WIDTH = 650;
const PADDING = 2;

export const SchemaListView = () => {
    const [isDrawerOpen, setDrawerOpen] = useAtom(drawerOpenAtom);
    const window = useWindowSize();
    const {
        palette,
        transitions: { create, easing, duration },
    } = useTheme();
    const params = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { data: schemas } = useFetchSortedSchemas();
    const setActiveSchema = useSetAtom(activeSchemaAtom);
    const setActiveTab = useSetAtom(activeTabAtom);
    const { isUser } = useAtomValue(authAtom);
    const scrollbarsRef = useRef<Scrollbars | null>(null);
    const setSchemaPageScrollBar = useSetAtom(schemaPageScrollBarAtom);

    useEffect(() => {
        setSchemaPageScrollBar(scrollbarsRef.current);
    });

    useEffect(() => {
        if (params.SchemaName && params.Version) {
            setActiveSchema({ SchemaName: params.SchemaName, Version: parseInt(params.Version) });
        } else {
            const firstSchema = schemas?.at(0);

            if (firstSchema && firstSchema.SchemaName && firstSchema.VersionCount) {
                navigate(`/events/schemas/${encodeURIComponent(firstSchema.SchemaName)}/1`, { replace: true });
            } else {
                setActiveSchema(undefined);
            }
        }
    }, [navigate, params, schemas, setActiveSchema]);

    useEffect(() => {
        if (location.state?.navigateToSubscriptionsTab) setActiveTab('subscriptions');
    }, [location.state, setActiveTab]);

    return (
        <>
            <PublishDialog />
            <Box sx={{ display: 'flex' }}>
                <Drawer
                    anchor="left"
                    open={isDrawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    variant="persistent"
                    sx={{
                        flexShrink: 0,
                        top: NAVBAR_HEIGHT,
                        width: DRAWER_WIDTH,

                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            top: NAVBAR_HEIGHT,
                            width: DRAWER_WIDTH,
                        },
                    }}
                >
                    <Scrollbars
                        autoHide
                        style={{
                            height: window.height - NAVBAR_HEIGHT,
                            width: DRAWER_WIDTH,
                            marginRight: 8,
                        }}
                    >
                        <FilterDrawer />
                    </Scrollbars>
                </Drawer>
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        transition: create('margin', {
                            easing: easing.sharp,
                            duration: duration.leavingScreen,
                        }),
                        marginLeft: `-${DRAWER_WIDTH}px`,
                        ...(isDrawerOpen && {
                            transition: create('margin', {
                                easing: easing.easeOut,
                                duration: duration.enteringScreen,
                            }),
                            marginLeft: 0,
                        }),
                    }}
                >
                    <Stack direction="row" spacing={0}>
                        <Scrollbars
                            ref={scrollbarsRef}
                            autoHide
                            style={{ flexShrink: 0, height: window.height - NAVBAR_HEIGHT, width: LIST_WIDTH }}
                        >
                            <Stack
                                spacing={1}
                                sx={{
                                    background: palette.grey[200],
                                    minHeight: window.height - NAVBAR_HEIGHT,
                                    padding: PADDING,
                                }}
                            >
                                <CardListControls />
                                <SchemaCardList />
                            </Stack>
                        </Scrollbars>

                        <Stack
                            spacing={PADDING}
                            sx={{
                                flex: '1 1 auto',
                                height: window.height - NAVBAR_HEIGHT,
                                minWidth: SCHEMA_VIEW_MIN_WIDTH,
                                maxWidth: window.width - LIST_WIDTH,
                                overflowX: 'hidden',
                                padding: PADDING,
                            }}
                        >
                            <Box>
                                {!isUser && <UnregisteredUserWarning />}
                                <SchemaInfoPane />
                                <TabSelector />
                            </Box>
                            <Scrollbars style={{ width: '100%' }} autoHide>
                                <TabContent />
                            </Scrollbars>
                        </Stack>
                    </Stack>
                </Box>
            </Box>
        </>
    );
};
