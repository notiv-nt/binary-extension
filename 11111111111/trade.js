'use strict';

const TOKEN = '8fplJWaTEUPHq6k';
const SYMBOL = 'frxNZDUSD';

let WebSocket = require('ws');
let socket = new WebSocket('wss://frontend.binaryws.com/websockets/v3');
let util = require('util');

socket.on('open', () => {
	console.log(' socket: open');

	sendAuthorize();
});

socket.on('message', (data) => {
	let _data = JSON.parse(data);

	if (_data.authorize) {
		console.log('Authorized )) ', _data.authorize.email, _data.authorize.balance);
		sendProposal();
	} else if (_data.proposal) {
		console.log('Proposal ))');
		sendBuy(_data.proposal.id);
	} else {
		console.log('Unknown message:');
		console.dir(_data);
	}
});

function sendAuthorize() {
	socket.send(
		JSON.stringify({
			authorize: TOKEN,
		})
	);
}

function sendProposal() {
	socket.send(
		JSON.stringify({
			proposal: 1,
			amount: '10',
			basis: 'payout',
			contract_type: 'CALL',
			currency: 'USD',
			duration: '2',
			duration_unit: 'm',
			symbol: SYMBOL,
		})
	);
}

function sendBuy(id) {
	socket.send(
		JSON.stringify({
			buy: id,
			price: 10,
		})
	);
}
