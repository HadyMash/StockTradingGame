/**
 * export COSMOS_ENDPOINT="https://delta.documents.azure.com:443/"
export COSMOS_KEY="ogZtTqNUKrGr9jA89Fr2iTaveJzbMYJl8zpaq0bmx0ivFryPsOvl4zBJcXVD8CH91NeA4CPnSjRnACDbiZBJAw=="
 */


import express from 'express';
const app = express();
//const server = require('http').Server(app);
//const socketIo = require('socket.io');
//const io = socketIo(server);
//import * as db from './db';
import * as db from './db.js';

app.get('/marketdata', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const startId = parseInt(req.params.startId);
    const count = parseInt(req.params.count);
    const data = await db.getMarketDataEntries(symbol, startId, count);
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
  console.log("succeeded");
});

app.get('/marketdata/random', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const maxGameDuration = parseInt(req.params.maxGameDuration);
    const count = parseInt(req.params.count);
    const data = await db.getRandomMarketDataEntries(symbol, maxGameDuration, count);
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/addmarketdata', async (req, res) => {
  try {
    const data = req.body;
    const createdItem = await db.addMarketData(data);
    res.status(201).json(createdItem);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});




//class MarketDatabase {
// function GetStocks(stockName, startDate, endDate) {}
/*
const stocks = [
  { stockName: 'apple', stockQuantityInMarket: 9, stockPricePerUnit: 3.55 },
  { stockName: 'google', stockQuantityInMarket: 20, stockPricePerUnit: 8.44 },
  {
    stockName: 'microsoft',
    stockQuantityInMarket: 17,
    stockPricePerUnit: 7.42,
  },
];

//   return stocks;
// }
//}

const players = [
  {
    playerName: 'AI',
    stocksInPossession: [{ typeOfStock: stocks[1], quantityInPossession: 3 }],
    playerMoney: 100,
  },
];

app.use(express.json());

app.post('/api/players', async (req, res) => {
  const newPlayer = {
    playerName: req.body.playerName,
    stocksInPossession: [],
    playerMoney: 100,
  };

  players.push(newPlayer);
  console.log(players);
  res.send(newPlayer);
});

app.post('/api/BUY', async (req, res) => {
  const stockName = req.body.stockName;
  const stockPurchased = getStock(stockName);
  const playerName = req.body.playerName;
  const player = getPlayer(playerName);
  const stockQuantityPurchased = req.body.stockQuantityPurchased;

  if (player == null || stockPurchased == null) {
    res.send('incorrect data!!');
  } else {
    if (
      stockQuantityPurchased > stockPurchased.stockQuantityInMarket ||
      stockPurchased.stockQuantityInMarket <= 0
    ) {
      res.send('No stocks left in market for ur purchase!!');
    } else if (
      player.playerMoney <
      stockPurchased.stockPricePerUnit * stockQuantityPurchased
    ) {
      res.send('insufficient funds!!');
    } else if (isStockAlreadyInPosession(stockPurchased, player)) {
      const i = getIndexOfPlayersPosessedStocks(stockPurchased, player);
      player.stocksInPossession[i].quantityInPossession +=
        stockQuantityPurchased;
      stockPurchased.stockQuantityInMarket -= stockQuantityPurchased;
      res.send(stocks);
      res.send(players);
    } else {
      const i = getIndexOfMarketStock(stockPurchased.stockName);
      player.stocksInPossession.push({
        typeOfStock: stocks[i],
        quantityInPossession: stockQuantityPurchased,
      });
      stockPurchased.stockQuantityInMarket -= stockQuantityPurchased;
      res.send(stocks);
    }
  }
});

const player = getPlayer(playerName);
player.mo;
function getIndexOfMarketStock(stockName) {
  for (let i = 0; i < stocks.length; i++) {
    if (stockName == stocks[i].stockName) {
      return i;
    }
  }
  return null;
}

function isStockAlreadyInPosession(stock, player) {
  for (let i = 0; i < player.stocksInPossession.length; i++) {
    if (
      JSON.stringify(player.stocksInPossession[i].typeOfStock) ==
      JSON.stringify(stock)
    ) {
      return true;
    }
  }
  return false;
}

function getIndexOfPlayersPosessedStocks(stock, player) {
  for (let i = 0; i < player.stocksInPossession.length; i++) {
    if (
      JSON.stringify(player.stocksInPossession[i].typeOfStock) ==
      JSON.stringify(stock)
    ) {
      return i;
    }
  }
  return null;
}

function getPlayer(playerName) {
  if (playerName == 'AI') {
    return players[0];
  } else if (playerName == players[1].playerName) {
    return players[1];
  } else {
    return null;
  }
}

function getStock(stockName) {
  for (let i = 0; i < stocks.length; i++) {
    if (stocks[i].stockName == stockName) {
      return stocks[i];
    }
  }
  return null;
}
*/
const port = 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));