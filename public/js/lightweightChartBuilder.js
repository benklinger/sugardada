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
        // TEXT COLOR same as your cards (#333)
        textColor: '#333',
        attributionLogo: false
      },
      // GRID lines, same color as text (#333) with 0.2 opacity
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
      // no default branding or watermark
      branding: { visible: false },
      watermark: { visible: false },
      crosshair: {
        // show vertical line on hover
        vertLine: {
          visible: true,
          labelVisible: true,
          style: 0, // 0 => solid line
          width: 1,
          color: 'rgba(51,51,51,0.6)'
        },
        horzLine: {
          visible: false,
          labelVisible: false
        }
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

    // WATERMARK with latest est value 
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

    // deposits area
    depositsSeries = myChart.addAreaSeries({
      lineColor: 'rgba(141, 182, 255, 1)',
      topColor: 'rgba(141, 182, 255, 0.4)',
      bottomColor: 'rgba(141, 182, 255, 0.0)',
      // bigger line => bigger "dots" effect
      lineWidth: 3,
      lastValueVisible: false,
      priceLineVisible: false
    });

    // est value area
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

      // Build markers from lifeEvents (if any)
      if (window.lifeEvents && window.lifeEvents.length) {
        const markers = window.lifeEvents.map((ev, i) => {
          // default shape => "square"
          let shape = 'square';
		  
          // If your code sets ev.specialShape for the first/last marker, override
          if (ev.specialShape) {
            shape = ev.specialShape; 
          }

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

window.buildLightweightChart = buildLightweightChart;
window.updateLightweightChart = fetchAndUpdateChart;

document.addEventListener('DOMContentLoaded', () => {
  if (window.buildLightweightChart) buildLightweightChart();
});