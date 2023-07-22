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
}

export const GameState = {
  waiting: 'waiting',
  active: 'active',
  finished: 'finished',
};
