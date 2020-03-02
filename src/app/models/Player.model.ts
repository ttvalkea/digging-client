import { Constants } from '../constants/constants';
import { Utilities } from '../utils/utilities';

export class Player implements HasPosition {
  positionX: number;
  positionY: number;
  playerName: string;
  playerColor: string;
  hitPoints: number;
  takeDamage: Function = takeDamage;
  score: number;
  id: string;
  direction: number;
  move: Function = Utilities.fourDirectionMoveFunction;
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
