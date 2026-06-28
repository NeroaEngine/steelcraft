export const manufacturerOptions = ['Whirlwind', 'Nucor', 'Chief', 'Metallic', 'Hornet', 'Other'];
export const riskCategories = ['I - Low', 'II - Normal', 'III - High', 'IV - Essential'];
export const roofLiveLoads = ['TBD', '0 psf', '12 psf', '20 psf Reducible', '20 psf', '40 psf and above'];
export const windLoads = ['TBD', '105 mph', '110 mph', '115 mph', '120 mph', '125 mph', '130 mph', '135 mph', '140 mph', '145 mph', '150 mph', '155 mph', '160 mph', '165 mph', '170 mph', '175 mph', '180 mph', '185 mph'];
export const closureTypes = ['TBD', 'Enclosed', 'Open', 'Partial'];
export const collateralLoads = ['TBD', '1.00 psf', '1.50 psf', '2.00 psf', '2.50 psf', '3.00 psf', '3.50 psf', '4.00 psf', '4.50 psf', '5.00 psf', '5.50 psf', '6.00 psf', '6.50 psf', '7.00 psf', '7.50 psf', '8.00 psf', '9.00 psf', '10.00 psf'];
export const windExposures = ['TBD', 'B', 'C', 'D'];

export const initialEstimate = {
  estimator: 'Seth McBride',
  quoteNumber: 'Q-2026-0001',
  projectName: 'Example Quote Record',
  projectAddress: '',
  customerCompany: 'ACME Corp',
  companyBiddingTo: 'ACME Corp',
  customerContact: '',
  customerPhone: '',
  billingAddress: '',
  billingEmail: '',
  payAppNeeded: 'TBD',
  referenceNumber: '',
  manufacturer: 'Whirlwind',
  quotePdfName: '',
  buildingCode: 'FBC 23 8th Edition',
  riskCategory: 'II - Normal',
  roofLiveLoad: 'TBD',
  windLoad: 'TBD',
  closureType: 'TBD',
  collateralLoad: 'TBD',
  windExposure: 'TBD',
  factoryMutual: 'N/A',
  paymentTerms: 'COD',
  projectNotes: '',
  buildingCost: 0,
  localTaxRate: 7.5,
  markupPercent: 18,
  freight: 0,
  engineering: 0,
  laborCost: 0,
  subcontractCost: 0,
  contingency: 0,
  squareFeet: 0,
  erectionPrice: 0,
  alternates: [
    { id: 'insulation', description: 'Insulation', cost: 0, feePercent: 0, taxPercent: 7.5, labor: 0 },
    { id: 'r19r13', description: 'R19/R13', cost: 0, feePercent: 0, taxPercent: 7.5, labor: 0 },
    { id: 'ohd', description: 'OHD', cost: 0, feePercent: 0, taxPercent: 7.5, labor: 0 },
    { id: 'standing-seam', description: 'Standing Seam Roof', cost: 0, feePercent: 0, taxPercent: 7.5, labor: 0 },
    { id: 'storefront', description: 'Storefront Glass', cost: 0, feePercent: 0, taxPercent: 7.5, labor: 0 },
    { id: 'windows', description: 'Windows', cost: 0, feePercent: 0, taxPercent: 7.5, labor: 0 },
    { id: 'curbs', description: 'Curbs and Roof Accessories', cost: 0, feePercent: 0, taxPercent: 7.5, labor: 0 },
    { id: 'rod-canopy', description: 'Rod Canopy', cost: 0, feePercent: 0, taxPercent: 7.5, labor: 0 },
    { id: 'foundation-drawings', description: 'Foundation Drawings', cost: 0, feePercent: 0, taxPercent: 7.5, labor: 0 },
  ],
};
