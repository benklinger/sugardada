let myChart = null;
window.investmentRecords = [];

function buildOrUpdateChart(labels, investData, interestData, interestTrendData){
  const ctx = document.getElementById("investment-chart");
  if(!ctx) return;

  const config = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Monthly Investment',
          data: investData,
          fill: true,
          backgroundColor: 'rgba(141,182,255,0.5)',
          borderColor: 'rgba(141,182,255,1)',
          tension: 0.2,
          stack: 'combinedStack',
          order: 1,
          pointRadius: 0
        },
        {
          label: 'Interest',
          data: interestData,
          fill: true,
          backgroundColor: 'rgba(255,153,153,0.5)',
          borderColor: 'rgba(255,153,153,1)',
          tension: 0.2,
          stack: 'combinedStack',
          order: 2,
          pointRadius: 0
        },
        {
          label: 'Interest Trend',
          data: interestTrendData,
          fill: false,
          borderColor: 'rgba(153,255,153,1)',
          borderDash: [5,5],
          tension: 0.2,
          stack: 'noStack',
          order: 3,
          pointRadius: 0
        }
      ]
    },
    options: {
      indexAxis: 'x',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context){
              const val = context.parsed.x;
              if(val == null) return '';
              return '$' + val.toLocaleString();
            }
          }
        }
      },
      scales: {
        x: {
          position: 'top',
          stacked: true,
          beginAtZero: true,
          ticks: { display: false },
          grid: { display: false }
        },
        y: {
          position: 'right',
          stacked: true,
          ticks: { display: false },
          grid: { display: false }
        }
      }
    }
  };

  if(!myChart){
    myChart = new Chart(ctx, config);
  } else {
    myChart.data.labels = labels;
    myChart.data.datasets[0].data = investData;
    myChart.data.datasets[1].data = interestData;
    myChart.data.datasets[2].data = interestTrendData;
    myChart.update();
  }
}

function buildExponentialTrend(interestData){
  let xy = [];
  for(let i=0; i<interestData.length; i++){
    const val = interestData[i];
    if(val > 0) xy.push({ x:i, y:Math.log(val) });
  }
  if(xy.length < 2) return new Array(interestData.length).fill(null);
  let n=xy.length, Sx=0, Sy=0, Sxx=0, Sxy=0;
  for(const p of xy){
    Sx+=p.x; Sy+=p.y; Sxx+=p.x*p.x; Sxy+=p.x*p.y;
  }
  let b=(n*Sxy - Sx*Sy)/(n*Sxx - Sx*Sx);
  let alpha=(Sy - b*Sx)/n;
  let a=Math.exp(alpha);
  let trend = new Array(interestData.length).fill(null);
  for(let i=0; i<interestData.length; i++){
    trend[i] = a*Math.exp(b*i);
  }
  return trend;
}

function fetchAndBuildChart(){
  fetch("/api/investment-records")
    .then(r => r.json())
    .then(d => {
      if(d.error) return;
      const recs = d.investmentRecords;
      if(!recs || !recs.length) return;
      window.investmentRecords = recs;
      const labels = recs.map((r,i)=>{
        const dt = new Date(r.simulatedDate);
        return dt.toLocaleDateString('en-US',{month:'short', year:'numeric'});
      });
      const investData = recs.map(r => r.totalInvestment);
      const interestData = recs.map(r => r.interest);
      const interestTrendData = buildExponentialTrend(interestData);
      buildOrUpdateChart(labels, investData, interestData, interestTrendData);
      updateCardValues(recs[0]);
    })
    .catch(e => {});
}

window.fetchAndBuildChart = fetchAndBuildChart;