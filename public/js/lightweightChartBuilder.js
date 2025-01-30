/* lightweightChartBuilder.js */

/* 
Ensure this file is loaded AFTER:
<script src="https://unpkg.com/lightweight-charts@5.0.1/dist/lightweight-charts.production.js"></script>
*/

let myChart;
let depositsSeries;
let estValueSeries;
let isDarkTheme;
let gridColor;
let textColor;

function updateChartTheme() {
  if (!myChart) return;
  isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
  gridColor = isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  textColor = isDarkTheme ? '#fff' : '#000';
  myChart.applyOptions({
    layout: { textColor },
    grid: {
      vertLines: { color: gridColor },
      horzLines: { color: gridColor }
    }
  });
  fetchAndUpdateChart();
}

function buildLightweightChart() {
  // Confirm LightweightCharts is defined:
  if (typeof LightweightCharts === 'undefined') {
    console.error('LightweightCharts is not defined. Ensure you included the correct library script first.');
    return;
  }

  const chartContainer = document.getElementById('chartContainer');
  if (!chartContainer) return;

  chartContainer.style.height = `${window.innerHeight - 240}px`;

  isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
  gridColor = isDarkTheme ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  textColor = isDarkTheme ? '#fff' : '#000';

  if (!myChart) {
    myChart = LightweightCharts.createChart(chartContainer, {
      width: chartContainer.clientWidth,
      height: chartContainer.clientHeight,
      layout: {
        background: { type: 'Solid', color: 'transparent' },
        textColor,
        attributionLogo: false
      },
      leftPriceScale: {
        visible: true,
        borderVisible: false
      },
      rightPriceScale: { visible: false },
      localization: {
        priceFormatter: shortDollarFormat
      },
      timeScale: {
        borderVisible: false,
        tickMarkFormatter: (time) => {
          const dt = new Date(time);
          return dt.getFullYear().toString();
        }
      },
      branding: { visible: false },
      watermark: { visible: false },
      crosshair: {
        vertLine: {
          visible: true,
          labelVisible: true,
          style: 0,
          width: 1,
          color: 'rgba(51,51,51,0.6)'
        },
        horzLine: {
          visible: false,
          labelVisible: false
        }
      },
      handleScroll: {
        mouseWheel: false,
        pressedMouseMove: false,
      },
      handleScale: {
        axisPressedMouseMove: false,
        pinch: false,
        mouseWheel: false,
      },
      grid: {
        vertLines: { color: gridColor, visible: true },
        horzLines: { color: gridColor, visible: true }
      }
    });

    depositsSeries = myChart.addAreaSeries({
      lineColor: 'rgba(141, 182, 255, 1)',
      topColor: 'rgba(141, 182, 255, 0.4)',
      bottomColor: 'rgba(141, 182, 255, 0.0)',
      lineWidth: 3,
      lastValueVisible: false,
      priceLineVisible: false
    });

    estValueSeries = myChart.addAreaSeries({
      lineColor: 'rgba(255, 153, 153, 1)',
      topColor: 'rgba(255, 153, 153, 0.4)',
      bottomColor: 'rgba(255, 153, 153, 0.0)',
      lineWidth: 3,
      lastValueVisible: false,
      priceLineVisible: false
    });
  }

  fetchAndUpdateChart();
}

function fetchAndUpdateChart() {
  if (!window.userId) return;
  fetch(`/api/investment-records/${window.userId}`)
    .then(res => res.json())
    .then(d => {
      if (d.error) {
        console.error('Error fetching records:', d.error);
        return;
      }
      const recs = d.investmentRecords;
      if (!recs || !recs.length) {
        depositsSeries.setData([]);
        estValueSeries.setData([]);
        return;
      }
      const depositsData = recs.map(r => ({
        time: r.simulatedDate.slice(0, 10),
        value: r.totalInvestment
      }));
      const estValueData = recs.map(r => ({
        time: r.simulatedDate.slice(0, 10),
        value: r.totalValue
      }));
      depositsSeries.setData(depositsData);
      estValueSeries.setData(estValueData);

      if (window.lifeEvents && window.lifeEvents.length) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const color = isDark ? '#fff' : '#000';
        const markers = window.lifeEvents.map(ev => ({
          time: ev.time,
          position: 'aboveBar',
          color,
          shape: ev.specialShape || 'square',
          text: ev.text
        }));
        estValueSeries.setMarkers(markers);
      }
      myChart.timeScale().fitContent();
    })
    .catch(e => {
      console.error("Chart fetch error:", e);
    });
}

function shortDollarFormat(num) {
  const absVal = Math.abs(num);
  if (absVal >= 1e6) {
    return '$' + (num / 1e6).toFixed(0) + 'M';
  }
  if (absVal >= 1e3) {
    return '$' + (num / 1e3).toFixed(0) + 'k';
  }
  return '$' + Math.round(num);
}

window.buildLightweightChart = buildLightweightChart;
window.updateLightweightChart = fetchAndUpdateChart;

/* 
If you rely on DOMContentLoaded to call buildLightweightChart, you can place:
document.addEventListener('DOMContentLoaded', () => {
  if (window.buildLightweightChart) buildLightweightChart();
});
*/
document.addEventListener('DOMContentLoaded', () => {
  if (typeof LightweightCharts === 'undefined') {
    console.error('LightweightCharts not loaded. Check your script tag.');
    return;
  }
  if (window.buildLightweightChart) {
    buildLightweightChart();
  }
});