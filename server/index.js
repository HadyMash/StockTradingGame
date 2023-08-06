import * as db from './db.js';
import express from 'express';
//import * as game from '../game.mjs';
import { GameSettings } from '../game.mjs';
import { makeDecision, AIDecision } from './ai.js';

const app = express();
app.use(express.json());

app.post('/create-new-game', async (req, res) => {
  try {
    const hostName = req.body.hostName;
    const maxGameTurns = req.body.maxGameTurns;
    const roundDurationSeconds = req.body.roundDurationSeconds;
    const startingMoney = req.body.startingMoney;
    const targetMoney = req.body.targetMoney;
    const maxPlayers = req.body.maxPlayers;

    if (!hostName) {
      res.status(400).json({
        error: 'Missing host name',
      });
      return;
    }

    if (!maxGameTurns) {
      res.status(400).json({
        error: 'Missing max game turns',
      });
      return;
    }

    if (!roundDurationSeconds) {
      res.status(400).json({
        error: 'Missing round duration seconds',
      });
      return;
    }

    if (!startingMoney) {
      res.status(400).json({
        error: 'Missing starting money',
      });
      return;
    }

    if (startingMoney <= 0) {
      res.status(400).json({
        error: 'Starting money must be greater than 0',
      });
      return;
    }

    if (!targetMoney) {
      res.status(400).json({
        error: 'Missing target money',
      });
      return;
    }

    if (targetMoney <= startingMoney) {
      res.status(400).json({
        error: 'Target money must be greater than starting money',
      });
      return;
    }

    if (!maxPlayers) {
      res.status(400).json({
        error: 'Missing max players',
      });
      return;
    }

    if (maxPlayers <= 1) {
      res.status(400).json({
        error: 'Max players must be greater than 1',
      });
      return;
    }

    const gameSettings = new GameSettings(
      maxGameTurns,
      roundDurationSeconds,
      startingMoney,
      targetMoney,
      maxPlayers
    );

    console.log(gameSettings.toObject());

    const stockStartIds = {};
    const symbols = Object.keys(db.stockEntryCount);
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      const symbolId = db.getRandomSymbolId(
        symbol,
        gameSettings.maxGameTurns,
        20
      );
      stockStartIds[symbol] = symbolId;
    }

    console.log(stockStartIds);

    if (stockStartIds.length === 0) {
      res.status(500).json({
        error: 'Failed to generate stock start ids',
      });
    }

    // ai
    try {
      var aiNetWorthOverTime = [];

      const assetsOverTime = [{}];
      const moneyOverTime = [gameSettings.startingMoney];
      const marketData = {};

      for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        marketData[symbol] = [];
        console.log('starting', symbol);

        const rawEntries = await db.getMarketDataEntries(
          symbol,
          stockStartIds[symbol],
          gameSettings.maxGameTurns + 20
        );
        rawEntries.forEach((element) => {
          marketData[symbol].push(element.resourceBody);
        });

        // TODO: adjust to allow ai to run from j = 0
        for (let j = 1; j < maxGameTurns; j++) {
          if (!assetsOverTime[j]) {
            assetsOverTime[j] = {};
          }
          if (!moneyOverTime[j]) {
            moneyOverTime[j] = moneyOverTime[j - 1];
          }
          let aiPrediction = makeDecision(marketData[symbol].slice(0, j + 1));
          console.log(`${j}:`, aiPrediction);
          if (aiPrediction.decision === AIDecision.BUY) {
            // * Buy
            console.log('buying');
            if (!assetsOverTime[j - 1][symbol]) {
              console.log('set current to 0 at index:', j);
              assetsOverTime[j][symbol] = 0;
            } else {
              assetsOverTime[j][symbol] = assetsOverTime[j - 1][symbol];
            }
            if (
              aiPrediction.quantity * marketData[symbol][j].price >
              moneyOverTime[j]
            ) {
              aiPrediction.quantity =
                Math.floor((100 * money) / marketData[symbol][j].price) / 100;
            }
            assetsOverTime[j][symbol] += aiPrediction.quantity;
            moneyOverTime[j] -=
              marketData[symbol][j].price * aiPrediction.quantity;
          } else if (aiPrediction.decision === AIDecision.SELL) {
            // * Sell
            console.log('selling');
            if (assetsOverTime[j - 1][symbol]) {
              assetsOverTime[j][symbol] = assetsOverTime[j - 1][symbol];
              if (assetsOverTime[j][symbol] < aiPrediction.quantity) {
                aiPrediction.quantity = assetsOverTime[j][symbol] ?? 0;
              }
              assetsOverTime[j][symbol] -= aiPrediction.quantity;
              moneyOverTime[j] +=
                marketData[symbol][j].price * aiPrediction.quantity;
            }
          } else {
            // * Hold
            console.log('holding');
            console.log(assetsOverTime[j - 1]);
            if (assetsOverTime[j - 1][symbol]) {
              assetsOverTime[j][symbol] = assetsOverTime[j - 1][symbol] ?? 0;
            }
          }
        }
        console.log(moneyOverTime);
        console.log(assetsOverTime);
      }

      console.log('calculating net worth');
      console.log(assetsOverTime);
      console.log(moneyOverTime);

      for (let i = 0; i < maxGameTurns; i++) {
        aiNetWorthOverTime[i] = 0;
        let netWorth = moneyOverTime[i];
        for (let j = 0; j < Object.keys(assetsOverTime[i]).length; j++) {
          const symbol = Object.keys(assetsOverTime[i])[j];
          netWorth += assetsOverTime[i][symbol] * marketData[symbol][i].price;
        }
        aiNetWorthOverTime[i] = netWorth;
      }
      console.log('done with ai', aiNetWorthOverTime);
    } catch (error) {
      console.error('error with ai:', error);
    }

    const response = await db.createNewGame(
      hostName,
      gameSettings,
      stockStartIds,
      aiNetWorthOverTime
    );

    console.log(response);

    if (response.statusCode !== 201) {
      res.status(response.statusCode).json({
        error: response.error,
      });
      return;
    }

    const game = response.resource;

    res.status(201).json({
      game: {
        id: response.resource.id,
        settings: response.resource.gameSettings,
        state: response.resource.state,
        hostId: response.resource.hostId,
        stocks: Object.keys(response.resource.stockStartIds),
        players: [],
      },
      player: response.player,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Failed to create the game',
      error: err.message,
    });
  }
});

app.post('/join-game', async (req, res) => {
  try {
    const gameId = req.body.gameId;
    const playerName = req.body.name;

    if (!gameId) {
      res.status(400).json({
        error: 'Missing game id',
      });
      return;
    }

    if (!playerName) {
      res.status(400).json({
        error: 'Missing player name',
      });
      return;
    }

    const response = await db.addPlayerToGame(gameId, playerName);

    console.log(response);

    if (response.statusCode !== 200) {
      res.status(response.statusCode).json({
        error: response.error,
      });
      return;
    }

    res.status(201).json({
      game: {
        id: response.resource.id,
        settings: response.resource.gameSettings,
        state: response.resource.state,
        hostId: response.resource.hostId,
        stocks: Object.keys(response.resource.stockStartIds),
        players: Object.keys(response.resource.players)
          .filter((playerId) => playerId !== response.player.id)
          .map((playerId) => {
            return {
              id: playerId,
              name: response.resource.players[playerId].name,
              netWorth: response.resource.players[playerId].money,
            };
          }),
      },
      player: response.player,
    });
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

app.post('/remove-player', async (req, res) => {
  try {
    const gameId = req.body.gameId;
    const playerId = req.body.playerId;
    const requestId = req.body.requestId;

    if (!gameId) {
      res.status(400).json({
        error: 'Missing game id',
      });
      return;
    }

    if (!playerId) {
      res.status(400).json({
        error: 'Missing player id',
      });
      return;
    }

    if (!requestId) {
      res.status(400).json({
        error: 'Missing request id',
      });
      return;
    }

    const response = await db.removePlayerFromGame(gameId, playerId, requestId);

    if (response.statusCode !== 200) {
      res.status(response.statusCode).json({
        error: response.error,
      });
      return;
    }

    console.log(response);

    if (response.statusCode === 204) {
      console.log('game deleted, 204');
      res.status(204).json({});
      return;
    }

    const players = response.resource.players;

    res.status(201).json({
      hostId: response.resource.hostId,
      gameState: response.resource.state,
      startTimestamp: response.resource.startTimestamp,
      players: Object.keys(players)
        .filter((playerId) => playerId !== requestId)
        .map((playerId) => {
          return {
            id: playerId,
            name: players[playerId].name,
            netWorth: players[playerId].money,
          };
        }),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Failed to remove player',
      error: err.message,
    });
  }
});

app.post('/start-game', async (req, res) => {
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

// app.post('/endGame', async (req, res) => {
//   try {
//     const gameId = req.body.gameId;
//     const response = await db.endGame(gameId);
//     res.status(200).json({
//       success: true,
//       message: 'Game ended successfully',
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to end game',
//       error: err.message,
//     });
//   }
// });

app.post('/buy', async (req, res) => {
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

app.post('/sell', async (req, res) => {
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

// app.get('/getRandomStocks', async (req, res) => {
//   try {
//     const symbol = req.body.symbol;
//     const maxGameDuration = req.body.maxGameDuration;
//     const count = req.body.count;
//     const gameId = req.body.gameId;
//     //const game = db.getGame(gameId);
//     const data = await db.getRandomMarketDataEntries(
//       symbol,
//       maxGameDuration,
//       count
//     );
//     res.status(200).json(data);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Internal Server Error');
//   }
// });

const port = 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
