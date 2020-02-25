import { Utilities } from '../utils/utilities';

export class ItemBase {
  id: string;
  positionX: number;
  positionY: number;
  direction: number;
  sizeX: number;
  sizeY: number;
  move: Function = Utilities.angledMoveFunction;
};

