export interface VersionMap<T = string> {
    [key: string]: T;
}

export class VersionMapping {
    // builds an object of { [version] : state } from a string of <version>-<state>:<version>-<state>...
    static parse<T = string>(versStateStr: string | undefined): VersionMap<T> {
        if (!versStateStr) return {};
        const versions = versStateStr.split(':').map((version: string) => version.split('-'));
        return Object.fromEntries(versions);
    }

    // returns a string of <version>-<state>:<version>-<state>... from an object of { version: state, version: state }
    static stringify<T = string>(versStateMap: VersionMap<T>): string {
        return Object.entries(versStateMap)
            .map((v) => v.join('-'))
            .join(':');
    }
}
