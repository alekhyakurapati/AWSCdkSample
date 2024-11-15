---
title: Producer User Journey
---

# Producer User Journey

## 1. Application Registration

First, make sure your application [has been onboarded](../getting-started/application-onboarding)

## 2. Design Event and Adapter

:::info What is an Adapter?
Adapters, from a Producer point of view, can be anything from a configurable webhook in a SaaS application to a function/lambda in a custom built application. It is the component that produces events.
:::

An adapter is required to perform the necessary extraction, preparation and publishing of the event.

<!-- TODO: Refer to documentation for information on EDA standards and design patterns to assist in designing an adapter. -->

Design outcomes should include:

-   [schema name](./naming-events) and [event payload](./event-message-patterns)
-   adapter type

## 3. Register Your Event Schema

Log in to the IntegrationHub to register your newly defined schema. New Schemas are created as a draft.

This means the events will be available for consumers to subscribe to in **non-prod only**.

:::tip
Producers should keep their schemas in DRAFT until you are ready to start [pushing events to production](#_5-release-adapter-to-production)
:::

## 4. Create Producer Adapter

Build/configure the adapter according to the design.

There are 2 methods to producing events:

1.  Using the REST API
1.  Publishing onto the EventBus using the AWS SDK

<!-- TODO: More info on [adapters here](./adapters) -->

## 5. Push Events to Non-Prod and Test

Perform the necessary testing to ensure that the event is published successfully to the non-production EventBus, and that the message conforms to the registered schema.

Please reach out to the Integration Support team for any support required.

## 6. Release to Production

Publish your schema so that it is no longer in DRAFT. This will make it available for subscription in the production environment.

Follow the requisite technical change process plan and release the adapter into production to begin publishing events to the Production EventBus.

## 7. Monitor & Manage Incidents

Producers are responsible for ensuring that their adapter successfully publishes all events.

::: warning
Monitoring should be in place to enable a quick response to failures
:::

## 8. Manage Chanages

Producers are responsible for ensuring that the event schemas on the IntegrationHub are current and remain consistent to what is being published.

To assist with MoC, the IntegrationHub provides version management of event schemas and producers can easily find active subscriptions to their events.
