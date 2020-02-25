import { ItemBase } from './ItemBase.model';

export class Obstacle extends ItemBase {

  constructor(id: string, positionX: number, positionY: number, direction: number, sizeX: number, sizeY: number) {

    super();

    this.id = id;
    this.positionX = positionX;
    this.positionY = positionY;
    this.direction = direction;
    this.sizeX = sizeX;
    this.sizeY = sizeY;
  }
};
