The code fetch data from binance market: get bitcoin price in real-time. 
From that data, the trading bot using simple trading algorithm compare average close prices to make order dicsion.
In this project, there is makeOrders.js allow you to make order sell/buy manually.
the bot using SMA calculation to automatically make order.

trading data are displayed in web browser by html

HOW TO RUN IT:

1.npm install ccxt moment fs

2.set your api key from https://testnet.binance.vision/

3.put your api key and secret key in key.json

4.node index.js

5. local host the show.html to view real-time data graphic

(This project is trading stimulation from real-time market data. Therefore, don't worry, you don't lost money)
