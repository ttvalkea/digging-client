
import { ItemBase } from '../models/ItemBase.model';
import { OnCollisionAction } from '../enums/enums';
import { Obstacle } from '../models/Obstacle.model';
import { Constants } from '../constants/constants';


export class Utilities {

  public static getRandomPlayerColor = () => {
    const colorNumber = Utilities.getRandomNumber(1, 18);
    switch (colorNumber) {
      case 1:
        return "red";
      case 2:
        return "dodgerblue";
      case 3:
        return "burlywood";
      case 4:
        return "cyan";
      case 5:
        return "lightseagreen";
      case 6:
        return "magenta";
      case 7:
        return "violet";
      case 8:
        return "silver";
      case 9:
        return "orange";
      case 10:
        return "mediumslateblue";
      case 11:
        return "olive";
      case 12:
        return "turquoise";
      case 13:
        return "lightcoral";
      case 14:
        return "deeppink";
      case 15:
        return "gold";
      case 16:
        return "greenyellow";
      case 17:
        return "palegreen";
      case 18:
        return "lightskyblue";
    }
  }

  public static generateId = (prefix: string = "") => {
    return prefix + Date.now() + Utilities.getRandomNumber(0, 1000).toString();
  }

  public static getRandomNumber = (min: number, max: number) => Math.floor((Math.random() * max) + min);

  public static areItemsColliding = (item1: ItemBase, item2: ItemBase) => {
    return  Math.abs((item1.positionX + item1.sizeX/2) - (item2.positionX + item2.sizeX/2)) < (item1.sizeX+item2.sizeX)/2 &&
            Math.abs((item1.positionY + item1.sizeY/2) - (item2.positionY + item2.sizeY/2)) < (item1.sizeY+item2.sizeY)/2;
  }

  public static doItemCollision = (collidingItem: ItemBase, itemsToCollideWith: ItemBase[], actionOnCollision: Function) => {
    for (let i = 0; i < itemsToCollideWith.length; i++) {
      const collision = Utilities.areItemsColliding(collidingItem, itemsToCollideWith[i]);
      if (collision) {
        actionOnCollision(itemsToCollideWith[i]);
        return;
      }
    }
  }

  private static convertAngleToRadians = (angle) => angle * (Math.PI / 180);
  public static getXAndYIncrementsByAngle = (angle: number) => {
    const angleInRadians = Utilities.convertAngleToRadians(angle);
    return {
      x: Math.cos(angleInRadians),
      y: Math.sin(angleInRadians)
    }
  }

  public static angledMoveFunction = (mover, direction: number, postMovementAction: Function, onCollisionAction: OnCollisionAction = OnCollisionAction.Stop, obstacles: Obstacle[] = []) => {

    mover.direction = direction;
    const xAndYIncrement = Utilities.getXAndYIncrementsByAngle(direction);

    if (onCollisionAction === OnCollisionAction.Destroy) {
      mover.positionX += xAndYIncrement.x;
      mover.positionY += xAndYIncrement.y;
      Utilities.doItemCollision(mover, obstacles, () => {
        mover.isDestroyed = true;
      });
    } else if (onCollisionAction === OnCollisionAction.Stop) {
      //For stopping objects, movement is done in two parts to have the object "slide" along an obstacle instead of stopping fully if colliding even a little bit.
      mover.positionX += xAndYIncrement.x;
      Utilities.doItemCollision(mover, obstacles, () => {
        mover.positionX -= xAndYIncrement.x;
      });

      mover.positionY += xAndYIncrement.y;
      Utilities.doItemCollision(mover, obstacles, () => {
        mover.positionY -= xAndYIncrement.y;
      });
    }

    //Play area edge checks
    if ((mover.positionX + mover.sizeX) > Constants.PLAY_AREA_SIZE_X) {
      if (onCollisionAction === OnCollisionAction.Destroy) {
        mover.isDestroyed = true;
      } else if (onCollisionAction === OnCollisionAction.Stop) {
        mover.positionX = Constants.PLAY_AREA_SIZE_X - mover.sizeX;
      }
    } else if (mover.positionX < 0) {
      if (onCollisionAction === OnCollisionAction.Destroy) {
        mover.isDestroyed = true;
      } else if (onCollisionAction === OnCollisionAction.Stop) {
        mover.positionX = 0;
      }
    }
    if ((mover.positionY + mover.sizeY) > Constants.PLAY_AREA_SIZE_Y) {
      if (onCollisionAction === OnCollisionAction.Destroy) {
        mover.isDestroyed = true;
      } else if (onCollisionAction === OnCollisionAction.Stop) {
        mover.positionY = Constants.PLAY_AREA_SIZE_Y - mover.sizeY;
      }
    } else if (mover.positionY < 0) {
      if (onCollisionAction === OnCollisionAction.Destroy) {
        mover.isDestroyed = true;
      } else if (onCollisionAction === OnCollisionAction.Stop) {
        mover.positionY = 0;
      }
    }
    postMovementAction();
  }
}
