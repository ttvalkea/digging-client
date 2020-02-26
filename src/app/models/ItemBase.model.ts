import { Utilities } from '../utils/utilities';

export class ItemBase {
  id: string;
  positionX: number;
  positionY: number;
  direction: number;
  move: Function = Utilities.fourDirectionMoveFunction;
};

