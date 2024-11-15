---
title: Producer Applications
---

# Producer Applications

## What is a Producer

Producer(s) are applications which publish events onto the Integration Platform's EventBus.

Events should be modelled by producers to be loosely coupled from other systems and reflective of the domain from which they are published.

## Producer Responsibilities

1. Adhere to Event Naming Convention - this improves readability of the events for users browsing through the Event Catalogue in the Integration Hub will be able to relate the event to the business function and business process the event originates from.
1. Schema structure - the payload is split into two parts namely Metadata and Data:
    - Metadata contains key attributes from the payload using which the Consuming Application can decide whether to subscribe, process or ignore the event;
    - Data is the shell where the producing Applications can wrap the actual JSON data structure.
1. GUID - Unique ID for unique events to avoid duplicate events.
1. Versioning - it is key to note that in the new model the Producing Application may publish an event ahead of time and the Consuming Application has the autonomy to subscribe and start consuming the event. The onus lies with the Producing Application to manage versions of the event in such a way that:
    - new events are backward compatible;
    - where feasible, publish concurrent version events; or
    - notify with consuming Application about deprecation of the old version and publishing of the new version of the event.
1. Confidentiality - where there is confidential data published in the event. Producing Application holds the key and would have to exchange with it onto the Consuming Application on an as needs basis. This is done to adhere to the cyber security requirement and possibly the one exception where the consuming Application require to get in touch with producing Application. Note: KMS and encryption feature is part of the Integration Hub roadmap.
1. Event size larger than 256kb - currently the Integration Hub platform has a limit of 256kb for events published. Where events size is larger than 256kb refer S3 Event Pattern. Note: This limitation is in discussion with AWS EventBridge product team and there is a constant push from the Integration Hub platform to increase this limit.
