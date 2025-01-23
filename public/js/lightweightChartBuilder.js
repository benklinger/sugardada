let myChart;
let depositsSeries;
let estValueSeries;

function buildLightweightChart() {
  const chartContainer = document.getElementById('chartContainer');
  if (!chartContainer) return;

  // Set container height -> e.g. (viewport - 240)
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
        // Example: "Jun 2026" style
        tickMarkFormatter: (time, tickMarkType, locale) => {
          const dt = new Date(time);
          const month = dt.toLocaleString(locale || 'en-US', { month: 'short' });
          const year = dt.getFullYear();
          return `${month} ${year}`;
        }
      },
      // remove branding
      branding: { visible: false },
      watermark: { visible: false },
      // no crosshairs
      crosshair: {
        vertLine: { visible: false, labelVisible: false },
        horzLine: { visible: false, labelVisible: false }
      },
      // disable user scaling/scrolling => chart is fixed
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

    // deposits area
    depositsSeries = myChart.addAreaSeries({
      lineColor: 'rgba(141, 182, 255, 1)',
      topColor: 'rgba(141, 182, 255, 0.4)',
      bottomColor: 'rgba(141, 182, 255, 0.0)',
      lineWidth: 2,
      lastValueVisible: false,
      priceLineVisible: false
    });

    // est value area
    estValueSeries = myChart.addAreaSeries({
      lineColor: 'rgba(255, 153, 153, 1)',
      topColor: 'rgba(255, 153, 153, 0.4)',
      bottomColor: 'rgba(255, 153, 153, 0.0)',
      lineWidth: 2,
      lastValueVisible: false,
      priceLineVisible: false
    });
  }

  // fetch data each time
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
        time: r.simulatedDate.slice(0, 10),
        value: r.totalInvestment
      }));
      const estValueData = recs.map(r => ({
        time: r.simulatedDate.slice(0, 10),
        value: r.totalValue
      }));

      depositsSeries.setData(depositsData);
      estValueSeries.setData(estValueData);

      // Show all data => fit the entire dataset
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