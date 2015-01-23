'use strict';
var request = require('request'),
    crypto = require('crypto'),
    querystring = require('querystring');

var CryptoTrade = function(apiKey, secret, options) {
  this.url = 'https://crypto-trade.com/api/1/private/';
  this.publicApiUrl = 'https://crypto-trade.com/api/1/';
  this.timeout = 5000;
  this.apiKey = apiKey;
  this.secret = secret;
  this._strictSSL = true;

  if (typeof options === 'function') {
    this.nonce = options;
  } else if (options) {
    this.nonce = options.nonce;
    this.agent = options.agent;

    if (typeof options.timeout !== 'undefined') {
      this.timeout = options.timeout;
    }
    if (typeof options.tapi_url !== 'undefined') {
      this.url = options.tapi_url;
    }
    if (typeof options.public_url !== 'undefined') {
      this.publicApiUrl = options.public_url;
    }
    if (typeof options.strict_ssl !== 'undefined') {
      this._strictSSL = !!options.strict_ssl;
    }
  }
};

CryptoTrade.prototype._sendRequest = function (options, callback) {
  var self = this;
  var requestOptions = {
    timeout: self.timeout,
    agent: self.agent,
    strictSSL: self._strictSSL
  };

  for (var key in options) {
    requestOptions[key] = options[key];
  }

  request(requestOptions, function(err, response, body) {
    if(err || response.statusCode !== 200) {
      return callback(new Error(err || response.statusCode));
    }

    var result;
    try {
      result = JSON.parse(body);
    } catch(error) {
      return callback(error);
    }

    if(result.error) {
      return callback(new Error(result.error));
    }

    return callback(null, result);
  });
};

CryptoTrade.prototype.makeRequest = function(method, params, callback) {
  var self = this;

  if(!self.apiKey || !self.secret) {
    return callback(new Error('Must provide API key and secret to use the trade API.'));
  }

  // If the user provided a function for generating the nonce, then use it.
  if(self.nonce) {
    params.nonce = self.nonce();
  } else {
    params.nonce = Math.round((new Date()).getTime() / 1000);
  }

  var formData = {};
  for (var key in params) {
    formData[key] = params[key];
  }
  formData.method = method;

  var form = querystring.stringify(formData);
  var sign = crypto.createHmac('sha512', self.secret).update(new Buffer(form)).digest('hex').toString();

  return self._sendRequest({
    url: self.url,
    method: 'POST',
    form: form,
    headers: {
      AuthSign: sign,
      AuthKey: self.apiKey
    }
  }, callback);
};

CryptoTrade.prototype.makePublicApiRequest = function(method, pair, callback) {
  this._sendRequest({
    url: this.publicApiUrl + method + '/' + pair;
  }, callback);
};

CryptoTrade.prototype.getInfo = function(callback) {
  this.makeRequest('getinfo', {}, callback);
};

CryptoTrade.prototype.tradesHistory = function(params, callback) {
  this.makeRequest('tradeshistory', params, callback);
};

CryptoTrade.prototype.ordersHistory = function(params, callback) {
  this.makeRequest('ordershistory', params, callback);
};

CryptoTrade.prototype.transactions = function(params, callback) {
  this.makeRequest('transactions', params, callback);
};

CryptoTrade.prototype.orderInfo = function(pair, orderid, callback) {
  this.makeRequest('orderinfo', {
	  'orderid' : orderid
	  }, callback);
};

CryptoTrade.prototype.trade = function(pair, type, price, amount, callback) {
  this.makeRequest('trade', {
	'pair' : pair,
    'type': type,
    'price': price,
    'amount': amount
  }, callback);
};

CryptoTrade.prototype.cancelOrder = function(pair, orderid, callback) {
  this.makeRequest('cancelorder', {
	  'orderid' : orderid
	  }, callback);
};


CryptoTrade.prototype.ticker = function(pair, callback) {
  this.makePublicApiRequest('ticker', pair, callback);
};

CryptoTrade.prototype.getPair = function(pair, callback) {
  this.makePublicApiRequest('getpair', pair, callback);
};

CryptoTrade.prototype.depth = function(pair, callback) {
  this.makePublicApiRequest('depth', pair, callback);
};

CryptoTrade.prototype.tradesHistory = function(pair, callback) {
  this.makePublicApiRequest('tradeshistory', pair, callback);
};

CryptoTrade.prototype.tradesHistoryWithTime = function(pair, timestamp, callback) {
  this.makePublicApiRequest('tradeshistory', pair + '/' + timestamp, callback);
};


CryptoTrade.prototype.tickers = function(callback) {
  this.makePublicApiRequest('tickers', '', callback);
};

CryptoTrade.prototype.getPairs = function(callback) {
  this.makePublicApiRequest('getpairs', '', callback);
};

module.exports = CryptoTrade;
