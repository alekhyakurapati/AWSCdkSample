---
title: Application Onboarding
---

# Application Onboarding

Before Applications are able to produce or consume their first event(s), they will need to be onboarded on to the Integration Platform.

## 1. Submit a Request to Onboard your Application to the Integration Platform

::: info
**Some Pre-requisites:**

-   Users require access to ServiceNow to properly complete the form, If you are unable to select all mandatory values, request your access via [this link](https://woodside.service-now.com/sp?id=sc_cat_item&sys_id=9c572c908776e510dd888407dabb3577)
-   Your application must be registered in the CMDB (ServiceNow). If required this can be requested via [this link](https://woodside.service-now.com/sp?id=sc_cat_item&sys_id=c9c264bedbf85090b6f3401d34961914)

:::

Submit a request through [EDA Integration Hub Application Onboarding](https://woodside.service-now.com/sp?id=sc_cat_item&sys_id=719a840fdbc89d10b6f3401d34961907) form in ServiceNow. This will generate 2 tasks for:

1.  the IntegrationPlatform team to set up application policies and data; and
2.  the Identity and Access Management team to set up a new entitlement in Savyint.

| Field                                                 |           Required            | Description                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------- | :---------------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Who is this required for                              |      :heavy_check_mark:       | User requesting this item                                                                                                                                                                                                                                                                                                                 |
| Application to be onboarded                           |      :heavy_check_mark:       | The application to be onboarded. This list is populated from the CMDB. If your application is not found in this list, please make sure it is registered in the CMDB                                                                                                                                                                       |
| Application CI Number                                 | :heavy_check_mark: (readonly) | Autofilled from the application selection                                                                                                                                                                                                                                                                                                 |
| Azure AD Application Client ID                        |                               | Your Azure Client ID if required                                                                                                                                                                                                                                                                                                          |
| Is your application hosted on the Woodside AWS Cloud? |      :heavy_check_mark:       |                                                                                                                                                                                                                                                                                                                                           |
| Prod AWS Account                                      |                               | Your Prod AWS Account ID if required                                                                                                                                                                                                                                                                                                      |
| Non-Prod AWS Account                                  |                               | Your Non-Prod AWS Account ID if required                                                                                                                                                                                                                                                                                                  |
| Cost Center                                           |      :heavy_check_mark:       | The Cost Centre associated with your application                                                                                                                                                                                                                                                                                          |
| Event Platform Role Name                              |          (readonly)           | Autofilled                                                                                                                                                                                                                                                                                                                                |
| Event Platform Role Description                       |          (readonly)           | Autofilled                                                                                                                                                                                                                                                                                                                                |
| Risk Rating for User Entitlement                      |                               | The risk rating for User entitlements should be assessed on the risk consequence for access being inappropriately granted to a user to manage your applications integration. A consequence of High or Very High will require approval from application owners and Severe will additionally require the requestor's line manager approval. |
| AD Group                                              |      :heavy_check_mark:       | The AD Group name users will be added to when requesting access to manage schemas and/or subscriptions for your application and should be in the format of <br>`Right-usr-ap-Int.Platform.Event.User.<short-app-name>-U-GS` <br>e.g. `Right-usr-ap-Int.Platform.Event.User.FUSE-U-GS`                                                     |
| ServiceNow Assignment Group                           |                               | The ServiceNow Assignment Group that is responsible for support requests                                                                                                                                                                                                                                                                  |
| Support Email                                         |                               | A support email address                                                                                                                                                                                                                                                                                                                   |
| Notification email                                    |                               | A list of any additional emails for event failure notifications (will include the Support Email)                                                                                                                                                                                                                                          |
| Additional instructions                               |                               |                                                                                                                                                                                                                                                                                                                                           |

When the tasks are complete, the requestor will receive a notification to confirm that the Application access is provisioned successfully.

## Next Steps

Once the 2 onboarding tasks have completed, you'll need to [request access](./requesting-access) via [Saviynt](https://ssm-saviyntcloud.woodside.com.au/ECM/workflowmanagement/requesthome?menu=1). This will give your user account the ability to create new or edit existing schemas, and subscribe to events and manage existing subscriptions

If you want to [Publish Events](../for-producers/producer-applications)

If you want to [Subscribe to Events](../for-consumers/consumer-applications)
