let myChart;
let depositsSeries;
let estValueSeries;

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
        vertLines: { visible: false },
        horzLines: { visible: false }
      },
      leftPriceScale: {
        visible: true,
        borderVisible: false
      },
      rightPriceScale: { visible: false },
      localization: {
        priceFormatter: value => '$' + Math.round(value).toLocaleString()
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
        vertLine: { visible: false, labelVisible: false },
        horzLine: { visible: false, labelVisible: false }
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
    });

    depositsSeries = myChart.addAreaSeries({
      lineColor: 'rgba(141, 182, 255, 1)',
      topColor: 'rgba(141, 182, 255, 0.4)',
      bottomColor: 'rgba(141, 182, 255, 0.0)',
      lineWidth: 2,
      lastValueVisible: false,
      priceLineVisible: false
    });

    estValueSeries = myChart.addAreaSeries({
      lineColor: 'rgba(255, 153, 153, 1)',
      topColor: 'rgba(255, 153, 153, 0.4)',
      bottomColor: 'rgba(255, 153, 153, 0.0)',
      lineWidth: 2,
      lastValueVisible: false,
      priceLineVisible: false
    });
  }

  fetchAndUpdateChart();
}

function fetchAndUpdateChart() {
  fetch('/api/investment-records')
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

      // Convert your records to chart objects
      const depositsData = recs.map(r => ({
        time: r.simulatedDate.slice(0, 10), // "YYYY-MM-DD"
        value: r.totalInvestment
      }));
      const estValueData = recs.map(r => ({
        time: r.simulatedDate.slice(0, 10),
        value: r.totalValue
      }));

      depositsSeries.setData(depositsData);
      estValueSeries.setData(estValueData);

      // NEW: If we have lifeEvents loaded from the server, set them as markers
      if (window.lifeEvents && window.lifeEvents.length) {
        const markers = window.lifeEvents.map(ev => ({
          time: ev.time,         // "YYYY-MM-DD" 
          position: 'aboveBar',  // or 'belowBar'
          color: 'blue',         // marker color
          shape: 'circle',       // arrowDown, arrowUp, circle, square
          text: ev.text          // event text on hover
        }));
        estValueSeries.setMarkers(markers);
      }

      myChart.timeScale().fitContent();
    })
    .catch(e => {
      console.error("Chart fetch error:", e);
    });
}

window.buildLightweightChart = buildLightweightChart;
window.updateLightweightChart = fetchAndUpdateChart;

document.addEventListener('DOMContentLoaded', () => {
  if (window.buildLightweightChart) buildLightweightChart();
});