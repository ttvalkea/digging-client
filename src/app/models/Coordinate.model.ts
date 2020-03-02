export class Coordinate implements HasPosition {
  positionX: number;
  positionY: number;


  constructor(positionX: number, positionY: number) {
    this.positionX = positionX;
    this.positionY = positionY;
  }
};
