import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { socketQueryType } from '../socketQueryType.mjs';
import { Game, GameSettings, GameState } from '../game.mjs';
import { Player } from '../player.mjs';
import {
  getMarketDataEntries,
  getRandomSymbolId,
  stockEntryCount,
} from './db.js';
import { join } from 'path';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    // TODO: replace with app origin
    origin: '*',
    methods: ['GET', 'POST'],
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  },
});

const activeGames = {};

function disconnectRoomSockets(room) {
  const socketsInRoom = io.of('/').adapter.rooms.get(room);

  if (socketsInRoom) {
    socketsInRoom.forEach((socketId) => {
      io.sockets.sockets.get(socketId).disconnect(true); // Disconnect with 'true' parameter to close the connection forcefully
    });
  }
}

function joinGame(socket, game, player) {
  io.to(socket.id).emit('join-game', {
    game: {
      id: game.id,
      settings: game.settings,
      state: game.state,
      hostId: game.hostId,
      players: Object.keys(game.players).map((playerId) => {
        return {
          id: playerId,
          name: game.players[playerId].name,
          netWorth: game.players[playerId].money,
        };
      }),
    },
    player: player.toObject(),
  });
}

function onDisconnect(socket, game) {
  console.log('user disconnected', socket.id);
  if (activeGames[game.id]) {
    delete activeGames[game.id].players[socket.id];
    if (Object.keys(activeGames[game.id].players).length === 0) {
      console.log('no players left in game, deleting game');
      delete activeGames[game.id];
    } else {
      io.to(game.id).emit('remove-player', socket.id);
      if (socket.id === activeGames[game.id].hostId) {
        const newHostId = Object.keys(activeGames[game.id].players)[0];
        activeGames[game.id].hostId = newHostId;
        io.to(game.id).emit('new-host', newHostId);
      }
    }
  }
}

function kick(socket, playerId, game) {
  console.log('kick', socket, playerId, game, activeGames[game.id]);
  console.log(socket.id, activeGames[game.id].hostId);
  if (socket.id == activeGames[game.id].hostId) {
    console.log('kicking', playerId);
    io.sockets.sockets.get(playerId)?.disconnect();
  } else {
    console.warn(
      `non host tried to kick player. gameId: ${game.id}, ${socket.id} tried to kick ${playerId}`,
    );
  }
}

function startGame(socket, game) {
  if (socket.id === activeGames[game.id].hostId) {
    console.log('starting game');
    // TODO: get market data
    activeGames[game.id].state = GameState.active;
    activeGames[game.id].nextRoundTimestamp =
      Date.now() + activeGames[game.id].settings.roundDurationSeconds * 1000;
    activeGames[game.id].round = 0;
    io.to(game.id).emit('game-started', {
      players: Object.keys(activeGames[game.id].players).map((playerId) => {
        return {
          id: playerId,
          name: activeGames[game.id].players[playerId].name,
          netWorth: activeGames[game.id].players[playerId].money,
        };
      }),
      nextRoundTimestamp: activeGames[game.id].nextRoundTimestamp,
      stockData: game.stockData.slice(0, 20),
      round: activeGames[game.id].round,
    });

    function gameUpdate() {
      try {
        activeGames[game.id].round++;
        console.log('round', activeGames[game.id].round);
        const newStockData =
          activeGames[game.id].stockData[activeGames[game.id].round + 20] ??
          activeGames[game.id].stockData[activeGames[game.id].round + 20 - 1];
        console.log('new stock data', newStockData);
        let endGame = false;
        if (
          activeGames[game.id].round >=
          activeGames[game.id].settings.maxGameTurns
        ) {
          console.log('game over by max rounds');
          endGame = true;
          activeGames[game.id].round--;
        }
        let winner;
        console.log('getting new players');
        const newPlayers = Object.keys(activeGames[game.id].players).map(
          (playerId) => {
            const player = activeGames[game.id].players[playerId];
            console.log('calculating net worth', player.name, player.stocks);
            let netWorth = player.money;
            console.log('net worth', netWorth);
            for (let i = 0; i < Object.keys(player.stocks).length; i++) {
              const symbol = Object.keys(player.stocks)[i];
              console.log('symbol', symbol);
              const quantity = player.stocks[symbol];
              console.log('new stock data', newStockData);
              console.log(newStockData[symbol]);
              netWorth += quantity * newStockData[symbol].price;
              console.log('net worth', netWorth);
            }
            console.log('net worth', netWorth);

            if (!winner) {
              winner = {
                id: playerId,
                name: player.name,
                netWorth: netWorth,
                stocks: player.stocks,
              };
            }

            if (netWorth > winner.netWorth) {
              winner = {
                id: playerId,
                name: player.name,
                netWorth: netWorth,
                stocks: player.stocks,
              };
            }

            if (netWorth >= activeGames[game.id].settings.targetMoney) {
              console.log(
                'game over by target money',
                'player',
                player.name,
                'net worth',
                netWorth,
                'target money',
                activeGames[game.id].settings.targetMoney,
              );
              endGame = true;
            }

            console.log('players map function', {
              id: playerId,
              name: player.name,
              netWorth: netWorth,
            });

            return {
              id: playerId,
              name: player.name,
              netWorth: netWorth,
            };
          },
        );
        console.log('new players', newPlayers);

        if (!endGame) {
          console.log('game not over');
          activeGames[game.id].nextRoundTimestamp =
            Date.now() +
            activeGames[game.id].settings.roundDurationSeconds * 1000;
          io.to(game.id).emit('game-update', {
            round: activeGames[game.id].round,
            nextRoundTimestamp: activeGames[game.id].nextRoundTimestamp,
            players: newPlayers,
            newStockData: newStockData,
          });

          console.log('starting timeout till next round');
          setTimeout(() => {
            gameUpdate();
          }, activeGames[game.id].nextRoundTimestamp - Date.now());
        } else {
          console.log('game over');

          const tempGame = activeGames[game.id];

          console.log('winner', winner);
          console.log(
            'losers',
            Object.keys(tempGame.players)
              .filter((playerId) => playerId !== winner.id)
              .map((playerId) => {
                const player = tempGame.players[playerId];
                return {
                  id: playerId,
                  name: player.name,
                  netWorth: player.money,
                  stocks: player.stocks,
                };
              }),
          );
          activeGames[game.id].state = GameState.finished;
          io.to(game.id).emit('game-over', {
            winner: winner,
            losers: Object.keys(tempGame.players)
              .filter((playerId) => playerId !== winner.id)
              .map((playerId) => {
                const player = tempGame.players[playerId];
                return {
                  id: playerId,
                  name: player.name,
                  netWorth: player.money,
                  stocks: player.stocks,
                };
              }),
          });
          //   disconnect all sockets
          setTimeout(() => {
            disconnectRoomSockets(game.id);
          }, 1000);
        }
      } catch (error) {
        console.log(error);
      }
    }

    // set delay for the next round
    const now = Date.now();
    const delay = activeGames[game.id].nextRoundTimestamp - now;

    setTimeout(() => {
      gameUpdate();
    }, delay);
  } else {
    console.warn(
      `non host tried to start game. gameId: ${game.id} socket id: ${socket.id}`,
    );
  }
}

function buy(socket, game, data) {
  const symbol = data.symbol;
  let quantity = data.quantity;
  if (!symbol) {
    console.warn('no symbol provided');
    return;
  }
  if (!activeGames[game.id].stockStartIds[symbol]) {
    console.warn('invalid symbol provided');
    return;
  }
  if (!quantity) {
    console.warn('no quantity provided');
    return;
  }
  quantity = parseInt(quantity);
  if (quantity < 0) {
    console.warn('negative quantity provided');
    return;
  }

  const round = activeGames[game.id].round;
  const price = activeGames[game.id].stockData[round][symbol].price;

  if (!price) {
    console.warn('invalid price');
    return;
  }

  if (price * quantity > activeGames[game.id].players[socket.id].money) {
    console.warn('insufficient funds');
    return;
  }

  console.log(
    symbol,
    price,
    quantity,
    activeGames[game.id].players[socket.id].money,
  );
  console.log(activeGames[game.id].stockData[round]);

  // update money and stocks
  activeGames[game.id].players[socket.id].money -= price * quantity;
  if (!activeGames[game.id].players[socket.id].stocks[symbol]) {
    activeGames[game.id].players[socket.id].stocks[symbol] = 0;
  }
  activeGames[game.id].players[socket.id].stocks[symbol] += quantity;

  // send updated player data to client
  io.to(socket.id).emit('update-player', {
    money: activeGames[game.id].players[socket.id].money,
    stocks: activeGames[game.id].players[socket.id].stocks,
  });
}

function sell(socket, game, data) {
  const symbol = data.symbol;
  let quantity = data.quantity;
  if (!symbol) {
    console.warn('no symbol provided');
    return;
  }
  if (!activeGames[game.id].stockStartIds[symbol]) {
    console.warn('invalid symbol provided');
    return;
  }
  if (!quantity) {
    console.warn('no quantity provided');
    return;
  }
  quantity = parseInt(quantity);
  if (quantity < 0) {
    console.warn('negative quantity provided');
    return;
  }
  if (
    quantity > activeGames[game.id].players[socket.id].stocks[symbol] &&
    activeGames[game.id].players[socket.id].stocks[symbol]
  ) {
    console.warn('insufficient stocks');
    return;
  }

  const round = activeGames[game.id].round;
  const price = activeGames[game.id].stockData[round][symbol].price;

  // update money and stocks
  activeGames[game.id].players[socket.id].money += price * quantity;
  activeGames[game.id].players[socket.id].stocks[symbol] -= quantity;

  const newStocksKeys = Object.keys(
    activeGames[game.id].players[socket.id].stocks,
  );
  const newStocks = activeGames[game.id].players[socket.id].stocks;

  for (let i = 0; i < newStocksKeys.length; i++) {
    if (newStocks[newStocksKeys[i]] === 0) {
      delete newStocks[newStocksKeys[i]];
    }
  }

  io.to(socket.id).emit('update-player', {
    money: activeGames[game.id].players[socket.id].money,
    stocks: newStocks,
  });
}

// TODO: check if the same socket is connected to another game
io.on('connection', async (socket) => {
  const query = socket.handshake.query;
  let globalGameVar;
  let globalPlayerVar;
  if (query.type === socketQueryType.CREATE_GAME) {
    try {
      console.log('create game:', query);
      // TODO: validate query
      if (!query.username) {
        socket.disconnect();
        return;
      }
      if (!query.maxGameTurns) {
        socket.disconnect();
        return;
      }
      if (!query.roundDurationSeconds) {
        socket.disconnect();
        return;
      }
      if (!query.startingMoney) {
        socket.disconnect();
        return;
      }
      if (query.startingMoney < 0) {
        socket.disconnect();
        return;
      }
      if (!query.targetMoney) {
        socket.disconnect();
        return;
      }
      if (query.targetMoney < query.startingMoney) {
        socket.disconnect();
        return;
      }
      if (!query.maxPlayers) {
        socket.disconnect();
        return;
      }

      // create game and add it to memory
      {
        let counter = 0;
        do {
          var gameId = Game.generateId();
          counter++;
        } while (activeGames[gameId] && counter < 100);
        if (counter >= 100) {
          console.log('failed to generate game id');
          // TODO: handle error
        }
      }
      console.log(query.targetMoney);

      const gameSettings = new GameSettings(
        parseInt(query.maxGameTurns),
        parseInt(query.roundDurationSeconds),
        parseInt(query.startingMoney),
        parseInt(query.targetMoney),
        parseInt(query.maxPlayers),
      );

      const player = new Player(
        socket.id,
        query.username,
        parseInt(gameSettings.startingMoney),
      );

      const stockStartIds = {};
      const symbols = Object.keys(stockEntryCount);
      for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        const symbolId = getRandomSymbolId(
          symbol,
          gameSettings.maxGameTurns,
          20,
        );
        stockStartIds[symbol] = symbolId;
      }

      const game = new Game(
        gameId,
        gameSettings.toObject(),
        { [player.id]: player.toObject() },
        stockStartIds,
        null,
        player.id,
        GameState.waiting,
      );

      // TODO: get market data after creating game to decrease delay between the request and joining
      const marketData = new Array(gameSettings.maxGameTurns + 20);

      // for each symbol
      for (let i = 0; i < Object.keys(stockStartIds).length; i++) {
        const symbol = Object.keys(stockStartIds)[i];

        const rawEntries = await getMarketDataEntries(
          symbol,
          game.stockStartIds[symbol],
          game.settings.maxGameTurns + 20,
        );

        // for each entry
        for (let j = 0; j < rawEntries.length; j++) {
          const entry = rawEntries[j];
          if (entry.statusCode !== 200) {
            console.log('error getting market data entry', entry);
            throw new Error('error getting market data entry');
          }

          const body = entry.resourceBody;
          if (!marketData[j]) {
            marketData[j] = {};
          }

          marketData[j][symbol] = {
            id: j,
            price: body.price,
            volume: body.volume,
          };
        }
      }

      game.stockData = marketData;
      // set game in memory
      activeGames[game.id.toString()] = game;
      globalGameVar = game;
      globalPlayerVar = player;
      // add socket to game room
      socket.join(game.id.toString());
      console.log('created game:', activeGames[game.id]);

      joinGame(socket, game, player);
    } catch (e) {
      console.error(e);
      socket.disconnect();
      return;
    }
  } else if (query.type === socketQueryType.JOIN_GAME) {
    console.log('join game:', query);
    // TODO: handle error
    if (!query.username) {
      socket.disconnect();
      return;
    }
    if (!query.gameId) {
      socket.disconnect();
      return;
    }

    console.log(activeGames);
    console.log(io.rooms);

    // look for game

    const game = activeGames[query.gameId.toLowerCase()];
    if (!game) {
      console.log('game not found');
      socket.disconnect();
      return;
      // TODO: handle error
    }
    console.log('game found:', game.toObject());

    // TODO: handle error
    if (game.state !== GameState.waiting) {
      console.log('game not waiting');
      socket.disconnect();
      return;
    }

    // TODO: handle error
    if (Object.keys(game.players).length >= game.settings.maxPlayers) {
      console.log('game full');
      socket.disconnect();
      return;
    }

    // add player to game and room
    // add the player to the game
    const player = new Player(
      socket.id,
      query.username,
      parseInt(game.settings.startingMoney),
    );
    game.players[player.id] = player.toObject();
    globalGameVar = game;
    globalPlayerVar = player;
    socket.join(game.id.toString());
    console.log('player joined game:', game.toObject());

    joinGame(socket, game, player);

    // notify other players that a new player has joined
    socket.broadcast.to(game.id).emit('player-joined', {
      player: {
        id: player.id,
        name: player.name,
        netWorth: player.money,
      },
    });
  } else {
    socket.disconnect();
    return;
  }

  socket.on('disconnect', () => onDisconnect(socket, globalGameVar));
  socket.on('kick', (playerId) => kick(socket, playerId, globalGameVar));
  socket.on('start-game', () => startGame(socket, globalGameVar));
  socket.on('buy', (data) => buy(socket, globalGameVar, data));
  socket.on('sell', (data) => sell(socket, globalGameVar, data));

  console.log('user connected', socket.id);
});

httpServer.listen(3000, () => {
  console.log('listening on *:3000');
});
