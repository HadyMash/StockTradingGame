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
    stocksInPossession: { typeOfStock: stocks[1], quantityInPossession: 3 },
    playerMoney: 100,
  },
];

app.use(express.json());

//for testing
const containerName = 'players';
const container = database.container(containerName);

app.post('/api/players', async (req, res) => {
  const newPlayer = ({
    playerName: req.body.playerName,
    stocksInPossession: [],
    playerMoney: 100,
  });
//for testing the buy action
  const { resource: createdPlayer } = await container.items.create(player);

  players.push(newPlayer);
  console.log(players);
  res.send(newPlayer);
});


// Handle buying stocks
app.post('/api/buy', async (req, res) => {
  const { playerName, stockName, quantityInPossession } = req.body;
  const price = getStockPrice(stockName);

  const { resource: player } = await container.item(playerName).read();

  if (player.playerMoney < price) {
    res.status(400).send('Insufficient funds');
    return;
  }

  // Update player's balance
  player.playerMoney -= price;

  const stock = player.stocksInPossession.find((s) => s.stockName === stockName);

  if (stock) {
    stock.quantityInPossession += quantityInPossession;
  } else {
    player.stocksInPossession.push({ stockName, price, quantity });
  }

  //const { resource: updatedPlayer } = await container.item(player.id).replace(player);
  console.log("Stocks bought successfully");

  res.send('Stocks bought successfully');
});

function getStockPrice(stockName) {
  //just for testing
  return 1;
  //return stockName.stockPricePerUnit;
  
  //return Math.floor(Math.random() * 151) + 50;
}
//app.post("/api/sell", (req, res) => {
//  const stocksToBeSold;
//});

const port = 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
