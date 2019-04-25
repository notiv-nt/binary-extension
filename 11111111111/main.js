
'use strict';

angular
	.module('app', [])
	.controller('MainCtrl', MainCtrl);


// @ngInject
function MainCtrl($scope, $timeout, $interval, BinaryApiService) {
	var vm = $scope;
	let temp = {

	};

	vm.option = JSON.parse(localStorage.getItem('bn_option') || '{}');

	vm.units = {
		't': 'Тиков',
		's': 'Секунд',
		'm': 'Минут',
		'h': 'Часов',
		'd': 'Дней'
	};

	vm.api = null;
	vm.activeSymbols = {};
	vm.config = JSON.parse(localStorage.getItem('bn_config') || '{}');

	vm.put = put;
	vm.call = call;
	vm.connect = connect;

	vm.$watch('config', (_new) => {
		if (_new.percentageOfDepo && vm.user) {
			getPercentageOfDepo();
		}

		if (_new.countOfCandles && vm.user) {
			watchTimeframe();
		}

		localStorage.setItem('bn_config', JSON.stringify(_new));
	}, true);

	vm.$watch('option', (_new) => {
		localStorage.setItem('bn_option', JSON.stringify(_new));
	}, true);

	connect();

	if (vm.config.countOfCandles) {
		watchTimeframe();
	}

	if (vm.config.autoDetectCurrency) {
		watchCurrency();
	}

	return vm;

	function watchCurrency() {
		if (temp.currencyInterval) {
			return;
		}

		var prev = null;

		getCurrency((a) => prev = a);

		temp.currencyInterval = $interval(() => {
			getCurrency(function(currency) {
				var next = currency;

				if (!vm.config.autoDetectCurrency) {
					return;
				}

				if (vm.activeSymbols[next]) {
					vm.option.symbol = next;
				}
			});
		}, 200);

		function getCurrency(cb) {
			if (chrome && !chrome.tabs) {
				cb(fromTitle(document.title));
			} else {
				chrome.tabs.query({
					active: true
				}, function(tabs) {
					for (var i = 0, len = tabs.length; i < len; i++) {
						var tab = tabs[i];
						var trReg = /https?\:[a-z\.\/]+tradingview\.com\/chart.+/i;

						if (trReg.test(tab.url)) {
							cb(fromTitle(tab.title));
							break;
						}
					}
				});
			}

			function fromTitle(title) {
				var reg = /(?:^(.+)\:)/i;
				var currency = reg.exec(title);

				if (currency) {
					return 'frx' + currency[1];
				}
			}
		}
	}

	function watchTimeframe() {
		if (temp.timeframeInterval) {
			return;
		}

		temp.timeframeInterval = $interval(() => {
			if (!vm.config.countOfCandles) {
				return temp.timeframeInterval.cancel();
			}

			getTimeframe(function(tf) {
				tf = normalizeTimeframe(tf);

				if (!tf) {
					return;
				}

				vm.option.duration_unit = tf[1];
				vm.option.duration = String(tf[0] * vm.config.countOfCandles);
			});
		}, 200);

		function getTimeframe(cb) {
			if (chrome && !chrome.tabs) {
				return;
			}

			// return tab {object}
			chrome.tabs.getSelected(function(tab) {
				if (!isTradingview(tab)) {
					return;
				}

				// return tf in page
				chrome.tabs.executeScript(tab.id, { code: "document.querySelector('.intervals-container .quick .selected').innerHTML;"}, function(data) {
					cb(data[0]);
				});
			});
		}

		function normalizeTimeframe(str) {
			var last = String(str[str.length - 1]);
			var i = parseInt(str);

			if (last.charCodeAt(0) >= 48 && last.charCodeAt(0) <= 57) {
				return [i, 'm'];
			}

			if (last === 'h') { return [i, 'h'] }
			if (last === 'D') { return [i, 'd'] }
		}

	}

	function isTradingview(tab) {
		var trReg = /https?\:[a-z\.\/]+tradingview\.com\/chart.+/i;

		if (trReg.test(tab.url)) {
			return true;
		}
	}

	function connect() {
		vm.api = BinaryApiService.connect(vm.config, (data) => {
			vm.user = data;
			vm.$apply();

			vm.api.getActiveSymbols((err, symbols) => {
				vm.activeSymbols = symbols || {};
				vm.$apply();

				if (vm.config.percentageOfDepo) {
					getPercentageOfDepo();
				}
			});
		});
	}

	function getPercentageOfDepo() {
		var p = vm.config.percentageOfDepo / 100;

		if (p) {
			vm.option.amount = parseInt(vm.user.balance * p);
		}
	}

	function put() {
		var opt = angular.extend({
			contract_type: 'PUT'
		}, vm.option);

		buy(opt);
	}

	function call() {
		var opt = angular.extend({
			contract_type: 'CALL'
		}, vm.option);

		buy(opt);
	}

	function buy(opt) {
		vm.errorMessage = null;
		vm.successMessage = false;

		vm.api.buy(opt, (err, res) => {
			if (err) {
				return $timeout(() => {
					vm.errorMessage = err.message;
				});
			}

			$timeout(() => {
				vm.successMessage = true;
			});
		});
	}
}
