import { CosmosClient } from '@azure/cosmos';
// TODO: add more detailed documentation

// TODO: avoid hard coding later
const stockEntryCount = {
  AAPL: 5910,
  AMZN: 5910,
  MSFT: 5920,
  GOOG: 4650,
  TSLA: 3140,
};
function getRandomSymbolId(symbol, maxGameDuration) {
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
    Math.random() * (stockEntryCount[symbol] - maxGameDuration)
  );
}

// max number of operations per bulk operation
const bulkOperationLimit = 100;

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

// Create containers if they don't exist
const { container: marketDataContainer } =
  await database.containers.createIfNotExists({
    id: 'MarketData',
    partitionKey: {
      paths: ['/symbol'],
    },
  });
console.log(`${marketDataContainer.id} container ready`);

// TODO: add active games container

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
  for (let i = 0; i < items.length; i += bulkOperationLimit) {
    console.log(`starting batch ${i / bulkOperationLimit}`);
    const batch = items.slice(i, i + bulkOperationLimit);
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
  const response = await marketDataContainer
    .item(`${symbol}-${id}`, symbol.toString())
    .read();
  console.log(response);
  return response.resource;
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
  for (let i = 0; i < count; i += bulkOperationLimit) {
    const operations = [];
    for (let j = 0; j < Math.min(bulkOperationLimit, count - i); j++) {
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
    entry: resource,
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
