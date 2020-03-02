import { SoilLevel } from '../enums/enums';

export class SoilInfo implements HasPosition {
  positionX: number;
  positionY: number;
  soilLevel: SoilLevel;
  hasFruit: boolean = false;
};
