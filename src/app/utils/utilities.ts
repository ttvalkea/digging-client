
import { OnCollisionAction } from '../enums/enums';
import { Obstacle } from '../models/Obstacle.model';
import { Constants } from '../constants/constants';
import { Player } from '../models/Player.model';


export class Utilities {

  public static getItemDisplayPositionX = (player: Player, item: HasPosition) => {
    return item.positionX - player.positionX;
  }

  public static getItemDisplayPositionY = (player: Player, item: HasPosition) => {
    return item.positionY - player.positionY;
  }

  public static isItemInPlayersView = (player: Player, item: HasPosition) => {
    return Math.abs(item.positionX - player.positionX) <= Constants.VIEW_RADIUS && Math.abs(item.positionY - player.positionY) <= Constants.VIEW_RADIUS;
  }

  public static getItemsInPlayersView = (player: Player, items: HasPosition[]) => items.filter(item => Utilities.isItemInPlayersView(player, item));

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

  public static getRandomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

  public static areItemsColliding = (item1: HasPosition, item2: HasPosition) => {
    return item1.positionX === item2.positionX && item1.positionY === item2.positionY;
  }

  public static doItemCollision = (collidingItem: HasPosition, openSpaces: HasPosition[], itemsToCollideWith: HasPosition[], actionOnCollision: Function) => {
    if (itemsToCollideWith.some(item => collidingItem.positionX === item.positionX && collidingItem.positionY === item.positionY) || (!openSpaces.some(openSpace => collidingItem.positionX === openSpace.positionX && collidingItem.positionY === openSpace.positionY))) {
      actionOnCollision(itemsToCollideWith.find(item => collidingItem.positionX === item.positionX && collidingItem.positionY === item.positionY));
      return;
    }
  }

  public static fourDirectionMoveFunction = (mover, direction: number, postMovementAction: Function,
    onCollisionAction: OnCollisionAction = OnCollisionAction.Stop, emptySpaces: HasPosition[] = [], obstacles: Obstacle[] = [], actionIfMoved: Function = () => {}) => {
    mover.direction = direction;
    const xAndYIncrement = {
      x: 0,
      y: 0
    }
    switch (direction) {
      case 0: //Right
        xAndYIncrement.x = 1;
        break;
      case 90: //Down
        xAndYIncrement.y = 1;
        break;
      case 180: //Left
        xAndYIncrement.x = -1;
        break;
      case 270: //Up
        xAndYIncrement.y = -1;
        break;
      default:
        throw "Unsupported direction: " + direction;
    }
    mover.positionX += xAndYIncrement.x;
    mover.positionY += xAndYIncrement.y;

    // Mover collides
    let moverCollided = false;
    if (onCollisionAction === OnCollisionAction.Destroy) {
      Utilities.doItemCollision(mover, emptySpaces, obstacles, () => {
        mover.isDestroyed = true;
        moverCollided = true;
      });
    } else if (onCollisionAction === OnCollisionAction.Stop) {
      Utilities.doItemCollision(mover, emptySpaces, obstacles, () => {
        mover.positionX -= xAndYIncrement.x;
        mover.positionY -= xAndYIncrement.y;
        moverCollided = true;
      });
    }

    //Play area edge checks
    if ((mover.positionX + 1) > Constants.PLAY_AREA_SIZE_X) {
      if (onCollisionAction === OnCollisionAction.Destroy) {
        mover.isDestroyed = true;
      } else if (onCollisionAction === OnCollisionAction.Stop) {
        mover.positionX = Constants.PLAY_AREA_SIZE_X - 1;
      }
      moverCollided = true;
    } else if (mover.positionX < 0) {
      if (onCollisionAction === OnCollisionAction.Destroy) {
        mover.isDestroyed = true;
      } else if (onCollisionAction === OnCollisionAction.Stop) {
        mover.positionX = 0;
      }
      moverCollided = true;
    }
    if ((mover.positionY + 1) > Constants.PLAY_AREA_SIZE_Y) {
      if (onCollisionAction === OnCollisionAction.Destroy) {
        mover.isDestroyed = true;
      } else if (onCollisionAction === OnCollisionAction.Stop) {
        mover.positionY = Constants.PLAY_AREA_SIZE_Y - 1;
      }
      moverCollided = true;
    } else if (mover.positionY < 0) {
      if (onCollisionAction === OnCollisionAction.Destroy) {
        mover.isDestroyed = true;
      } else if (onCollisionAction === OnCollisionAction.Stop) {
        mover.positionY = 0;
      }
      moverCollided = true;
    }

    if (!moverCollided) {
      actionIfMoved();
    }
    postMovementAction();
  }
}
