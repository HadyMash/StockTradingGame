/**
 * Game class
 * @param {string} id game id (string)
 * @param {GameState} state game state (GameState)
 * @param {Array<Player>} players array of players (<Player>[])
 */
export class Game {
  constructor(id, state, players) {
    this.id = id;
    this.state = state;
    this.players = players;
  }

  toObject() {
    return {
      id: this.id,
      state: this.state,
      players: this.players,
    };
  }
  fromObject(obj) {
    return Game(obj.id, obj.state, obj.players);
  }

  toJSON() {
    return JSON.stringify(this.toObject());
  }

  fromJSON(json) {
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
