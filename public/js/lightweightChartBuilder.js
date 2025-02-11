/* lightweightChartBuilder.js */
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
  if (typeof LightweightCharts === 'undefined') {
    console.error('LightweightCharts is not defined. Ensure you included the correct library script first.');
    return;
  }
  const chartContainer = document.getElementById('chartContainer');
  if (!chartContainer) return;
  
  let heightOffset = 240;
  if (window.innerWidth <= 768) {
    heightOffset = 390;
  }
  let chartHeight = window.innerHeight - heightOffset;
  chartContainer.style.height = `${chartHeight}px`;

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
        horzLine: { visible: false, labelVisible: false }
      },
      handleScroll: { mouseWheel: false, pressedMouseMove: false },
      handleScale: { axisPressedMouseMove: false, pinch: false, mouseWheel: false },
      grid: {
        vertLines: { color: gridColor, visible: true },
        horzLines: { color: gridColor, visible: true }
      }
    });
    
    // Create smooth area series using the new unified API:
    depositsSeries = myChart.addSeries(LightweightCharts.AreaSeries, {
      lineColor: 'rgba(141, 182, 255, 1)',
      topColor: 'rgba(141, 182, 255, 0.4)',
      bottomColor: 'rgba(141, 182, 255, 0.0)',
      lineWidth: 3,
      lastValueVisible: false,
      priceLineVisible: false,
      lineType: LightweightCharts.LineType.Smooth
    });
    estValueSeries = myChart.addSeries(LightweightCharts.AreaSeries, {
      lineColor: 'rgba(255, 153, 153, 1)',
      topColor: 'rgba(255, 153, 153, 0.4)',
      bottomColor: 'rgba(255, 153, 153, 0.0)',
      lineWidth: 3,
      lastValueVisible: false,
      priceLineVisible: false,
      lineType: LightweightCharts.LineType.Smooth
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
      myChart.timeScale().fitContent();
      
      if (window.lifeEvents && window.lifeEvents.length) {
        const markerColor = document.documentElement.getAttribute('data-theme') === 'dark' ? '#fff' : '#000';
        let markers = window.lifeEvents.map(ev => ({
          time: ev.time,
          position: 'aboveBar',
          color: markerColor,
          shape: ev.specialShape || 'square',
          text: ev.text
        }));
        markers = markers.sort((a, b) => {
          if (typeof a.time === 'number' && typeof b.time === 'number') {
            return a.time - b.time;
          }
          return String(a.time).localeCompare(String(b.time));
        });
        LightweightCharts.createSeriesMarkers(estValueSeries, markers);
      }
    })
    .catch(e => {
      console.error("Chart fetch error:", e);
    });
}

function shortDollarFormat(num) {
  const absVal = Math.abs(num);
  if (absVal >= 1e6) return '$' + (num / 1e6).toFixed(0) + 'M';
  if (absVal >= 1e3) return '$' + (num / 1e3).toFixed(0) + 'k';
  return '$' + Math.round(num);
}

window.buildLightweightChart = buildLightweightChart;
window.updateLightweightChart = fetchAndUpdateChart;

document.addEventListener('DOMContentLoaded', () => {
  if (typeof LightweightCharts === 'undefined') {
    console.error('LightweightCharts not loaded. Check your script tag.');
    return;
  }
  if (window.buildLightweightChart) {
    buildLightweightChart();
  }
});
