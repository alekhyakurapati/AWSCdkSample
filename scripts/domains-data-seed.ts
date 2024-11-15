import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

// const DDB_BUSINESS_DOMAIN_TABLE_NAME = 'EAI-EventApiStack-DEV-BusinessDomainTableACA77767-1WDMAIQJP4NH0';
const DDB_BUSINESS_DOMAIN_TABLE_NAME = 'EAI-EventApiStack-PRD-BusinessDomainTableACA77767-1K80A5AJ0JMU7';
// const DDB_BUSINESS_DOMAIN_TABLE_NAME = 'EAI-EventApiStack-QA-BusinessDomainTableACA77767-VW6MKXT33J';
// const DDB_BUSINESS_DOMAIN_TABLE_NAME = 'EAI-EventApiStack-RP-BusinessDomainTableACA77767-1U1GKLDQUJL4N';

// prettier-ignore
const data = [
    ['wel', 'wel', 'Woodside Energy', 'wel'],
    ['wel', 'wel.climate-strategy', 'Climate Strategy', 'climate-strategy'],
    ['wel', 'wel.climate-strategy.carbon', 'Carbon', 'carbon'],
    ['wel', 'wel.corporate-legal', 'Corporate & Legal', 'corporate-legal'],
    ['wel', 'wel.corporate-legal.business-climate-energy-outlook', 'Business Climate & Energy Outlook', 'business-climate-energy-outlook'],
    ['wel', 'wel.corporate-legal.corporate-affairs', 'Corporate Affairs', 'corporate-affairs'],
    ['wel', 'wel.corporate-legal.corporate-change-management', 'Corporate Change Management', 'corporate-change-management'],
    ['wel', 'wel.corporate-legal.global-property-workplace', 'Global Property & Workplace', 'global-property-workplace'],
    ['wel', 'wel.corporate-legal.hse', 'HSE', 'hse'],
    ['wel', 'wel.corporate-legal.internal-audit', 'Internal Audit', 'internal-audit'],
    ['wel', 'wel.corporate-legal.leadership-commitment-accountability', 'Leadership Commitment & Accountability', 'leadership-commitment-accountability'],
    ['wel', 'wel.corporate-legal.legal-secretariat', 'Legal & Secretariat', 'legal-secretariat'],
    ['wel', 'wel.corporate-legal.risk-quality-compliance-governance', 'Risk, Quality, Compliance and Governance', 'risk-quality-compliance-governance'],
    ['wel', 'wel.corporate-legal.security-emergency-management', 'Security & Emergency Management', 'security-emergency-management'],
    ['wel', 'wel.development', 'Development', 'development'],
    ['wel', 'wel.development.development-planning', 'Development Planning', 'development-planning'],
    ['wel', 'wel.development.drilling-completions', 'Drilling & Completions', 'drilling-completions'],
    ['wel', 'wel.development.power-new-market', 'Power & New Market', 'power-new-market'],
    ['wel', 'wel.development.projects', 'Projects', 'projects'],
    ['wel', 'wel.development.quality-assurance', 'Quality Assurance', 'quality-assurance'],
    ['wel', 'wel.engineering', 'Engineering', 'engineering'],
    ['wel', 'wel.engineering.engineering', 'Engineering', 'engineering'],
    ['wel', 'wel.exploration', 'Exploration', 'exploration'],
    ['wel', 'wel.exploration.geoscience', 'Geoscience', 'geoscience'],
    ['wel', 'wel.exploration.subsurface', 'Subsurface', 'subsurface'],
    ['wel', 'wel.finance-commercial', 'Finance & Commercial', 'finance-commercial'],
    ['wel', 'wel.finance-commercial.commercial', 'Commercial', 'commercial'],
    ['wel', 'wel.finance-commercial.contract-procurement', 'Contract & Procurement', 'contract-procurement'],
    ['wel', 'wel.finance-commercial.finance', 'Finance', 'finance'],
    ['wel', 'wel.finance-commercial.investor-relations', 'Investor Relations', 'investor-relations'],
    ['wel', 'wel.finance-commercial.performance-excellence', 'Performance Excellence', 'performance-excellence'],
    ['wel', 'wel.finance-commercial.strategy-planning-analysis', 'Strategy Planning & Analysis', 'strategy-planning-analysis'],
    ['wel', 'wel.finance-commercial.tax', 'Tax', 'tax'],
    ['wel', 'wel.finance-commercial.treasury', 'Treasury', 'treasury'],
    ['wel', 'wel.human-resource-management', 'Human Resource Management', 'human-resource-management'],
    ['wel', 'wel.human-resource-management.human-resources', 'Human Resources', 'human-resources'],
    ['wel', 'wel.information-system-management', 'Information & System Management', 'information-system-management'],
    ['wel', 'wel.information-system-management.information-systems', 'Information Systems', 'information-systems'],
    ['wel', 'wel.marketing-trading', 'Marketing & Trading', 'marketing-trading'],
    ['wel', 'wel.marketing-trading.shipping-operations', 'Shipping Operations', 'shipping-operations'],
    ['wel', 'wel.new-energy', 'New Energy', 'new-energy'],
    ['wel', 'wel.new-energy.hydrogen', 'Hydrogen', 'hydrogen'],
    ['wel', 'wel.operations', 'Operations', 'operations'],
    ['wel', 'wel.operations.global-operations-planning-performance', 'Global Operations Planning & Performance', 'global-operations-planning-performance'],
    ['wel', 'wel.operations.logistics', 'Logistics', 'logistics'],
    ['wel', 'wel.operations.logistics.aviation', 'Aviation', 'aviation'],
    ['wel', 'wel.operations.logistics.facility-management', 'Facility Management', 'facility-management'],
    ['wel', 'wel.operations.logistics.marine-services', 'Marine Services', 'marine-services'],
    ['wel', 'wel.operations.logistics.materials-management', 'Materials Management', 'materials-management'],
    ['wel', 'wel.operations.maintenance', 'Maintenance', 'maintenance'],
    ['wel', 'wel.operations.production', 'Production', 'production'],
    ['wel', 'wel.operations.production.operations', 'Operations', 'operations'],
    ['wel', 'wel.operations.production.planning', 'Planning', 'planning'],
    ['wel', 'wel.operations.production.hc-accounting', 'HC Accounting', 'hc-accounting'],
    ['wel', 'wel.operations.production.integrated-activity-planning', 'Integrated Activity Planning', 'integrated-activity-planning'],
    ['wel', 'wel.operations.quality-sample-analysis', 'Quality (Sample Analysis)', 'quality-sample-analysis'],
    ['wel', 'wel.operations.reservoir-management', 'Reservoir Management', 'reservoir-management'],
    ['wel', 'wel.operations.subsea-pipelines', 'Subsea & Pipelines', 'subsea-pipelines'],
];

const db = DynamoDBDocument.from(new DynamoDB({ region: 'ap-southeast-2' }));

async function main() {
    await Promise.all(
        data.map(([PK, Path, DisplayName, Name]) => {
            console.log(PK, Path, DisplayName, Name);

            return db.put({
                TableName: DDB_BUSINESS_DOMAIN_TABLE_NAME,
                Item: { PK, Path, DisplayName, Name },
            });
        }),
    );

    // for (const [PK, Path, DisplayName, Name] of data) {
    //     console.log(PK, Path, DisplayName, Name);

    //     await db.put({
    //         TableName: DDB_BUSINESS_DOMAIN_TABLE_NAME,
    //         Item: { PK, Path, DisplayName, Name },
    //     });
    // }
}

(async () => {
    console.warn(`Running script on ${DDB_BUSINESS_DOMAIN_TABLE_NAME} table`);
    try {
        await main();
    } catch (e) {
        // Deal with the fact the chain failed
    }
})();
