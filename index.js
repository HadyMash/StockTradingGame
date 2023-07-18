const express = require("express");
const app = express();

const stocks = ["apple", "google", "microsoft"];
const players = [
  { playerName: "AI", stocksInPossession: stocks[1], playerMoney: 100 },
];

app.use(express.json());

app.post("/api/players", (req, res) => {
  console.log(players);
  const newPlayer = {
    playerName: req.body.playerName,
    stocksInPossession: new Array(),
    playerMoney: 100,
  };
  players.push(newPlayer);
  res.send(newPlayer);
});

const port = 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
