import {
    ManageTargetApisView,
    TargetApisFormView,
    AuthorisationFormView,
} from '@eai-event-integration-platform/integration-hub/rest-api';
import { SchemaFormView, SchemaListView } from '@eai-event-integration-platform/integration-hub/schemas';
import {
    ManageSubscriptionsView,
    SubscriptionFormView,
} from '@eai-event-integration-platform/integration-hub/subscriptions';
import { EventDeliveryFailuresView } from '@eai-event-integration-platform/integration-hub/delivery-failures';
import { Route, Routes } from 'react-router-dom';

export default () => {
    return (
        <Routes>
            <Route path="/" element={<SchemaListView />} />

            <Route path="/events/schemas/:SchemaName/:Version" element={<SchemaListView />} />
            <Route path="/events/schemas/create" element={<SchemaFormView variant="create" />} />
            <Route path="/events/schemas/:SchemaName/edit" element={<SchemaFormView variant="details" />} />
            <Route path="/events/schemas/:SchemaName/:Version/edit" element={<SchemaFormView variant="definition" />} />

            <Route path="/events/targets/rest-api" element={<ManageTargetApisView variant="Api" />} />
            <Route path="/events/targets/rest-api/create" element={<TargetApisFormView variant="create" />} />
            <Route
                path="/events/targets/rest-api/:connectionName/:destinationName/edit"
                element={<TargetApisFormView variant="edit" />}
            />

            <Route path="/events/targets/rest-api/authorisations" element={<ManageTargetApisView variant="Auth" />} />
            <Route path="/events/targets/rest-api/authorisations/create" element={<AuthorisationFormView />} />
            <Route
                path="/events/targets/rest-api/authorisations/:connectionName/edit"
                element={<AuthorisationFormView />}
            />

            <Route path="/events/subscriptions" element={<ManageSubscriptionsView />} />
            <Route path="/events/subscriptions/create" element={<SubscriptionFormView variant="create" />} />
            <Route
                path="/events/subscriptions/:subscriptionName/edit"
                element={<SubscriptionFormView variant="edit" />}
            />

            <Route path="/events/delivery-failures" element={<EventDeliveryFailuresView />} />
            <Route path="/events/*" element={<SchemaListView />} />
        </Routes>
    );
};
