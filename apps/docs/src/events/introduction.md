---
title: Events
lastUpdated: true
---

# Introduction to Event Driven Architecture

Event Driven Architecture (EDA) has been identified as a strategic capability required at Woodside to support our investment in innovation through technology.

## What is Event Driven Architecture?

Event Driven Architecture (EDA) is an approach to integration that uses events to trigger message-based communication between disparate services, or applications. At Woodside it is a preferred pattern for asynchronous integration and is an important capability for modern digital solutions. Some benefits of utilising EDA include:

-   **Loosely coupled architectures** - this is an architecture style where the individual components of an application are built independently from one another.
-   **Near real time integration** - given the asynchronous and decoupled nature of integration, the data exchange is not real time but as close to real time as possible.
-   **Reduced load on systems of record** - application publishes the data to the middleware which takes care of broadcasting the data to interested application, thus reducing load on the original system of record.
-   **Improved integration scalability** - application(s) are decoupled in this architectural style and exchange data via the middleware, thus enabling the integration to scale regardless of the number of application subscribing for it.
-   **Improved integration resilience** - as the data to be broadcasted is persisted / archived, if the same data has to be re-broadcasted this can be done.

At Woodside EDA landscape consists of two major components:

-   **Broker** - is the middleware that processes events published and distributes them to 'subscribed' applications.
-   **Applications**:
    -   can detect business process events and publish them to the broker.
    -   can subscribe to and receive events from the broker and processes them for further action.

![EDA Overview](/eda-overview.png)

## What is an Event?

An event can be described simply as a change in state. The composition of an event includes a description of the event (where it comes from and what the change in state is) and may contain a data payload.

### Business Events

Business Events indicate **significant change of state in a business process** that triggers further consumption or processing in other areas of the business. These events provide a notification with a more defined business context than data level events and should:

-   be described in a business language that clearly describes the event within a process;
-   contain a payload that is contextual to the event with a schema that is also described using business language;
-   incorporate logic required to determine a business event preferably carried out by the producing an application before the event is published to the platform.

#### For example:

A Maintenance Item might have its Description field updated, which would trigger a `MaintenanceItemChanged` event. This is not classified as a significant change of state as other areas of the business may not care about it.

However, if the Maintenance Item has its Status changed to `Approved`, other areas of the business will need to know about this event. And therefore, this would trigger a `MaintenanceItemApproved` event which has a more defined business context.
