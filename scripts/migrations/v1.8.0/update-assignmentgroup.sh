#!/bin/bash

# Please update the tableName, baseUrl, token according to the environment.
# Please comment out the curl command and check the payload first

tableName='EAI-EventApiStack-QA-ApplicationsTable27AC2163-1GYAWEQ8XUUE5'
baseUrl='https://pybs0vopg7.execute-api.ap-southeast-2.amazonaws.com/applications/'
token='Authorization: Bearer '
assignmentGroupInforDir='./assignmentgroup-info.txt'

aws dynamodb scan --table-name $tableName | jq -r '.Items[] | "\(.PK.S),\(.Owner.S),\(.ContactEmail.S),\(.CostCode.S),\(.CINumber.S)"' |
while IFS="," read -r appShortName Owner ContactEmail CostCode CINumber
do 
    
	export assignmentGroup=$(grep $appShortName "${assignmentGroupInforDir}" | cut -d ':' -f2 | awk '{$1=$1};1')
	echo $appShortName
	
	if [[ ! -z "$assignmentGroup" ]];then
		export fullUrl=${baseUrl}${appShortName}
		
		export dataRaw=$(jq --null-input \
		--arg shortName "$appShortName" \
		--arg assignmentGroup "$assignmentGroup" \
		--arg Owner "$Owner" \
		--arg ContactEmail "$ContactEmail" \
		--arg CostCode "$CostCode" \
		--arg CINumber "$CINumber" \
		'{"ShortName": $shortName, "AssignmentGroup": $assignmentGroup, "Owner": $Owner, "ContactEmail": $ContactEmail, "CostCode": $CostCode, "CINumber": $CINumber }')
		
		echo $dataRaw

# 		curl --location --request PUT "${fullUrl}" \
# 		--header "${token}" \
# 		--header 'Content-Type: application/json' \
# 		--data-raw "${dataRaw}" 
	
	fi
	
	unset assignmentGroup 
	echo -e
	echo -e =======================

done