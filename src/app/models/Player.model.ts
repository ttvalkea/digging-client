import { ItemBase } from './ItemBase.model';
import { MovementState } from '../enums/enums';
import { Constants } from '../constants/constants';

export class Player extends ItemBase {
  playerName: string;
  playerColor: string;
  hitPoints: number;
  takeDamage: Function = takeDamage;
  movementState: MovementState = MovementState.Stopped;
  movementIntervalMs: number = Constants.PLAYER_MOVEMENT_INTERVAL;
  score: number;
};

const takeDamage = (player: Player, amount: number, broadcastPlayerDataFunction: Function) => {
  if (player.hitPoints > 0) {
    player.hitPoints -= amount;

    if (player.hitPoints <= 0) {
      //Players are knocked out only for moment
      setTimeout(() => {
        player.hitPoints = Constants.PLAYER_STARTING_HIT_POINTS;

        //TODO: Add a short period of invincibility after being revived

        broadcastPlayerDataFunction(player);
      }, Constants.PLAYER_KNOCKOUT_DURATION_MS);
    }
    broadcastPlayerDataFunction(player);
  }
}
