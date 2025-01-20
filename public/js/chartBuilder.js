let myChart = null;
function fetchAndBuildChart(){
  fetch("/api/investment-records")
    .then(r=>r.json())
    .then(d=>{
      if(d.error){
        console.error("Error fetching records:",d.error);
        return;
      }
      const recs=d.investmentRecords;
      if(!recs||!recs.length){
        console.warn("No records found for chart");
        return;
      }
      const labels = recs.map(r=>{
        const dt=new Date(r.simulatedDate);
        return dt.toLocaleDateString('en-US',{month:'short',year:'numeric'});
      });
      const totalValueData = recs.map(r=>r.totalValue);
      const interestData   = recs.map(r=>r.interest);
      const investData     = recs.map(r=>r.totalInvestment);

      buildChart(labels, totalValueData, interestData, investData);
    })
    .catch(e=>console.error("Chart fetch error:",e));
}

function buildChart(labels, totalValueData, interestData, investData){
  const ctx=document.getElementById("investment-chart");
  if(!ctx)return;
  if(myChart){
    myChart.destroy();
  }
  myChart=new Chart(ctx,{
    type:'line',
    data:{
      labels,
      datasets:[
        {
          label:'Total Value',
          data:totalValueData,
          borderColor:'rgba(75,192,192,1)',
          backgroundColor:'rgba(75,192,192,0.1)',
          fill:false,
          tension:0.2
        },
        {
          label:'Interest',
          data:interestData,
          borderColor:'rgba(255,99,132,1)',
          backgroundColor:'rgba(255,99,132,0.1)',
          fill:false,
          tension:0.2
        },
        {
          label:'Monthly Investment',
          data:investData,
          borderColor:'rgba(54,162,235,1)',
          backgroundColor:'rgba(54,162,235,0.1)',
          fill:false,
          tension:0.2
        }
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      scales:{
        y:{beginAtZero:true}
      }
    }
  });
}
// Make them global so other files can call
window.fetchAndBuildChart=fetchAndBuildChart;