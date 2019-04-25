import TinyEmitter from './tinyemitter.min';

const log = (name, ...args) => {
  // console.log(name, ...args);
};

export default class BinaryApi extends TinyEmitter {
  constructor() {
    super();

    const appId = 16288;

    this.url = `wss://ws.binaryws.com/websockets/v3?app_id=${appId}`;
    this.socket = null;
    this.counter = 0;
    this.secretKey = '__BinaryApiSecret';
    this.events = [];

    this.connect();

    log('BinaryApi.constructor');
  }

  onOpen = () => {
    log('BinaryApi.onOpen');

    this.emit('open');
  };

  onClose = () => {
    log('BinaryApi.onClose');

    this.connect();
  };

  onError = (e) => {
    log('BinaryApi.onError', e);
  };

  onMessage = (e) => {
    const data = JSON.parse(e.data);

    log('BinaryApi.onMessage', data);

    if (data && data.echo_req) {
      let key = data.echo_req[this.secretKey];

      if (this.events[key] && typeof this.events[key] === 'function') {
        this.events[key](data.error, data);
      }
    }
  };

  connect() {
    this.counter = 0;
    this.events = [];
    this.socket = new WebSocket(this.url);

    this.socket.onopen = this.onOpen;
    this.socket.onclose = this.onClose;
    this.socket.onerror = this.onError;
    this.socket.onmessage = this.onMessage;
  }

  send(message) {
    log('BinaryApi.send', message);

    return new Promise((res, rej) => {
      this.counter++;

      this.events[this.counter] = (err, data) => {
        if (err) {
          return rej(err);
        }

        res(data);
      };

      this.socket.send(
        JSON.stringify({
          ...message,

          [this.secretKey]: this.counter,
        })
      );
    });
  }
}
