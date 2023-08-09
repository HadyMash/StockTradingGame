import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { socketQueryType } from '../socketQueryType.mjs';
import { Game, GameSettings, GameState } from '../game.mjs';
import { Player } from '../player.mjs';
import { getRandomSymbolId, stockEntryCount } from './db.js';

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

// check if the same socket id is connected to another game
io.on('connection', (socket) => {
  const query = socket.handshake.query;
  if (query.type === socketQueryType.CREATE_GAME) {
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
    if (!query.targetMoney) {
      socket.disconnect();
      return;
    }
    if (!query.maxPlayers) {
      socket.disconnect();
      return;
    }

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
    const gameSettings = new GameSettings(
      query.maxGameTurns,
      query.roundDurationSeconds,
      query.startingMoney,
      query.targetMoney,
      query.maxPlayers
    );

    const player = new Player(
      socket.id,
      query.username,
      parseInt(gameSettings.startingMoney)
    );

    const stockStartIds = {};
    const symbols = Object.keys(stockEntryCount);
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      const symbolId = getRandomSymbolId(symbol, gameSettings.maxGameTurns, 20);
      stockStartIds[symbol] = symbolId;
    }

    const game = new Game(
      gameId,
      gameSettings.toObject(),
      { [player.id]: player.toObject() },
      stockStartIds,
      null,
      player.id,
      GameState.waiting
    );
    activeGames[game.id.toString()] = game;
    console.log('active games:', activeGames);
    console.log(activeGames[game.id.toString()]);
    socket.join(game.id.toString());
    console.log('created game:', game.toObject());

    io.to(socket.id).emit('join-game', {
      // TODO: send only necessary data
      game: game.toObject(),
      player: player.toObject(),
      players: [player.toObject()],
    });
    console.log('send game created to client');

    // TODO: refactor disconnect and kick and start game to avoid code duplication
    socket.on('disconnect', () => {
      console.log('user disconnected', socket.id);
      if (activeGames[game.id]) {
        delete activeGames[game.id].players[socket.id];
        if (Object.keys(activeGames[game.id].players).length === 0) {
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
    });

    // TODO: refactor disconnect and kick and start game to avoid code duplication
    socket.on('kick', (playerId) => {
      console.log('kick');
      console.log(socket.id, activeGames[game.id].hostId);
      if (socket.id == activeGames[game.id].hostId) {
        console.log('kicking', playerId);
        io.sockets.sockets.get(playerId)?.disconnect();
      } else {
        console.warn(
          `non host tried to kick player. gameId: ${game.id}, ${socket.id} tried to kick ${playerId}`
        );
      }
    });

    // TODO: refactor disconnect and kick and start game to avoid code duplication
    socket.on('start-game', () => {
      if (socket.id == activeGames[game.id].hostId) {
        console.log('starting game');
        // TODO: get market data
        activeGames[game.id].state = GameState.running;
        activeGames[game.id].nextRoundTimestamp =
          Date.now() +
          activeGames[game.id].settings.roundDurationSeconds * 1000;
        io.to(game.id).emit('game-started', {
          nextRoundTimestamp: activeGames[game.id].nextRoundTimestamp,
          // TODO: add data
          stockData: [
            {
              AAPL: { day: 1, price: 100, volume: 100 },
              MSFT: { day: 1, price: 100, volume: 100 },
              GOOG: { day: 1, price: 100, volume: 100 },
              AMZN: { day: 1, price: 100, volume: 100 },
            },
            {
              AAPL: { day: 2, price: 100, volume: 100 },
              MSFT: { day: 2, price: 100, volume: 100 },
              GOOG: { day: 2, price: 100, volume: 100 },
              AMZN: { day: 2, price: 100, volume: 100 },
            },
            {
              AAPL: { day: 3, price: 100, volume: 100 },
              MSFT: { day: 3, price: 100, volume: 100 },
              GOOG: { day: 3, price: 100, volume: 100 },
              AMZN: { day: 3, price: 100, volume: 100 },
            },
            {
              AAPL: { day: 4, price: 100, volume: 100 },
              MSFT: { day: 4, price: 100, volume: 100 },
              GOOG: { day: 4, price: 100, volume: 100 },
              AMZN: { day: 4, price: 100, volume: 100 },
            },

            {
              AAPL: { day: 5, price: 100, volume: 100 },
              MSFT: { day: 5, price: 100, volume: 100 },
              GOOG: { day: 5, price: 100, volume: 100 },
              AMZN: { day: 5, price: 100, volume: 100 },
            },
          ],
        });
      } else {
        console.warn(
          `non host tried to start game. gameId: ${game.id} socket id: ${socket.id}`
        );
      }
    });
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

    // add the player to the game
    const player = new Player(
      socket.id,
      query.username,
      parseInt(game.settings.startingMoney)
    );
    game.players[player.id] = player.toObject();
    socket.join(game.id.toString());
    console.log('player joined game:', game.toObject());

    io.to(socket.id).emit('join-game', {
      // TODO: send only necessary data
      game: game.toObject(),
      // TODO: consider sending id only to avoid duplicating data
      player: player.toObject(),
      players: Object.keys(game.players).map((id) => {
        const player = game.players[id];
        return {
          id: player.id,
          name: player.name,
          netWorth: player.money,
        };
      }),
    });

    // notify other players that a new player has joined
    socket.broadcast.to(game.id).emit('player-joined', {
      id: player.id,
      username: player.name,
      netWorth: player.money,
    });

    // TODO: refactor disconnect and kick and start game to avoid code duplication
    socket.on('disconnect', () => {
      console.log('user disconnected', socket.id);
      if (activeGames[query.gameId]) {
        delete activeGames[query.gameId].players[socket.id];
        if (Object.keys(activeGames[query.gameId].players).length === 0) {
          delete activeGames[query.gameId];
        } else {
          io.to(query.gameId).emit('remove-player', socket.id);
          if (socket.id === activeGames[query.gameId].hostId) {
            const newHostId = Object.keys(activeGames[query.gameId].players)[0];
            activeGames[query.gameId].hostId = newHostId;
            io.to(query.gameId).emit('new-host', newHostId);
          }
        }
      }
    });

    // TODO: refactor disconnect and kick and start game to avoid code duplication
    socket.on('kick', (playerId) => {
      console.log('kick');
      console.log(socket.id, activeGames[game.id].hostId);
      if (socket.id == activeGames[game.id].hostId) {
        console.log('remove player:', playerId);
        if (io.sockets.sockets[playerId]) {
          io.sockets.sockets[playerId].disconnect();
        }
      } else {
        console.warn(
          `non host tried to kick player. gameId: ${game.id}, ${socket.id} tried to kick ${playerId}`
        );
      }
    });
  } else {
    socket.disconnect();
    return;
  }

  console.log('user connected', socket.id);
  console.log(socket.recovered);
  console.log(socket.handshake.query.x);
});

httpServer.listen(3000, () => {
  console.log('listening on *:3000');
});
