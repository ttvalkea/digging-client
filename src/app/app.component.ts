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
    this.signalRService.addBroadcastFireballDataMessageListener(this.clientPlayer);
    this.signalRService.addBroadcastFireballHitPlayerMessageListener(this.clientPlayer);
    this.signalRService.addBroadcastGetObstaclesListener(() => {});//TODO: this.setStartingPosition);
    this.signalRService.addBroadcastGetEmptySpacesListener();
    this.signalRService.addBroadcastPlayerWinsListener();
    this.signalRService.addBroadcastDigMessageListener();

    this.startHttpRequest();

    //Refresher makes sure that clients update dom all the time
    setInterval(() => {this.refresher=this.refresher*-1}, Constants.REFRESHER_REFRESH_RATE_MS);

    //Player's mana regeneration
    setInterval(() => { if (this.manaAmount < Constants.PLAYER_STARTING_MANA) this.manaAmount++; }, Constants.PLAYER_MANA_REGENERATION_INTERVAL);
  }

  private startHttpRequest = () => {
    const isProductionEnvironment = environment.production;
    const serverBaseUrl = isProductionEnvironment ? 'https://tuomas-angular-combat-server.azurewebsites.net/api' : 'https://localhost:44342/api'; //'https://localhost:5001/api';
    this.http.get(serverBaseUrl + '/hub')
      .subscribe(res => {
        console.log(res);
      })
  }

  private getPlayAreaBorderObstacles = () => {
    const obstacles = [];
    for (let i=0; i<Constants.PLAY_AREA_SIZE_X+2; i++) {
      obstacles.push(new Obstacle('', i-1, -1, 0));
      obstacles.push(new Obstacle('', i-1, Constants.PLAY_AREA_SIZE_Y, 0));
    }
    for (let i=0; i<Constants.PLAY_AREA_SIZE_Y+2; i++) {
      obstacles.push(new Obstacle('', -1, i-1, 0));
      obstacles.push(new Obstacle('', Constants.PLAY_AREA_SIZE_X, i-1, 0));
    }
    return obstacles;
  }

  //TODO:
  // public setStartingPosition = () => {
  //   if (!this.hasPlayerStartingPositionBeenSet) {
  //     let isPositionOk = false;

  //     while (!isPositionOk) {
  //       this.clientPlayer.positionX = Utilities.getRandomNumber(0, Constants.PLAY_AREA_SIZE_X - 1);
  //       this.clientPlayer.positionY = Utilities.getRandomNumber(0, Constants.PLAY_AREA_SIZE_Y - 1);
  //       isPositionOk = true;
  //       Utilities.doItemCollision(this.clientPlayer, this.signalRService.obstacles, () => {
  //         isPositionOk = false;
  //       });
  //     }
  //     this.broadcastPlayerData();
  //     this.hasPlayerStartingPositionBeenSet = true;
  //   }
  // }

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
      this.clientPlayer.move(this.clientPlayer, this.clientPlayer.direction, this.postMovementAction, OnCollisionAction.Stop, this.signalRService.emptySpaces, this.signalRService.obstacles);
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
    this.broadcastPlayerData();
  }
}
