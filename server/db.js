import { CosmosClient } from '@azure/cosmos';

// Provide required connection from environment variables
const key = process.env.COSMOS_KEY;
// Endpoint format: https://YOUR-RESOURCE-NAME.documents.azure.com:443/
const endpoint = process.env.COSMOS_ENDPOINT;

// Set Database name and container name with unique timestamp
const databaseName = `StockTradingGame`;
// const containerName = `StockTradingGame_${timeStamp}`;
// const partitionKeyPath = ['/categoryId'];

// Authenticate to Azure Cosmos DB
const cosmosClient = new CosmosClient({ endpoint, key });

// Create database if it doesn't exist
const { database } = await cosmosClient.databases.createIfNotExists({
  id: databaseName,
});
console.log(`${database.id} database ready`);

// // Create container if it doesn't exist
// const { container } = await database.containers.createIfNotExists({
//   id: containerName,
//   partitionKey: {
//     paths: partitionKeyPath,
//   },
// });
// console.log(`${container.id} container ready`);
