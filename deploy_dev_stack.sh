#!/usr/bin/env bash
set -e
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)

# Make sure layer packages are installed
cd $SCRIPT_DIR/apps/infrastructure/resources/lambda-layers/aws-sdk/nodejs
npm install
cd $SCRIPT_DIR/apps/infrastructure/resources/lambda-layers/nestjs/nodejs
npm install

# # Make sure NestJS APi is built
cd $SCRIPT_DIR
pnpm build:api:prod

# # Assume CNF_WORKLOAD_DEPLOYMENT_ROLE_ARN
CNF_WORKLOAD_DEPLOYMENT_ROLE_ARN=arn:aws:iam::727026770742:role/cnf/cnf-workload-deployment-role
CNF_CODEBUILD_PROJECT="local-dev-session"

cd $SCRIPT_DIR/ci
. ./assume-role.sh

# Deploy CDK app
cd $SCRIPT_DIR/apps/infrastructure
export CDK_STAGE=DEV

# npx cdk bootstrap aws://727026770742/ap-southeast-2
# npx cdk synth --context stage="${CDK_STAGE}"

# npx cdk diff --all --context stage="${CDK_STAGE}"
# npx cdk diff EventBrokerStack EventBrokerStackNp --context stage="${CDK_STAGE}"

# npx cdk deploy --all --ci --context stage="${CDK_STAGE}" --require-approval never --force true
# npx cdk deploy EventBrokerStack EventBrokerStackNp --ci --context stage="${CDK_STAGE}" --require-approval never --force true
# npx cdk deploy SchemaRegistryStack --ci --context stage="${CDK_STAGE}" --require-approval never --force true
# npx cdk deploy EventApiStack --ci --context stage="${CDK_STAGE}" --require-approval never --force true
export S3_BUCKET_ARN=arn:aws:s3:ap-southeast-2:278364088108:accesspoint/c775fc6a-7a91-45c9-b161-2707c2ab473b/integration-dev.dev.app.woodside

cd $SCRIPT_DIR
pnpx nx build docs --skip-nx-cache
pnpx nx build integration-hub --skip-nx-cache --configuration=dev
cp ./ci/env.dev.js ./dist/apps/integration-hub/dev/env.js
cp ./ci/app.config.json ./dist/apps/integration-hub/dev/app.config.json
cp -r ./dist/apps/docs ./dist/apps/integration-hub/dev/

echo "syncing"
aws s3 sync ./dist/apps/integration-hub/dev/ s3://${S3_BUCKET_ARN} --delete --acl bucket-owner-full-control --cache-control 'max-age=3600' \
  --exclude "index.html" \
  --exclude "docs/index.html" \
  --exclude "env.js" \
  --exclude "app.config.json"
echo "copying"
aws s3 cp ./dist/apps/integration-hub/dev/index.html s3://${S3_BUCKET_ARN}/index.html --acl bucket-owner-full-control --cache-control no-cache
aws s3 cp ./dist/apps/integration-hub/dev/docs/index.html s3://${S3_BUCKET_ARN}/docs/index.html --acl bucket-owner-full-control --cache-control no-cache
aws s3 cp ./dist/apps/integration-hub/dev/env.js s3://${S3_BUCKET_ARN}/env.js --acl bucket-owner-full-control --cache-control no-store
aws s3 cp ./dist/apps/integration-hub/dev/app.config.json s3://${S3_BUCKET_ARN}/app.config.json --acl bucket-owner-full-control --cache-control no-store
