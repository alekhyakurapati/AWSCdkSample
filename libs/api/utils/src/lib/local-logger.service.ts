import { Injectable, Scope, ConsoleLogger, ConsoleLoggerOptions } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class LocalLoggerService extends ConsoleLogger {
    // constructor(context: string, options: ConsoleLoggerOptions) {
    //     super(context, options);
    // }
    // Overwriting the default Nest Logger class methods
    // override log(message: string) {
    //     this.log(message);
    // }
    // override error(message: string, trace?: string) {
    //     this.error(message);
    // }
    // override warn(message: string) {
    //     this.warn(message);
    // }
    // override debug(message: string) {
    //     this.debug(message);
    // }
    // override verbose(message: string) {
    //     this.verbose(message);
    // }
}
