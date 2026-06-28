export type EstimatingFlowStepId =
  | 'project-info'
  | 'working-sheet'
  | 'estimate'
  | 'fe-quotation'
  | 'eo-quotation'
  | 'dynamic-door'
  | 'invoice';

export type EstimatingFlowStep = {
  id: EstimatingFlowStepId;
  title: string;
  sourceFile: string;
  purpose: string;
  output: string;
  recordPhase: 'quote' | 'award' | 'project' | 'billing';
};

export const steelCraftEstimatingFlow: EstimatingFlowStep[] = [
  {
    id: 'project-info',
    title: 'Project Information',
    sourceFile: 'project info.csv',
    purpose: 'Capture quote metadata, customer information, project address, billing information, estimator, and contract reference data.',
    output: 'Clean quote record foundation.',
    recordPhase: 'quote',
  },
  {
    id: 'working-sheet',
    title: 'Working Sheet',
    sourceFile: 'working sheet.csv',
    purpose: 'Capture building requirements, proposal language, project notes, payment terms, inclusions, exclusions, and alternates.',
    output: 'Controlled scope and proposal description.',
    recordPhase: 'quote',
  },
  {
    id: 'estimate',
    title: 'Estimate',
    sourceFile: 'Estimate.csv',
    purpose: 'Calculate building cost, markup, tax, freight, engineering, labor, subcontract, alternates, margin, and proposal value.',
    output: 'Template-backed financial estimate.',
    recordPhase: 'quote',
  },
  {
    id: 'fe-quotation',
    title: 'F&E Quotation',
    sourceFile: 'F&E Quotation.csv',
    purpose: 'Generate the customer-facing furnishing and erection quotation from approved quote, scope, and pricing data.',
    output: 'Customer proposal document.',
    recordPhase: 'quote',
  },
  {
    id: 'eo-quotation',
    title: 'EO Quotation',
    sourceFile: 'EO Quotation.csv',
    purpose: 'Generate erection-only quotation language and pricing when erection is scoped separately.',
    output: 'Erection-only proposal document.',
    recordPhase: 'quote',
  },
  {
    id: 'dynamic-door',
    title: 'Dynamic Door',
    sourceFile: 'Dynamic Door.csv',
    purpose: 'Provide vendor catalog pricing and selected door options for estimate alternates and project scope.',
    output: 'Vendor-priced door selections.',
    recordPhase: 'quote',
  },
  {
    id: 'invoice',
    title: 'Invoice',
    sourceFile: 'Invoice.csv',
    purpose: 'Generate invoices from awarded project schedule of values, material draws, labor draws, and approved change orders.',
    output: 'Billing document after award.',
    recordPhase: 'billing',
  },
];

export function getEstimatingFlow(): EstimatingFlowStep[] {
  return steelCraftEstimatingFlow;
}
