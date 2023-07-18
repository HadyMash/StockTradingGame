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

app.post('/api/players', (req, res) => {
  const newPlayer = {
    playerName: req.body.playerName,
    stocksInPossession: new Array(),
    playerMoney: 100,
  };

  players.push(newPlayer);
  console.log(players);
  res.send(newPlayer);
});

//app.post("/api/sell", (req, res) => {
//  const stocksToBeSold;
//});

const port = 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
