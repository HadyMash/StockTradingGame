/**
 * Game class
 * @param {string} id game id (string)
 * @param {GameSettings} settings game settings (GameSettings)
 * @param {Array<Player>} players array of players
 * @param {Object} stockStartIds object of stock start ids
 * @param {number} currentDay current day (number)
 * @param {GameState} state game state (GameState)
 */
export class Game {
  constructor(
    id,
    settings,
    players,
    stockStartIds,
    currentDay,
    state = GameState.waiting
  ) {
    this.id = id;
    this.state = state;
    this.settings = settings;
    this.stockStartIds = stockStartIds;
    this.currentDay = currentDay;
    this.players = players;
  }

  static generateId() {
    // TODO: generate random id
    let letters = 'abcdefghijklmnopqrstuvwxyz';
    let id = '';
    for (let i = 0; i < 5; i++) {
      id += letters[Math.floor(Math.random() * letters.length)];
      return id;
    }
  }

  toObject() {
    return {
      id: this.id,
      state: this.state,
      settings: this.settings,
      players: this.players,
      stockStartIds: this.stockStartIds,
      currentDay: this.currentDay,
    };
  }

  static fromObject(obj) {
    return Game(
      obj.id,
      obj.settings,
      obj.players,
      obj.stockStartIds,
      obj.currentDay,
      obj.state
    );
  }

  toJSON() {
    return JSON.stringify(this.toObject());
  }

  static fromJSON(json) {
    this.fromObject(JSON.parse(json));
  }
}

/**
 * GameSettings class
 * @param {number} maxGameTurns max game turns (number)
 * @param {number} roundDurationSeconds round duration in seconds (number)
 * @param {number} startingMoney starting money (number)
 * @param {number} targetMoney target money a player has to reach for the game to end (0 for turns only) (number)
 */
export class GameSettings {
  constructor(maxGameTurns, roundDurationSeconds, startingMoney, targetMoney) {
    this.maxGameTurns = maxGameTurns;
    this.roundDurationSeconds = roundDurationSeconds;
    this.startingMoney = startingMoney;
    this.targetMoney = targetMoney;
  }

  toObject() {
    return {
      maxGameTurns: this.maxGameTurns,
      roundDurationSeconds: this.roundDurationSeconds,
      targetMoney: this.targetMoney,
      startingMoney: this.startingMoney,
    };
  }

  static fromObject(obj) {
    return GameSettings(
      obj.maxGameTurns,
      obj.roundDurationSeconds,
      obj.startingMoney,
      obj.targetMoney
    );
  }

  toJSON() {
    return JSON.stringify(this.toObject());
  }

  static fromJSON(json) {
    this.fromObject(JSON.parse(json));
  }
}

/**
 * GameState enum
 * @property {string} waiting waiting for players
 * @property {string} active game is active
 * @property {string} finished game is finished
 */
export const GameState = {
  waiting: 'waiting',
  active: 'active',
  finished: 'finished',
};
