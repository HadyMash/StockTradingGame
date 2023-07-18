import { CosmosClient } from '@azure/cosmos';

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
  const operationLimit = 100;
  for (let i = 0; i < items.length; i += operationLimit) {
    console.log(`starting batch ${i / operationLimit}`);
    const batch = items.slice(i, i + operationLimit);
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
