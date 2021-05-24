import { Component, OnInit, HostListener } from '@angular/core';
import { SignalRService } from './services/signal-r.service';
import { HttpClient } from '@angular/common/http';
import { environment } from './../environments/environment';
import { Player } from './models/Player.model';
import { Fireball } from './models/Fireball.model';
import { Constants } from './constants/constants';
import { Utilities } from './utils/utilities';
import { OnCollisionAction } from './enums/enums';
import { Obstacle } from './models/Obstacle.model';
import { SoilInfo } from './models/SoilInfo.model';


//TODO: Refactor different entities into their own files (Player etc)

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  public clientPlayer: Player = new Player();
  public manaAmount: number = Constants.PLAYER_STARTING_MANA;

  public refresher: number = 1; //This will just flick between 1 and -1 indefinitely, ensuring DOM refreshing.
  public constants = Constants; //This is declared for Angular template to have access to constants
  public utilities = Utilities; //This is declared for Angular template to have access to utilities

  public showInstructions: boolean = true;
  public hasPlayerStartingPositionBeenSet: boolean = false;

  public playAreaBorderObstacles: Obstacle[];

  constructor(public signalRService: SignalRService, private http: HttpClient) {
    this.clientPlayer.id = Utilities.generateId();
    this.clientPlayer.playerName = 'A';
    this.clientPlayer.playerColor = Utilities.getRandomPlayerColor();
    this.clientPlayer.hitPoints = Constants.PLAYER_STARTING_HIT_POINTS;
    this.clientPlayer.direction = 0;
    this.clientPlayer.score = 0;
    this.clientPlayer.positionX = 0;
    this.clientPlayer.positionY = 0;

    this.playAreaBorderObstacles = this.getPlayAreaBorderObstacles();
  }

  ngOnInit() {
    this.signalRService.startConnection();

    this.signalRService.addBroadcastConnectionAmountDataListener(this.broadcastPlayerData);
    this.signalRService.addBroadcastPlayerDataMessageListener();
    this.signalRService.addBroadcastGetObstaclesListener();
    this.signalRService.addBroadcastFireballDataMessageListener(this.clientPlayer);
    this.signalRService.addBroadcastFireballHitPlayerMessageListener(this.clientPlayer);
    this.signalRService.addBroadcastPlayerWinsListener();
    this.signalRService.addBroadcastDigMessageListener();
    this.signalRService.addFruitInfoListener();
    this.signalRService.addPlayerGotPointsListener(this.clientPlayer);

    this.signalRService.addBroadcastMapInfoListener(this.setStartingPosition)

    this.startHttpRequest();

    //Refresher makes sure that clients update dom all the time
    setInterval(() => {this.refresher=this.refresher*-1}, Constants.REFRESHER_REFRESH_RATE_MS);

    //Player's mana regeneration
    setInterval(() => { if (this.manaAmount < Constants.PLAYER_STARTING_MANA) this.manaAmount++; }, Constants.PLAYER_MANA_REGENERATION_INTERVAL);
  }

  private startHttpRequest = () => {
    const isProductionEnvironment = environment.production;
    const serverBaseUrl = isProductionEnvironment ? 'https://tuomas-angular-combat-server.azurewebsites.net/api' : 'http://localhost:5000/api'; // If the connection doesn't work right away, maybe try one of these: 'https://localhost:44342/api'; //'https://localhost:5001/api';
    this.http.get(serverBaseUrl + '/hub')
      .subscribe(res => {
        console.log(res);
      })
  }

  private getPlayAreaBorderObstacles = () => {
    const obstacles = [];
    for (let i=0; i<Constants.PLAY_AREA_SIZE_X+2; i++) {
      obstacles.push(new Obstacle(i-1, -1));
      obstacles.push(new Obstacle(i-1, Constants.PLAY_AREA_SIZE_Y));
    }
    for (let i=0; i<Constants.PLAY_AREA_SIZE_Y+2; i++) {
      obstacles.push(new Obstacle(-1, i-1));
      obstacles.push(new Obstacle(Constants.PLAY_AREA_SIZE_X, i-1));
    }
    return obstacles;
  }

  public setStartingPosition = () => {
    if (!this.hasPlayerStartingPositionBeenSet) {
      //Randomly spawn into any of the four corners but not into one where another player is already in
      let isPositionOk: boolean = false;
      let corner: number = Utilities.getRandomNumber(0, 3);
      let cornersAttempted: number = 0;
      while (!isPositionOk && cornersAttempted < 4) {
        switch (corner) {
          case 0: //Top left
            this.clientPlayer.positionX = Constants.STARTING_POSITION_OFFSET_FROM_THE_CORNER;
            this.clientPlayer.positionY = Constants.STARTING_POSITION_OFFSET_FROM_THE_CORNER;
            break;
          case 1: //Top right
            this.clientPlayer.positionX = Constants.PLAY_AREA_SIZE_X-Constants.STARTING_POSITION_OFFSET_FROM_THE_CORNER-1;
            this.clientPlayer.positionY = Constants.STARTING_POSITION_OFFSET_FROM_THE_CORNER;
            break;
          case 2: //Bottom right
            this.clientPlayer.positionX = Constants.PLAY_AREA_SIZE_X-Constants.STARTING_POSITION_OFFSET_FROM_THE_CORNER-1;
            this.clientPlayer.positionY = Constants.PLAY_AREA_SIZE_Y-Constants.STARTING_POSITION_OFFSET_FROM_THE_CORNER-1;
            break;
          case 3: //Bottom left
            this.clientPlayer.positionX = Constants.STARTING_POSITION_OFFSET_FROM_THE_CORNER
            this.clientPlayer.positionY = Constants.PLAY_AREA_SIZE_Y-Constants.STARTING_POSITION_OFFSET_FROM_THE_CORNER-1;
            break;
        }
        //No other player in this position
        if (!this.signalRService.players.some(player => player.id !== this.clientPlayer.id && player.positionX === this.clientPlayer.positionX && player.positionY === this.clientPlayer.positionY)) {
          isPositionOk = true;
        } else {
          cornersAttempted++;
          corner = (corner+1)%4;
        }
      }
      //All four corners are in use. Spawn in a completely random position
      if (!isPositionOk) {
        this.clientPlayer.positionX = Utilities.getRandomNumber(0, Constants.PLAY_AREA_SIZE_X - 1);
        this.clientPlayer.positionY = Utilities.getRandomNumber(0, Constants.PLAY_AREA_SIZE_Y - 1);
        isPositionOk = true;
      }

      //Create an empty space underneath the player
      this.signalRService.broadcastDigMessage(this.clientPlayer.positionX, this.clientPlayer.positionY);

      this.broadcastPlayerData();
      this.hasPlayerStartingPositionBeenSet = true;
    }
  }

  public broadcastPlayerData = () => {
    this.signalRService.broadcastPlayerDataMessage(this.clientPlayer);
  }

  public cast = () => {
    if (this.clientPlayer.hitPoints > 0 && this.manaAmount >= Constants.FIREBALL_MANA_COST && !this.signalRService.winner) {
      this.manaAmount -= Constants.FIREBALL_MANA_COST;
      this.signalRService.broadcastFireballDataMessage(new Fireball(
        Utilities.generateId(),
        this.clientPlayer.id,
        this.clientPlayer.positionX,
        this.clientPlayer.positionY,
        this.clientPlayer.direction,
        Constants.FIREBALL_MOVEMENT_INTERVAL
      ));
    }
  }

  //Keyboard actions
  @HostListener("window:keydown", ['$event'])
  onKeyDown(event:KeyboardEvent) {
    switch (event.key) {
      case "ArrowUp":
        this.clientPlayer.direction = 270;
        this.go();
        break;
      case "ArrowDown":
        this.clientPlayer.direction = 90;
        this.go();
        break;
      case "ArrowLeft":
        this.clientPlayer.direction = 180;
        this.go();
        break;
      case "ArrowRight":
        this.clientPlayer.direction = 0;
        this.go();
        break;
      case "Control":
        this.cast();
        break;
      case "Shift":
        this.dig();
        break;
      default:
        break;
      }
  }

  go = () => {
    if (this.clientPlayer.hitPoints > 0 && !this.signalRService.winner) {
      this.clientPlayer.move(this.clientPlayer, this.clientPlayer.direction, this.postMovementAction, OnCollisionAction.Stop, this.signalRService.emptySpaces, this.signalRService.obstacles, () => { this.manaAmount = 0; });
    }
  }

  dig = () => {
    if (this.manaAmount > Constants.DIGGING_MANA_COST && this.clientPlayer.hitPoints > 0 && !this.signalRService.winner) {
      const xAndYIncrement = {
        x: 0,
        y: 0
      }
      switch (this.clientPlayer.direction) {
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
          throw "Unsupported direction: " + this.clientPlayer.direction;
      }
      this.signalRService.broadcastDigMessage(this.clientPlayer.positionX + xAndYIncrement.x, this.clientPlayer.positionY + xAndYIncrement.y);
      this.manaAmount -= Constants.DIGGING_MANA_COST;
    }
  }

  postMovementAction = () => {
    this.checkForCollisionWithFruit();
    this.broadcastPlayerData();
  }

  checkForCollisionWithFruit = () => {
    Utilities.doItemCollision(
      this.clientPlayer,
      this.signalRService.emptySpaces,
      this.signalRService.soilTiles.filter(soilTile => soilTile.hasFruit),
      (soilTile: SoilInfo) => { this.signalRService.broadcastPlayerHitFruit(soilTile, this.clientPlayer.id); });
  }
}
