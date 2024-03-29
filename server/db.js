import { config as dotenvConfig } from 'dotenv';
import { CosmosClient } from '@azure/cosmos';
import { Game } from '../game.mjs';

dotenvConfig();

// TODO: cache recently read market data to avoid unnecessary reads

// TODO: avoid hard coding later
export const stockEntryCount = {
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
export function getRandomSymbolId(symbol, maxGameDuration, buffer = 0) {
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
      (stockEntryCount[symbol] - Math.ceil(maxGameDuration) - Math.ceil(buffer))
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
      `\`startId\` is too large, maximum number of entries for this stock is ${stockEntryCount[symbol]} but you requested ${startId}`
    );
  }
  if (startId + count > stockEntryCount[symbol]) {
    throw new Error(
      `\`count\` is too large, maximum number of entries for this stock is ${
        stockEntryCount[symbol]
      } but you requested ${startId + count}`
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
