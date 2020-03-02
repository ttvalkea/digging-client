import { Coordinate } from './Coordinate.model';
import { Obstacle } from './Obstacle.model';
import { SoilInfo } from './SoilInfo.model';

export class MapInfo {
  emptySpaces: Coordinate[];
  obstacles: Obstacle[];
  soilTiles: SoilInfo[];
};
