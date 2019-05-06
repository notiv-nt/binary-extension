<template>
<div class="host">
  <table>
    <tr>
      <th>Balance</th>
      <th>Account</th>
      <th>Token</th>
    </tr>

    <tr>
      <td>{{ locBalance }}</td>
      <td>{{ account.isVirtual ? 'virtual' : 'real' }}</td>
      <td>{{ config.token }}</td>
    </tr>
  </table>

  <div class="flex">
    <label class="form-field flex-col-2">
      <select v-model="params.symbol" class="form-control">
        <option value="" disabled selected hidden>Symbol</option>
        <option :value="symbol.symbol" v-for="symbol in locSymbols">{{ symbol.display_name }}</option>
      </select>
    </label>

    <label class="form-field flex-col-6">
      <input
        class="form-control"
        v-model.number="config.amount"
        placeholder="Amount $"
      >
    </label>
  </div>

  <div class="deal-wrap">
    <h2 class="deal-title">Deals</h2>

    <button @click="addDeal" class="add-deal">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 491.86 491.86"><path d="M465.167 211.614H280.245V26.691c0-8.424-11.439-26.69-34.316-26.69s-34.316 18.267-34.316 26.69v184.924H26.69C18.267 211.614 0 223.053 0 245.929s18.267 34.316 26.69 34.316h184.924v184.924c0 8.422 11.438 26.69 34.316 26.69s34.316-18.268 34.316-26.69V280.245H465.17c8.422 0 26.69-11.438 26.69-34.316s-18.27-34.315-26.693-34.315z"/></svg>
    </button>
  </div>

  <div v-for="deal in deals" @click.right="removeDeal(deal, $event)">
    <div class="flex">
      <label class="form-field flex-col-4">
        <!-- <span class="form-label">Duration</span> -->

        <input
          type="number"
          class="form-control"
          v-model.number="deal.duration"
          placeholder="Duration"
        >
      </label>

      <label class="form-field flex-col-3">
        <!-- <span class="form-label">Unit</span> -->

        <select v-model="deal.duration_unit" class="form-control">
          <option value="" disabled selected hidden>Unit</option>
          <option value="t">Ticks</option>
          <option value="s">Seconds</option>
          <option value="m">Minutes</option>
          <option value="h">Hours</option>
          <option value="d">Days</option>
        </select>
      </label>

      <button @click="buyContract(deal, 'call')" class="buy flex-col">Buy</button>
      <button @click="buyContract(deal, 'put')" class="sell flex-col">Sell</button>
    </div>
  </div>

  <div class="alert-danger" v-if="error">{{ error }}</div>

  <div class="config">
    <h2 @click="config.isVisible = !config.isVisible">Config</h2>

    <div v-if="config.isVisible">
      <div class="form-field">
        <input
          type="text"
          class="form-control"
          placeholder="Token"
          v-model="config.token"
          @change="authorize()"
        >
      </div>

      <div class="form-field">
        <input
          type="text"
          class="form-control"
          placeholder="% of amount"
          v-model.number="config.percent"
          @input="onPercentChange"
        >
      </div>

      <label class="form-field">
        <select v-model="params.basis" class="form-control">
          <option value="" disabled selected hidden>Basis</option>
          <option value="payout">Payout</option>
          <option value="stake">Stake</option>
          <option value="multiplier">Multiplier</option>
        </select>
      </label>

    </div>
  </div>

</div>
</template>

<script>
import BinaryApi from './BinaryApi';

const defaultConfig = JSON.stringify({
  isVisible: true,
  percent: null,
  amount: 2,
  token: '',
});

export default {
  data: () => ({
    api: new BinaryApi('8fplJWaTEUPHq6k'),

    config: JSON.parse(localStorage.getItem('BA_CONFIG') || defaultConfig),

    account: {
      balance: {
        value: '',
        currency: 'USD',
      },
      loginId: null,
      isVirtual: false,
    },

    symbols: [],
    deals: [
      { duration: 5, duration_unit: 'm' },
      { duration: 15, duration_unit: 'm' },
    ],

    params: {
      symbol: '',
      basis: 'stake',
    },

    error: null,
    intervals: [],
  }),

  computed: {
    locSymbols() {
      return this.symbols.filter((s) => {
        return ['forex', 'indices'].includes(s.market) && s.exchange_is_open;
      });
    },

    locBalance() {
      const currencies = {
        USD: '$',
        EUR: '€',
      };

      return `${currencies[this.account.balance.currency]} ${this.account.balance.value}`;
    },
  },

  methods: {
    async getBalance() {
      const { balance } = await this.api.send({
        balance: 1,
      });

      this.account.balance.value = balance.balance;
    },

    async getSymbols() {
      const { active_symbols } = await this.api.send({
        active_symbols: 'full',
        product_type: 'basic',
      });

      this.symbols = active_symbols;
    },

    async buyContract(deal, type) {
      const res = await this.api
        .send({
          buy: 1,
          parameters: {
            ...this.params, // symbol, basis
            ...deal, // duration, duration_unit
            amount: this.config.amount,
            contract_type: type.toUpperCase(),
            currency: 'USD',
          },
          price: this.config.amount,
        })
        .catch((e) => e);

      if (res.message && res.code) {
        this.error = res.message;
        return;
      }
    },

    addDeal() {
      this.deals.push({
        duration: 5,
        duration_unit: 'm',
      });
    },

    removeDeal(deal, e) {
      e.preventDefault();

      let index = this.deals.indexOf(deal);

      this.deals.splice(index, 1);
    },

    tryToSetCurrency(currency) {
      const f = (a) => a.trim().toUpperCase().replace(/\//g, '');

      const isFound = this.locSymbols.find((symbol) => {
        return f(symbol.display_name) === f(currency);
      });

      if (isFound) {
        this.params.symbol = isFound.symbol;
      }
    },

    watchForCurrency() {
      let prevValue = null;

      const f = () => {
        let value = null;
        const input = document.querySelector('#header-toolbar-symbol-search input');

        if (!input) {
          console.warn('BinaryApi input was not found');

          value = document.title.split(':')[0];
        }
        else {
          value = input.value;
        }

        // if (prevValue !== value) {
          // TODO:
         this.tryToSetCurrency(value);
        // }

        prevValue = value;
      }

      setInterval(f, 200);

      f();
    },

    async authorize() {
      const { authorize } = await this.api.send({
        authorize: this.config.token,
      });

      this.account.balance.value = authorize.balance;
      this.account.balance.currency = authorize.currency;
      this.account.isVirtual = authorize.is_virtual;
      this.account.loginId = authorize.loginId;

      this.getSymbols();

      this.intervals.push(setInterval(() => {
        this.getBalance();
      }, 3000));

      this.intervals.push(setInterval(() => {
        this.getSymbols();
      }, 10000));

      this.watchForCurrency();
    },

    onPercentChange() {
      if (this.config.percent) {
        const percent = this.getBalancePercent();

        this.config.amount = parseInt(percent);
      }
    },

    getBalancePercent() {
     return this.account.balance.value * (this.config.percent / 100);
    }
  },

  watch: {
    config: {
      handler(n, o) {
        localStorage.setItem('BA_CONFIG', JSON.stringify(n));
      },
      deep: true
    }
  },

  mounted() {
    this.api.on('open', () => {
      this.authorize();
    });
  },

  errorHandler(err, vm, info) {
    console.log(err, vm, info);
  }
};
</script>

<style>
.widgetbar-widget-detail .dl-data > * {
  display: none !important;
}
</style>

<style lang="scss" scoped>
.host {
  font: 13px/1.4 'Trebuchet MS', Arial, sans-serif;
  color: #333;
  padding: 1em;
  display: block !important;

  *:not(path) {
    all: unset;
    box-sizing: border-box;
  }

  .form-field {
    display: block;
    margin-bottom: .5rem;
  }

  .form-label {
    display: block;
    font-weight: 600;
    margin-bottom: .3em;
  }

  .form-control {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background: #fff;
    border-radius: 3px;
    border: 1px solid #d8d8d8;
    display: block;
    width: 100%;
    font: inherit;
    padding: 0 0.7em;
    height: 1.8rem;
    line-height: 1.8rem;
  }

  .form-control::placeholder {
    color: #bbb;
  }

  .form-control:hover,
  .form-control:focus {
    border-color: #09f;
  }

  .form-control:focus {
    box-shadow: 0 0 3px #09f;
  }

  select.form-control {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 451.847 451.847'%3E%3Cpath d='M225.923 354.706c-8.098 0-16.195-3.092-22.369-9.263L9.27 151.157c-12.359-12.359-12.359-32.397 0-44.751 12.354-12.354 32.388-12.354 44.748 0l171.905 171.915 171.906-171.909c12.359-12.354 32.391-12.354 44.744 0 12.365 12.354 12.365 32.392 0 44.751L248.292 345.449c-6.177 6.172-14.274 9.257-22.369 9.257z'/%3E%3C/svg%3E");
    background-position: right 0.5em center;
    background-repeat: no-repeat;
    background-size: 0.7em;
  }

  .flex {
    display: flex;
    margin: 0 -0.5em;
  }

  .flex-col,
  .flex-col-1,
  .flex-col-2,
  .flex-col-3,
  .flex-col-4,
  .flex-col-5,
  .flex-col-6 {
    margin-left: .5em;
    margin-right: .5em;
    flex-shrink: 0;
    flex-grow: 1;
  }

  .flex-col-1 { width: calc(100% / 1 - 1em); }
  .flex-col-2 { width: calc(100% / 2 - 1em); }
  .flex-col-3 { width: calc(100% / 3 - 1em); }
  .flex-col-4 { width: calc(100% / 4 - 1em); }
  .flex-col-5 { width: calc(100% / 5 - 1em); }
  .flex-col-6 { width: calc(100% / 6 - 1em); }

  .add-deal {
    float: right;
    color: #000;
  }

  .deal-wrap {
    border-top: 1px solid #f1f3f6;
    margin: 1em 0 1em;
    padding-top: 1em;
    display: block;
  }

  .deal-wrap::after {
    content: '';
    display: block;
    clear: both;
  }

  .deal-title {
    font-size: 1.5em;
    font-weight: bold;
  }

  .add-deal {
    padding: .3rem .5rem;
    cursor: pointer;
    margin: -.2rem;
    border-radius: 50%;
  }

  .add-deal:hover {
    background-color: #f0f0f0;
  }

  .add-deal svg {
    display: inline-block;
    vertical-align: middle;
    width: 1em;
    height: 1em;
    fill: currentColor;
    color: currentColor;
  }

  .sell,
  .buy {
    padding: 0 .5rem;
    align-self: center;
    border-radius: 5px;
    border: 1px solid transparent;
    letter-spacing: 0.07em;
    line-height: 1;
    font-weight: 300;
    text-align: center;
    text-transform: uppercase;
    cursor: pointer;
    height: 1.8rem;
    line-height: 1.8rem;
  }

  .buy {
    background: #2196f3;
    color: #fff;
  }

  .sell {
    background: #ef5350;
    color: #fff;
  }

  .alert-danger {
    color: #000;
    letter-spacing: .05em;
    font-size: 1.4em;
    display: block;
    background-color: #f8d7dac0;
    padding: .3rem .7rem;
    border: 1px solid #f8aaa4;
    border-radius: 4px;
    margin: .5rem 0;
  }

  table {
    display: table;
    table-layout: fixed;
    width: 100%;
  }

  tr {
    display: table-row;
  }

  td, th {
    display: table-cell;
  }
}
</style>
