---
title: Fetching Large Payloads
---

# Fetching Large Payloads

Limitations with EventBridge means events that have large payloads (>256Kb), have the payloads stored in S3, while a link is provided in the event itself to make an HTTP call to fetch the payload.

For example, in the following event:

```json
{
    "version": "0",
    "id": "9e6de25a-36d5-b4ea-f0b6-17082d78996d",
    "detail-type": "MaintenanceOrderChanged",
    "source": "wel.operations.maintenance",
    "account": "144028967590",
    "time": "2023-11-20T01:46:09Z",
    "region": "ap-southeast-2",
    "resources": [],
    "detail": {
        "Data": {
            "_link": {
                "Internal": "https://events-np.dev.api.woodside/v1/events?s3Key=wel.operations.maintenance/MaintenanceOrderChanged/MAINT_ORDER_CHANGED20231120014604.2809110.json"
            }
        },
        "Metadata": {
            "Guid": "MAINT_ORDER_CHANGED20231120014604.2809110",
            "Time": "2023-11-20T01:46:04.280Z",
            "Version": "2",
            "BusinessKey": "500009686",
            "MaintenancePlant": "AA50",
            "MaintenancePlanningPlant": "AA50",
            "MaintenanceOrderType": "AM05",
            "TechnicalObjectType": "VESL",
            "Origin": "S4HPRE",
            "S3Bucket": "wel-eai-event-bucket-prd-np",
            "S3Key": "wel.operations.maintenance/MaintenanceOrderChanged/MAINT_ORDER_CHANGED20231120014604.2809110.json"
        }
    }
}
```

The `Data._link.Internal` value provides a link to call to fetch the full payload

Your application needs to be configured to access the Events API

<!--@include: ../shared/authentication.md-->
