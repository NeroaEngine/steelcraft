import type { RegisteredRoom } from '../registry/room-registry';

export const steelCraftRoomRegistration: RegisteredRoom = Object.freeze({
  room_id: 'steelcraft-room',
  room_type: 'erp-runtime-room',
  manifest_path: 'rooms/steelcraft/steelcraft.manifest.json',
  sql_card_path: 'rooms/steelcraft/steelcraft.sql_card',
  worker_path: 'rooms/steelcraft/steelcraft.worker.ts',
  card_paths: Object.freeze([
    'rooms/steelcraft/cards/project-information-card.json',
    'rooms/steelcraft/cards/accounts-card.json',
    'rooms/steelcraft/cards/contacts-card.json',
    'rooms/steelcraft/cards/working-sheet-card.json',
    'rooms/steelcraft/cards/estimate-card.json',
    'rooms/steelcraft/cards/metal-building-generator-card.json',
    'rooms/steelcraft/cards/dynamic-door-card.json',
    'rooms/steelcraft/cards/fe-quotation-card.json',
    'rooms/steelcraft/cards/eo-quotation-card.json',
    'rooms/steelcraft/cards/project-delivery-card.json',
    'rooms/steelcraft/cards/erection-schedule-card.json',
    'rooms/steelcraft/cards/change-order-card.json',
    'rooms/steelcraft/cards/labor-sov-card.json',
    'rooms/steelcraft/cards/material-sov-card.json',
    'rooms/steelcraft/cards/invoice-card.json',
    'rooms/steelcraft/cards/coi-card.json'
  ]) as string[]
});

export function registerSteelCraftRoom(registry: { registerRoom: (room: RegisteredRoom) => RegisteredRoom }) {
  return registry.registerRoom(steelCraftRoomRegistration);
}
