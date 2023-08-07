import * as db from './db.js';
import express from 'express';
import cors from 'cors';
//import * as game from '../game.mjs';
import { Game, GameSettings, GameState } from '../game.mjs';
import { makeDecision, AIDecision } from './ai.js';

const app = express();

app.use(express.json());
app.use(
  cors({
    // TODO: update for production build
    origin: '*',
  })
);

app.post('/create-new-game', async (req, res) => {
  try {
    const hostName = req.body.hostName;
    const maxGameTurns = req.body.maxGameTurns;
    const roundDurationSeconds = req.body.roundDurationSeconds;
    const startingMoney = req.body.startingMoney;
    const targetMoney = req.body.targetMoney;
    const maxPlayers = req.body.maxPlayers;

    if (!hostName) {
      console.log('Missing host name');
      res.status(400).json({
        error: 'Missing host name',
      });
      return;
    }

    if (!maxGameTurns) {
      console.log('Missing max game turns');
      res.status(400).json({
        error: 'Missing max game turns',
      });
      return;
    }

    if (!roundDurationSeconds) {
      console.log('Missing round duration seconds');
      res.status(400).json({
        error: 'Missing round duration seconds',
      });
      return;
    }

    if (!startingMoney) {
      console.log('Missing starting money');
      res.status(400).json({
        error: 'Missing starting money',
      });
      return;
    }

    if (startingMoney <= 0) {
      console.log('Starting money must be greater than 0');
      res.status(400).json({
        error: 'Starting money must be greater than 0',
      });
      return;
    }

    if (!targetMoney) {
      console.log('Missing target money');
      res.status(400).json({
        error: 'Missing target money',
      });
      return;
    }

    if (targetMoney <= startingMoney) {
      console.log('Target money must be greater than starting money');
      res.status(400).json({
        error: 'Target money must be greater than starting money',
      });
      return;
    }

    if (!maxPlayers) {
      console.log('Missing max players');
      res.status(400).json({
        error: 'Missing max players',
      });
      return;
    }

    if (maxPlayers <= 1) {
      console.log('Max players must be greater than 1');
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

    // console.log(gameSettings.toObject());

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

    // console.log(stockStartIds);

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
        // console.log('starting', symbol);

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
          // console.log(`${j}:`, aiPrediction);
          if (aiPrediction.decision === AIDecision.BUY) {
            // * Buy
            // console.log('buying');
            if (!assetsOverTime[j - 1][symbol]) {
              // console.log('set current to 0 at index:', j);
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
            // console.log('selling');
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
            // console.log('holding');
            // console.log(assetsOverTime[j - 1]);
            if (assetsOverTime[j - 1][symbol]) {
              assetsOverTime[j][symbol] = assetsOverTime[j - 1][symbol] ?? 0;
            }
          }
        }
        // console.log(moneyOverTime);
        // console.log(assetsOverTime);
      }

      // console.log('calculating net worth');
      // console.log(assetsOverTime);
      // console.log(moneyOverTime);

      for (let i = 0; i < maxGameTurns; i++) {
        aiNetWorthOverTime[i] = 0;
        let netWorth = moneyOverTime[i];
        for (let j = 0; j < Object.keys(assetsOverTime[i]).length; j++) {
          const symbol = Object.keys(assetsOverTime[i])[j];
          netWorth += assetsOverTime[i][symbol] * marketData[symbol][i].price;
        }
        aiNetWorthOverTime[i] = netWorth;
      }
      // console.log('done with ai', aiNetWorthOverTime);
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
        id: game.id,
        settings: game.gameSettings,
        state: game.state,
        hostId: game.hostId,
        stocks: Object.keys(game.stockStartIds),
        players: Object.keys(game.players).map((playerId) => {
          return {
            id: playerId,
            name: game.players[playerId].name,
            netWorth: game.players[playerId].money,
          };
        }),
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

    res.status(200).json({
      game: {
        id: response.resource.id,
        settings: response.resource.gameSettings,
        state: response.resource.state,
        hostId: response.resource.hostId,
        stocks: Object.keys(response.resource.stockStartIds),
        players: Object.keys(response.resource.players).map((playerId) => {
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

    // console.log(response);

    if (response.statusCode === 204) {
      console.log('game deleted, 204');
      res.status(204).json({});
      return;
    }

    const players = response.resource.players;

    res.status(200).json({
      hostId: response.resource.hostId,
      gameState: response.resource.state,
      startTimestamp: response.resource.startTimestamp,
      players: Object.keys(players).map((playerId) => {
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

    const response = await db.startGame(gameId, playerId);

    const dayNumber = 0;
    const stockData = new Array(20);

    // for each symbol
    for (let i = 0; i < Object.keys(game.stockStartIds).length; i++) {
      const symbol = Object.keys(game.stockStartIds)[i];
      // console.log('starting', symbol);
      // get prices from start id to current day + a buffer of 20 days
      const rawEntries = await db.getMarketDataEntries(
        symbol,
        game.stockStartIds[symbol],
        // TODO: replace all + 20 with a constant
        dayNumber + 20
      );
      // console.log('raw entries', rawEntries);
      // for each day
      for (let j = 0; j < rawEntries.length; j++) {
        const entry = rawEntries[j];
        if (entry.statusCode !== 200) {
          throw new Error(entry.resourceBody);
        }

        const body = entry.resourceBody;
        if (!stockData[j]) {
          stockData[j] = {};
        }
        // add anonymised data to stock data
        stockData[j][symbol] = {
          id: j,
          symbol: symbol,
          price: body.price,
          volume: body.volume,
        };
      }
    }

    res.status(200).json({
      game: {
        state: response.resource.state,
        players: [
          ...Object.keys(response.resource.players).map((playerId) => {
            // calculate player's net worth
            let netWorth = resource.settings.startingMoney;
            return {
              id: playerId,
              name: game.players[playerId].name,
              netWorth: netWorth,
            };
          }),
          {
            id: 'ai',
            name: 'AI',
            netWorth: resource.settings.startingMoney,
          },
        ],
        resource,
      },
      player: resource.players[playerId],
      stockData: stockData,
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

app.post('/buy', async (req, res) => {
  try {
    const symbol = req.body.symbol;
    const quantity = req.body.quantity;
    const gameId = req.body.gameId;
    const playerId = req.body.playerId;

    if (!symbol) {
      res.status(400).json({
        error: 'Missing symbol',
      });
      return;
    }
    if (!quantity) {
      res.status(400).json({
        error: 'Missing quantity',
      });
      return;
    }
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

    const response = await db.buyStock(gameId, playerId, symbol, quantity);
    if (response.statusCode !== 200) {
      const error = response.resource ?? response;
      res.status(response.statusCode).json({
        error: error,
      });
      return;
    }

    const dayNumber = Math.floor(
      (Date.now() - response.resource.startTimestamp) /
        1000 /
        response.resource.settings.roundDurationSeconds
    );

    const stockData = {};
    for (
      let i = 0;
      i < Object.keys(response.resource.stockStartIds).length;
      i++
    ) {
      const symbol = Object.keys(response.resource.stockStartIds)[i];
      const marketResponse = await db.getMarketDataEntry(
        symbol,
        response.resource.stockStartIds[symbol] + dayNumber + 20
      );
      if (marketResponse.statusCode !== 200) {
        throw new Error(marketResponse.resourceBody);
      }
      stockData[symbol] = marketResponse.resource;
      console.log(`${symbol}:`, stockData[symbol]);
    }

    res.status(200).json({
      gameState: response.resource.state,
      players: [
        ...Object.keys(response.resource.players).map((playerId) => {
          // calculate player's net worth
          console.log('playerId', playerId);
          let netWorth = response.resource.players[playerId].money;
          console.log('netWorth', netWorth);
          for (
            let i = 0;
            i < Object.keys(response.resource.players[playerId].stocks).length;
            i++
          ) {
            const symbol = Object.keys(
              response.resource.players[playerId].stocks
            )[i];
            console.log('symbol', symbol);
            const quantity = response.resource.players[playerId].stocks[symbol];
            console.log('quantity', quantity);
            const price = stockData[symbol].price;
            console.log('price', price);

            netWorth += quantity * price;
          }
          console.log('netWorth', netWorth);

          return {
            id: playerId,
            name: response.resource.players[playerId].name,
            netWorth: netWorth,
          };
        }),
        {
          id: 'ai',
          name: 'AI',
          // TODO: test if day number starts at 0 or 1 (i believe it starts at 0 because of the math floor)
          netWorth: response.resource.aiNetWorthOverTime[dayNumber],
        },
      ],
      player: response.resource.players[playerId],
    });
  } catch (err) {
    console.error(err);
    if (res.status !== 200) {
      res.status(500).json({
        message: 'Stock not bought',
        error: err.message,
      });
    }
  }
});

app.post('/sell', async (req, res) => {
  try {
    const symbol = req.body.symbol;
    const quantity = req.body.quantity;
    const gameId = req.body.gameId;
    const playerId = req.body.playerId;

    if (!symbol) {
      res.status(400).json({
        error: 'Missing symbol',
      });
      return;
    }
    if (!quantity) {
      res.status(400).json({
        error: 'Missing quantity',
      });
      return;
    }
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

    const response = await db.sellStock(gameId, playerId, symbol, quantity);
    if (response.statusCode !== 200) {
      const error = response.resource ?? response;
      res.status(response.statusCode).json({
        error: error,
      });
      return;
    }

    const dayNumber = Math.floor(
      (Date.now() - response.resource.startTimestamp) /
        1000 /
        response.resource.settings.roundDurationSeconds
    );

    const stockData = {};
    for (
      let i = 0;
      i < Object.keys(response.resource.stockStartIds).length;
      i++
    ) {
      const symbol = Object.keys(response.resource.stockStartIds)[i];
      const marketResponse = await db.getMarketDataEntry(
        symbol,
        response.resource.stockStartIds[symbol] + dayNumber + 20
      );
      if (marketResponse.statusCode !== 200) {
        throw new Error(marketResponse.resourceBody);
      }
      stockData[symbol] = marketResponse.resource;
      console.log(`${symbol}:`, stockData[symbol]);
    }

    res.status(200).json({
      gameState: response.resource.state,
      players: [
        ...Object.keys(response.resource.players).map((playerId) => {
          // calculate player's net worth
          console.log('playerId', playerId);
          let netWorth = response.resource.players[playerId].money;
          console.log('netWorth', netWorth);
          for (
            let i = 0;
            i < Object.keys(response.resource.players[playerId].stocks).length;
            i++
          ) {
            const symbol = Object.keys(
              response.resource.players[playerId].stocks
            )[i];
            console.log('symbol', symbol);
            const quantity = response.resource.players[playerId].stocks[symbol];
            console.log('quantity', quantity);
            const price = stockData[symbol].price;
            console.log('price', price);

            netWorth += quantity * price;
          }
          console.log('netWorth', netWorth);

          return {
            id: playerId,
            name: response.resource.players[playerId].name,
            netWorth: netWorth,
          };
        }),
        {
          id: 'ai',
          name: 'AI',
          // TODO: test if day number starts at 0 or 1 (i believe it starts at 0 because of the math floor)
          netWorth: response.resource.aiNetWorthOverTime[dayNumber],
        },
      ],
      player: response.resource.players[playerId],
    });
  } catch (err) {
    console.error(err);
    if (res.status !== 200) {
      res.status(500).json({
        message: 'Stock not bought',
        error: err.message,
      });
    }
  }
});

app.get('/update', async (req, res) => {
  try {
    const gameId = req.body.gameId;
    const playerId = req.body.playerId;
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

    const { statusCode, resource } = await db.getGame(gameId);
    if (statusCode !== 200) {
      console.log(statusCode, resource);
      res.status(statusCode).json({
        error: resource,
      });
      return;
    }

    const game = Game.fromObject(resource);

    let response = {};

    if (game.state === GameState.waiting) {
      response = {
        gameState: game.state,
        players: Object.keys(game.players).map((playerId) => {
          return {
            id: playerId,
            name: game.players[playerId].name,
            netWorth: game.players[playerId].money,
          };
        }),
        hostId: game.hostId,
      };
    } else if (game.state === GameState.active) {
      // TODO: check for end conditions
      const dayNumber = Math.floor(
        (Date.now() - game.startTimestamp) /
          1000 /
          game.settings.roundDurationSeconds
      );
      const stockData = new Array(dayNumber);

      // console.log('day number', dayNumber);

      // for each symbol
      for (let i = 0; i < Object.keys(game.stockStartIds).length; i++) {
        const symbol = Object.keys(game.stockStartIds)[i];
        // console.log('starting', symbol);
        // get prices from start id to current day + a buffer of 20 days
        const rawEntries = await db.getMarketDataEntries(
          symbol,
          game.stockStartIds[symbol],
          // TODO: replace all + 20 with a constant
          dayNumber + 20
        );
        // console.log('raw entries', rawEntries);
        // for each day
        for (let j = 0; j < rawEntries.length; j++) {
          const entry = rawEntries[j];
          if (entry.statusCode !== 200) {
            throw new Error(entry.resourceBody);
          }

          const body = entry.resourceBody;
          if (!stockData[j]) {
            stockData[j] = {};
          }
          // add anonymised data to stock data
          stockData[j][symbol] = {
            id: j,
            symbol: symbol,
            price: body.price,
            volume: body.volume,
          };
        }
      }

      // console.log('stock data', stockData);

      response = {
        gameState: game.state,
        players: [
          ...Object.keys(game.players).map((playerId) => {
            // calculate player's net worth
            let netWorth = game.players[playerId].money;
            for (
              let i = 0;
              i < Object.keys(game.players[playerId].stocks).length;
              i++
            ) {
              const symbol = Object.keys(game.players[playerId].stocks)[i];
              const quantity = game.players[playerId].stocks[symbol];
              const price = stockData[20 + dayNumber];

              netWorth += quantity * price;
            }

            return {
              id: playerId,
              name: game.players[playerId].name,
              netWorth: netWorth,
            };
          }),
          {
            id: 'ai',
            name: 'AI',
            // TODO: test if day number starts at 0 or 1 (i believe it starts at 0 because of the math floor)
            netWorth: resource.aiNetWorthOverTime[dayNumber],
          },
        ],
        player: game.players[playerId],
        stockData: stockData,
      };
      // console.log('response', response);
    } else if (game.state === GameState.finished) {
      let winner = game.players[Object.keys(game.players)[0]];
      for (let i = 0; i < Object.keys(game.players).length; i++) {
        const playerId = Object.keys(game.players)[i];
        if (game.players[playerId].money > winner.money) {
          winner = game.players[playerId];
        }
      }
      response = {
        gameState: game.state,
        winner: winner,
        losers: Object.keys(game.players)
          .filter((id) => id !== winner.id)
          .map((playerId) => {
            return game.players[playerId];
          }),
      };
    }

    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
    return;
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
