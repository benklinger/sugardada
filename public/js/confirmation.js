// public/js/confirmation.js

document.addEventListener('DOMContentLoaded', () => {
  // Animate cards with staggered entrance
  const cards = document.querySelectorAll('.card');
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('card-enter');
    }, index * 100);
  });

  // Retrieve the monthly investment from data attribute
  const body = document.querySelector('body');
  const monthlyInvestment = parseFloat(body.getAttribute('data-monthly-investment'));

  // Function to format numbers with commas
  function formatNumber(num) {
    return num.toLocaleString();
  }

  // Fetch investment records from the API
  fetch('/api/investment-records')
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        // Display error messages
        document.getElementById('est-value').innerText = 'Error loading data';
        document.getElementById('roi-multiple').innerText = 'N/A';
        document.getElementById('roi-hint').innerText = 'Error';
        return;
      }

      const investmentRecords = data.investmentRecords;
      if (!investmentRecords || investmentRecords.length === 0) {
        // Handle case with no investment records
        document.getElementById('est-value').innerText = 'No data available';
        document.getElementById('roi-multiple').innerText = 'N/A';
        document.getElementById('roi-hint').innerText = 'N/A';
        return;
      }

      // Assuming the last record is the latest month
      const latestRecord = investmentRecords[investmentRecords.length - 1];
      const latestInterest = latestRecord.interest;
      const latestTotalValue = latestRecord.totalValue;
      const latestTotalInvestment = latestTotalValue - latestInterest;

      // Update Estimated Value
      const estValueElement = document.getElementById('est-value');
      estValueElement.innerText = `$${formatNumber(Math.round(latestTotalValue))}`;

      // Calculate ROI: latestInterest / (latestTotalValue - latestInterest)
      let roiText = 'N/A';
      if (latestTotalInvestment > 0) {
        const roi = (latestInterest / latestTotalInvestment).toFixed(1);
        roiText = `x${roi}`;
      }

      // Update ROI Multiple
      const roiMultipleElement = document.getElementById('roi-multiple');
      roiMultipleElement.innerText = roiText;

      // Update ROI Hint with actual interest earned
      const roiHintElement = document.getElementById('roi-hint');
      roiHintElement.innerText = `$${formatNumber(Math.round(latestInterest))}`;
    })
    .catch(error => {
      console.error('Error fetching investment records:', error);
      // Display error messages
      document.getElementById('est-value').innerText = 'Error loading data';
      document.getElementById('roi-multiple').innerText = 'N/A';
      document.getElementById('roi-hint').innerText = 'Error';
    });
});