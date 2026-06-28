export type EstimateTemplateKind = 'project-info' | 'working-sheet' | 'estimate-sheet';

export type EstimateTemplateField = {
  id: string;
  label: string;
  sourceSheet: string;
  sourceHint?: string;
  inputType: 'text' | 'number' | 'currency' | 'percent' | 'date' | 'select' | 'computed' | 'longText';
  editable: boolean;
  required?: boolean;
  options?: string[];
};

export type EstimateTemplateSection = {
  id: string;
  title: string;
  description: string;
  fields: EstimateTemplateField[];
};

export type EstimateTemplateDefinition = {
  id: string;
  version: string;
  title: string;
  kind: EstimateTemplateKind;
  description: string;
  sourceFileName: string;
  active: boolean;
  sections: EstimateTemplateSection[];
};
