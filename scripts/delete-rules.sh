#!/usr/bin/env bash

if [ -z "$1" ]
  then
    echo "No Event Bus name supplied"
    exit 1
fi

echo "Fetching rules for: $1"
aws events list-rules --event-bus-name=$1 \
| jq --raw-output '.Rules[].Name | select(. | startswith("EAI-EventBroker-EventLoggerRule") | not)' \
| while read name; do \
   echo "Fetching targets for $name"; \
   aws events list-targets-by-rule --rule=$name --event-bus-name="$1" | jq --raw-output '.Targets[].Id' \
   | while read id; do \
   	echo "Deleting target $id"; \
	aws events remove-targets --event-bus-name="$1" --rule=$name --ids=$id | jq; \
   done; \
   echo "Deleting rule $name"; \
   aws events delete-rule --name=$name --event-bus-name="$1"
done
