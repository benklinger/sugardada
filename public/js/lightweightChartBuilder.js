let myChart;
let depositsSeries;
let estValueSeries;

const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';

function buildLightweightChart() {
  const chartContainer = document.getElementById('chartContainer');
  if (!chartContainer) return;

  chartContainer.style.height = `${window.innerHeight - 240}px`;

  if (!myChart) {
    myChart = LightweightCharts.createChart(chartContainer, {
      width: chartContainer.clientWidth,
      height: chartContainer.clientHeight,
      layout: {
        background: { type: 'Solid', color: 'transparent' },
        textColor: '#333',
        attributionLogo: false
      },
      grid: {
        vertLines: { color: 'rgba(51,51,51,0.2)', visible: true },
        horzLines: { color: 'rgba(51,51,51,0.2)', visible: true }
      },
      leftPriceScale: {
        visible: true,
        borderVisible: false
      },
      rightPriceScale: { visible: false },
      localization: {
        priceFormatter: shortDollarFormat // ← replaced the old priceFormatter
      },
      timeScale: {
        borderVisible: false,
        tickMarkFormatter: (time, tickMarkType, locale) => {
          const dt = new Date(time);
          const month = dt.toLocaleString(locale || 'en-US', { month: 'short' });
          const year = dt.getFullYear();
          return `${month} ${year}`;
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
        pressedMouseMove: false
      },
      handleScale: {
        axisPressedMouseMove: false,
        pinch: false,
        mouseWheel: false
      }
    });

    if (typeof window.latestValue === 'number') {
      myChart.applyOptions({
        watermark: {
          visible: true,
          color: 'rgba(51,51,51,0.3)',
          text: `Est. Value: $${window.latestValue.toLocaleString()}`,
          fontSize: 18,
          horzAlign: 'center',
          vertAlign: 'top'
        }
      });
    }

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
        const markers = window.lifeEvents.map(ev => {
          const shape = ev.specialShape || 'square';
          return {
            time: ev.time,
            position: 'aboveBar',
            color: isDarkTheme ? '#fff' : '#000',
            shape,
            text: ev.text
          };
        });
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

document.addEventListener('DOMContentLoaded', () => {
  if (window.buildLightweightChart) buildLightweightChart();
});