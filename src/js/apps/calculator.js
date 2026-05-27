const CalculatorApp = {
  open() {
    const win = wm.createWindow('calculator', 'Calculadora', '🧮', { width: 320, height: 480 });
    let display = '0';
    let previousValue = null;
    let operation = null;
    let waitingForOperand = false;

    const updateDisplay = () => {
      const el = win.body.querySelector('.calc-display');
      if (el) {
        let displayText = display;
        if (displayText.length > 12) {
          displayText = parseFloat(displayText).toExponential(6);
        }
        el.textContent = displayText;
      }
    };

    const inputDigit = (digit) => {
      if (waitingForOperand) {
        display = digit;
        waitingForOperand = false;
      } else {
        display = display === '0' ? digit : display + digit;
      }
      updateDisplay();
    };

    const inputDot = () => {
      if (waitingForOperand) {
        display = '0.';
        waitingForOperand = false;
      } else if (!display.includes('.')) {
        display += '.';
      }
      updateDisplay();
    };

    const performOperation = (nextOp) => {
      const current = parseFloat(display);
      if (previousValue !== null && operation && !waitingForOperand) {
        let result;
        switch (operation) {
          case '+': result = previousValue + current; break;
          case '-': result = previousValue - current; break;
          case '×': result = previousValue * current; break;
          case '÷': result = current !== 0 ? previousValue / current : 'Error'; break;
        }
        display = String(result);
        previousValue = typeof result === 'number' ? result : null;
      } else {
        previousValue = current;
      }
      operation = nextOp;
      waitingForOperand = true;
      updateDisplay();
    };

    const clear = () => {
      display = '0';
      previousValue = null;
      operation = null;
      waitingForOperand = false;
      updateDisplay();
    };

    const toggleSign = () => {
      display = String(-parseFloat(display));
      updateDisplay();
    };

    const percentage = () => {
      display = String(parseFloat(display) / 100);
      updateDisplay();
    };

    win.body.innerHTML = `
      <div class="calculator-app">
        <div class="calc-display">0</div>
        <div class="calc-buttons">
          <button class="calc-btn function" data-action="clear">AC</button>
          <button class="calc-btn function" data-action="sign">+/−</button>
          <button class="calc-btn function" data-action="percent">%</button>
          <button class="calc-btn operator" data-action="op" data-op="÷">÷</button>
          <button class="calc-btn number" data-digit="7">7</button>
          <button class="calc-btn number" data-digit="8">8</button>
          <button class="calc-btn number" data-digit="9">9</button>
          <button class="calc-btn operator" data-action="op" data-op="×">×</button>
          <button class="calc-btn number" data-digit="4">4</button>
          <button class="calc-btn number" data-digit="5">5</button>
          <button class="calc-btn number" data-digit="6">6</button>
          <button class="calc-btn operator" data-action="op" data-op="-">−</button>
          <button class="calc-btn number" data-digit="1">1</button>
          <button class="calc-btn number" data-digit="2">2</button>
          <button class="calc-btn number" data-digit="3">3</button>
          <button class="calc-btn operator" data-action="op" data-op="+">+</button>
          <button class="calc-btn number zero" data-digit="0">0</button>
          <button class="calc-btn number" data-action="dot">.</button>
          <button class="calc-btn operator" data-action="equals">=</button>
        </div>
      </div>
    `;

    win.body.querySelectorAll('.calc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const digit = btn.dataset.digit;
        const action = btn.dataset.action;
        if (digit !== undefined) inputDigit(digit);
        else if (action === 'dot') inputDot();
        else if (action === 'clear') clear();
        else if (action === 'sign') toggleSign();
        else if (action === 'percent') percentage();
        else if (action === 'op') performOperation(btn.dataset.op);
        else if (action === 'equals') performOperation(null);
      });
    });
  }
};
