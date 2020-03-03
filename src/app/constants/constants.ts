export class Constants {
  public static POSITION_TO_DISPLAY_MULTIPLAYER: number = 50;
  public static REFRESHER_REFRESH_RATE_MS: number = 10;

  public static PLAYER_STARTING_HIT_POINTS: number = 5;
  public static PLAYER_STARTING_MANA: number = 100;
  public static PLAYER_ROTATE_ANGLE_AMOUNT: number = 90;
  public static PLAYER_MANA_REGENERATION_INTERVAL: number = 100;
  public static PLAYER_KNOCKOUT_DURATION_MS: number = 5000;

  public static PLAY_AREA_SIZE_X: number = 40;
  public static PLAY_AREA_SIZE_Y: number = 40;

  public static STARTING_POSITION_OFFSET_FROM_THE_CORNER: number = 2;

  public static VIEW_RADIUS: number = 5;
  public static VIEW_AREA_SIZE: number = Constants.VIEW_RADIUS * 2 + 1;

  public static FIREBALL_MOVEMENT_INTERVAL: number = 60;
  public static FIREBALL_MANA_COST: number = 50;

  public static DIGGING_MANA_COST: number = 1; //TODO: Increase for actual play
  public static SCORE_NEEDED_TO_WIN: number = 100;

  public static OBSTACLE_AMOUNT_MIN: number = 350;
  public static OBSTACLE_AMOUNT_MAX: number = 400;
  public static SOIL_TILE_AMOUNT_MIN: number = 100;
  public static SOIL_TILE_AMOUNT_MAX: number = 130;
}
