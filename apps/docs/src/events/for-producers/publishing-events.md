---
title: How to Publish Events
---

# How to Publish Events

Publishing events to the platform EventBus can be done in a couple of ways depending on the producer application's capabilities

## 1. Publish Events via AWS SDK

If your application is a custom built solution (using AWS lambdas for example), there is the ability to push events directly onto the EventBus using the [AWS SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-eventbridge/)

[View more details on pushing events directly to the EventBus](./publishing-via-sdk)

## 2. Publish Events via REST API

For most SaaS and COTS applications, there should be the ability to push events to a REST API

[View more details on pushing events using the REST API](./publishing-via-api)
