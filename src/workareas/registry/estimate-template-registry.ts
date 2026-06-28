import type { EstimateTemplateDefinition } from '../contracts/estimate-template-contract';

export const steelCraftEstimateTemplates: EstimateTemplateDefinition[] = [
  {
    id: 'project-info-v1',
    version: '1.0.0',
    title: 'Project Information Template',
    kind: 'project-info',
    description: 'Approved project and customer information source. Orange/input cells become guided quote intake fields.',
    sourceFileName: 'project info.csv',
    active: true,
    sections: [
      {
        id: 'project-basics',
        title: 'Project Basics',
        description: 'Estimator, quote number, project name, address, customer, and company bidding to.',
        fields: [
          { id: 'estimator', label: 'Estimator', sourceSheet: 'project info', sourceHint: 'Estimator', inputType: 'text', editable: true, required: true },
          { id: 'quoteNumber', label: 'Quote Number', sourceSheet: 'project info', sourceHint: 'Project # before award', inputType: 'text', editable: false },
          { id: 'projectName', label: 'Project Name', sourceSheet: 'project info', sourceHint: 'Project Name', inputType: 'text', editable: true, required: true },
          { id: 'projectAddress', label: 'Project Address', sourceSheet: 'project info', sourceHint: 'Street, city, state, zip', inputType: 'longText', editable: true },
          { id: 'customerCompany', label: 'Customer Company', sourceSheet: 'project info', sourceHint: "Customer's Full Company Name", inputType: 'text', editable: true, required: true },
          { id: 'companyBiddingTo', label: 'Company Bidding To', sourceSheet: 'project info', sourceHint: 'Company Bidding to', inputType: 'text', editable: true },
        ],
      },
    ],
  },
  {
    id: 'working-sheet-v1',
    version: '1.0.0',
    title: 'Working Sheet Template',
    kind: 'working-sheet',
    description: 'Approved proposal description and alternates source. It drives descriptions without copying the spreadsheet layout into the UI.',
    sourceFileName: 'working sheet.csv',
    active: true,
    sections: [
      {
        id: 'proposal-description',
        title: 'Proposal Description',
        description: 'Customer-facing quote description, notes, payment terms, and project notes.',
        fields: [
          { id: 'projectName', label: 'Project Name', sourceSheet: 'working sheet', sourceHint: 'Project Name', inputType: 'text', editable: true },
          { id: 'salespersonEstimator', label: 'Salesperson / Estimator', sourceSheet: 'working sheet', sourceHint: 'Salesperson/Estimator', inputType: 'text', editable: true },
          { id: 'emailAddress', label: 'Email Address', sourceSheet: 'working sheet', sourceHint: 'Email Address', inputType: 'text', editable: true },
          { id: 'paymentTerms', label: 'Payment Terms', sourceSheet: 'working sheet', sourceHint: 'Payment terms', inputType: 'text', editable: true },
          { id: 'projectNotes', label: 'Project Notes', sourceSheet: 'working sheet', sourceHint: 'Project Notes', inputType: 'longText', editable: true },
        ],
      },
      {
        id: 'alternates',
        title: 'Alternates',
        description: 'Structured alternate descriptions from the approved working sheet.',
        fields: [
          { id: 'alt1', label: 'Alternate 1', sourceSheet: 'working sheet', sourceHint: 'Alt 1', inputType: 'longText', editable: true },
          { id: 'alt2', label: 'Alternate 2', sourceSheet: 'working sheet', sourceHint: 'Alt 2', inputType: 'longText', editable: true },
          { id: 'alt3', label: 'Alternate 3', sourceSheet: 'working sheet', sourceHint: 'Alt 3', inputType: 'longText', editable: true },
        ],
      },
    ],
  },
  {
    id: 'estimate-sheet-v1',
    version: '1.0.0',
    title: 'Estimate Sheet Template',
    kind: 'estimate-sheet',
    description: 'Approved estimating math source. Editable cost and markup fields feed calculated totals, profit, alternates, and erection cost views.',
    sourceFileName: 'Estimate.csv',
    active: true,
    sections: [
      {
        id: 'estimate-summary',
        title: 'Estimate Summary',
        description: 'Quote-level totals and cost-per-square-foot calculations.',
        fields: [
          { id: 'estimateNumber', label: 'Estimate Number', sourceSheet: 'Estimate', sourceHint: 'Estimate Number', inputType: 'text', editable: false },
          { id: 'estimateDate', label: 'Date', sourceSheet: 'Estimate', sourceHint: 'Date', inputType: 'date', editable: true },
          { id: 'squareFeet', label: 'Square Feet', sourceSheet: 'Estimate', sourceHint: 'SF', inputType: 'number', editable: true },
          { id: 'buildingCost', label: 'Building Cost', sourceSheet: 'Estimate', sourceHint: 'Building cost', inputType: 'currency', editable: true },
          { id: 'localTaxRate', label: 'Local Tax Rate', sourceSheet: 'Estimate', sourceHint: 'Local Tax Rate', inputType: 'percent', editable: true },
          { id: 'defaultMarkup', label: 'Default Markup', sourceSheet: 'Estimate', sourceHint: 'Markup', inputType: 'percent', editable: true },
        ],
      },
      {
        id: 'computed-outputs',
        title: 'Generated Outputs',
        description: 'White/generated outputs. These should be formula-backed and not free typed.',
        fields: [
          { id: 'costWithAlternates', label: 'Cost With Alternates', sourceSheet: 'Estimate', sourceHint: 'Cost with alternate', inputType: 'computed', editable: false },
          { id: 'buildingProfit', label: 'Building Profit', sourceSheet: 'Estimate', sourceHint: 'Building Profit', inputType: 'computed', editable: false },
          { id: 'alternateProfit', label: 'SCB Alternate Profit', sourceSheet: 'Estimate', sourceHint: 'SCB alternate profit', inputType: 'computed', editable: false },
          { id: 'erectionCostPsf', label: 'Estimated Erection Cost PSF', sourceSheet: 'Estimate', sourceHint: 'Est. Erection cost PSF', inputType: 'computed', editable: false },
        ],
      },
    ],
  },
];

export function getEstimateTemplates(): EstimateTemplateDefinition[] {
  return steelCraftEstimateTemplates;
}

export function getActiveEstimateTemplates(): EstimateTemplateDefinition[] {
  return steelCraftEstimateTemplates.filter((template) => template.active);
}
