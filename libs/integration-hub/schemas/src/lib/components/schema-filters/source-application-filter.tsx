import { Checkbox, FormControlLabel, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { appFilterAtom } from '../../atoms';

interface SourceApplicationFilterProps {
    sourceApplication: string | undefined;
}

export const SourceApplicationFilter = ({ sourceApplication }: SourceApplicationFilterProps) => {
    const [sourceAppSchemaFilterValue, setSourceAppSchemaFilter] = useAtom(appFilterAtom);

    if (!sourceApplication) return null;

    const onChange = (name: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = event.target.checked;
        if (isChecked) {
            setSourceAppSchemaFilter((sourceApps) => sourceApps.concat(name));
        } else {
            setSourceAppSchemaFilter((sourceApps) => sourceApps.filter((sourceApp) => sourceApp !== name));
        }
    };

    return (
        <FormControlLabel
            label={<Typography variant="body2">{sourceApplication}</Typography>}
            key={sourceApplication}
            name={sourceApplication}
            control={
                <Checkbox
                    checked={sourceAppSchemaFilterValue.includes(sourceApplication)}
                    onChange={(event) => onChange(sourceApplication, event)}
                />
            }
            sx={{ marginY: -0.5 }}
        />
    );
};
