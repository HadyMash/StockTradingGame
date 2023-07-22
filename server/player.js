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
}
