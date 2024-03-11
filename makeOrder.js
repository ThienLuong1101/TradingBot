const ccxt = require('ccxt');
const moment = require('moment');
const fs = require('fs');
const config = require('./key');

//fetch data from binance spot test network
const binance = new ccxt.binance({
    apiKey: config.binance.apiKey,
    secret: config.binance.secret,
});
binance.setSandboxMode(true); //stimulation trading


//access to binance market data in real-time
async function BinanceData(symbol, timeframe, limit) {
    const binance = new ccxt.binance();
    const prices = await binance.fetchOHLCV(symbol, timeframe, undefined, limit);
    const bPrices = prices.map(price => {
        return {
            timestamp: moment(price[0].format),
            open: price[1],
            high: price[2],
            low: price[3],
            close: price[4],
            volume: price[5]
        }
    })
    return bPrices;
}

async function makeOrder(symbol, signal, quantity, lastClosePrice) {
    try {
        const order = await binance.createMarketOrder(symbol, signal.toUpperCase(), quantity);
        console.log(`${moment().format()}: ${signal} ${quantity} BTC at ${lastClosePrice}`);
        const DisplayOrder = {
            Timestamp: moment().format(),
            Signal: signal,
            Quantity: quantity,
            LastClosePrice: lastClosePrice
        };

        // Store the order data in a JSON file
        storeOrder(DisplayOrder);

    } catch (error) {
        console.error('Error making order:', error);
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

async function main() {
    const symbol = 'BTC/USDT';
    const timeframe = '1m';
    const limit = 50;
    const prices = await BinanceData(symbol, timeframe, limit);
    const lastClosePrice = prices[limit - 1].close;
    const quantity = 300 / lastClosePrice;
    const decision = 'BUY'
    await makeOrder(symbol, decision, quantity, lastClosePrice);
}

main();