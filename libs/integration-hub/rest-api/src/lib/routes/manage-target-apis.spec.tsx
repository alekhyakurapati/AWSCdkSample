import { render } from '@testing-library/react';

import ManageTargetApisView from './manage-target-apis-view';

describe('IntegrationHubRestApi', () => {
    it('should render successfully', () => {
        const { baseElement } = render(<ManageTargetApisView variant="Auth" />);

        expect(baseElement).toBeTruthy();
    });
});
