## Setting up Authentication

1. Login to Azure AD using your cloud service admin account and open App registrations and search for your application.
1. Under `API Permissions` on the left, click "Add a Permission"
1. Search for `events.api.woodside` (for the prod application) or `events-np.dev.api.woodside` (for the non-prod application).
1. After selecting the relevant API, choose Application Permissions, tick the Event.Application permission, then click "Add Permission"
1. After the Permission is requested, it will require admin consent. This can be requested by raising a ticket in [ServiceNow](https://woodside.service-now.com/sp?id=sc_cat_item&sys_id=af578d7bdb694150b6f3401d3496191f). When filling out the form:
    - Choose Microsoft Azure in the "What is this query related to?" field.
    - in the further details specify the request: eg

```
Please grant admin consent on requested API permissions
on the <your-app-name> Azure application
(client id: <your-app-client-id>)
```

6. Next, under `Certificates and Secrets`, got to `Client Secrets` tab and add a new secret.

## Getting Authorization Token

Before querying the event API, your application needs to get an Authorization token.

Authentication is done using the [OAuth 2 Client Credentials flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow)

| Parameter        | Value                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Access token URL | `https://login.microsoftonline.com/a3299bba-ade6-4965-b011-bada8d1d9558/oauth2/v2.0/token`                                                  |
| grant_type       | `client_credentials`                                                                                                                        |
| client_id        | `<<Your Client ID>>`                                                                                                                        |
| client_secret    | `<<Your Client Secret>>`                                                                                                                    |
| scope            | `api://6eb11a81-1da2-429c-ba5e-c29f049e8a9b/.default` for Non-Prod and, <br> `api://c0dfa8d7-3715-4a83-b12b-4b71231d6019/.default` for Prod |
