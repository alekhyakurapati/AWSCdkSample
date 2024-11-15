---
title: Shared Responsibility Model
---

# Shared Responsibility Model

EDA integration is intended to enable loosely coupled architectures allowing disparate applications and teams to operate more independently and have more accountability over their roles in integration. Team responsibilities are structured to provide them with accountability over their service domain and a span of control to reduce dependencies on other teams.

## Service Boundary Contexts

The following diagram depicts service boundary contexts across a logical EDA architecture. Note that a specific team / application can perform in both a producer and consumer role.

![EDA Service Boundary](/eda-service-boundary.png)

## Service Model Principles

### 1. Ownership

You build it, you own it. For integration, the same team should build and support the solution to provide improved span of control and accountability.

### 2. Assess and Select

Integration capabilities of applications and vendors should be carefully evaluated during **Assess & Select | Co-Create**. The Integration Platform team can provide consultancy to support this.

### 3. Resources

To enable the _you build it you own it model_, if required, SE&P will help secure resources based on Business Partner / Squad requests.

### 4. Support Models

Every application with integration needs to factor in support for its integration which is aligned to the **EDA Shared Responsibility Model**.

## Roles and Responsibilities

The following shared responsibility model provides a definition of key roles and desired responsibilities:

### 1. Producer Context

#### Key Roles/Capabilities:

-   Process Owner(s)
-   System Owners(s)
-   Producer Delivery and Support team

#### Key responsibilities:

-   System Owner must ensure adequate budget is in place for ongoing maintenance of their event(s)
-   Process Owners are responsible for ensuring that events are defined to be consistent with the business process that they represent (this includes the triggers and event message
-   Producer Delivery and Support teams:
    -   Must ensure that event schemas are accurately registered within the Integration Hub as a contract for consumers subscriptions
    -   Must ensure that published events conform to the schema registered in the Integration Hub
    -   Must provide adequate notice to consumers of changes to their event schemas to support Management of Change
    -   When publishing confidential or most confidential data producers are responsible for providing data level encryption and consumer access to keys for decryption.
    -   Are responsible for delivery and support of all logic/solutions required to trigger and transform events up to the point where an event is published to the platform.

### 2. Consumer Context

#### Key Roles/Capabilities:

-   System Owners(s)
-   Consumer Delivery and Support team

#### Key responsibilities:

-   System Owner must ensure adequate budget is in place for ongoing maintenance of their event subscription(s)
-   Consumer Delivery and Support Teams are responsible for:
    -   Design, delivery and support of all logic/solutions required to process events in their service boundary following the point that the platform delivers an event to a subscribers target destination. Consumer solutions should consider requirements for:
        -   Idempotency
        -   Throttling
        -   Callbacks to specified end points to retrieve detailed payloads associated to the event
        -   Decryption of any confidential data
    -   Creating their own subscriptions in the Integration Hub and updating them as required
    -   Monitoring event message delivery failures to their targets. The platform will provide an alert to nominated contact emails and access to error logs in the Integration Hub for authorised users
    -   Ensuring that failed message deliveries are replayed or accepted as a failure. Note that the Platform team can provide support for this activity upon request

### 3. Platform Context

#### Key Roles/Capabilities

-   Platform Owner
-   Integration Platform Development and Support Team
-   Event Driven Integration Consulting
-   Event Driven Integration Evangelism

#### Key responsibilities

-   Platform Owner:
    -   must ensure adequate budget is in place to maintain the integrity and health of the integration platform
    -   engage with stakeholders (Business Partners, Strategic Architects) to provide strategy and vision
    -   must provide guidance for prioritisation of features
    -   Should manage a roadmap that continues deliver platform capabilities to improve integration efficiency
    -   should provide capability for cost effective governance to assure alignment to Integration standards and to drive best practice
-   The Integration Platform Development and Support Team will maintain a stable and secure platform, providing reliable and platform services that enable producer and consumer teams to perform their responsibilities:
    -   To discuss:
        -   Monitoring
        -   Level 3 support assistance with integration failures
        -   Capacity management for feature development
        -   Handle application onboarding requests and ongoing access management
        -   Evangelise in all platforms the importance and value of Event Driven Integration
        -   Provide consulting to Solution Architects for ISA and ISD.
        -   Maintain Marketing materials and Knowledge base.
