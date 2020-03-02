import { TerrainType } from '../enums/enums';

export class TerrainInfo implements HasPosition {
  positionX: number;
  positionY: number;
  terrainType: TerrainType;
};
