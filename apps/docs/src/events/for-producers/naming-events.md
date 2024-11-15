---
title: How to Name your Event
---

# How to Name your Event

Event names play a crucial role in identifying the 'what' and 'where':

1. **What has occurred** (event itself) – the occurrence of an event in the Producer Application is always linked to a change to one or more business object(s). These changes (like approval of a Maintenance Item) would be represented in one of the following ways:
    - **Object level change** – for creation/modification/deletion of Maintenance Item can be encapsulated as a change event. i.e. `MaintenanceItemChanged`
    - **Field level change** – for specific events on certain fields that bears importance, i.e. `MaintenanceItemApproved`.
1. **Where it occurred** – indicates the business domain, sub business domain and business process related to the event within the Woodside Organisation.

## Schema Name Structure

Schema names in the IntegrationHub take the form of

`<Org>.<BusinessDomain>.<SubDomain>[optional.<Process>]@<EventName>`

for example:

`wel.operations.maintenance@MaintenanceOrderCreated`

## Business Domains

![Business Domains](/business-domains.png)

<table>
  <thead>
    <tr class="tablesorter-headerRow">
      <th> Org </th>
      <th> Domain </th>
      <th> Sub-Domain </th>
      <th> Sub-Sub-Domain </th>
      <th> Resulting Event Source Name </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="44">WEL</td>
      <td>Climate Strategy</td>
      <td>Carbon</td>
      <td><br></td>
      <td colspan="1">wel.climate-strategy.carbon</td>
    </tr>
    <tr>
      <td rowspan="10">Corporate &amp; Legal</td>
      <td>Business Climate &amp; Energy Outlook</td>
      <td><br></td>
      <td>wel.corporate-legal.business-climate-energy-outlook</td>
    </tr>
    <tr>
      <td>Corporate Change Management</td>
      <td><br></td>
      <td>wel.corporate-legal.corporate-change-management</td>
    </tr>
    <tr>
      <td>Corporate Affairs</td>
      <td><br></td>
      <td>wel.corporate-legal.corporate-affairs</td>
    </tr>
    <tr>
      <td>Global Property &amp; Workplace</td>
      <td><br></td>
      <td>wel.corporate-legal.global-property-workplace</td>
    </tr>
    <tr>
      <td>HSE</td>
      <td><br></td>
      <td>wel.corporate-legal.hse</td>
    </tr>
    <tr>
      <td>Internal Audit</td>
      <td><br></td>
      <td>wel.corporate-legal.internal-audit</td>
    </tr>
    <tr>
      <td>Leadership Commitment &amp; Accountability</td>
      <td><br></td>
      <td>wel.corporate-legal.leadership-commitment-accountability</td>
    </tr>
    <tr>
      <td>Legal and Secretariat</td>
      <td><br></td>
      <td>wel.corporate-legal.legal-secretariat</td>
    </tr>
    <tr>
      <td>Risk, Quality, Compliance and Governance</td>
      <td><br></td>
      <td>wel.corporate-legal.risk-quality-compliance-governance</td>
    </tr>
    <tr>
      <td>Security &amp; Emergency Management</td>
      <td><br></td>
      <td>wel.corporate-legal.security-emergency-management</td>
    </tr>
    <tr>
      <td rowspan="5">Development</td>
      <td>Development Planning</td>
      <td><br></td>
      <td>wel.development.development-planning</td>
    </tr>
    <tr>
      <td>Drilling &amp; Completions</td>
      <td><br></td>
      <td>wel.development.drilling-completions</td>
    </tr>
    <tr>
      <td>Power &amp; New Market</td>
      <td><br></td>
      <td>wel.development.power-new-market</td>
    </tr>
    <tr>
      <td>Projects</td>
      <td><br></td>
      <td>wel.development.projects</td>
    </tr>
    <tr>
      <td>Quality Assurance</td>
      <td><br></td>
      <td>wel.development.quality-assurance</td>
    </tr>
    <tr>
      <td>Marketing &amp; Trading</td>
      <td>Shipping Operations</td>
      <td><br></td>
      <td>wel.marketing-trading.shipping-operations</td>
    </tr>
    <tr>
      <td rowspan="8">Finance &amp; Commercial</td>
      <td>Commercial</td>
      <td><br></td>
      <td>wel.finance-commercial.commercial</td>
    </tr>
    <tr>
      <td>Contract &amp; Procurement</td>
      <td><br></td>
      <td>wel.finance-commercial.contract-procurement</td>
    </tr>
    <tr>
      <td>Finance</td>
      <td><br></td>
      <td>wel.finance-commercial.finance</td>
    </tr>
    <tr>
      <td>Investor Relations</td>
      <td><br></td>
      <td>wel.finance-commercial.investor-relations</td>
    </tr>
    <tr>
      <td>Performance Excellence</td>
      <td><br></td>
      <td>wel.finance-commercial.performance-excellence</td>
    </tr>
    <tr>
      <td>Strategy Planning &amp; Analysis</td>
      <td><br></td>
      <td>wel.finance-commercial.strategy-planning-analysis</td>
    </tr>
    <tr>
      <td>Tax</td>
      <td><br></td>
      <td>wel.finance-commercial.tax</td>
    </tr>
    <tr>
      <td>Treasury</td>
      <td><br></td>
      <td>wel.finance-commercial.treasury</td>
    </tr>
    <tr>
      <td rowspan="13">Operations</td>
      <td>Maintenance</td>
      <td><br></td>
      <td>wel.operations.maintenance</td>
    </tr>
    <tr>
      <td rowspan="4">Logistics</td>
      <td>Aviation</td>
      <td>wel.operations.logistics.aviation</td>
    </tr>
    <tr>
      <td>Marine Services</td>
      <td>wel.operations.logistics.marine-services</td>
    </tr>
    <tr>
      <td>Materials Management</td>
      <td>wel.operations.logistics.materials-management</td>
    </tr>
    <tr>
      <td>Facility Management</td>
      <td>wel.operations.logistics.facility-management</td>
    </tr>
    <tr>
      <td rowspan="4">Production</td>
      <td>Production Operations</td>
      <td>wel.operations.production.operations</td>
    </tr>
    <tr>
      <td>Production Planning</td>
      <td>wel.operations.production.planning</td>
    </tr>
    <tr>
      <td>Production/HC Accounting</td>
      <td>wel.operations.production.hc-accounting</td>
    </tr>
    <tr>
      <td>Integrated Activity Planning</td>
      <td>wel.operations.production.integrated-activity-planning</td>
    </tr>
    <tr>
      <td>Reservoir Management</td>
      <td><br></td>
      <td>wel.operations.reservoir-management</td>
    </tr>
    <tr>
      <td>Subsea &amp; Pipelines</td>
      <td><br></td>
      <td>wel.operations.subsea-pipelines</td>
    </tr>
    <tr>
      <td>Quality (Sample Analysis)</td>
      <td><br></td>
      <td>wel.operations.quality-sample-analysis</td>
    </tr>
    <tr>
      <td>Global Operations Planning &amp; Performance</td>
      <td><br></td>
      <td>wel.operations.global-operations-planning-performance</td>
    </tr>
    <tr>
      <td>Engineering</td>
      <td><br></td>
      <td><br></td>
      <td>wel.engineering</td>
    </tr>
    <tr>
      <td>Human Resource Management</td>
      <td><br></td>
      <td><br></td>
      <td>wel.human-resource-management</td>
    </tr>
    <tr>
      <td>New Energy</td>
      <td>Hydrogen</td>
      <td><br></td>
      <td>wel.new-energy.hydrogen</td>
    </tr>
    <tr>
      <td>Information &amp; System Management</td>
      <td><br></td>
      <td><br></td>
      <td>wel.information-system-management</td>
    </tr>
    <tr>
      <td>Exploration</td>
      <td>GeoScience</td>
      <td><br></td>
      <td>wel.exploration.geoscience</td>
    </tr>
    <tr>
      <td>Exploration</td>
      <td>Subsurface</td>
      <td><br></td>
      <td>wel.exploration.subsurface</td>
    </tr>
  </tbody>
</table>
