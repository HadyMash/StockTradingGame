/**
 * Game class
 * @param {string} id game id (string)
 * @param {string} hostId host id (string)
 * @param {GameSettings} settings game settings (GameSettings)
 * @param {Object<string, Player>} players object of players (Object<string, Player>)
 * @param {Object} stockStartIds object of stock start ids
 * @param {number} startTimestamp current day (number)
 * @param {GameState} state game state (GameState)
 */
export class Game {
  constructor(
    id,
    settings,
    players,
    stockStartIds,
    startTimestamp,
    hostId,
    state = GameState.waiting
  ) {
    this.id = id;
    this.state = state;
    this.settings = settings;
    this.stockStartIds = stockStartIds;
    this.startTimestamp = startTimestamp;
    this.players = players;
    this.hostId = hostId;
  }

  static generateId() {
    let letters = 'abcdefghijklmnopqrstuvwxyz';
    let id = '';
    for (let i = 0; i < 5; i++) {
      id += letters[Math.floor(Math.random() * letters.length)];
    }
    return id;
  }

  toObject() {
    return {
      id: this.id,
      state: this.state,
      settings: this.settings,
      players: this.players,
      stockStartIds: this.stockStartIds,
      startTimestamp: this.startTimestamp,
      hostId: this.hostId,
    };
  }

  static fromObject(obj) {
    return new Game(
      obj.id,
      obj.settings,
      obj.players,
      obj.stockStartIds,
      obj.startTimestamp,
      obj.hostId,
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
 * @param {maxPlayers} maxPlayers max players (number)
 */
export class GameSettings {
  constructor(
    maxGameTurns,
    roundDurationSeconds,
    startingMoney,
    targetMoney,
    maxPlayers
  ) {
    this.maxGameTurns = maxGameTurns;
    this.roundDurationSeconds = roundDurationSeconds;
    this.startingMoney = startingMoney;
    this.targetMoney = targetMoney;
    this.maxPlayers = maxPlayers;
  }

  toObject() {
    return {
      maxGameTurns: this.maxGameTurns,
      roundDurationSeconds: this.roundDurationSeconds,
      targetMoney: this.targetMoney,
      startingMoney: this.startingMoney,
      maxPlayers: this.maxPlayers,
    };
  }

  static fromObject(obj) {
    return new GameSettings(
      obj.maxGameTurns,
      obj.roundDurationSeconds,
      obj.startingMoney,
      obj.targetMoney,
      obj.maxPlayers
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
