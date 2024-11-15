---
title: Subscribing to Events using a REST API Target
---

# Subscribing to Events using a REST API Target

The IntegrationHub supports message delivery to a REST API endpoint using the POST method.

There should be 2 APIs created - Non-prod and Production.

Each API is required to have OAuth2 authentication with 'Client Credentials' grant type and must support JSON Payloads.

:::warning
EventBridge requests to an API endpoint must have a maximum client execution time of **5 seconds**. If the target endpoint takes longer than 5 seconds to respond, EventBridge times out the request. Failed messages, including timeouts, are retried up to the maximum amount (185 retries over 24 hours by default). After the maximum number of retries, events are sent to the DLQ.

[View more details on event delivery failures and the DLQ](./event-delivery-retry.md)
:::

<!-- TODO: link to user guide->API Targets here -->

API targets require some additional configuration in the IntegrationHub. This includes creating the API Destination and Connection.

## 2. Subscribe to an Event

<!-- TODO: link to user guide->Subscriptions->Subscribing to Events here -->

Once you have created a REST API, and configured a Connection and API Target in the IntegrationHub, follow the guide (TODO) on creating the subscription.
