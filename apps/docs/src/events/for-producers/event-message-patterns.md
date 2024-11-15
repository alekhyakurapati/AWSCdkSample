---
title: Event Message Patterns
---

# Event Message Patterns

## 1. Event-Carried State Transfer Pattern

Event-Carried State Transfer provides a data payload within the event message.

### Key Considerations

-   Use this pattern when there is a limit or constraint on Producer API consumption to achieve full decoupling between the producers and consumers. This pattern provides the following benefits:
    1. Reduced integration demand on Producer API's;
    1. Supports more decoupled integration architectures. Any number of Consumers can subscribe to the event, without any impact to the Producers.
    1. Data contained in the event payload is temporally associated with the time of the event.
-   Event carried state could represent a change to an Object. Change events introduce complexity as it requires the change summary to be computed between the previous and current version of the Object. As a best practice Producers are urged to take on this responsibility as it reduces the need to replicate change summary computation by multiple consumers.

::: warning
The broker uses an AWS EventBridge service which currently only allows a maximum size of 256KB. To use the pattern producers should be confident message size will be within this service limit.
:::

## 2. Event Notification Pattern

Event Notifications are light weight events that provide a notification that an event has occurred. The message structure will contain:

-   Metadata properties further describing the event that helps the Consumers decide whether the event is useful for them. This should include a business key property that provides a reference to a record / document in the producing application which is related to the event.
-   Optionally there will be a link to a Producers API, where the Producers like to decouple themselves from the Consumers can opt to use S3 bucket to publish the data payload of the record associated with the business key property.

### Key Considerations

-   This pattern is appropriate to use when there is a risk that event message size will exceed the broker service limit of 256KB.
-   Consumers will need to make an extra call to retrieve data from producing systems.
-   When producers provide an API to publish their event data, following points should be taken into consideration over and above the API best practices and guidelines:
    1. Spike in integration demand as there could be more Consumers who can subscribe to the event at a later point, which may impact the Producer system itself;
    1. Providing association between the time of the event and the payload provided by the API. Whilst the API can provide the latest version of the data, the intent of the API was to provide point in time state of the data associated with the event.

## 3. Large Payload or S3 Pattern

Large Payload pattern must be used when payload contained in the event exceeds storage size > 256kb. Integration Hub as part of the platform provides S3 bucket to support exchange of large payloads of storage size exceeding 256kb and limited to 10MB. This pattern can be used in combination with Event Carried State Transfer or Event Notification or Confidential Event pattern.

### Key Considerations

-   Payload size can exceed 256 kb and is limited to 10MB.
-   Producing application can use the use S3 query parameter in publishEvent API and Integration Hub platform will incorporate callback link to the S3 bucket.
-   Consuming application can use fetchEvent API to read the event.

## 4. Confidential Event Pattern

The confidential event pattern must be used if event payloads contain confidential or most confidential information which requires data level encryption to be applied on sensitive information. This pattern can be used in combination with Event Carried State Transfer or Event Notification pattern where the event has confidential information.

<!-- TODO: add link to: "Refer to the following documentation for more detailed information on this pattern: Confidential Events." -->

### Key Considerations

-   Symmetrical encryption is applied by the producer using a shared key (recommended to use KMS).
-   Decryption is performed by the consumer using the same shared key.
-   Producers are responsible for management of the key including granting access to the key.
