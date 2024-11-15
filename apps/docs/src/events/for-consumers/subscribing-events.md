---
title: How to Subscribe to Events
---

# How to Subscribe to Events

Subscribing to events on the Integration Platform can be done in a couple of ways depending on the consumer application's capabilities.

## 1. Subscribing to Events using AWS EventBridge

If the consumer application resides in an AWS account and has access to AWS services, the Integration Platform can deliver events to an EventBridge event bus in your account for your application to consume from.

[View more details on subscribing to events using EventBridge](./subscribing-via-bus)

## 2. Subscribing to Events using a REST API Target

Alernatively, the Integration Platform can forward messages to a secure REST API endpoint.

[View more details on subscribing to events using a REST API Target](./subscribing-via-api)

# How to Configure Your Subscription

## Using Event Filters

If the consumer application only needs to subscribe to _some_ events, you can utilise filters to specify which events are forwarded to the application.

[View more details on specifying event filters](./event-filters)
