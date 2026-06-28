export type ComponentCategory =
  | 'structural'
  | 'roof'
  | 'wall'
  | 'door'
  | 'window'
  | 'accessory'
  | 'color'
  | 'vendor-catalog';

export type SteelCraftComponent = {
  id: string;
  category: ComponentCategory;
  name: string;
  description: string;
  vendor?: string;
  estimateBucket: string;
  mbsExportable: boolean;
  modelRenderable: boolean;
};

export const steelCraftComponents: SteelCraftComponent[] = [
  { id: 'frames', category: 'structural', name: 'Frames', description: 'Primary frame lines from the building model.', estimateBucket: 'Structural', mbsExportable: true, modelRenderable: true },
  { id: 'columns', category: 'structural', name: 'Columns', description: 'Column locations and heights.', estimateBucket: 'Structural', mbsExportable: true, modelRenderable: true },
  { id: 'girts', category: 'structural', name: 'Girts', description: 'Wall secondary framing.', estimateBucket: 'Structural', mbsExportable: true, modelRenderable: true },
  { id: 'purlins', category: 'structural', name: 'Purlins', description: 'Roof secondary framing.', estimateBucket: 'Structural', mbsExportable: true, modelRenderable: true },
  { id: 'bracing', category: 'structural', name: 'Bracing', description: 'Rod, cable, or portal bracing zones.', estimateBucket: 'Structural', mbsExportable: true, modelRenderable: true },
  { id: 'roof-panels', category: 'roof', name: 'Roof Panels', description: 'Standard roof panel system.', estimateBucket: 'Roof', mbsExportable: true, modelRenderable: true },
  { id: 'standing-seam', category: 'roof', name: 'Standing Seam Roof', description: 'Standing seam roof upgrade option.', estimateBucket: 'Alternate', mbsExportable: true, modelRenderable: true },
  { id: 'gutters-downspouts', category: 'roof', name: 'Gutters and Downspouts', description: 'Gutter and downspout package.', estimateBucket: 'Roof Accessories', mbsExportable: true, modelRenderable: true },
  { id: 'wall-panels', category: 'wall', name: 'Wall Panels', description: 'Exterior wall panel system.', estimateBucket: 'Wall', mbsExportable: true, modelRenderable: true },
  { id: 'wainscot', category: 'wall', name: 'Wainscot', description: 'Wainscot panel band.', estimateBucket: 'Wall', mbsExportable: true, modelRenderable: true },
  { id: 'insulation', category: 'wall', name: 'Insulation', description: 'Roof and wall insulation package.', estimateBucket: 'Alternate', mbsExportable: true, modelRenderable: false },
  { id: 'roll-up-door', category: 'door', name: 'Roll-Up Door', description: 'Roll-up door from vendor catalog.', vendor: 'Dynamic Door', estimateBucket: 'Door', mbsExportable: true, modelRenderable: true },
  { id: 'walk-door', category: 'door', name: 'Walk Door', description: 'Personnel door package.', estimateBucket: 'Door', mbsExportable: true, modelRenderable: true },
  { id: 'sectional-door', category: 'door', name: 'Sectional Door', description: 'Sectional overhead door package.', estimateBucket: 'Door', mbsExportable: true, modelRenderable: true },
  { id: 'storefront-glass', category: 'window', name: 'Storefront Glass', description: 'Storefront glass system.', estimateBucket: 'Alternate', mbsExportable: false, modelRenderable: true },
  { id: 'windows', category: 'window', name: 'Windows', description: 'Window openings and trim.', estimateBucket: 'Alternate', mbsExportable: true, modelRenderable: true },
  { id: 'louvers', category: 'accessory', name: 'Louvers', description: 'Wall louver accessories.', estimateBucket: 'Accessory', mbsExportable: true, modelRenderable: true },
  { id: 'roof-curbs', category: 'accessory', name: 'Roof Curbs', description: 'Roof curb package.', estimateBucket: 'Alternate', mbsExportable: true, modelRenderable: true },
  { id: 'exhaust-fans', category: 'accessory', name: 'Exhaust Fans', description: 'Roof or wall exhaust fan package.', estimateBucket: 'Alternate', mbsExportable: false, modelRenderable: true },
  { id: 'canopies', category: 'accessory', name: 'Canopies', description: 'Rod canopy or framed canopy package.', estimateBucket: 'Alternate', mbsExportable: true, modelRenderable: true },
  { id: 'roof-color', category: 'color', name: 'Roof Color', description: 'Roof panel finish color.', estimateBucket: 'Color', mbsExportable: true, modelRenderable: true },
  { id: 'wall-color', category: 'color', name: 'Wall Color', description: 'Wall panel finish color.', estimateBucket: 'Color', mbsExportable: true, modelRenderable: true },
  { id: 'trim-color', category: 'color', name: 'Trim Color', description: 'Trim finish color.', estimateBucket: 'Color', mbsExportable: true, modelRenderable: true },
];

export function getSteelCraftComponents(): SteelCraftComponent[] {
  return steelCraftComponents;
}

export function getModelRenderableComponents(): SteelCraftComponent[] {
  return steelCraftComponents.filter((component) => component.modelRenderable);
}
