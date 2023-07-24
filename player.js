import { Game } from './game.js';

/**
 * Player class
 * @param {number} id player id (number)
 * @param {string} name player name (string)
 * @param {number} money player money (number)
 * @param {Object} stocks player stocks (Object)
 */
export class Player {
  constructor(id, name, money) {
    this.id = id;
    this.name = name;
    this.money = money;
    this.stocks = {};
  }

  static generateId() {
    return Game.generateId();
  }

  toObject() {
    return {
      id: this.id,
      name: this.name,
      money: this.money,
      stocks: this.stocks,
    };
  }

  static fromObject(obj) {
    return new Player(obj.id, obj.name, obj.money, obj.stocks);
  }

  toJSON() {
    return JSON.stringify(this.toObject());
  }

  static fromJSON(json) {
    return this.fromObject(JSON.parse(json));
  }
}
