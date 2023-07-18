import * as fs from 'fs';
import { parse } from 'csv-parse';
import { addMarketData, addMarketDataBulk } from '../db.js';

// TODO: read all files in directory in the future to avoid hardcoding
// list of paths to microsoft, apple, tesla, google, and amazon csv files
const csvFiles = ['MSFT', 'AAPL', 'TSLA', 'GOOG', 'AMZN'];

function readCSV(path, symbol) {
  return new Promise((resolve, reject) => {
    let data = [];
    let id = 0;
    fs.createReadStream(path)
      .pipe(parse({ delimiter: ',', from_line: 2 }))
      .on('data', function (row) {
        data.push({
          //   id: `${symbol}-${row[0]}`,
          id: `${symbol}-${id++}`,
          date: Date.parse(row[0]),
          symbol: symbol,
          price:
            row
              .slice(1, 4 + 1)
              .reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / 4,
          volume: parseInt(row[6]),
        });
      })
      .on('end', function () {
        console.log('finished reading csv');
        resolve(data);
      })
      .on('error', function (error) {
        console.log(error.message);
        reject(error);
      });
  });
}

let data = [];
for (let csv in csvFiles) {
  data.push(
    ...(await readCSV(`./scripts/csv/${csvFiles[csv]}.csv`, csvFiles[csv]))
  );
}

data.forEach((item) => {
  fs.appendFile('./scripts/data.txt', JSON.stringify(item) + '\n', (err) => {
    if (err) throw err;
  });
});

// await addMarketDataBulk(data);

// console.log('done adding data to marketDataContainer in database');
