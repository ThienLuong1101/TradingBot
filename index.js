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
    const lastClosePrice = bPrices[limit - 1].close;
    return bPrices;
}

// Simple Moving Average calculation
function calculateSMA(prices, period) {
    const smaArray = [];
    for (let i = 0; i < prices.length; i++) {
        if (i >= period - 1) {
            const sum = prices.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.close, 0);
            smaArray.push(sum / period);
        } else {
            smaArray.push(null);
        }
    }
    return smaArray;
}

async function TradingBot(prices) {
    const shortLimit = 5;
    const longLimit = 30;
    const shortSMA = calculateSMA(prices, shortLimit);
    const longSMA = calculateSMA(prices, longLimit);

    const lastShortSMA = shortSMA[shortSMA.length - 1];
    const lastLongSMA = longSMA[longSMA.length - 1];
    const prevShortSMA = shortSMA[shortSMA.length - 2];
    const prevLongSMA = longSMA[longSMA.length - 2];

    let LongTrend;
    let ShortTrend;
    if (prevShortSMA < prevLongSMA) {
        LongTrend = 'downLongTrend';
    } else if (prevShortSMA > prevLongSMA) {
        LongTrend = 'upLongTrend';
    } else {
        LongTrend = '?';
    }

    if (lastShortSMA < lastLongSMA) {
        ShortTrend = 'downShortTrend';
    } else if (lastShortSMA > lastLongSMA) {
        ShortTrend = 'upShortTrend';
    } else {
        ShortTrend = '?';
    }
    let signal = '';
    if (LongTrend == 'downLongTrend' && ShortTrend == 'upShortTrend') {
        signal = 'BUY';
    } else if (LongTrend == 'upLongTrend' && ShortTrend == 'downShortTrend') {
        signal = 'SELL';
    } else {
        signal = 'HOLD';
    }

    return signal;
}

async function makeOrder(symbol, signal, quantity, lastClosePrice) {
    try {
        if (signal !== 'HOLD') {
            const order = await binance.createMarketOrder(symbol, signal.toUpperCase(), quantity);
            console.log(`${moment().format()}: ${signal} ${quantity} BTC at ${lastClosePrice}`);
        } else {
            console.log('HOLD');
        }
    } catch (error) {
        console.error('Error making order:', error);
    }
}

async function printBalance(lastClosePrice) {
    try {
        const balance = await binance.fetchBalance();
        const total = balance.total;
        console.log(`Balance: BTC ${total.BTC}, USDT: ${total.USDT}`);
    } catch (error) {
        console.error('Error fetching balance:', error);
    }
}

async function calculateTotalUSD(lastClosePrice) {
    try {
        const balance = await binance.fetchBalance();
        const total = balance.total;
        const totalUSD = (total.BTC - 1)* lastClosePrice + total.USDT;
        return totalUSD;
    } catch (error) {
        console.error('Error fetching balance:', error);
    }
}

async function main() {
    const symbol = 'BTC/USDT';
    const timeframe = '1m';
    const limit = 50;
    const prices = await BinanceData(symbol, timeframe, limit);
    const lastClosePrice = prices[limit - 1].close;
    const quantity = 200 / lastClosePrice;
    const decision = await TradingBot(prices);
    await makeOrder(symbol, decision, quantity, lastClosePrice);
    //draw data in line graph


}

main();

setInterval(main, 60000);

