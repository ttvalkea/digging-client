import { Injectable } from '@angular/core';
import * as signalR from "@aspnet/signalr";
import { environment } from '../../environments/environment';
import { Player } from '../models/Player.model';
import { Fireball } from '../models/Fireball.model';
import { Obstacle } from '../models/Obstacle.model';
import { OnCollisionAction, TerrainType } from '../enums/enums';
import { FireballHitPlayerData } from '../models/FireballHitPlayerData.model';
import { Utilities } from '../utils/utilities';
import { TerrainInfo } from '../models/TerrainInfo.model';
import { MapInfo } from '../models/MapInfo.model';
import { SoilInfo } from '../models/SoilInfo.model';
import { Coordinate } from '../models/Coordinate.model';
import { PlayerGotPoints } from '../models/PlayerGotPoints.model';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  public connectionAmount: number = 0;
  private hubConnection: signalR.HubConnection

  public players: Player[] = [];
  public fireballs: Fireball[] = [];
  public obstacles: Obstacle[] = [];
  public soilTiles: SoilInfo[] = [];
  public emptySpaces: Coordinate[] = [];
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
    this.broadcastMapInfo(false);
  }

  public broadcastMapInfo = (generateNewMap: boolean, mapSizeX: number = null, mapSizeY: number = null, obstacleAmountMin: number = null, obstacleAmountMax: number = null, soilAmountMin: number = null, soilAmountMax: number = null) => {
    this.hubConnection.invoke('broadcastMapInfo', generateNewMap, mapSizeX, mapSizeY, obstacleAmountMin, obstacleAmountMax, soilAmountMin, soilAmountMax)
    .catch(err => console.error(err));
  }

  public addBroadcastMapInfoListener = (postMapInfoSettingFunction: Function) => {
    this.hubConnection.on('broadcastMapInfo', (data: MapInfo) => {
      this.setMapInfo(data);
      postMapInfoSettingFunction();
    })
  }

  private setMapInfo(mapInfo: MapInfo) {
    this.obstacles = mapInfo.obstacles;
    this.emptySpaces = mapInfo.emptySpaces;
    this.soilTiles = mapInfo.soilTiles;

    console.log(this.obstacles, this.soilTiles)
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
    Utilities.doItemCollision(fireball, this.emptySpaces, playersOtherThanCaster, (collidedPlayer) => {
      if (collidedPlayer) {
        this.broadcastFireballHitPlayerMessage(fireball, collidedPlayer);
      }
      fireball.isDestroyed = true;
    });
  }

  public addBroadcastFireballDataMessageListener = (listeningPlayer: Player) => {
    this.hubConnection.on('broadcastFireballDataMessage', (fireball: Fireball) => {

      //Server can't return the move function, so it's reassigned here
      fireball.move = Utilities.fourDirectionMoveFunction;
      this.fireballs.push(fireball);
      //Fireball's movement
      const interval = setInterval(() => {
        if (!fireball.isDestroyed) {
          fireball.move(fireball, fireball.direction, () => {}, OnCollisionAction.Destroy, this.emptySpaces, this.obstacles);

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

  public addBroadcastGetObstaclesListener = () => {
    this.hubConnection.on('broadcastGetObstacles', (obstacles: Obstacle[]) => {
      this.obstacles = obstacles;
    })
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

  public getOtherPlayers = (playerId: string) => this.players.filter(player => player.id !== playerId);

  public getVisibleObstacles = () => this.obstacles.filter(obstacle => obstacle.isVisible);

  public broadcastDigMessage = (positionX: number, positionY: number) => {
    this.hubConnection.invoke('broadcastDigMessage', positionX, positionY)
    .catch(err => console.error(err));
  }

  public addBroadcastDigMessageListener = () => {
    this.hubConnection.on('broadcastDigMessage', (terrainInfo: TerrainInfo) => {
      if (terrainInfo.terrainType === TerrainType.Empty && !this.emptySpaces.some(emptySpace => emptySpace.positionX === terrainInfo.positionX && emptySpace.positionY === terrainInfo.positionY)) {
        this.emptySpaces.push(new Coordinate(terrainInfo.positionX, terrainInfo.positionY));
      } else if (terrainInfo.terrainType === TerrainType.Obstacle) {
        // If the dug space has an obstacle, reveal that obstacle for the players
        this.obstacles.find(obstacle => obstacle.positionX === terrainInfo.positionX && obstacle.positionY === terrainInfo.positionY).isVisible = true;
      }
    })
  }

  //TODO: Refactor game state to its own class and have only signalR invocations here

  public getTileSoilLevelAndFruitStatus = (coordinate: Coordinate) => {
    const soilTile = this.soilTiles.find(soilTile => soilTile.positionX === coordinate.positionX && soilTile.positionY === coordinate.positionY);
    return soilTile ? { soilLevel: soilTile.soilLevel, hasFruit: soilTile.hasFruit } : { soilLevel: 0, hasFruit: false };
  }

  public addFruitInfoListener = () => {
    this.hubConnection.on('fruitInfo', (soilTiles: SoilInfo[]) => {
      console.log(soilTiles)
      soilTiles.forEach(soilTile => {
        this.soilTiles.find(tile => tile.positionX === soilTile.positionX && tile.positionY === soilTile.positionY).hasFruit = soilTile.hasFruit;
      });
    })
  }

  public broadcastPlayerHitFruit = (soilTile: SoilInfo, playerId: string) => {
    this.hubConnection.invoke('broadcastPlayerHitFruit', soilTile.positionX, soilTile.positionY, playerId)
    .catch(err => console.error(err));
  }

  public addPlayerGotPointsListener = (player: Player) => {
    this.hubConnection.on('playerGotPoints', (playerGotPoints: PlayerGotPoints) => {
      if (player.id === playerGotPoints.playerId) {
        player.score += playerGotPoints.amount;
      }
    })
  }
}
