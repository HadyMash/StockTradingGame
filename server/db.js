import { CosmosClient } from '@azure/cosmos';
import { Player } from '../player.mjs';
import { Game, GameSettings, GameState } from '../game.mjs';

// TODO: avoid hard coding later
const stockEntryCount = {
  AAPL: 5910,
  AMZN: 5910,
  MSFT: 5920,
  GOOG: 4650,
  TSLA: 3140,
};
/**
 *
 * @param {string} symbol - the symbol of the stock
 * @param {number} maxGameDuration maximum number of turns
 * @param {number} buffer - a buffer in case you need to show buffer days before the game starts
 * @returns
 */
function getRandomSymbolId(symbol, maxGameDuration, buffer = 0) {
  if (!symbol || !stockEntryCount[symbol]) {
    throw new Error('Invalid symbol');
  }
  if (!maxGameDuration) {
    throw new Error('Invalid maxGameDuration');
  }
  if (maxGameDuration > stockEntryCount[symbol]) {
    throw new Error(
      `Max game duration is too large, maximum game duration for this stock is ${stockEntryCount[symbol]}}`
    );
  }
  return Math.floor(
    Math.random() *
      (stockEntryCount[symbol] -
        Math.floor(maxGameDuration) -
        Math.floor(buffer))
  );
}

// max number of operations per bulk operation
const BULK_OPERATION_LIMIT = 100;

// Provide required connection from environment variables
const key = process.env.COSMOS_KEY;
// Endpoint format: https://YOUR-RESOURCE-NAME.documents.azure.com:443/
const endpoint = process.env.COSMOS_ENDPOINT;

// Set Database name and container name with unique timestamp
const databaseName = `StockTradingGame`;

// Authenticate to Azure Cosmos DB
const cosmosClient = new CosmosClient({ endpoint, key });

// Create database if it doesn't exist
const { database } = await cosmosClient.databases.createIfNotExists({
  id: databaseName,
});
console.log(`${database.id} database ready`);

// Create containers if they don't exist`Ω
const { container: marketDataContainer } =
  await database.containers.createIfNotExists({
    id: 'MarketData',
    partitionKey: {
      paths: ['/symbol'],
    },
  });
console.log(`${marketDataContainer.id} container ready`);

const { container: gamesContainer } =
  await database.containers.createIfNotExists({
    id: 'Games',
    partitionKey: {
      paths: ['/id'],
    },
  });
console.log('Games container ready');

/**
 * generates a unique id for a game
 * @returns {string} id - a guaranteed unique id
 */
async function generateUniqueId() {
  let id;
  let counter = 0;

  do {
    id = Game.generateId();
    counter++;
  } while (
    // TODO - add check for error code 500
    (await getGame(id)).statusCode !== 404 &&
    counter < 10
  );
  return id;
}

/**
 * Adds a single item to the marketDataContainer
 */
export async function addMarketData(item) {
  const { resource: createdItem } = await marketDataContainer.items.create(
    item
  );
  return createdItem;
}

/**
 * Adds an array of items to the marketDataContainer
 * @param {Array} items
 * @returns {Array} createdItems
 */
export async function addMarketDataBulk(items) {
  for (let i = 0; i < items.length; i += BULK_OPERATION_LIMIT) {
    console.log(`starting batch ${i / BULK_OPERATION_LIMIT}`);
    const batch = items.slice(i, i + BULK_OPERATION_LIMIT);
    const operations = [];
    for (let j = 0; j < batch.length; j++) {
      operations.push({
        operationType: 'Create',
        resourceBody: batch[j],
      });
    }
    var response = await marketDataContainer.items.bulk(operations);
    for (let i = 0; i < response.length; i++) {
      if (response[i].statusCode !== 201) {
        console.log(`error at index ${i}, `, response[i]);
      }
    }
  }
}

/**
 * Gets a specific entry from the marketDataContainer
 * @param {string} symbol - the symbol of the stock
 * @param {string} id - the id of the stock's entry
 * @returns {Object} market data entry
 * @throws {Error} if entry is not found
 */
export async function getMarketDataEntry(symbol, id) {
  const { statusCode, resource } = await marketDataContainer
    .item(`${symbol}-${id}`, symbol.toString())
    .read();

  return {
    statusCode: statusCode,
    resource: resource,
  };
}

/**
 * Gets multiple entries from the marketDataContainer for the given symbol
 * @param {string} symbol - the symbol of the stock
 * @param {number} startId - the id of the first entry to get
 * @param {number} count - the number of entries to get
 * @returns {Array} market data entries
 */
export async function getMarketDataEntries(symbol, startId, count = 1) {
  if (!symbol || !stockEntryCount[symbol]) {
    throw new Error('Invalid `symbol`');
  }
  if ((!startId && startId != 0) || startId < 0) {
    throw new Error('Invalid `startId`');
  }
  if (!count || count < 1) {
    throw new Error('Invalid `count`');
  }
  if (startId > stockEntryCount[symbol]) {
    throw new Error(
      `\`startId\` is too large, maximum number of entries for this stock is ${stockEntryCount[symbol]}}`
    );
  }
  if (startId + count > stockEntryCount[symbol]) {
    throw new Error(
      `\`count\` is too large, maximum number of entries for this stock is ${stockEntryCount[symbol]}}`
    );
  }

  let data = [];
  for (let i = 0; i < count; i += BULK_OPERATION_LIMIT) {
    const operations = [];
    for (let j = 0; j < Math.min(BULK_OPERATION_LIMIT, count - i); j++) {
      operations.push({
        operationType: 'Read',
        id: `${symbol}-${startId + i + j}`,
        partitionKey: symbol.toString(),
      });
    }
    var response = await marketDataContainer.items.bulk(operations);
    for (let i = 0; i < response.length; i++) {
      if (response[i].statusCode !== 200) {
        console.log(`error at index ${i}, `, response[i]);
      }
      data.push({
        statusCode: response[i].statusCode,
        resourceBody: response[i].resourceBody,
      });
    }
  }
  return data;
}

/**
 * Get a random first entry for a given symbol
 * @param {string} symbol - the symbol of the stock
 * @returns {Object} `statusCode`, `id` for future queries, and market data `entry`
 */
// TODO: add retries
export async function getRandomMarketDataEntry(symbol, maxGameDuration) {
  const randomId = getRandomSymbolId(symbol, maxGameDuration);
  var { statusCode, resource } = await marketDataContainer
    .item(`${symbol}-${randomId}`, symbol.toString())
    .read();

  return {
    statusCode: statusCode,
    id: randomId,
    resource: resource,
  };
}

/**
 * Get a consecutive `count` entries for a given symbol starting at a random id
 * @param {string} symbol - the symbol of the stock
 * @param {number} maxGameDuration - the maximum duration the game can run for
 * @param {number} count - the number of entries to get
 */
export async function getRandomMarketDataEntries(
  symbol,
  maxGameDuration,
  count = 1
) {
  return await getMarketDataEntries(
    symbol,
    getRandomSymbolId(symbol, maxGameDuration),
    count
  );
}

/**
 * Gets a game from the Database
 * @param {string} id - the id of the game
 */
export async function getGame(id) {
  const { statusCode, resource } = await gamesContainer
    .item(id.toString(), id.toString())
    .read();
  return {
    statusCode: statusCode,
    resource: resource,
  };
}

/**
 * Creates a new game
 *
 * @param {Player} host (Player)
 * @returns {Game} the created game (Game)
 */
export async function createNewGame(hostName, gameSettings, stockStartIds) {
  // create player
  const player = new Player(
    Player.generateId(),
    hostName,
    gameSettings.startingMoney
  );
  // generate unique id
  const gameId = await generateUniqueId();
  let game = new Game(
    gameId,
    gameSettings.toObject(),
    {
      [player.id]: player.toObject(),
    },
    stockStartIds,
    0,
    player.id
  );
  try {
    var { statusCode, resource } = await gamesContainer.items.create(
      game.toObject()
    );
    return {
      statusCode: statusCode,
      player: player.toObject(),
      resource: resource,
    };
  } catch (e) {
    console.log(e);
    return {
      statusCode: statusCode,
      error: e.toObject(),
    };
  }
}

/**
 * Adds a player to a game
 * @param {string} gameId - the id of the game (string)
 * @param {Player} player - the player to add (Player)
 */
export async function addPlayerToGame(gameId, playerName) {
  const gameResponse = await getGame(gameId);
  if (gameResponse.statusCode !== 200) {
    throw new Error('Game not found');
  }
  const game = Game.fromObject(gameResponse.resource);
  if (Object.keys(game.players).length >= game.settings.maxPlayers) {
    throw new Error('Game is full');
  }

  {
    var id;
    let counter = 0;
    do {
      id = Player.generateId();
      counter++;
    } while (game.players[id] && counter < 10);
  }

  const player = new Player(id, playerName, game.settings.startingMoney);
  const operations = [
    { op: 'add', path: `/players/${player.id}`, value: player.toObject() },
  ];
  try {
    var { statusCode, resource } = await gamesContainer
      .item(gameId.toString(), gameId.toString())
      .patch(operations);

    return {
      statusCode: statusCode,
      player: player.toObject(),
      resource: resource,
    };
  } catch (error) {
    return {
      statusCode: statusCode,
      error: error.toObject(),
    };
  }
}
// TODO: remove player from game
/**
 * Removes a player from a game
 * @param {string} gameId - the id of the game (string)
 * @param {string} playerId - the id of the player to remove (string)
 * @param {string} requestId - the id of the person requesting the removal (string)
 * @returns {Object} statusCode and resource
 */
export async function removePlayerFromGame(gameId, playerId, requestId) {
  const gameResponse = await getGame(gameId);
  if (gameResponse.statusCode !== 200) {
    throw new Error('Game not found');
  }
  const game = Game.fromObject(gameResponse.resource);
  if (game.hostId !== requestId && playerId !== requestId) {
    throw new Error('Player is not the host or the player to be removed');
  }
  if (!game.players[playerId]) {
    throw new Error('Player not found');
  }
  const operations = [{ op: 'remove', path: `/players/${playerId}` }];
  try {
    var { statusCode, resource } = await gamesContainer
      .item(gameId.toString(), gameId.toString())
      .patch(operations);

    return {
      statusCode: statusCode,
      resource: resource,
    };
  } catch (error) {
    return {
      statusCode: statusCode,
      error: error.toObject(),
    };
  }
}

/**
 * Updates the game's state
 * @param {string} gameId game id (string)
 * @param {GameState} state game state (GameState)
 * @returns {Object} statusCode and resource
 */
async function setGameState(gameId, state) {
  const operations = [
    { op: 'replace', path: '/state', value: state },
    { op: 'add', path: '/startTimestamp', value: Date.now() },
  ];
  const { statusCode, resource } = await gamesContainer
    .item(gameId.toString(), gameId.toString())
    .patch(operations);
  return {
    statusCode: statusCode,
    resource: resource,
  };
}

/**
 * Set's the game's state to GameState.active
 * @param {string} gameId - the id of the game (string)
 * @param {string} playerId - the id of the player starting the game (string)
 */
export async function startGame(gameId, playerId) {
  const gameResponse = await getGame(gameId);
  if (gameResponse.statusCode !== 200) {
    throw new Error('Game not found');
  }
  const game = Game.fromObject(gameResponse.resource);
  if (game.hostId !== playerId) {
    throw new Error('Player is not the host');
  }
  if (Object.keys(game.players).length < 2) {
    throw new Error('Not enough players');
  }

  return await setGameState(gameId, GameState.active);
}

/**
 * Sets the game's state to GameState.finished
 */
export async function endGame(gameId) {
  return await setGameState(gameId, GameState.ended);
}

/**
 * updates the player money and stock values based on the desired transaction (buy) in the db
 * @param {string} gameId
 * @param {string} playerId
 * @param {string} symbol
 * @param {int} quantity
 * @returns player object with updated money and stocks
 */
export async function buyStock(gameId, playerId, symbol, quantity) {
  quantity = Math.abs(quantity);
  const {
    stockPrice,
    playerMoney,
    operations: opp,
  } = await getTransactionInfo(gameId, playerId, symbol, quantity);
  if (playerMoney < stockPrice * quantity) {
    throw new Error(`Player ${playerId} does not have enough money`);
  }

  const operations = opp;

  const { statusCode, resource } = await gamesContainer
    .item(gameId, gameId)
    .patch(operations);
  if (statusCode !== 200) {
    return { statusCode: statusCode };
  }
  return { statusCode: statusCode, resource: resource };
}

/**
 * updates the player money and stock values based on the desired transaction (sell) in the db
 * @param {string} gameId
 * @param {string} playerId
 * @param {string} symbol
 * @param {int} quantity
 * @returns player object with updated money and stocks
 */
export async function sellStock(gameId, playerId, symbol, quantity) {
  quantity = Math.abs(quantity);
  const { numOfStocks: numOfStocks, operations: opp } =
    await getTransactionInfo(gameId, playerId, symbol, -quantity);
  // check if player has enough stocks
  if (numOfStocks < quantity) {
    throw new Error(`Player ${playerId} does not have enough stocks`);
  }
  const operations = opp;
  const { statusCode, resource } = await gamesContainer
    .item(gameId, gameId)
    .patch(operations);
  if (statusCode !== 200) {
    return { statusCode: statusCode };
  }
  return { statusCode: statusCode, resource: resource };
}

/**
 * get's info used in the buy/sell stocks functions
 * @param {string} gameId game id
 * @param {string} playerId player id
 * @param {string} symbol symbol of the stock
 * @param {number} quantity amount to trade
 * @returns
 */
async function getTransactionInfo(gameId, playerId, symbol, quantity) {
  const { statusCode: gameStatusCode, resource: gameResource } = await getGame(
    gameId
  );
  if (gameStatusCode !== 200) {
    throw new Error(`Game ${gameId} not found`);
  }
  const game = Game.fromObject(gameResource);

  if (game.state !== GameState.active) {
    throw new Error(`Game ${gameId} is not active`);
  }

  let playerMoney = game.players[playerId].money;

  // get stock price
  const { statusCode: marketStatusCode, resource: marketResource } =
    await getMarketDataEntry(
      symbol,
      game.stockStartIds[symbol] +
        Math.floor(
          (Date.now() - game.startTimestamp) /
            game.settings.roundDurationSeconds
        )
    );
  if (marketStatusCode !== 200) {
    throw new Error(`Market data for ${symbol} not found`);
  }
  const stockPrice = marketResource.price;
  const numOfStocks = game.players[playerId].stocks[symbol];
  const operations = [
    {
      op: 'incr',
      path: `/players/${playerId}/money`,
      value: stockPrice * -quantity,
    },
    {
      op: 'incr',
      path: `/players/${playerId}/stocks/${symbol}`,
      value: quantity,
    },
  ];

  return {
    stockPrice: stockPrice,
    numOfStocks: numOfStocks,
    playerMoney: playerMoney,
    operations: operations,
  };
}
