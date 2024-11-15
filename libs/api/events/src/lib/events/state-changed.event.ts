export class StateChangedEvent {
    created: Date;
    constructor(public name: string, public data: any, public username: string) {
        this.created = new Date();
    }
}
