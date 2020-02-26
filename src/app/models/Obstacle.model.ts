import { ItemBase } from './ItemBase.model';

export class Obstacle extends ItemBase {

  constructor(id: string, positionX: number, positionY: number, direction: number) {

    super();

    this.id = id;
    this.positionX = positionX;
    this.positionY = positionY;
    this.direction = direction;
  }
};
