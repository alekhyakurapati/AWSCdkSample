<!-- --- -->
<!-- title: How to Use Event Filters in Subscriptions -->
<!-- --- -->
<!---->
<!-- # How to Use Event Filters in Subscriptions -->
<!---->
<!-- The EDA platform supports creation of event filters with declarative content. An event filter is defined when creating or editing a subscription within the IntegrationHub. When an event is published to the EDA platform Event filters are used to determine which targets should be invoked to send the message to subscribed consumers. -->
<!---->
<!-- ## Core Event Filter -->
<!---->
<!-- When subscribing to a schema from the Integration Hub, a core filter will be automatically created with the following mandatory/readonly properties: -->
<!---->
<!-- 1. "source" : populated by the schema source domain -->
<!-- 1. "detail-type": populated by the schema event name -->
<!-- 1. "detail.Metadata.Version": populated by the schema version -->
<!---->
<!-- ```json -->
<!-- { -->
<!--     "source": ["wel.operations.maintenance"], -->
<!--     "detail-type": ["WorkOrderStatusChange"], -->
<!--     "detail": { -->
<!--         "Metadata": { -->
<!--             "Version": ["2"] -->
<!--         } -->
<!--     } -->
<!-- } -->
<!-- ``` -->
<!---->
<!-- ## Creating More Specific Event Filters -->
<!---->
<!-- The filter can be extended to be more specific if the consumer wishes to be more prescriptive on what events should be forwarded to their targets. Consumers should refer to the event schema and example(s) in the Integration Hub catalogue to help them define filters that are relevant to their requirements. -->
<!---->
<!-- To add a more detailed filter simply add the appropriate property name from the event schema into the event filter object with an array of filters The below examples uses the **detail.Metadata.StatusChange** property. -->
<!---->
<!-- ```json -->
<!-- { -->
<!--     "source": ["wel.operations.maintenance"], -->
<!--     "detail-type": ["WorkOrderStatusChange"], -->
<!--     "detail": { -->
<!--         "Metadata": { -->
<!--             "Version": ["2"], -->
<!--             "StatusChange": [ -->
<!--                 // add filters here -->
<!--             ] -->
<!--         } -->
<!--     } -->
<!-- } -->
<!-- ``` -->
<!---->
<!-- The following filter types are supported: -->
<!---->
<!-- ### Exact Match -->
<!---->
<!-- The below example would be matched if an event has a statusChange value of "APPR" or "SCHD" -->
<!---->
<!-- ```json -->
<!-- { -->
<!--    ... -->
<!--         "StatusChange": [ -->
<!--             "APPR", "SCHD" -->
<!--         ], -->
<!--    ... -->
<!-- } -->
<!-- ``` -->
<!---->
<!-- ### Prefix Match -->
<!---->
<!-- The below example would be matched if an event has a statusChange value with a prefix of "AP" -->
<!---->
<!-- ```json -->
<!-- { -->
<!--    ... -->
<!--         "StatusChange": [ { "prefix": "AP" } ], -->
<!--    ... -->
<!-- } -->
<!-- ``` -->
<!---->
<!-- ### Anything-but Match -->
<!---->
<!-- The below example would be matched for any event that has a statusChange value that is not equal to "APPR" or "SCHD" -->
<!---->
<!-- ```json -->
<!-- { -->
<!--    ... -->
<!--         "StatusChange": [ { "anything-but": ["APPR", "SCHD"] } ], -->
<!--    ... -->
<!-- } -->
<!-- ``` -->
<!---->
<!-- ### Numeric Match -->
<!---->
<!-- Numeric matching works with values that are JSON numbers. It is limited to values between -1.0e9 and +1.0e9 inclusive, with 15 digits of precision, or six digits to the right of the decimal point. The below example would be matched for any event that has a weight value is greater than 5 AND less than or equal to 10 -->
<!---->
<!-- ```json -->
<!-- { -->
<!--    ... -->
<!--         "weight": [ { "numeric": [">", 5, "<=", 10] } ], -->
<!--    ... -->
<!-- } -->
<!-- ``` -->
