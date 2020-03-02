import { Utilities } from '../utils/utilities';

export class Fireball implements HasPosition {
  positionX: number;
  positionY: number;
  casterId: string;
  moveIntervalMs: number;
  isDestroyed: Boolean = false;
  id: string;
  direction: number;
  move: Function = Utilities.fourDirectionMoveFunction;

  constructor(id: string, casterId: string, positionX: number, positionY: number, direction: number, moveIntervalMs: number) {
    this.id = id;
    this.casterId = casterId;
    this.positionX = positionX;
    this.positionY = positionY;
    this.direction = direction;
    this.moveIntervalMs = moveIntervalMs;
  }
};
