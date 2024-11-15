# Event Platform

## About the Project

The Event Platform Portal is a SPA showcasing the available events available to subscribe to

### Built With

This section should list any major frameworks/libraries used to bootstrap your project.

-   React.js
-   NestJS
-   NodeJS Lambdas
-   AWS CDK
-   NX for builds

## Getting Started

This is an example of how you may give instructions on setting up your project locally. To get a local copy up and running follow these simple example steps.

**This repo runs on node >=18.0.0**

You can easily install the correct version of Node using [n](https://www.npmjs.com/package/n) or [nvm](https://github.com/nvm-sh/nvm), e.g.

`n auto` or `nvm use`

### Prerequisites

Libraries to install globally

-   Typescript - `npm install -g typescript`
-   PNPM - `npm install -g pnpm@latest-8`
-   CDK v2 - `npm install -g aws-cdk`
-   ESBUILD - `npm install -g esbuild`
-   NX - `npm install -g nx` (optional, can use `pnpx nx ...` instead)

### Installation

1. Clone the repo

```bash
git clone https://github.com/Woodside/eai-event-integration-platform.git
```

2. Install packages:

```bash
pnpm install
```

3. Configure Authorization for Woodside MUI Themes
   1. Create a [PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) with "read:packages" and "repo" scopes.
   2. Click the "COnfigure SSO" dropdown and authorize the token to be used in the Woodside org.
   3. Run the following command: `npm login --scope=@woodside --registry=https://npm.pkg.github.com`
      You'll be prompted for the following:
      - Username: Your Github Username
      - Password: Your PAT

*\*Reference to: https://github.com/Woodside/woodside-mui-themes?tab=readme-ov-file*

## Usage

### Running the Portal Locally

```bash
pnpm start
// or
pnpm run start:ui
```

### Deploying to personal infrastructure

In addition to the DEV infrastructure, it is best to develop using your own personal stack. To deploy a set of personal infrastructure you will need to do the following:

1. Add variables to the CDK context file (`./apps/infrastructure/cdk.context.json`)

Copy the `"DEV"` attribrute, and make a new version using your initials. Then find and replace all instances of `DEV` with those initials.

2. Uncomment code blocks for one-off infrastructure

Some of the infrastructure deployed by the CDK should only be deployed once. In that case, there are code blocks that have been commented out that you will need to uncomment. Go to:

-   `./apps/infrastructure/src/stacks/event-broker.stack.ts`
-   `./apps/infrastructure/src/stacks/event-customer-api.stack.ts`

Then look for commented code blocks that create new CDK resources (i.e. `this.eventBus = new EventBus(this, ... `) and uncomment them. There will also be a matching set of code that accesses these resources you are now creating that will need to be commented out. You may also need to include some missing imports.

3. Make your deployment script

Copy the deployment script `./deploy_dev_stack.sh` as `./deploy_<YOUR_INITIALS>_stack.sh`. Then edit it and change the `CDK_STAGE` to match the initials you used in step 1. Also change the commented lines at the bottom so that instead of deploying only the 'EventBroker' stacks, it deploys '--all'.

4. Log into the AWS CLI tool and deploy the stack by invoking the script from step 3. (You may need to `chmod` it if it is not executable)

5. Seed your new tables

There are a few different seed scripts to help you.

-   Applications: run `pnpm nx seed-applications dev-tools` and follow the prompts to seed your applications table.
-   Business domains: modify `scripts/domains-data-seed.ts` to point at your business domain table (e.g. 'EAI-EventApiStack-<YOUR_INITIALS>-BusinessDomainTableACA77767-3YUUN3YSORXM'), then run `npx ts-node ./scripts/domains-data-seed.ts`
-   Schemas: modify `scripts/schema-data-seed.ts` to point at your schemas table (e.g. 'EAI-EventApiStack-<YOUR_INITIALS>-SchemasTable1DC069C3-2J2YJ0KZFNT'), then run `npx ts-node ./scripts/schema-data-seed.ts`
-   Event failures: run `pnpm nx event-failures dev-tools` and follow the prompts to seed your event failures table. Note you will need to find the url for your DLQ in AWS's SNS product.

6. Update these docs to reconcile any errors you experienced following the above instructions.

_Note:_ If you are using [granted](https://docs.commonfate.io/granted/introduction) to manage your AWS credentials, you should modify `./ci/assume-role.sh` and comment out the lines at the start that `unset` your AWS env var credentials.

### Running API Locally

First, copy the .env.sample to .env and update any env vars required

You'll also need to be logged into AWS using SSO

Then,

```bash
pnpm run start:api
```

### Running the portal _with_ the API

Update the `./apps/integration-hub/src/environments/environment.ts` file so it points at the API. Then run both applications with:

```bash
pnpm run start:dev
```

## Contributing

### Source Control

We use the [GitHub Flow](https://guides.github.com/introduction/flow/) as a branching strategy.

1. Create your Feature Branch (`git checkout -b feature/JIRA-123-feature-name`). **Must include the JIRA Issue number**
1. Commit your Changes (`git commit -m 'your-CONVENTIONAL_COMMIT-message here'`) **See guildlines below about commit messages**
1. Push to the Branch (`git push origin feature/JIRA-123-feature-name`)
1. Create a Pull Request

#### Conventional Commit Messages, Commitlint and Husky

The [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification is a simple convention on top of commit messages. It provides an easy set of rules for creating an explicit commit history.

Commit messages need to be written in the following format:

```
<type>([optional scope]): <description>

[optional body]

[optional footer(s)]
```

Where:

-   `type = one of [build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test]`
-   `scope = describes the scope of work (optional) e.g. feat(api): send an email`
-   `description = your commit message in lower case`

More information can be found [here](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional)

### Linting

Lint the code

```bash
pnpm run lint
```

### Testing

Run tests with

```bash
// run all tests
pnpm test:all
// or
pnpm test [project-name]
// where projet-name is the name of the project found in workspaces.json
```

### Documentation

Documents are created using the VitePress SSG. Any features added or changes made should be considered for documentation updates.

To start the local dev server to view the documentation site:

```
nx serve docs
```

### Troubleshooting

```
index.handler is not found
The deploy script used to create the infrastructure is using main.js not lambda.js.

Make sure to include the following code after npm install in your deploy script

# Make sure NestJS API is built
cd "$SCRIPT_DIR"
pnpm build:api:prod

```

## CI/CD

### CI

Continuous Integration checks are triggered on each new commit to a pull request that is set to merge with the `main` branch using the `./.github/workflows/ci.yaml` GitHub Action

### Deploying to DEV and QA

Deployments are triggered on merges with the `main` branch using the `./.github/workflows/deploy-dev-qa.yaml` GitHub Action

### Deploying to Production

Deployments are triggered from creating and pushing tags that start with `v` (e.g. `v1.8.0`).

When ready to deploy a prod release, increment the version number by

```
git checkout main
pnpm version [major|minor|patch]
```

This will increment the version number in `package.json` and create a new tag. Then push the branch and tag.

```
git push --atomic origin main <tag>
```

## Dev-tools

Some useful tools are stored in the `dev-tools` application to help with seeding databases or simulating test scenarios. To invoke the application simply use:

```sh
pnpm nx <script-name> dev-tools
```

See `apps/dev-tools/project.json` for the available scripts, currently this includes:

-   `simulate-event-failures` - pushes a variable amount of events to a specified DLQ SQS queue
-   `seed-apps-table` - seeds the applications table with entries that include the now required `SupportEmail` attribrute
-   `update-ttl` - iterates through all events in an event-failures table and sets the `TTL` field 60 days after its `SentTimestamp`

## Notes

### Delete all schemas from the registry

Use this command to delete all schemas in a specified registry (requires [JQ](https://stedolan.github.io/jq/))

```bash
aws schemas list-schemas --registry=[REGISTRY_NAME] | jq --raw-output '.Schemas[].SchemaName' | while read name; do echo "Deleting $name"; aws schemas delete-schema --schema-name=$name --registry-name="[REGISTRY_NAME]"; done
# using a filter on schema name
aws schemas list-schemas --registry=[REGISTRY_NAME] | jq --raw-output '.Schemas[].SchemaName | select(. | contains("test"))' |
```
