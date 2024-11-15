---
title: Consumer User Journey
editLink: true
---

# Consumer User Journey

## 1. Search Existing Schemas

Browse and search the Integration Hub for any existing event schemas which meet your needs. Event schemas contain details about the schema including contact details for the Producer if you require further information.

:::tip
If you can't find the event schema, please reach out to the CI Owner of the application
:::

## 2. Get Onboarded and Request Access via Saviynt

In order to subscribe to an event, your application [needs to be onboarded](../getting-started/application-onboarding). After onboarding, you will be able to request the correct role entitlements in Saviynt.

## 3. Design and Create Consumer Adapter

:::info What is an Adapter?
Adapters, from a consumer point of view, are resources that can receive events. Currently, the Integration Hub only supports two types of adapters: EventBridge Event Buses and REST API endpoints.
:::

Adapters are required to receive and process the event, and the design will vary depending upon your specific context as a Consumer.

Determine the appropriate target (Event Bus or REST API) and define the event handling logic (idempotency, ordering, throttling, load etc) required by the consuming application.
The Integration Hub Schema Catelog provides schema definitions and examples of events to support development.

Build and deploy the adapter to your Non-Prod or QA environment.

## 4. Subscribe to Non-Prod Events.

Login to the Integration Hub, search for the schema you are interested in, and subscribe to the Non-prod events.

<!-- TODO: link to user guide->subscriptions->subscribing to events here -->

Perform necessary quality assurances to ensure that events are properly received and processed.

## 5. Release the Consumer Adapter to Production

Following the requisite technical change process, implement/deploy the adapter to the production environment and create a new subscription for the Production Event.

Ensure events are being consumed correctly

## 6. Monitor and Manage Incidents

<!-- TODO: link to user guide->event delivery failures here -->

The Integration Hub will send email alerts to the consumer support team if any messages are failing to be delivered. Consumers are responsible for acting on these delivery failures, and may raise an incident to seek assistance from the Integration Platform team to replay failed events

## 7. Manage Change

Consumers will need to update their adapters to handle changes in event schema versions. Existing subscriptions can be edited in the Integration Hub to change versions or other subscription settings.
