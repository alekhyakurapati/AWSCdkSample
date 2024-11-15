import { Domain } from '@eai-event-integration-platform/interfaces';
import { Checkbox, FormControlLabel, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import lodash from 'lodash';
import { domainFilterAtom } from '../../atoms';

interface BusinessDomainFilterProps {
    PK?: string | undefined;
    Path: string;
    Name: string;
    DisplayName: string;
    Children?: Domain[];
}

export const BusinessDomainFilter = (businessDomain: BusinessDomainFilterProps) => {
    const [businessDomainSchemaFilterValue, setBusinessDomainSchemaFilter] = useAtom(domainFilterAtom);

    if (!businessDomain.Children) return null;
    const fullChildrenPathList = businessDomain.Children?.map((child) => child.Path);

    const handleChangeParent = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        if (isChecked) {
            setBusinessDomainSchemaFilter((businessDomains) =>
                lodash.uniq(businessDomains.concat(fullChildrenPathList)),
            );
        } else {
            setBusinessDomainSchemaFilter((businessDomains) =>
                businessDomains.filter((businessDomain) => !fullChildrenPathList.includes(businessDomain)),
            );
        }
    };

    const handleChangeChild = (path: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        if (isChecked) {
            setBusinessDomainSchemaFilter((businessDomains) => businessDomains.concat(path));
        } else {
            setBusinessDomainSchemaFilter((businessDomains) =>
                businessDomains.filter((businessDomain) => businessDomain !== path),
            );
        }
    };

    const childrenPathInSchemaFilter = businessDomainSchemaFilterValue.filter((businessDomain) =>
        fullChildrenPathList.includes(businessDomain),
    );

    return (
        <>
            <FormControlLabel
                label={<Typography variant="body2">{businessDomain.DisplayName}</Typography>}
                control={
                    <Checkbox
                        checked={childrenPathInSchemaFilter.length === fullChildrenPathList.length}
                        indeterminate={
                            childrenPathInSchemaFilter.length < fullChildrenPathList.length &&
                            childrenPathInSchemaFilter.length > 0
                        }
                        onChange={handleChangeParent}
                    />
                }
                sx={{ marginY: -0.5 }}
            />

            {businessDomain.Children?.map((child) => (
                <FormControlLabel
                    key={child.Path}
                    label={<Typography variant="body2">{child.DisplayName}</Typography>}
                    value={child.Path}
                    control={
                        <Checkbox
                            checked={businessDomainSchemaFilterValue.includes(child.Path)}
                            onChange={(event) => handleChangeChild(child.Path, event)}
                        />
                    }
                    sx={{ marginLeft: 2, marginY: -0.5 }}
                />
            ))}
        </>
    );
};
