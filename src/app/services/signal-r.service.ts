import { Injectable } from '@angular/core';
import * as signalR from "@aspnet/signalr";
import { environment } from '../../environments/environment';
import { Player } from '../models/Player.model';
import { Fireball } from '../models/Fireball.model';
import { Obstacle } from '../models/Obstacle.model';
import { OnCollisionAction } from '../enums/enums';
import { ItemBase } from '../models/ItemBase.model';
import { FireballHitPlayerData } from '../models/FireballHitPlayerData.model';
import { Utilities } from '../utils/utilities';
import { NewTagItem } from '../models/NewTagItem.model';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  public connectionAmount: number = 0;
  private hubConnection: signalR.HubConnection

  public players: Player[] = [];
  public fireballs: Fireball[] = [];
  public obstacles: Obstacle[] = [];
  public tagPlayerId: string; //Id of the player who is currently gaining victory points.
  public tagItem: NewTagItem;
  public winner: Player;

  public startConnection = () => {
    const isProductionEnvironment = environment.production;
    const serverBaseUrl = isProductionEnvironment ? 'https://tuomas-angular-combat-server.azurewebsites.net' : 'https://localhost:44342';//'https://localhost:5001';
    this.hubConnection = new signalR.HubConnectionBuilder()
                            .withUrl(serverBaseUrl + '/hub')
                            .build();

    this.hubConnection
      .start()
      .then(this.actionsAfterSignalRConnectionStarted)
      .catch(err => console.log('Error while starting connection: ' + err))
  }

  private actionsAfterSignalRConnectionStarted = () => {
    console.log('SignalR connection formed.');

    //TODO: Make a getGameState function with all the initial loading.
    //TODO: Add getWhoIsTag() there.
    this.broadcastGetObstacles(false);
    this.broadcastNewTagItemData();
  }

  public addBroadcastConnectionAmountDataListener = (playerInfoFunction: Function) => {
    this.hubConnection.on('broadcastconnectionamountdata', (data) => {
      this.connectionAmount = data;

      //This player receives other player's data when entering the game
      this.players = [];
      playerInfoFunction();
    })
  }

  public broadcastPlayerDataMessage = (message: Player) => {
    this.hubConnection.invoke('broadcastPlayerDataMessage', message)
    .catch(err => console.error(err));
  }

  public addBroadcastPlayerDataMessageListener = () => {
    this.hubConnection.on('broadcastPlayerDataMessage', (data: Player) => {
      this.updatePlayerData(data);
    })
  }

  public broadcastFireballHitPlayerMessage = (fireball: Fireball, player: Player) => {
    this.hubConnection.invoke('broadcastFireballHitPlayerMessage', fireball, player)
    .catch(err => console.error(err));
  }

  public addBroadcastFireballHitPlayerMessageListener = (listeningPlayer: Player) => {
    this.hubConnection.on('broadcastFireballHitPlayerMessage', (data: FireballHitPlayerData) => {
      this.fireballs = this.fireballs.filter(fireball => fireball.id !== data.fireballId);

      if (listeningPlayer.id === data.playerId) {
        listeningPlayer.takeDamage(listeningPlayer, 1, this.broadcastPlayerDataMessage);
      }
    })
  }

  // Updates a player's data if it's already in the players array or adds a new player
  private updatePlayerData = (playerData: Player) => {
    this.players = this.players.filter(player => player.id !== playerData.id);
    this.players.push(playerData);
  }

  public broadcastFireballDataMessage = (message: Fireball) => {
    this.hubConnection.invoke('broadcastFireballDataMessage', message)
    .catch(err => console.error(err));
  }

  private getFireballWithPlayersCollisions = (fireball: Fireball) => {
    const playersOtherThanCaster = this.players.filter(player => player.id !== fireball.casterId);
    Utilities.doItemCollision(fireball, playersOtherThanCaster, (collidedPlayer) => {
      this.broadcastFireballHitPlayerMessage(fireball, collidedPlayer);
      fireball.isDestroyed = true;
    });
  }

  public addBroadcastFireballDataMessageListener = (listeningPlayer: Player) => {
    this.hubConnection.on('broadcastFireballDataMessage', (fireball: Fireball) => {

      //Server can't return the move function, so it's reassigned here
      fireball.move = new ItemBase().move;
      this.fireballs.push(fireball);
      //Fireball's movement
      const interval = setInterval(() => {
        if (!fireball.isDestroyed) {
          fireball.move(fireball, fireball.direction, () => {}, OnCollisionAction.Destroy, this.obstacles);

          //Only the player, who cast the fireball, makes collision checks and broadcasts them to everyone
          if (fireball.casterId === listeningPlayer.id) {
            this.getFireballWithPlayersCollisions(fireball);
          }

          if (fireball.isDestroyed) {
            this.fireballs = this.fireballs.filter(x => x.id !== fireball.id);
          }
        } else {
          clearInterval(interval);
        }
      }, fireball.moveIntervalMs);
    })
  }

  public broadcastGetObstacles = (generateNewObstacles: boolean) => {
    this.hubConnection.invoke('broadcastGetObstacles', generateNewObstacles)
    .catch(err => console.error(err));
  }

  public addBroadcastGetObstaclesListener = (functionAfterSettingObstacles: Function) => {
    this.hubConnection.on('broadcastGetObstacles', (data: Obstacle[]) => {
      this.obstacles = data;
      functionAfterSettingObstacles();
    })
  }

  public addNewTagListener = () => {
    this.hubConnection.on('newTag', (newTagItem: NewTagItem) => {
      this.tagItem = newTagItem;
    })
  }

  public broadcastPlayerHitNewTagItem = (playerId: string) => {
    this.hubConnection.invoke('broadcastPlayerHitNewTagItem', playerId)
    .catch(err => console.error(err));
  }

  public addBroadcastPlayerBecomesTagListener = () => {
    this.hubConnection.on('broadcastPlayerBecomesTag', (playerId: string) => {
      this.tagPlayerId = playerId;
    })
  }

  public broadcastNewTagItemData = () => {
    this.hubConnection.invoke('broadcastNewTagItemData')
    .catch(err => console.error(err));
  }

  public broadcastPlayerWins = (message: Player) => {
    this.hubConnection.invoke('broadcastPlayerWins', message)
    .catch(err => console.error(err));
  }

  public addBroadcastPlayerWinsListener = () => {
    this.hubConnection.on('broadcastPlayerWins', (player: Player) => {
      this.winner = player;
    })
  }
}
