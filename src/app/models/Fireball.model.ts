import { ItemBase } from './ItemBase.model';

export class Fireball extends ItemBase {
  casterId: string;
  moveIntervalMs: number;
  isDestroyed: Boolean = false;

  constructor(id: string, casterId: string, positionX: number, positionY: number, direction: number, moveIntervalMs: number, sizeX: number, sizeY: number) {

    super();

    this.id = id;
    this.casterId = casterId;
    this.positionX = positionX;
    this.positionY = positionY;
    this.direction = direction;
    this.moveIntervalMs = moveIntervalMs;
    this.sizeX = sizeX;
    this.sizeY = sizeY;
  }
};
