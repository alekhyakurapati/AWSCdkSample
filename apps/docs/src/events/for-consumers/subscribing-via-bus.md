---
title: Subscribing to Events using AWS EventBridge
---

# Subscribing to Events using AWS EventBridge

This method requires you to have an event bus configured in your AWS accounts (both non-prod and prod).

You'll also need to configure the Resource Policy to allow events from the Integration Platform Event Bus.

:::info Current Integration Platform Account Details
| Account | Number |
| --- | --- |
| Non-Production | `727026770742` |
| Production | `144028967590` |
:::

## 1. Create an Event Bus Target

### Using the AWS Console

![Create Event Bus](/eda-create-event-bus.png)

Enter a name for your event bus using standard naming conventions.

Configure the Resource-based Policy to allow events from the Integration Platform Account, replace `<INTEGRATION_ACCOUNT_ID>` with the appropriate account number above and `<YOUR_ACCOUNT_ID>` and `<YOUR_EVENTBUS_NAME>` with the appropriate values.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "allow_integration_account_to_put_events",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::<INTEGRATION_ACCOUNT_ID>:root"
            },
            "Action": "events:PutEvents",
            "Resource": "arn:aws:events:ap-southeast-2:<YOUR_ACCOUNT_ID>:event-bus/<YOUR_EVENTBUS_NAME>"
        }
    ]
}
```

#### For example:

![New Event Bus](/eda-new-event-bus.png)

### Using the AWS Cloud Development Kit (CDK)

```typescript
// Create event bus to receive events from integration platform
const myEventBus = new EventBus(this, 'MyEventBus');

// Create resource-based policy to allow integration platform account to put events
new CfnEventBusPolicy(this, 'AllowEventsFromIntegrationPlatformPolicy', {
  statementId: 'allow_integration_account_to_put_events',
  eventBusName:  myEventBus.eventBusName,
  action: 'events:PutEvents',
  principal: <INTEGRATION_ACCOUNT_ID>,
});

/**
 * OPTIONAL: The following statements add a lambda and rule to subscribe to all the events
 */
// Basic lambda to receive events and log to cloudwatch
const lambdaTarget = new lambda.Function(this, 'LogIntegrationEvent', {
  code: Code.fromAsset("path/to/your/lambda"),
  handler: 'log-event.handler',
  runtime: Runtime.NODEJS_18_X,
  memorySize: 128,
});

// Create rule to do something with the events
new Rule(this, 'LogAllEvents', {
  eventBus: myEventBus,
  targets: [new targets.LambdaFunction(lambdaTarget)],
  description: 'Subscribes to wel.operations.maintenance@WorkOrderStatusChange events received from Integration Platform',
  eventPattern: {
    "source": ["wel.operations.maintenance"],
    "detail-type": ["WorkOrderStatusChange"]
  }
});
```

## 2. Subscribe to an Event

<!-- TODO: link to user guide->Subscriptions->Subscribing to Events here -->

Once you have created an Event Bus Target, follow the guide on creating the subscription.
