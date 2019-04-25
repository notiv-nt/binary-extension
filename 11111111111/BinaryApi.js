'use strict';

// @ngInject
function BinaryApiService() {
	this._url = 'wss://ws.binaryws.com/websockets/v3?app_id=16288';
	this._socket = null;
	this._secretKey = '__BinaryApiSecret';
	this._secretCounter = 0;
	this._authorized = false;
	this._connected = false;
	this._events = [];
	this._pending = [];
	this._user = {};
	this._debug = true;

	this.config = {};

	this._init();
}

// private
BinaryApiService.prototype._init = function() {
	let self = this;

	if (this._debug) {
		console.log('_init');
		console.log('');
	}

	try {
		this._socket = new WebSocket(this._url);
	} catch (e) {
		return console.dir(e);
	}

	this._socket.onopen = this._onOpen.bind(this);
	this._socket.onclose = this._onClose.bind(this);
	this._socket.onerror = this._onError.bind(this);
	this._socket.onmessage = this._onMessage.bind(this);

	self._update();
};

BinaryApiService.prototype._update = function() {
	let self = this;

	setTimeout(() => {
		self.send({
			ping: 1,
		});

		self._update();
	}, 10000);
};

BinaryApiService.prototype._onOpen = function() {
	if (this._debug) {
		console.log('_onOpen');
		console.log('');
	}

	this._connected = true;

	for (let i = 0, len = this._pending.length; i < len; i++) {
		let a = this._pending[i];

		this.send(a[0], a[1]);
	}

	this._pending = [];
};

BinaryApiService.prototype._onClose = function() {
	if (this._debug) {
		console.log('_onClose');
		console.log('');
	}

	this._connected = false;
};

BinaryApiService.prototype._onError = function(e) {
	if (this._debug) {
		console.log('_onError');
		console.dir(e);
		console.log('');
	}

	this._connected = false;
};

BinaryApiService.prototype._onMessage = function(e) {
	let data = JSON.parse(e.data);

	if (this._debug && data.msg_type !== 'ping') {
		console.log('_onMessage');
		console.dir(data);
		console.log('');
	}

	if (!data) {
		return;
	}

	if (data && data.echo_req) {
		let key = data.echo_req[this._secretKey];

		if (this._events[key] && typeof this._events[key] === 'function') {
			this._events[key](data.error, data);
		}
	}
};

// public
BinaryApiService.prototype.getActiveSymbols = function(cb) {
	if (this._debug) {
		console.log('getActiveSymbols');
		console.log('');
	}

	let self = this;

	this.send(
		{
			active_symbols: 'brief',
		},
		(err, res) => {
			let symbols = {};

			if (!res.active_symbols && !res.active_symbols[0]) {
				return cb(null, null);
			}

			for (let i = 0, len = res.active_symbols.length; i < len; i++) {
				let _s = res.active_symbols[i];
				let it = true;

				// only available
				if (!_s.exchange_is_open) {
					continue;
				}

				if (self.config && self.config.onlyForex && _s.symbol_type !== 'forex') {
					it = false;
				}

				if (it) {
					symbols[_s.symbol] = _s.display_name;
				}
			}

			cb(null, symbols);
		}
	);
};

BinaryApiService.prototype.getProposal = function(opt, cb) {
	if (this._debug) {
		console.log('getProposal');
		console.dir(opt);
		console.log('');
	}

	this.send(
		{
			proposal: 1,
			// TODO: currency get from user's object
			currency: 'USD',
			duration: Number(opt.duration),
			duration_unit: opt.duration_unit,
			basis: opt.basis,
			amount: Number(opt.amount),
			contract_type: opt.contract_type,
			symbol: opt.symbol,
		},
		(err, res) => {
			cb(err, res.proposal);
		}
	);
};

BinaryApiService.prototype.buy = function(opt, callback) {
	opt.currency = this._user.currency;
	opt.duration = Number(opt.duration);
	opt.amount = Number(opt.amount);

	if (this._debug) {
		console.log('buy');
		console.dir(opt);
		console.log('');
	}

	let self = this;

	// this.getProposal(opt, (err, proposal) => {
	// if (err && err.message) {
	// return callback(err, null);
	// }

	console.dir({
		buy: 1,
		price: opt.amount + 1,
		parameters: opt,
	});
	return;

	self.send(
		{
			// buy: proposal.id,
			buy: 1,
			price: opt.amount + 1,
			parameters: opt,
		},
		callback
	);
	// });
};

BinaryApiService.prototype.send = function(msg, cb) {
	if (this._debug && !msg.ping) {
		console.log('send');
		console.dir(msg);
		console.log('');
	}

	if (this._socket.readyState !== 1) {
		return this._pending.push([msg, cb]);
	}

	// push secretKey
	let secret = this._secretCounter++;
	msg[this._secretKey] = secret;

	this._events[secret] = cb;
	this._socket.send(JSON.stringify(msg));
};

BinaryApiService.prototype.connect = function(config, cb) {
	if (this._debug) {
		console.log('connect');
		console.dir(config);
		console.log('');
	}

	this.config = config;

	this.send(
		{
			authorize: this.config.token,
		},
		(err, res) => {
			this._user = res.authorize;

			cb(res.authorize);

			this._authorized = true;
		}
	);

	return this;
};

BinaryApiService.prototype.getBalance = function(cb) {
	if (this._debug) {
		console.log('getBalance');
		console.log('');
	}

	this.send(
		{
			balance: 1,
		},
		cb
	);
};

angular.module('app').service('BinaryApiService', BinaryApiService);
