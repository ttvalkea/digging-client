import { Coordinate } from './Coordinate.model';
import { Obstacle } from './Obstacle.model';
import { SoilInfo } from './SoilInfo';

export class MapInfo {
  emptySpaces: Coordinate[];
  obstacles: Obstacle[];
  soilTiles: SoilInfo[];
};
