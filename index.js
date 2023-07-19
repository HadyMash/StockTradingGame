// adding conflict comment
const express = require('express');
const app = express();

const stocks = [
  { stockName: 'apple', stockQuantityInMarket: 9, stockPricePerUnit: 3.55 },
  { stockName: 'google', stockQuantityInMarket: 20, stockPricePerUnit: 8.44 },
  {
    stockName: 'microsoft',
    stockQuantityInMarket: 17,
    stockPricePerUnit: 7.42,
  },
];
const players = [
  {
    playerName: 'AI',
    stocksInPossession: [{ typeOfStock: stocks[1], quantityInPossession: 3 }],
    playerMoney: 100,
  },
];

app.use(express.json());

//for testing
//const containerName = 'players';
//const container = database.container(containerName);

app.post('/api/players', async (req, res) => {
  const newPlayer = {
    playerName: req.body.playerName,
    stocksInPossession: [],
    playerMoney: 100,
  };
  //for testing the buy action
  //const { resource: createdPlayer } = await container.items.create(player);

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
      stockBought.stockQuantityInMarket <= 0
    ) {
      res.send('No stocks left in market for ur purchase!!');
    } else if (
      player.playerMoney <
      stockPurchased.stockPricePerUnit * stockQuantityPurchased
    ) {
      res.send('insufficient funds!!');
    } else if (isStockAlreadyInPosession(stockBought, player)) {
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
      res.send(players);
    }
  }
});

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

// Handle buying stocks
//app.post('/api/buy', async (req, res) => {
//const { playerName, stockName, quantityInPossession } = req.body;
//const price = getStockPrice(stockName);

//const { resource: player } = await container.item(playerName).read();

//if (player.playerMoney < price) {
//  res.status(400).send('Insufficient funds');
//  return;
//}

// Update player's balance
//player.playerMoney -= price;

//const stock = player.stocksInPossession.find(
//(s) => s.stockName === stockName
//);

//if (stock) {
//stock.quantityInPossession += quantityInPossession;
//} else {
//  player.stocksInPossession.push({ stockName, price, quantity });
//}

//const { resource: updatedPlayer } = await container.item(player.id).replace(player);
//console.log('Stocks bought successfully');

// res.send('Stocks bought successfully');
//});

//function getStockPrice(stockName) {
//just for testing
// return 1;
//return stockName.stockPricePerUnit;

//return Math.floor(Math.random() * 151) + 50;
//}
//app.post("/api/sell", (req, res) => {
//  const stocksToBeSold;
//});

const port = 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
