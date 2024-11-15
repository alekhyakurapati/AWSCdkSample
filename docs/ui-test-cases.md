# UI Test Cases

In the test cases, there are two types of actors:

-   A **Viewer** is anybody with readonly access to the site. This is currently configured for anybody with a WOPID
-   A **User** is someone with elevated access (requested via Saviynt) and has access to manage schemas and subscriptions for a particular application

## Schemas

### Browsing

-   <input type="checkbox"> Viewers can browse schemas, navigate through pages
-   <input type="checkbox"> Viewers can filter for schemas by business domain and application
-   <input type="checkbox"> Viewers can search for schemas using the search box
-   <input type="checkbox"> Viewers can sort schemas by name / updated
-   <input type="checkbox"> Viewers can select schema to view details
-   Schema Definition Tab
    -   <input type="checkbox"> Viewers can switch between schema versions (if more than one)
    -   <input type="checkbox"> Viewers can download schema definition as a typescript interface
    -   Subscribing
        -   <input type="checkbox"> Viewers should be able to see the subscription buttons but are disabled
        -   <input type="checkbox"> Users can subscribe to schemas in DRAFT status only for non-prod
        -   <input type="checkbox"> Users can subscribe to schemas in PUBLISHED state for either non-prod or prod
        -   <input type="checkbox"> Users can not subscribe to schemas in DEPRECATED state for either non-prod or prod
-   Subscriptions Tab
    -   <input type="checkbox"> Viewers can view a list of subscriptions (if exists)
    -   <input type="checkbox"> Viewers can switch between production and non-production subscriptions (if exists)
    -   <input type="checkbox"> Viewers can expand one to view more details about that subscription
-   Event Examples Tab
    -   <input type="checkbox"> Viewers can view event examples
    -   <input type="checkbox"> Viewers can copy code to clipboard
-   Support Tab
    -   <input type="checkbox"> Viewers can view support information
    -   <input type="checkbox"> Viewers can raise a support ticket

### Creating

-   <input type="checkbox"> Viewers can see the "New Schema" button, but is disabled and should not be able to browse to the Create Schema page
-   <input type="checkbox"> Users can create a new schema
    -   Validation Requirements:
        -   <input type="checkbox"> Domain name is required and
        -   <input type="checkbox"> EventName should be required and only in PascalCase
        -   <input type="checkbox"> Description is required
        -   <input type="checkbox"> Application is required and changing it should upate Owner and Cost code fields
    -   Schema Definition
        -   <input type="checkbox"> Can generate schema based on event
        -   <input type="checkbox"> Schema should conform to Woodside shape (include Metadata (with Guid, Time and Version) and Data fields)
    -   <input type="checkbox"> On cancel form, confirmation modal should show if the form values have been changed
        -   <input type="checkbox"> on cancel modal -> confirm, user is redirected back to schema view with current schema selected
    -   <input type="checkbox"> On successful save, user is redirected back to schema view with current schema selected

### Updating

-   <input type="checkbox"> Viewers cannot see a link to edit the schema info or the link to edit schema definition
-   <input type="checkbox"> Viewers should not be able to navigate to the edit pages directly by typing in the URL
-   <input type="checkbox"> Users should only be able to edit schemas that they have access to, links should not be visible to unauthorised users
-   Schema Info
    -   <input type="checkbox"> Users should only be able to edit the description and Information Sensitivity fields
    -   <input type="checkbox"> On cancel, confirmation modal should show if the form values have been changed
    -   <input type="checkbox"> On successful save, should, user is redirected back to schema page with current schema selected
-   Schema Definition
    -   <input type="checkbox"> Can generate schema based on event
    -   <input type="checkbox"> Schema should conform to Woodside shape (include Metadata (with Guid, Time and Version) and Data fields)
    -   <input type="checkbox"> Editing draft schemas will not affect the version or the state (it'll remain as draft)
    -   <input type="checkbox"> Editing published schemas will change the state to draft an increment the version
-   <input type="checkbox"> Users should only be able to see edit links for the latest version of the schema definition
-   <input type="checkbox"> Users should only be able to publish the latest draft for a schema definition

## Subscriptions

### Managing

-   <input type="checkbox"> Viewers cannot see a link to Manage Subscriptions
-   <input type="checkbox"> Users can navigate to Manage Subsriptions page
-   <input type="checkbox"> Users should be able to view a list of schemas their applications are subscribed to, grouped by application
    -   <input type="checkbox"> List should be displayed in alphabetical order
-   <input type="checkbox"> Users can expand on each schema group to view a list of subscriptions
-   <input type="checkbox"> Users can enable/disable subscriptions
    -   <input type="checkbox"> Disabling a Prod subscription should show a confirmation modal
-   <input type="checkbox"> Users can edit subscriptions
-   Filtering
    -   <input type="checkbox"> Users can filter by Application, Type or Status
    -   <input type="checkbox"> Users can search for subscription by name
    -   <input type="checkbox"> Users can clear all filters with the Clear All button

### Creating

-   <input type="checkbox"> Only Users can create a Subscription
-   <input type="checkbox"> Application is required and changing it should update Owner and Cost code fields
-   <input type="checkbox"> Domain Name is required
-   <input type="checkbox"> Description is required
-   <input type="checkbox"> Event rule is required and should have
    -   <input type="checkbox"> Source, detail-type and detail.Metadata.Version fields
    -   <input type="checkbox"> Fields should match the schema that the user is creating the subscription for
    -   <input type="checkbox"> Version value should be a valid value
        -   <input type="checkbox"> Only allow values for DRAFT and PUBLISHED versions for non-prod subscriptions
        -   <input type="checkbox"> Only allow values for PUBLISHED versions for Prod subscriptions
-   <input type="checkbox"> Target is required
    -   Event Bus Targets
        -   <input type="checkbox"> Target ARN's should be in the correct format (e.g. `arn:aws:events:<region>:<account>:event-bus/`)
        -   <input type="checkbox"> Users can only specify 1 ARN in Prod
        -   <input type="checkbox"> Users can specify 1 to 5 ARN's in Non Prod
            -   <input type="checkbox"> Delete icon should appear when more than one target field is visible
            -   <input type="checkbox"> Add Additional Target link should be disable when 5 fields are visible
    -   API Targets
        -   <input type="checkbox"> User needs to have selected their application first before select list of APIs is available
        -   <input type="checkbox"> User can select to create a new REST API, which loads the Add REST API Form
        -   <input type="checkbox"> If a new REST API Target is created, it should show up in the dropdown field (without refreshing)

### Updating

-   <input type="checkbox"> Users can only edit subscriptions they are entitled to edit based on the app role
-   <input type="checkbox"> Only Description, Rule and Targets values are editable
    -   <input type="checkbox"> Validation rules are the same as the Create Subscription for these fields

### Deleting

-   <input type="checkbox"> Users can only delete subscriptions they are entitled to edit based on the app role
-   <input type="checkbox"> Users can only delete subscriptions that have been disabled
-   <input type="checkbox"> Deleting should present a confirmation modal to the User

## API Targets

### Managing

-   <input type="checkbox"> Viewers cannot see a link to Manage Authorisations & Target APIs
-   <input type="checkbox"> Users can navigate to Manage Authorisations & Target APIs page
-   <input type="checkbox"> Users should be able to view a list of API Authorisations and API Targets that they are entitled to view based on app roles
-   <input type="checkbox"> Users can switch between the list of API Authorisations and API Target Tabs
-   <input type="checkbox"> Resources should be grouped by application name
-   <input type="checkbox"> API Authorisations should show the current Authorised Status (AUTHORISED in green chip, DEAUTHORISED in red)

### Creating

Test the below both from withing the 'add subscription' context and also from the 'manage api' context

-   API Authorisations
    -   <input type="checkbox"> Only Users can create API Authorisations
    -   <input type="checkbox"> All fields are required
    -   <input type="checkbox"> Authorisation Endpoint must a valid URL Format
-   Target APIs
    -   <input type="checkbox"> Only Users can create target APIs
    -   <input type="checkbox"> All fields are required
    -   <input type="checkbox"> Destination Endpoint must a valid URL Format

### Updating

-   API Authorisations
    -   <input type="checkbox"> Only Users can edit API Authorisations they are entitled to
    -   <input type="checkbox"> Authorisation Endpoint must a valid URL Format
    -   <input type="checkbox"> Users can update an auth endpoint without modifying the client credentials
    -   <input type="checkbox"> Users can update the client credentials
-   Target APIs
    -   <input type="checkbox"> Only Users can edit target APIs they are entitled to
    -   <input type="checkbox"> Destination Endpoint must a valid URL Format

### Deleting

-   API Authorisations
    -   <input type="checkbox"> Only Users can delete API Authorisations they are entitled to
    -   <input type="checkbox"> Authorisations can only be deleted if there are no API Destinations using it
-   Target APIs
    -   <input type="checkbox"> Only Users can delete target APIs they are entitled to
    -   <input type="checkbox"> APIs can only be deleted if there are no subscriptions using it

## Event Failures

-   <input type="checkbox"> Viewers cannot see a link to Manage Delivery Failures
-   <input type="checkbox"> Users can navigate to Manage Delivery Failures
-   <input type="checkbox"> Users should be able to select any application they have access to
-   <input type="checkbox"> Users can navigate to Manage Delivery Failures
-   <input type="checkbox"> Users can switch between production and non-production
-   <input type="checkbox"> Users can use filters correctly
-   <input type="checkbox"> Users can open up a selected event for further detail
-   <input type="checkbox"> Users can load additional events while there are more available
