let myChart;
let trendlineSeries;
let investmentSeries;
let estValueSeries;
let isDarkTheme;
let gridColor;
let textColor;

function formatUsdWhole(num) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(num);
}

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
  if (typeof LightweightCharts === 'undefined') return;
  const chartContainer = document.getElementById('chartContainer');
  if (!chartContainer) return;

  chartContainer.style.position = 'relative';

  let heightOffset = 223;
  if (window.innerWidth <= 768) {
    heightOffset = 363;
  }
  const chartHeight = window.innerHeight - heightOffset;
  chartContainer.style.height = chartHeight + 'px';

  isDarkTheme = document.documentElement.getAttribute('data-theme') === 'light';
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
      leftPriceScale: { visible: false },
      rightPriceScale: { visible: true, borderVisible: false },
      localization: { priceFormatter: shortDollarFormat },
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
        vertLine: { visible: false, labelVisible: false },
        horzLine: { visible: false, labelVisible: false }
      },
      handleScroll: { mouseWheel: false, pressedMouseMove: false },
      handleScale: { axisPressedMouseMove: false, pinch: false, mouseWheel: false },
      grid: {
        vertLines: { color: gridColor, visible: true },
        horzLines: { color: gridColor, visible: true }
      }
    });

    trendlineSeries = myChart.addSeries(LightweightCharts.LineSeries, {
      color: '#00FF7F',
      lineWidth: 3,
      lineStyle: LightweightCharts.LineStyle.Dashed,
      lastValueVisible: false,
      priceLineVisible: false
    });

    investmentSeries = myChart.addSeries(LightweightCharts.AreaSeries, {
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

  const toolTipWidth = 130;
  const tooltip = document.createElement('div');
  tooltip.style.width = toolTipWidth + 'px';
  tooltip.style.position = 'absolute';
  tooltip.style.display = 'none';
  tooltip.style.padding = '8px';
  tooltip.style.boxSizing = 'border-box';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.zIndex = '1000';
  tooltip.style.borderRadius = '4px 4px 0 0';
  tooltip.style.borderBottom = 'none';
  tooltip.style.boxShadow = '0 2px 5px 0 rgba(117, 134, 150, 0.45)';
  tooltip.style.background = 'rgba(0, 0, 0, 0.1)';
  tooltip.style.color = 'black';
  tooltip.style.borderColor = 'rgba(239, 83, 80, 1)';
  tooltip.style.top = '0';
  tooltip.style.height = chartContainer.clientHeight + 'px';
  chartContainer.appendChild(tooltip);

  myChart.subscribeCrosshairMove((param) => {
    if (
      !param.point ||
      !param.time ||
      param.point.x < 0 ||
      param.point.x > chartContainer.clientWidth ||
      param.point.y < 0 ||
      param.point.y > chartContainer.clientHeight
    ) {
      tooltip.style.display = 'none';
      return;
    }

    tooltip.style.display = 'block';

    const dateObj = new Date(param.time);
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const investmentData = param.seriesData.get(investmentSeries);
    const estValueData = param.seriesData.get(estValueSeries);

    const investmentVal = investmentData && investmentData.value !== undefined ? investmentData.value : null;
    const estVal = estValueData && estValueData.value !== undefined ? estValueData.value : null;

    const investment = investmentVal === null ? 'N/A' : formatUsdWhole(investmentVal);
    const totalValue = estVal === null ? 'N/A' : formatUsdWhole(estVal);

    let returnsContent = 'N/A';
    if (investmentVal !== null && estVal !== null && investmentVal > 0) {
      const gain = estVal - investmentVal;
      const pct = (gain / investmentVal) * 100;
      const rounded = Math.round(pct);
      returnsContent = `
        <span style="color: #000;">${rounded}</span><span style="color: #00FF7F;">%</span>`;
    }

    function styleCurrency(val) {
      if (typeof val === 'string' && val.startsWith('$')) {
        return '$<span style="color: #000;">' + val.slice(1) + '</span>';
      }
      return val;
    }

    tooltip.innerHTML = `
      <div style="
        font-size: 0.8rem; 
        color: #000; 
        margin-bottom: 12px; 
        font-family: 'Roboto', sans-serif;
        text-shadow: 5px 5px 20px white;
        font-weight: 900;">
        ${formattedDate}
      </div>

      <div style="
        display: flex; 
        flex-direction: column; 
        align-items: flex-start; 
        margin-bottom: 12px;">
        <div style="
          display: flex; 
          text-shadow: 5px 5px 20px white;
          align-items: center; 
          font-size: 1rem; 
          font-family: 'Radley', serif;
          margin-bottom: 6px;
          color: #000;">
          <span style="
            font-size: 0.35rem; 
            margin-right: 6px; 
            text-shadow: 5px 5px 20px white;
            color: rgba(255,153,153,1);">
            ⬤
          </span>
          <span>Total Value</span>
        </div>
        <div style="
          font-size: 1.3rem; 
          color: rgba(255,153,153,1);
          text-shadow: 5px 5px 20px white;
          margin-bottom: 12px;">
          ${styleCurrency(totalValue)}
        </div>
      </div>

      <div style="
        display: flex; 
        flex-direction: column; 
        align-items: flex-start;">
        <div style="
          display: flex; 
          align-items: center;
          text-shadow: 5px 5px 20px white; 
          font-size: 1rem; 
          font-family: 'Radley', serif; 
          margin-bottom: 6px;
          color: #000;">
          <span style="
            font-size: 0.35rem; 
            margin-right: 6px; 
            text-shadow: 5px 5px 20px white;
            color: rgba(141,182,255,1);">
            ⬤
          </span>
          <span>Investment</span>
        </div>
        <div style="
          font-size: 1.3rem; 
          color: rgba(141,182,255,1); 
          text-shadow: 5px 5px 20px white;
          margin-bottom: 20px;">
          ${styleCurrency(investment)}
        </div>
      </div>

      <div style="
        display: flex; 
        flex-direction: column; 
        align-items: flex-start;">
        <div style="
          display: flex; 
          align-items: center;
          text-shadow: 5px 5px 20px white; 
          font-size: 1rem; 
          font-family: 'Radley', serif; 
          margin-bottom: 6px;
          color: #000;">
          <span style="
            font-size: 0.35rem; 
            margin-right: 6px; 
            text-shadow: 5px 5px 20px white;
            color: #00FF7F;">
            ⬤
          </span>
          <span>Returns</span>
        </div>
        <div style="
          font-size: 1.3rem; 
          text-shadow: 5px 5px 20px white;
          margin-bottom: 6px;">
          ${returnsContent}
        </div>
      </div>
    `;

    let left = param.point.x;
    const timeScaleWidth = myChart.timeScale().width();
    const priceScaleWidth = myChart.priceScale('left').width();
    const halfTooltipWidth = toolTipWidth / 2;
    left += priceScaleWidth - halfTooltipWidth;
    left = Math.min(left, priceScaleWidth + timeScaleWidth - toolTipWidth);
    left = Math.max(left, priceScaleWidth);
    tooltip.style.left = left + 'px';
  });
}

function calculateExponentialTrendline(data) {
  if (data.length < 2) return [];
  const firstTime = new Date(data[0].time).getTime();
  const xs = data.map(d => (new Date(d.time).getTime() - firstTime) / (1000 * 60 * 60 * 24));
  const ys = data.map(d => d.value);
  const n = xs.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    const x = xs[i];
    const y = Math.log(ys[i]);
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }
  const b = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const a = Math.exp((sumY - b * sumX) / n);
  return data.map((d, i) => ({
    time: d.time,
    value: a * Math.exp(b * xs[i])
  }));
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
        trendlineSeries.setData([]);
        investmentSeries.setData([]);
        estValueSeries.setData([]);
        return;
      }
      const investmentData = recs.map(r => ({
        time: r.simulatedDate.slice(0, 10),
        value: r.totalInvestment
      }));
      const estValueData = recs.map(r => ({
        time: r.simulatedDate.slice(0, 10),
        value: r.totalValue
      }));

      investmentSeries.setData(investmentData);
      estValueSeries.setData(estValueData);

      const trendData = calculateExponentialTrendline(estValueData);
      trendlineSeries.setData(trendData);

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
      console.error('Chart fetch error:', e);
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
  if (typeof LightweightCharts === 'undefined') return;
  if (window.buildLightweightChart) {
    buildLightweightChart();
  }
});