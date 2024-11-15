---
title: Consumer Applications
---

# Consumer Applications

## What is a Consumer?

Consumer(s) are applications which consume events from the IntegrationHub platform for further processing.

## Responsibilities of a Consumer

1. Understand Event Schemas - Event schema is the contract that binds the Producer Application and Consumer Application. It is imperative that the Consumer Application team understand the intent of the business event, structure of the metadata (header) and the data payload.
1. Idempotency - Integration Hub platform guarantees at least one delivery. There will be instances where the Consumer Application is not available requiring 'Replay' of events or the Producer Application may publish the same event one or more times. In such scenarios, the Consumer Application Adaptor will have to be designed to be Idempotent.
1. Versioning - The Consumer Application will have to align to a newer version of the Events published by the Consumer Application. Whilst the best practice is for the Producer Application is to publish a concurrent Event version, it may not be always be possible.
1. Confidentiality - Where there is confidential data published in the event the Consumer Application will need to reach out to the Producer Application system owner to receive the key for decrypting the Data payload. Note: KMS and encryption feature is part of the Integration Hub roadmap.
1. Event size larger than 256kb - Currently the Integration Hub platform has a limit of 256kb for events published. When the events size is larger than 256KB, the event payload is replace with an S3 link for consumers to fetch the payload from the API
