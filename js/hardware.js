
import { buildExternalSystems } from "./systems/externalSystem.js";
import { buildMagnetSystems } from "./systems/magnetSystem.js";
import { buildGradientSystems } from "./systems/gradientSystem.js";
import { buildRFSystems } from "./systems/rfSystem.js";
import { buildElectronicsSystems } from "./systems/electronicsSystem.js";
import { buildRoomSystems } from "./systems/roomSystem.js";

export function buildAllHardware(M) {
  return [
    ...buildExternalSystems(M),
    ...buildMagnetSystems(M),
    ...buildGradientSystems(M),
    ...buildRFSystems(M),
    ...buildElectronicsSystems(M),
    ...buildRoomSystems(M),
  ];
}
