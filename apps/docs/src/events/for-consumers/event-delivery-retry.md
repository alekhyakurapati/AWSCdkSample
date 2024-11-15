---
title: Event Delivery and Retry Mechanism
---

# Event Delivery and Retry Mechanism

By default, the Integration Hub is configured to retry unsuccessful delivery attempts up to 185 times over a 24 hour period using an [exponential backoff mechanism](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/). If an event isn't delivered after all retry attempts are exhausted, the event is delivered to a Dead Letter Queue (DLQ). From there it is processed and stored in a table, with information regarding why it failed, the number of retries etc.

Consumers are able to view delivery failures and the error message in the Integration Hub's Manage Delivery Failures page.

[Read more here](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-rule-dlq.html)

## API Destination Targets

:::warning
EventBridge requests to an API endpoint must have a maximum client execution time of **5 seconds**. If the target endpoint takes longer than 5 seconds to respond, EventBridge times out the request. Failed messages, including timeouts, are retried up to the maximum amount (185 retries over 24 hours by default). After the maximum number of retries, events are sent to the DLQ.
:::

### API Destination Error Codes

When EventBridge tries to deliver an event to an API destination and an error occurs, EventBridge does the following:

-   Events associated with error codes 429 and 5xx are retried.
-   Events associated with error codes 1xx, 2xx, 3xx, and 4xx (excluding 429) aren't retried.

EventBridge API destinations read the standard HTTP response header Retry-After to find out how long to wait before making a follow-up request. EventBridge chooses the more conservative value between the defined retry policy and the Retry-After header. If Retry-After value is negative, EventBridge **stops retrying delivery** for that event.

#### How invocation rate affects event delivery

When configuring a destination endpoint, you must set an appropriate invocation rate for your API. To determine the correct rate, you will need to balance the frequency of events you are consuming with your API's capability.

For subscriptions with a very high number of events, there is the potential for the amount of events being pushed to the delivery queue to outpace the invocation rate set for your API. For example, if an event occurs roughly 5 times every second, but your invocation rate limits API calls to once every second, the message queue for that API will grow indefinitely.

However, if the invocation rate is too high, the destination API can start failing under high traffic loads. This issue is then compounded, as the queue grows from the existing high traffic and an increasing backlog of retry events.

To ensure that no events are lost, set up a dead-letter queue to send events with failed invocations to so you can process the events at a later time.
