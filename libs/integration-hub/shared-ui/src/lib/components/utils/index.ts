export const convertTimeStamp = (timeStamp: string) => {
    return new Date(timeStamp).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true,
        timeZone: 'UTC',
    });
};

export const extractTargetArn = (targetArn: string) => {
    return new RegExp('(?<=/).*?(?=/|$)').exec(targetArn) || targetArn;
};

export const formatJSON = (input: string | undefined) => {
    try {
        return input ? JSON.stringify(JSON.parse(input), null, 4) : '';
    } catch (err) {
        return '';
    }
};

export const extractSchemaShortName = (schemaName: string) => {
    return schemaName.substring(schemaName.lastIndexOf('@') + 1);
};
