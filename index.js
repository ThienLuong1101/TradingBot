const ccxt = require('ccxt');
const moment = require('moment');
const fs = require('fs');
const config = require('./key');

const binance = new ccxt.binance({
    apiKey: config.binance.apiKey,
    secret: config.binance.secret,
});
binance.setSandboxMode(true);

let USD = 0;
const usdHistory = [];

// Clear the orders.json file
function clearOrdersFile() {
    fs.writeFile('orders.json', '[]', 'utf8', (err) => {
        if (err) {
            console.error('Error clearing orders file:', err);
            return;
        }
        console.log('Orders file cleared successfully.');
    });
}

// Clear the orders file before starting
clearOrdersFile();

async function printBalance(btcPrice) {
    try {
        const balance = await binance.fetchBalance();
        const total = balance.total;
        console.log(`Balance: BTC ${total.BTC}, USDT: ${total.USDT}`);
        USD = (total.BTC - 1) * btcPrice + total.USDT;
        console.log(`Total USD: ${USD} \n`);


        // Update the chart data
        usdHistory.push(USD);
        saveUsdHistory();

    } catch (error) {
        console.error('Error fetching balance:', error);
    }
}
// printBalance();

async function tick() {
    try {
        const symbol = 'BTC/USDT';
        const timeframe = '1m';
        const limit = 5;
        const ohlcv = await binance.fetchOHLCV(symbol, timeframe, undefined, limit);

        const formattedData = ohlcv.map(candle => {
            return {
                timestamp: candle[0],
                open: candle[1],
                high: candle[2],
                low: candle[3],
                close: candle[4],
                volume: candle[5],
            };
        });

        const averagePrice = formattedData.reduce((acc, candle) => acc + candle.close, 0) / limit;
        const lastClosePrice = formattedData[limit - 1].close;

        console.log(formattedData.map(p => p.close), averagePrice, lastClosePrice);

        const direction = lastClosePrice > averagePrice ? 'sell' : 'buy';

        const TRADE_SIZE = 50;
        const quantity = 200 / lastClosePrice;

        const order = await binance.createMarketOrder(symbol, direction, quantity);
        console.log(`${moment().format()}: ${direction}${quantity} BTC at ${lastClosePrice}`);
        const DisplayOrder = {
            Timestamp: moment().format(),
            Signal: direction,
            Quantity: quantity,
            LastClosePrice: lastClosePrice
        };

        // Store the order data in a JSON file
        storeOrder(DisplayOrder);

        await printBalance(lastClosePrice);
    } catch (error) {
        console.error('Error in tick function:', error);
    }
}

// Set up the interval to run every 1 minute (60 seconds)
const intervalId = setInterval(tick, 6000);

// Save usdHistory to a JSON file
function saveUsdHistory() {
    fs.writeFileSync('usdHistory.json', JSON.stringify(usdHistory), 'utf-8');
}

// Express.js web server to display the USD chart
const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/usdHistory', (req, res) => {
    res.json(usdHistory);
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

// To stop the interval after a certain number of iterations (e.g., 5 times)
let iterations = 0;
const maxIterations = 500;

function stopInterval() {
    clearInterval(intervalId);
    console.log("Interval stopped.");
}

// Check the number of iterations and stop the interval after reaching the limit
function checkIterations() {
    iterations++;
    if (iterations === maxIterations) {
        stopInterval();
    }
}

function storeOrder(orderData) {
    // Read existing data from the file
    fs.readFile('orders.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

        let orders = [];

        // Parse existing JSON data if available
        if (data) {
            try {
                orders = JSON.parse(data);
            } catch (error) {
                console.error('Error parsing JSON data:', error);
                return;
            }
        }

        // Add the new order data to the array
        orders.push(orderData);

        // Convert the updated array to JSON format
        const jsonData = JSON.stringify(orders, null, 2);

        // Write the JSON data back to the file
        fs.writeFile('orders.json', jsonData, 'utf8', (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return;
            }
            console.log('Order data stored successfully.');
        });
    });
}

// Set up a check to stop the interval after a certain number of iterations
setInterval(checkIterations, 60000);
