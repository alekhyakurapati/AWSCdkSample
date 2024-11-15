# Event API

This app was generated with [Nx](https://nx.dev).

## Notes about:

-   nestjs fundamentals (modules/controllers/services)
-   shared modules in library
-   config module (and required config, environments, .env files etc)
-   auth module (roles, guards) - [todo - OBO auth]
-   event module (eventstore, event emitting)
-   schemas module
-   validators (and custom decorators)

### Still todo

-   schemas
    -   fix /schema/:name not found
    -   Publish version
-   subscriptions
    -   everything
-   logging

### Cleanup

-   CDK
-   lambda/
    -   schemas
    -   subscriptions
-   libs/
    -   aws-sdk
    -   interfaces
    -   data
