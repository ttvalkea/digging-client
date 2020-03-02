export class Obstacle implements HasPosition {
  positionX: number;
  positionY: number;
  isVisible: boolean;

  constructor(positionX: number, positionY: number, isVisible: boolean = false) {
    this.positionX = positionX;
    this.positionY = positionY;
    this.isVisible = isVisible;
  }
};
