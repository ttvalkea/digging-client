import { SoilLevel } from '../enums/enums';
import { Coordinate } from './Coordinate.model';

export class SoilInfo {
  soilLevel: SoilLevel;
  coordinate: Coordinate;
  hasFruit: boolean = false;
};
