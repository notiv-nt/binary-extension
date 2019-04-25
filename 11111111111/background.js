(function() {
  'use strict';

  let widgetButton = `
  <div class ="widgetbar-tab">
    <div class="widgetbar-tabcontent">
      <div class="widgetbar-iconplace apply-common-tooltip common-tooltip-vertical">

        <svg width="21" height="21" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" class="widgetbar-icon">
          <g fill="#293152">
            <path d="M56.58 5.81C70.24 4.07 84.48 7.28 96 14.84c12.34 8.04 21.53 20.85 24.95 35.21 3.61 14.61 1.33 30.58-6.32 43.55-7.76 13.3-20.91 23.35-35.85 27.15-11.38 2.96-23.66 2.42-34.73-1.59-16.45-5.84-29.92-19.5-35.5-36.05-4.95-14.29-4.08-30.5 2.4-44.17C19.25 21.1 37.02 8.12 56.58 5.81M36.95 21.54c6.77-.92 13.23 2.34 19.98 1.19 15.72.66 27.95 12.67 43.39 14.63-8.62 3.54-17.55-.79-26.1-2.33 6.3 2.39 12.65 4.62 19.05 6.7-6.76 1.4-13.69.39-20.2-1.66 1.57 2.01 3.67 4.04 3.58 6.81-.2 4.13 1.87 7.9 4.67 10.79 1 1.41 2.89 2.49 2.98 4.34-2.22 5.4-8.76 7.98-14.26 7.65-6.33-1.98-12.25-5.4-18.9-6.35-2.27-.17-4.92-.42-6.71 1.3-2.8 2.3-6.37 3.91-7.92 7.41 2.54 3.3 5.86 6.53 6.31 10.88.65 5.14 4.98 8.57 7.23 12.99-1.43 2.34-1.35 5.35 1.14 6.94 2.18 2.27 5.33-.46 7.75 1.12 4.52 2.25 9.73 1.91 14.48 3.46 3.79 1.25 7.88 1.44 11.74.34 10.76-2.75 18.65-11.69 23.58-21.24 7.15-13.99 7.09-31.4-.15-45.35-6.81-13.31-19.8-23.31-34.51-26.18-12.68-2.8-26.01.11-37.13 6.56m30.17 21.13c.65 1.9.88 3.9 1.37 5.84.88 1.81 3.09 1.39 4.73 1.55-1.16-3.1-3.51-5.44-6.1-7.39z"/>
          </g>
        </svg>

      </div>
    </div>
  </div>
  `;

  let widgetContent = `
  <div class="widgetbar-page">
    <div class="widgetbar-widget widgetbar-widget-datawindow">
      <div class="widgetbar-widgetheader">
        <div class="widgetbar-headerspace"></div>
        <div class="widgetbar-widgettitle">Binary.com Trading</div>
      </div>
      <div class="widgetbar-widgetbody">
        <div class="chart-data-window">

          <p>body</p>

        </div>
        <div class="sb-inner-shadow top i-invisible"></div>
        <div class="sb-inner-shadow i-invisible"></div>
        <div class="sb-scrollbar-wrap">
          <div class="sb-scrollbar sb-scrollbar-body js-hidden"></div>
        </div>
      </div>
      <div class="widgetbar-widgethandle"></div>
    </div>
  </div>
  `;

  document.querySelectorAll('.widgetbar-tabscontent > .widgetbar-tab')[2].insertAdjacentHTML('afterend', widgetButton);
  document.querySelectorAll('.widgetbar-pagescontent > .widgetbar-page')[2].insertAdjacentHTML('afterend', widgetContent);
  $0.insertAdjacentHTML('afterend', '<div class="widgetbar-widget widgetbar-widget-detail"> <div class="widgetbar-widgetheader"> <div class="widgetbar-widgettitle">Details</div> </div> <div class="widgetbar-widgetbody" style="height: 94px;"> <div class="tv-detail sb-scroll-active" style="overflow: hidden;"> <div class="dl-data" style="bottom: auto;"> <p>some here</p> </div> <div class="dl-depthchart" style="height: 99px; display: none;"></div> <div class="sb-inner-shadow top i-invisible"></div> <div class="sb-inner-shadow"></div> <div class="sb-scrollbar-wrap"> <div class="sb-scrollbar sb-scrollbar-body ui-draggable" style="height: 57.0065px; top: 1px;"></div> </div> </div> </div> <div class="widgetbar-widgethandle"></div> </div>');
})()


