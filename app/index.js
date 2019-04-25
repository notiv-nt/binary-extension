import Vue from 'vue/dist/vue.common.dev';
import App from './App.vue';

function inject() {
  if (!document.querySelector('.widgetbar-widget-detail .dl-data')) {
    return setTimeout(inject, 1000);
  }

  document.querySelector('.widgetbar-widget-detail .widgetbar-widgettitle').innerHTML = 'Binary API';

  const widget = document.querySelector('.widgetbar-widget-detail .dl-data');
  const root = document.createElement('DIV');

  root.style.display = 'block !important';

  widget.appendChild(root);

  Vue.config.errorHandler = function(err, vm, info) {
    vm.error = err.message;
  };

  new Vue({
    el: root,
    render: (h) => h(App),
  });
}

window.addEventListener('load', inject);
