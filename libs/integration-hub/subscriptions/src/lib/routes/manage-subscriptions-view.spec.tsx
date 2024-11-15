import { render } from '@testing-library/react';

import ManageSubscriptionsView from './manage-subscriptions-view';

describe('ManageSubscriptionsView', () => {
    it('should render successfully', () => {
        const { baseElement } = render(<ManageSubscriptionsView />);
        expect(baseElement).toBeTruthy();
    });
});
