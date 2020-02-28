import { ItemBase } from './ItemBase.model';

export class Obstacle extends ItemBase {
  isVisible: boolean;

  constructor(id: string, positionX: number, positionY: number, direction: number, isVisible: boolean = false) {

    super();

    this.id = id;
    this.positionX = positionX;
    this.positionY = positionY;
    this.direction = direction;
    this.isVisible = isVisible;
  }
};
