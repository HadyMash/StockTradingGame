import * as db from './db.js';
import express from 'express';
//import * as game from '../game.mjs';
import { GameSettings } from '../game.mjs';
const app = express();
app.use(express.json());

app.post('/createNewGame', async (req, res) => {
  try {
    const hostName = req.body.hostName;
    const maxGameTurns = req.body.maxGameTurns;
    const roundDurationSeconds = req.body.roundDurationSeconds;
    const startingMoney = req.body.startingMoney;
    const targetMoney = req.body.targetMoney;
    const maxPlayers = req.body.maxPlayers;
    if (
      Number.isInteger(maxGameTurns) &&
      Number.isInteger(roundDurationSeconds) &&
      Number.isInteger(startingMoney) &&
      Number.isInteger(targetMoney) &&
      Number.isInteger(maxPlayers)
    ) {
      const gameSettings = new GameSettings(
        maxGameTurns,
        roundDurationSeconds,
        startingMoney,
        targetMoney,
        maxPlayers
      );

      const stockStartIds = {
        MSFT: db.getRandomSymbolId('MSFT', maxGameTurns, 0),
        GOOG: db.getRandomSymbolId('GOOG', maxGameTurns, 0),
      };
      const response = await db.createNewGame(
        hostName,
        gameSettings,
        stockStartIds
      );
      // res.status(201).json({
      //   success: true,
      //   message: 'Game created successfully',
      // });
      res.send(response);
    } else {
      res.send('Invalid input!');
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Failed to create the game',
      error: err.message,
    });
  }
});

app.post('/addPlayer', async (req, res) => {
  try {
    const gameId = req.body.gameId;
    const playerName = req.body.playerName;
    const response = await db.addPlayerToGame(gameId, playerName);
    res.status(201).json({
      success: true,
      message: 'Player added successfully',
    });
    //res.send(response);
    console.log(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Failed to add player',
      error: err.message,
    });
  }
});

app.delete('/removePlayer', async (req, res) => {
  try {
    const gameId = req.body.gameId;
    const playerId = req.body.playerId;
    const requestId = req.body.requestId;
    const response = await db.removePlayerFromGame(gameId, playerId, requestId);
    res.status(201).json({
      success: true,
      message: 'Player removed successfully',
    });
    //res.send(response);
    console.log(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Failed to remove player',
      error: err.message,
    });
  }
});

app.post('/startGame', async (req, res) => {
  try {
    const gameId = req.body.gameId;
    const playerId = req.body.playerId;
    const response = await db.startGame(gameId, playerId);
    res.status(200).json({
      success: true,
      message: 'Game started successfully',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Failed to start game',
      error: err.message,
    });
  }
});

app.post('/endGame', async (req, res) => {
  try {
    const gameId = req.body.gameId;
    const response = await db.endGame(gameId);
    res.status(200).json({
      success: true,
      message: 'Game ended successfully',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Failed to end game',
      error: err.message,
    });
  }
});

app.post('/buyStock', async (req, res) => {
  try {
    const symbol = req.body.symbol;
    const quantity = req.body.quantity;
    const gameId = req.body.gameId;
    const playerId = req.body.playerId;
    const response = await db.buyStock(gameId, playerId, symbol, quantity);
    res.status(201).json({
      success: true,
      message: 'Stock bought successfully',
    });
  } catch (err) {
    if (res.status !== 201) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: 'Stock not bought',
        error: err.message,
      });
    }
  }
});

app.post('/sellStock', async (req, res) => {
  try {
    const gameId = req.body.gameId;
    const playerId = req.body.playerId;
    const symbol = req.body.symbol;
    const quantity = req.body.quantity;

    const response = await db.sellStock(gameId, playerId, symbol, quantity);
    res.status(201).json({
      success: true,
      message: 'Stock sold successfully',
    });
    //res.send(response);
    console.log(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Failed to sell stock',
      error: err.message,
    });
  }
});

app.get('/getRandomStocks', async (req, res) => {
  try {
    const symbol = req.body.symbol;
    const maxGameDuration = req.body.maxGameDuration;
    const count = req.body.count;
    const gameId = req.body.gameId;
    //const game = db.getGame(gameId);
    const data = await db.getRandomMarketDataEntries(
      symbol,
      maxGameDuration,
      count
    );
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

const port = 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));



//createNewgame---which info will be sent
//getRandomStocks---rounds!
//integers in create new game!