import { Command } from 'commander';
import { eventFailures } from './assets/event-failures';
import { queryLogs } from './assets/query-logs';
import { seedApplications } from './assets/seed-applications';
import { updateTTL } from './assets/update-ttl';

const program = new Command();

program.command('event-failures').action(eventFailures);
program.command('recent-events').action(queryLogs);
program.command('seed-applications').action(seedApplications);
program.command('update-ttl').action(updateTTL);

setTimeout(() => program.parse(), 500);
