class Calculator {
    constructor(previousOperandElement, currentOperandElement, historyListElement) {
        this.previousOperandElement = previousOperandElement;
        this.currentOperandElement = currentOperandElement;
        this.historyListElement = historyListElement;
        this.history = [];
        this.clear();
    }

    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.shouldResetScreen = false;
        this.error = false;
        this.updateDisplay();
    }

    delete() {
        if (this.error) {
            this.clear();
            return;
        }
        if (this.currentOperand === '0') return;
        
        if (this.currentOperand.length === 1 || (this.currentOperand.length === 2 && this.currentOperand.startsWith('-'))) {
            this.currentOperand = '0';
        } else {
            this.currentOperand = this.currentOperand.toString().slice(0, -1);
        }
    }

    appendNumber(number) {
        if (this.error) this.clear();
        if (this.shouldResetScreen) {
            this.currentOperand = '';
            this.shouldResetScreen = false;
        }
        if (number === '.' && this.currentOperand.includes('.')) return;
        
        // Prevent multiple leading zeros
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number;
        } else {
            this.currentOperand = this.currentOperand.toString() + number.toString();
        }
    }

    chooseOperation(operation) {
        if (this.error) this.clear();
        if (this.currentOperand === '') return;
        if (this.previousOperand !== '') {
            this.compute();
        }
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '';
    }

    compute() {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        
        if (isNaN(prev) || isNaN(current)) return;

        switch (this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '-':
                computation = prev - current;
                break;
            case '*':
                computation = prev * current;
                break;
            case '/':
                if (current === 0) {
                    this.error = true;
                    this.currentOperand = "Cannot divide by zero";
                    this.previousOperand = '';
                    this.operation = undefined;
                    return;
                }
                computation = prev / current;
                break;
            default:
                return;
        }

        // Handle floating point precision issues (e.g. 0.1 + 0.2)
        computation = Math.round(computation * 100000000) / 100000000;

        // Log to history
        this.addToHistory(`${prev} ${this.operation} ${current}`, computation);
        
        this.currentOperand = computation.toString();
        this.operation = undefined;
        this.previousOperand = '';
        this.shouldResetScreen = true;
    }

    addToHistory(equation, result) {
        this.history.unshift({ equation, result });
        // Keeping only last 20 history records to avoid bloat
        if (this.history.length > 20) {
            this.history.pop();
        }
        this.renderHistory();
    }

    clearHistory() {
        this.history = [];
        this.renderHistory();
    }

    renderHistory() {
        this.historyListElement.innerHTML = '';
        this.history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            
            const equationDiv = document.createElement('div');
            equationDiv.classList.add('history-equation');
            equationDiv.innerText = item.equation + ' =';
            
            const resultDiv = document.createElement('div');
            resultDiv.classList.add('history-result');
            resultDiv.innerText = this.getDisplayNumber(item.result);
            
            historyItem.appendChild(equationDiv);
            historyItem.appendChild(resultDiv);
            
            // Allow clicking on a history item to restore result
            historyItem.addEventListener('click', () => {
                this.clear();
                this.currentOperand = item.result.toString();
                this.updateDisplay();
            });
            
            this.historyListElement.appendChild(historyItem);
        });
    }

    getDisplayNumber(number) {
        if (this.error) return this.currentOperand;
        
        const stringNumber = number.toString();
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        
        let integerDisplay;
        if (isNaN(integerDigits)) {
            integerDisplay = '';
        } else {
            // Add commas for thousands
            integerDisplay = integerDigits.toLocaleString('en', { maximumFractionDigits: 0 });
        }
        
        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            return integerDisplay;
        }
    }

    updateDisplay() {
        if (this.error) {
            this.currentOperandElement.innerText = this.currentOperand;
            this.currentOperandElement.classList.add('error-message');
            this.previousOperandElement.innerText = '';
        } else {
            this.currentOperandElement.classList.remove('error-message');
            this.currentOperandElement.innerText = this.getDisplayNumber(this.currentOperand);
            if (this.operation != null) {
                // Determine display symbol for operation
                let opSymbol = this.operation;
                if (opSymbol === '/') opSymbol = '÷';
                if (opSymbol === '*') opSymbol = '×';
                if (opSymbol === '-') opSymbol = '−';
                this.previousOperandElement.innerText = `${this.getDisplayNumber(this.previousOperand)} ${opSymbol}`;
            } else {
                this.previousOperandElement.innerText = '';
            }
        }
    }
}

// Initialization and binding DOM Elements
const previousOperandElement = document.getElementById('previous-operand');
const currentOperandElement = document.getElementById('current-operand');
const historyListElement = document.getElementById('history-list');

const calculator = new Calculator(previousOperandElement, currentOperandElement, historyListElement);

// Add event listeners for all calculator buttons
document.querySelectorAll('.calculator .btn').forEach(button => {
    button.addEventListener('click', () => {
        // Handle visual feedback
        button.style.transform = 'translateY(1px)';
        button.style.boxShadow = '0 2px 4px -2px rgba(0, 0, 0, 0.05)';
        setTimeout(() => {
            button.style.transform = '';
            button.style.boxShadow = '';
        }, 100);

        if (button.dataset.action === 'clear') {
            calculator.clear();
        } else if (button.dataset.action === 'delete') {
            calculator.delete();
        } else if (button.dataset.action === 'calculate') {
            calculator.compute();
        } else if (button.dataset.action === 'operator') {
            calculator.chooseOperation(button.dataset.value);
        } else if (button.dataset.value !== undefined) {
            calculator.appendNumber(button.dataset.value);
        }
        
        calculator.updateDisplay();
    });
});

// Setup history clear button
document.getElementById('clear-history').addEventListener('click', () => {
    calculator.clearHistory();
});

// Setup keyboard support
document.addEventListener('keydown', (e) => {
    const keyMap = {
        '0': () => calculator.appendNumber('0'),
        '1': () => calculator.appendNumber('1'),
        '2': () => calculator.appendNumber('2'),
        '3': () => calculator.appendNumber('3'),
        '4': () => calculator.appendNumber('4'),
        '5': () => calculator.appendNumber('5'),
        '6': () => calculator.appendNumber('6'),
        '7': () => calculator.appendNumber('7'),
        '8': () => calculator.appendNumber('8'),
        '9': () => calculator.appendNumber('9'),
        '.': () => calculator.appendNumber('.'),
        '+': () => calculator.chooseOperation('+'),
        '-': () => calculator.chooseOperation('-'),
        '*': () => calculator.chooseOperation('*'),
        '/': () => {
            e.preventDefault(); // Prevents browser features like Firefox's quick search
            calculator.chooseOperation('/');
        },
        'Enter': () => {
            e.preventDefault(); // Prevents form submission or repeating button press focus
            calculator.compute();
        },
        '=': () => calculator.compute(),
        'Backspace': () => calculator.delete(),
        'Escape': () => calculator.clear(),
        'Delete': () => calculator.clear()
    };

    if (keyMap[e.key]) {
        keyMap[e.key]();
        calculator.updateDisplay();
        
        // Trigger visual effect for keyboard pres
        const button = findButtonByKeyValue(e.key);
        if (button) {
            button.style.transform = 'translateY(1px)';
            button.style.boxShadow = '0 2px 4px -2px rgba(0, 0, 0, 0.05)';
            button.style.background = getComputedStyle(button).getPropertyValue('--bg-tertiary'); // Approximate active look
            setTimeout(() => {
                button.style.transform = '';
                button.style.boxShadow = '';
                button.style.background = '';
            }, 100);
        }
    }
});

function findButtonByKeyValue(key) {
    if (key === 'Enter') key = '=';
    if (key === 'Escape' || key === 'Delete') return document.querySelector('[data-action="clear"]');
    if (key === 'Backspace') return document.querySelector('[data-action="delete"]');
    
    // Search for matching data value
    let btn = document.querySelector(`[data-value="${key}"]`);
    if (!btn && key === '=') {
        btn = document.querySelector(`[data-action="calculate"]`);
    }
    return btn;
}
