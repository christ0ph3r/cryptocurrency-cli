#! /usr/bin/env node
require('dotenv').config();

const request = require('request');
const chalk = require('chalk');
const Table = require('cli-table');
const figlet = require('figlet');
const Barcli = require("barcli");
const path = require('path');
const program = require('commander');
const getSymbolFromCurrency = require('currency-symbol-map');
const portfolio = require(path.resolve(__dirname,'portfolio.json'));

/**
 * Command Line Options
 */

program
  .version('1.4.3')
  .option('-c, --currency [value]', 'An optional currency value', 'USD')
  .parse(process.argv);

/**
 * Set currency
 */
var curUp = program.currency.toUpperCase();
var curLow = program.currency.toLowerCase();
var curSym = getSymbolFromCurrency(curUp);

/**
 * Loading Message Figlet Style
 */

figletLog('Crypto Portfolio Loading...');

/**
 * Request and table
 */
const requestUrl = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?sort=market_cap&start=1&limit=5000&convert=' + curUp + '&CMC_PRO_API_KEY='+process.env.CMC_PRO_API_KEY;

request(requestUrl, function (error, response, body) {
  var response = JSON.parse(body);
  var data = response.data;
  var table = new Table({ head: [
    chalk.blue('Rank'),
    chalk.blue('Coin'),
    chalk.blue(`${curUp} Price`),
    chalk.blue('Coins Owned'),
    chalk.blue('Net Worth'),
    chalk.blue('24 Hour Volume'),
    chalk.blue('Market Cap'),
    chalk.blue('1 Hour'),
    chalk.blue('24 Hours'),
    chalk.blue('7 Days'),
    chalk.blue('Last Updated'),
  ] });
  var portfolioTotal = 0;
  var barData = {};
  data.forEach(function (value, key) {
    if(portfolio.hasOwnProperty(value.slug)) {
      table.push([
        chalk.blue(value.cmc_rank),
        chalk.green(value.name),
        chalk.green(curSym+addCommas(value.quote[curUp].price.toFixed(8))),
        chalk.green(addCommas(portfolio[value.slug])),
        chalk.green(curSym+addCommas(Number(Math.round(value.quote[curUp].price * portfolio[value.slug])))),
        chalk.green(curSym+addCommas(value.quote[curUp].volume_24h)),
        chalk.green(curSym+addCommas(value.quote[curUp].market_cap)),
        chalk.green(`${value.quote[curUp].percent_change_1h}%`),
        chalk.green(`${value.quote[curUp].percent_change_24h}%`),
        chalk.green(`${value.quote[curUp].percent_change_7d}%`),
        chalk.green(value.quote[curUp].last_updated),
      ]);
      var totalValue = Number(Math.round(value.quote[curUp].price * portfolio[value.slug]));
      var coinName = value.name;
      barData[coinName] = totalValue;
      portfolioTotal += totalValue;
    }
  });
  barGraph(barData, portfolioTotal);
  console.log('\n'+table.toString());
  console.log(chalk.underline.blue(`Portfolio Total: ${curSym}${portfolioTotal}`));
  console.log(' ');
});

/**
 * Figlet console log
 */

function figletLog(text) {
  figlet(text, function(err, data) {
    if (err) {
      console.log('Something went wrong...');
      console.dir(err);
      return;
    }
    console.log(data)
  });
}

/**
 * Bar Graphs For Coins
 */

function barGraph(barData, total) {
  Object.keys(barData).forEach(function(key) {
    var label = `${key} ${curSym}${barData[key]}`;
    var graph = new Barcli({
      label: label,
      range: [0, 100],
    });
    var percent = Math.round((barData[key] / total) * 100);
    graph.update(percent);
  });
}

/**
* Comma seperate big numbers
* Took multiple answers
* from https://stackoverflow.com/questions/1990512/add-comma-to-numbers-every-three-digits/
* This work with small coins like dogecoin and does not comma seperate AFTER decimals
*/

function addCommas(nStr){
  nStr += '';
  x = nStr.split('.');
  x1 = x[0];
  x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }
  return x1 + x2;
};

