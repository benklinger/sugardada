// public/js/confirmation.js

class universalRush {
  /**
   * @param {String} elementId   - e.g. "monthly-investment"
   * @param {String} newVal      - Final text to display
   * @param {String} oldVal      - Starting text, or "RND" for random
   * @param {Object} options     - { stepDelayStart, stepDelayInc, onEnd }
   */
  constructor(elementId, newVal, oldVal, options = {}) {
    this.el = document.getElementById(elementId);
    if (!this.el) return;

    this.newVal = newVal ?? "";
    this.oldVal = oldVal ?? "RND";
    this.opts = options;

    this.stepDelayStart = this.opts.stepDelayStart ?? 20;
    this.stepDelayInc = this.opts.stepDelayInc ?? 3;

    this.onEnd = this.opts.onEnd ?? function() {};

    // For digits & letters:
    this.digits = "0123456789";
    this.letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    // If oldVal is "RND", generate random of same length as newVal
    if (this.oldVal === "RND") {
      this.oldVal = this._randomPlaceholder(this.newVal);
    }

    this._spinAll();
  }

  _spinAll() {
    const oldTxt = this.oldVal;
    const newTxt = this.newVal;
    const minLen = Math.min(oldTxt.length, newTxt.length);

    let completed = 0;
    for (let i = 0; i < minLen; i++) {
      const oldC = oldTxt[i];
      const newC = newTxt[i];
      this._spinChar(i, oldC, newC, () => {
        completed++;
        // Once all "shared" positions are done, set final text and trigger onEnd
        if (completed === minLen) {
          this.el.textContent = newTxt;
          this.onEnd(); // Invoke the onEnd callback
        }
      });
    }

    // Handle extra characters if newVal is longer than oldVal
    if (newTxt.length > oldTxt.length) {
      this.el.textContent = newTxt;
      this.onEnd(); // Invoke the onEnd callback
    }
  }

  _spinChar(pos, oldC, newC, onDone) {
    if (oldC === newC) {
      this._setChar(pos, newC);
      onDone && onDone();
      return;
    }
    const isDigitSpin = this._isDigit(oldC) && this._isDigit(newC);
    const isLetterSpin = this._isLetter(oldC) && this._isLetter(newC);
    if (!isDigitSpin && !isLetterSpin) {
      this._setChar(pos, newC);
      onDone && onDone();
      return;
    }

    let path = isDigitSpin
      ? this._spinPathDigits(oldC, newC)
      : this._spinPathLetters(oldC, newC);

    let stepDelay = this.stepDelayStart;
    let idx = 0;
    const stepFn = () => {
      if (idx < path.length) {
        this._setChar(pos, path[idx]);
        idx++;
        stepDelay += this.stepDelayInc;
        setTimeout(stepFn, stepDelay);
      } else {
        onDone && onDone();
      }
    };
    stepFn();
  }

  _spinPathDigits(a, b) {
    let oldIndex = this.digits.indexOf(a);
    let newIndex = this.digits.indexOf(b);

    // Forward path
    let forward = [];
    {
      let i = oldIndex;
      while (i !== newIndex) {
        i = (i + 1) % 10;
        forward.push(this.digits[i]);
      }
    }

    // Backward path
    let backward = [];
    {
      let j = oldIndex;
      while (j !== newIndex) {
        j = (j - 1 + 10) % 10; // Avoid negative wrap
        backward.push(this.digits[j]);
      }
    }

    // Pick the shorter path
    return forward.length <= backward.length ? forward : backward;
  }

  _spinPathLetters(a, b) {
    let A = a.toUpperCase();
    let B = b.toUpperCase();
    let oldIndex = this.letters.indexOf(A);
    let newIndex = this.letters.indexOf(B);

    // Forward path
    let forward = [];
    {
      let i = oldIndex;
      while (i !== newIndex) {
        i = (i + 1) % 26;
        forward.push(this._preserveCase(a, this.letters[i]));
      }
    }

    // Backward path
    let backward = [];
    {
      let j = oldIndex;
      while (j !== newIndex) {
        j = (j - 1 + 26) % 26;
        backward.push(this._preserveCase(a, this.letters[j]));
      }
    }

    // Pick whichever is shorter
    return forward.length <= backward.length ? forward : backward;
  }

  _preserveCase(oldChar, newUpper) {
    // If oldChar was lowercase, return newUpper in lowercase
    return oldChar === oldChar.toLowerCase() ? newUpper.toLowerCase() : newUpper;
  }

  _setChar(pos, c) {
    // Read current text
    let current = this.el.textContent;
    // Ensure we have enough length
    while (current.length <= pos) {
      current += " ";
    }
    let arr = current.split("");
    arr[pos] = c;
    this.el.textContent = arr.join("");
  }

  _isDigit(c) {
    return this.digits.includes(c);
  }
  _isLetter(c) {
    return this.letters.includes(c.toUpperCase());
  }

  _randomPlaceholder(str) {
    // If str is numeric => random digits
    if (/^[0-9,]+$/.test(str.replace(/[^0-9]/g, ""))) {
      let out = "";
      for (let i = 0; i < str.length; i++) {
        if (str[i] === ",") {
          out += ",";
        } else {
          out += this.digits[Math.floor(Math.random() * 10)];
        }
      }
      return out;
    }
    // If str is alpha => random letters
    if (/^[A-Za-z]+$/.test(str.replace(/[^A-Za-z]/g, ""))) {
      let out = "";
      for (let i = 0; i < str.length; i++) {
        let c = this.letters[Math.floor(Math.random() * 26)];
        // Preserve case
        if (str[i] === str[i].toLowerCase()) c = c.toLowerCase();
        out += c;
      }
      return out;
    }
    // Fallback => keep non-alphanumeric characters as-is and random for others
    let out = "";
    for (let i = 0; i < str.length; i++) {
      if (/[^A-Za-z0-9]/.test(str[i])) {
        out += str[i];
      } else {
        // Randomly choose digit or letter
        if (Math.random() > 0.5) {
          out += this.digits[Math.floor(Math.random() * 10)];
        } else {
          let c = this.letters[Math.floor(Math.random() * 26)];
          out += str[i] === str[i].toLowerCase() ? c.toLowerCase() : c;
        }
      }
    }
    return out;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Animate cards with staggered entrance (existing functionality)
  const cards = document.querySelectorAll('.card');
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('card-enter');
    }, index * 100);
  });

  /**
   * Define a symbol map to associate element IDs with their respective symbols.
   * This ensures symbols like '$' and 'x' are preserved during animations.
   */
  const symbolMap = {
    'est-value': '$',
    'roi-multiple': 'x',
    'roi-hint': '$',
    // Add more mappings if you have other elements with symbols
  };

  /**
   * Function to animate a specific element from oldVal to newVal while preserving symbols.
   * @param {String} elementId - The ID of the element to animate
   * @param {String} newVal - The final numerical value to display
   */
  function animateElement(elementId, newVal) {
    const el = document.getElementById(elementId);
    if (!el) return;

    // Retrieve the associated symbol, if any
    const symbol = symbolMap[elementId] || '';

    // Get current text
    const currentText = el.textContent.trim();

    // Remove the symbol from the old value
    const oldVal = symbol ? currentText.replace(symbol, '') : currentText;

    // Initialize universalRush animation
    new universalRush(elementId, newVal, oldVal, { 
      stepDelayStart: 20, 
      stepDelayInc: 3,
      onEnd: () => {
        // Reattach the symbol after animation completes
        el.textContent = symbol + newVal;
      }
    });
  }

  /**
   * Function to format numbers with commas
   * @param {Number} num - The number to format
   * @returns {String} - Formatted number with commas
   */
  function formatNumber(num) {
    return num.toLocaleString();
  }

  // Initialize universalRush for Est. Value and ROI with placeholders
  animateElement('est-value', '999,999');
  animateElement('roi-multiple', '9.9');
  animateElement('roi-hint', '999,999');

  // Fetch investment records from the API
  fetch('/api/investment-records')
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        // Display error messages with animation
        animateElement('est-value', 'Error loading data');
        animateElement('roi-multiple', 'N/A');
        animateElement('roi-hint', 'Error');
        return;
      }

      const investmentRecords = data.investmentRecords;
      if (!investmentRecords || investmentRecords.length === 0) {
        // Handle case with no investment records with animation
        animateElement('est-value', 'No data available');
        animateElement('roi-multiple', 'N/A');
        animateElement('roi-hint', 'N/A');
        return;
      }

      // Assuming the last record is the latest month
      const latestRecord = investmentRecords[investmentRecords.length - 1];
      const latestInterest = latestRecord.interest;
      const latestTotalValue = latestRecord.totalValue;
      const latestTotalInvestment = latestTotalValue - latestInterest;

      // Define the new values
      const estValueNew = `${formatNumber(Math.round(latestTotalValue))}`;
      const roiMultipleNew = latestTotalInvestment > 0
        ? `${(latestInterest / latestTotalInvestment).toFixed(1)}`
        : 'N/A';
      const roiHintNew = `${formatNumber(Math.round(latestInterest))}`;

      // Animate to the new values
      animateElement('est-value', estValueNew);
      animateElement('roi-multiple', roiMultipleNew);
      animateElement('roi-hint', roiHintNew);
    })
    .catch(error => {
      console.error('Error fetching investment records:', error);
      // Display error messages with animation
      animateElement('est-value', 'Error loading data');
      animateElement('roi-multiple', 'N/A');
      animateElement('roi-hint', 'Error');
    });
});

document.addEventListener('DOMContentLoaded', () => {
  const monthlyInvestmentCard = document.getElementById('monthly-investment-card');
  const monthlyInvestmentValue = document.getElementById('monthly-investment-value');
  const estValueElement      = document.getElementById('est-value');
  const estReturnElement     = document.getElementById('est-return');
  const roiHintElement       = document.getElementById('roi-hint');

  if (monthlyInvestmentCard) {
    monthlyInvestmentCard.addEventListener('click', async () => {
      try {
        const response = await fetch('/api/update-monthly-investment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();

        if (response.ok) {
			const newInvestment = data.monthlyInvestment; 
          monthlyInvestmentValue.textContent = `$${Math.round(newInvestment).toLocaleString()}`;

          if (data.roiMultiple) {
            estReturnElement.firstChild.textContent = `x${data.roiMultiple}`;
          }
          if (typeof data.totalProfit === 'number') {
            roiHintElement.textContent = `$${data.totalProfit.toLocaleString()}`;
          }

          if (data.investmentRecords && data.investmentRecords.length > 0) {
            const latest = data.investmentRecords[data.investmentRecords.length - 1];
            estValueElement.textContent = `$${Math.round(latest.totalValue).toLocaleString()}`;
          }

        } else {
          console.error('Update monthly investment error:', data.error);
          alert('Failed to update monthly investment!');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        alert('Something went wrong!');
      }
    });
  }
});