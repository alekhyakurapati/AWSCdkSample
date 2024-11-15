export interface Domain {
    PK?: string;
    Path: string;
    Name: string;
    DisplayName: string;
    Children?: Domain[];
}
