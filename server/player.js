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

  toObject() {
    return {
      id: this.id,
      name: this.name,
      money: this.money,
      stocks: this.stocks,
    };
  }

  fromObject(obj) {
    this.id = obj.id;
    this.name = obj.name;
    this.money = obj.money;
    this.stocks = obj.stocks;
  }

  toJSON() {
    return JSON.stringify(this.toObject());
  }

  fromJSON(json) {
    this.fromObject(JSON.parse(json));
  }
}
