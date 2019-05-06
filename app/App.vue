<template>
<div class="host">

  <nav class="nav">
    <button
      type="button"
      class="nav-button"
      :disabled="!config.realToken"
      :class="{ 'is-active': currentTab === 'real' }"
      @click="setTab('real')"
    >Real</button>

    <button
      type="button"
      class="nav-button"
      :disabled="!config.demoToken"
      :class="{ 'is-active': currentTab === 'demo' }"
      @click="setTab('demo')"
    >Demo</button>

    <button
      type="button"
      class="nav-button"
      :class="{ 'is-active': currentTab === 'config' }"
      @click="setTab('config')"
    >Config</button>

    <div class="nav-balance" v-if="config.showBalance">{{ locBalance }}</div>
  </nav>

  <div class="body" v-if="currentTab === 'config'">
    <label class="form-group">
      <span class="form-label">Tokens</span>

      <div class="row">
        <input type="text" class="form-input" v-model="config.realToken" placeholder="Real">
        <input type="text" class="form-input" v-model="config.demoToken" placeholder="Demo">
      </div>
    </label>

    <div class="row">
      <label class="form-group">
        <span class="form-label">% of depo</span>

        <input
          class="form-input"
          placeholder="% of amount"
          v-model.number="config.percent"
          @input="onPercentChange"
        >
      </label>

      <label class="form-group">
        <span class="form-label">Basis</span>

        <select v-model="config.basis" class="form-input">
          <option value="" disabled selected hidden>Basis</option>
          <option value="payout">Payout</option>
          <option value="stake">Stake</option>
          <option value="multiplier">Multiplier</option>
        </select>
      </label>
    </div>

    <label class="form-group">
      <input type="checkbox" v-model="config.showBalance"> Show Balance
    </label>
  </div>

  <div class="body" v-if="currentTab !== 'config'">
    <div class="row">
      <label class="form-group">
        <span class="form-label">Symbol</span>

        <select v-model="symbol" class="form-input">
          <option value="" disabled selected hidden>Symbol</option>
          <option :value="symbol.symbol" v-for="symbol in locSymbols">{{ symbol.display_name }}</option>
        </select>
      </label>

      <label class="form-group">
        <span class="form-label">Amount</span>

        <input
          class="form-input"
          v-model.number="config.amount"
          placeholder="Amount $"
        >
      </label>
    </div>

    <div class="title">
      <span class="title-text">Deals</span>

      <button
        class="u-link"
        type="button"
        @click="isDealEdit = !isDealEdit"
      >{{ isDealEdit ? 'save' : 'manage' }}</button>
    </div>

    <draggable v-model="deals">
      <div
        class="row deals-row"
        v-for="deal in deals"
        :key="deal.id"
        :id="`deal-${deal.id}`"
      >
        <input class="form-input" placeholder="Duration" v-model="deal.duration">

        <select v-model="deal.duration_unit" class="form-input">
          <option :value="key" v-for="(value, key) in durationUnits">{{ value }}</option>
        </select>

        <button
          class="btn deals-btn is-buy"
          type="button"
          v-if="!isDealEdit"
          @click="buyContract(deal, 'call')"
        >Buy</button>

        <button
          class="btn deals-btn is-sell"
          type="button"
          v-if="!isDealEdit"
          @click="buyContract(deal, 'put')"
        >Sell</button>

        <button class="deals-action" type="button" v-if="isDealEdit" @click="removeDeal(deal)">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 212.982 212.982" class="u-icon">
            <path d="M131.804 106.491l75.936-75.936c6.99-6.99 6.99-18.323 0-25.312-6.99-6.99-18.322-6.99-25.312 0L106.491 81.18 30.554 5.242c-6.99-6.99-18.322-6.99-25.312 0-6.989 6.99-6.989 18.323 0 25.312l75.937 75.936-75.937 75.937c-6.989 6.99-6.989 18.323 0 25.312 6.99 6.99 18.322 6.99 25.312 0l75.937-75.937 75.937 75.937c6.989 6.99 18.322 6.99 25.312 0 6.99-6.99 6.99-18.322 0-25.312l-75.936-75.936z" fill-rule="evenodd" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    </draggable>

    <button
      class="u-link"
      type="button"
      @click="addDeal"
      v-if="isDealEdit"
    >add</button>

    <div class="u-alert is-error" v-if="error">{{ error }}</div>
  </div>

<!--   <pre>{{ config }}</pre> <hr>
  <pre>{{ account }}</pre> <hr>
  <pre>{{ deals }}</pre> <hr> -->

</div>
</template>

<script>
import draggable from 'vuedraggable';
import BinaryApi from './BinaryApi';

const defaultConfig = JSON.stringify({
  percent: 0,
  amount: 1,
  realToken: '',
  demoToken: '',
  showBalance: true,
  tab: 'config',
  basis: 'stake',
});

const defaultDeals = JSON.stringify([
  { duration: 5, duration_unit: 'm', id: String(Math.random()).replace('.', '') },
  { duration: 15, duration_unit: 'm', id: String(Math.random()).replace('.', '') },
]);

export default {
  components: {
    draggable,
  },

  data: () => ({
    api: new BinaryApi('8fplJWaTEUPHq6k'),

    currentTab: JSON.parse(localStorage.getItem('BA_CONFIG') || defaultConfig).tab,
    config: JSON.parse(localStorage.getItem('BA_CONFIG') || defaultConfig),
    deals: JSON.parse(localStorage.getItem('BA_DEALS') || defaultDeals),
    isDealEdit: false,

    account: {
      balance: '',
      currency: 'USD',
      isVirtual: false,
    },

    symbols: [],
    symbol: '',

    error: null,
    errorInterval: null,
    intervals: [],

    durationUnits: {
      t: 'Ticks',
      s: 'Seconds',
      m: 'Minutes',
      h: 'Hours',
      d: 'Days',
    },
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

      return `${currencies[this.account.currency]} ${this.account.balance}`;
    },
  },

  methods: {
    setTab(tab) {
      if (tab === 'config') {
        this.currentTab = 'config';
      }

      else {
        this.currentTab = tab;

        this.authorize(tab);
      }

      this.config.tab = tab;
    },

    async getBalance() {
      const { balance } = await this.api.send({
        balance: 1,
      });

      this.account.balance = balance.balance;
    },

    async getSymbols() {
      const { active_symbols } = await this.api.send({
        active_symbols: 'full',
        product_type: 'basic',
      });

      this.symbols = active_symbols;
    },

    async buyContract(deal, type) {
      if (this.errorInterval) {
        clearInterval(this.errorInterval);
      }

      this.error = null;

      const contract = {
        buy: 1,
        parameters: {
          duration: deal.duration,
          duration_unit: deal.duration_unit,
          symbol: this.symbol,
          amount: this.config.amount,
          basis: this.config.basis,
          contract_type: type.toUpperCase(),
          currency: 'USD',
        },
        price: this.config.amount,
      };

      const res = await this.api.send(contract).catch((e) => e);

      console.dir(res);

      if (res.message && res.code) {
        this.errorInterval = setTimeout(() => {
          this.error = null;
        }, 3000);

        this.error = res.message;
      }
    },

    addDeal() {
      const deal = {
        duration: 0,
        duration_unit: 'm',
        id: String(Math.random()).replace('.', ''),
      };

      this.deals.push(deal);
      this.$nextTick(() => {
        this.$el.querySelector(`#deal-${deal.id} input`).focus();
      });
    },

    removeDeal(deal) {
      this.deals.splice(this.deals.indexOf(deal), 1);
    },

    tryToSetCurrency(currency) {
      const f = (a) => a.trim().toUpperCase().replace(/\//g, '');

      const isFound = this.locSymbols.find((symbol) => {
        return f(symbol.display_name) === f(currency);
      });

      if (isFound) {
        this.symbol = isFound.symbol;
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

    async authorize(tab) {
      if ((tab === 'real' && !this.config.realToken) || (tab === 'demo' && !this.config.demoToken)) {
        return;
      }

      const token = tab === 'real' ? this.config.realToken : this.config.demoToken;
      const { authorize } = await this.api.send({
        authorize: token,
      });

      this.account.balance = authorize.balance;
      this.account.currency = authorize.currency;
      this.account.isVirtual = authorize.is_virtual;

      this.getSymbols();

      this.intervals.push(setInterval(() => {
        this.getBalance();
      }, 3000));

      this.intervals.push(setInterval(() => {
        this.getSymbols();
      }, 10000));

      this.watchForCurrency();

      // TODO:
      this.onPercentChange();
    },

    onPercentChange() {
      if (this.config.percent) {
        const percent = this.getBalancePercent();

        this.config.amount = parseInt(percent);
      }
    },

    getBalancePercent() {
     return this.account.balance * (this.config.percent / 100);
    }
  },

  watch: {
    config: {
      handler(n) {
        localStorage.setItem('BA_CONFIG', JSON.stringify(n));
      },
      deep: true
    },

    deals: {
      handler(n) {
        localStorage.setItem('BA_DEALS', JSON.stringify(n));
      },
      deep: true
    },
  },

  mounted() {
    this.api.on('open', () => {
      if (this.config.tab !== 'config') {
        this.authorize(this.config.tab);
      }
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
@mixin button-reset {
  background: transparent;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  justify-content: center;
  border: 0;
  font: inherit;
  padding: 0;
  cursor: pointer;
  color: inherit;
  line-height: 1;
  text-decoration: none;
  letter-spacing: inherit;
  user-select: none;
  outline: none;
}

.host {
  --ba-color-1: #8798ad;
  --ba-color-2: #333;
  --ba-color-3: #2196F3;
  --ba-color-5: #fcfcff;
  --ba-color-6: #e0e7ff;
  --ba-color-7: #eef1f6;
  --ba-color-9: #8798ad;
  --ba-color-10: #de5e57;

  --ba-radius: 2px;

  display: block !important;
  color: var(--ba-color-2);
  font: 12px/1 Helvetica, sans-serif;

  *, ::before, ::after {
    box-sizing: border-box;
  }
}

.u-icon {
  display: inline-block;
  vertical-align: middle;
  color: currentColor;
  fill: currentColor;
  width: 1em;
  height: 1em;
}

.u-alert {
  display: block;
  padding: .5em .7em;
  border-radius: var(--ba-radius);
  margin: .5rem 0;
  border: 1px solid transparent;
  font-size: .9em;
  line-height: 1.3;

  &.is-error {
    border-color: #f8aaa4;
    background-color: #f8d7dac0;
  }
}

.u-link {
  @include button-reset;

  font-weight: 300;
  line-height: 1.2;
  color: var(--ba-color-3);
  border-bottom: 1px dashed currentColor;
}

.nav {
  display: flex;
  align-items: center;
  padding-top: .2em;
  color: var(--ba-color-1);
  border-bottom: 1px solid var(--ba-color-7);

  &-button {
    @include button-reset;

    font-weight: normal;
    padding: .5em 0.9em;
    position: relative;
    letter-spacing: 0.03em;

    &.is-active {
      color: var(--ba-color-2);
      font-weight: 600;
      letter-spacing: 0;

      &::before {
        height: 2px;
      }
    }

    &[disabled] {
      cursor: not-allowed;
      opacity: .3;
    }

    &::before {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 0;
      background-color: var(--ba-color-3);
    }
  }

  &-balance {
    margin-left: auto;
    margin-right: .5em;
    font-size: .9em;
    color: var(--ba-color-3);
  }
}

.body {
  padding: 10px;
}

label {
  display: block;
}

.form-group {
  display: block;
  margin-bottom: 10px;
  width: 100%;
}

.form-label {
  font-weight: bold;
  font-size: 1em;
  color: var(--ba-color-2);
  display: block;
  margin-bottom: .5em;
}

.form-input {
  display: block;
  width: 100%;

  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;

  background: var(--ba-color-5);
  border: 1px solid var(--ba-color-6);
  border-radius: var(--ba-radius);
  font: inherit;
  font-family: 'Trebuchet MS', sans-serif;
  padding: 0 0.5em;
  letter-spacing: .03em;
  height: 2em;
  line-height: 2em;
  outline: none;
  color: var(--ba-color-2);

  &:focus {
    border-color: var(--ba-color-3);
    box-shadow: 0 0 2px var(--ba-color-3);
  }

  &::placeholder {
    font: inherit;
    color: var(--ba-color-9);
  }
}

select.form-input {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 9 5' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 .374l4.3 4.11L8.6.375H0z' fill='%238798AD'/%3E%3C/svg%3E");
  background-position: right 0.5em top .7em;
  background-repeat: no-repeat;
  background-size: 0.82em;
}

.row {
  display: flex;
  margin: 0 -5px;

  > * {
    margin-left: 5px;
    margin-right: 5px;
  }
}

.title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--ba-color-7);
  margin: .5em -10px 0;
  padding: 0 10px 5px;
  margin-bottom: 10px;

  &-text {
    font-size: 15px;
    color: var(--ba-color-2);
  }
}

.btn {
  @include button-reset;

  width: 100%;
  display: flex;
  height: 2em;
  font-family: Helvetica, sans-serif;
  font-weight: 300;
  letter-spacing: .05em;
  text-transform: lowercase;
  border-radius: var(--ba-radius);

  &, &:hover, &:focus {
    color: #fff;
  }

  &.is-buy {
    background: var(--ba-color-3);
  }

  &.is-sell {
    background: var(--ba-color-10);
  }
}

.deals-row {
  margin-bottom: 10px;
}

.deals-action {
  @include button-reset;

  padding: 0 .5em;

  &:hover {
    color: var(--ba-color-3);
  }
}

.deals-btn {
  width: auto;
  min-width: 56px;
}
</style>
