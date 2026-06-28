export type MbsProjectType = 'mini-storage' | 'metal-building' | 'hybrid';

export type MbsAccessory = {
  id: string;
  type: 'door' | 'vent' | 'insulation' | 'trim' | 'other';
  label: string;
  quantity?: number;
  width?: string;
  height?: string;
  notes?: string;
};

export type MbsDesignInput = {
  quoteId: string;
  quoteNumber: string;
  projectName: string;
  projectType: MbsProjectType;
  width?: number;
  length?: number;
  eaveHeight?: number;
  roofPitch?: string;
  buildingCode?: string;
  windLoad?: string;
  exposure?: string;
  roofLiveLoad?: string;
  collateralLoad?: string;
  accessories: MbsAccessory[];
};

export type MbsDesignOutput = {
  source: 'mbs-file' | 'mbs-api' | 'manual-entry';
  designSummary?: string;
  costReportTotal?: number;
  shippingListId?: string;
  erectionDrawingSetId?: string;
  draftingOutputId?: string;
  rawReference?: string;
  importedAt: string;
};
