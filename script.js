class PairEmUpGame {
    constructor() {
        this.gameState = {
            mode: null,
            grid: [],
            score: 0,
            targetScore: 100,
            selectedCells: [],
            timer: 0,
            assists: {
                hints: Infinity,
                revert: 0,
                addNumbers: 10,
                shuffle: 5,
                eraser: 5
            },
            lastMove: null
        };
        this.timerInterval = null;
        this.init();
    }

    init() {
        this.createStartScreen();
    }

    createStartScreen() {
        document.body.innerHTML = `
            <div class="container">
                <div class="start-screen">
                    <h1 class="title">Pair 'em Up</h1>
                    <div class="author">
                        <p>By <a href="https://github.com/yourusername" target="_blank">@yourusername</a></p>
                    </div>
                    <div class="mode-buttons">
                        <button class="btn btn-primary" onclick="game.startGame('classic')">Classic</button>
                        <button class="btn btn-primary" onclick="game.startGame('random')">Random</button>
                        <button class="btn btn-primary" onclick="game.startGame('chaotic')">Chaotic</button>
                    </div>
                    <div class="controls">
                        <button class="btn btn-secondary" onclick="game.continueGame()" id="continueBtn" style="display: none;">Continue Game</button>
                        <button class="btn btn-secondary" onclick="game.showSettings()">Settings</button>
                        <button class="btn btn-secondary" onclick="game.showResults()">Results</button>
                    </div>
                </div>
            </div>
        `;
        
        // Check if saved game exists
        if (localStorage.getItem('pairEmUpSave')) {
            document.getElementById('continueBtn').style.display = 'inline-block';
        }
    }

    startGame(mode) {
        this.gameState.mode = mode;
        this.gameState.score = 0;
        this.gameState.timer = 0;
        this.gameState.selectedCells = [];
        this.gameState.assists = {
            hints: Infinity,
            revert: 0,
            addNumbers: 10,
            shuffle: 5,
            eraser: 5
        };
        this.gameState.lastMove = null;
        
        this.generateGrid(mode);
        this.createGameScreen();
        this.startTimer();
    }

    generateGrid(mode) {
        this.gameState.grid = [];
        
        switch(mode) {
            case 'classic':
                // Numbers 1-9 in first row, 10-19 in next rows (excluding 0)
                for (let i = 1; i <= 9; i++) {
                    this.gameState.grid.push(i);
                }
                for (let i = 10; i <= 19; i++) {
                    this.gameState.grid.push(i);
                }
                break;
                
            case 'random':
                // Same numbers as classic but shuffled
                const numbers = [];
                for (let i = 1; i <= 9; i++) numbers.push(i);
                for (let i = 10; i <= 19; i++) numbers.push(i);
                this.gameState.grid = this.shuffleArray([...numbers]);
                break;
                
            case 'chaotic':
                // 27 random numbers from 1-9
                for (let i = 0; i < 27; i++) {
                    this.gameState.grid.push(Math.floor(Math.random() * 9) + 1);
                }
                break;
        }
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    createGameScreen() {
        document.body.innerHTML = `
            <div class="container">
                <div class="game-screen" style="display: block;">
                    <div class="game-header">
                        <div class="game-info">
                            <div class="score">Score: <span id="currentScore">${this.gameState.score}</span>/${this.gameState.targetScore}</div>
                            <div class="timer">Time: <span id="timer">00:00</span></div>
                            <div class="mode">Mode: ${this.gameState.mode.charAt(0).toUpperCase() + this.gameState.mode.slice(1)}</div>
                        </div>
                        <div class="controls">
                            <button class="btn btn-secondary" onclick="game.resetGame()">Reset</button>
                            <button class="btn btn-secondary" onclick="game.saveGame()">Save</button>
                            <button class="btn btn-secondary" onclick="game.createStartScreen()">Menu</button>
                        </div>
                    </div>
                    
                    <div class="game-grid" id="gameGrid"></div>
                    
                    <div class="assists">
                        <button class="btn assist-btn" onclick="game.useHint()">
                            Hints <span class="assist-counter" id="hintsCounter">∞</span>
                        </button>
                        <button class="btn assist-btn" onclick="game.useRevert()" id="revertBtn" disabled>
                            Revert <span class="assist-counter" id="revertCounter">0</span>
                        </button>
                        <button class="btn assist-btn" onclick="game.useAddNumbers()">
                            Add Numbers <span class="assist-counter" id="addNumbersCounter">${this.gameState.assists.addNumbers}</span>
                        </button>
                        <button class="btn assist-btn" onclick="game.useShuffle()">
                            Shuffle <span class="assist-counter" id="shuffleCounter">${this.gameState.assists.shuffle}</span>
                        </button>
                        <button class="btn assist-btn" onclick="game.useEraser()">
                            Eraser <span class="assist-counter" id="eraserCounter">${this.gameState.assists.eraser}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.renderGrid();
        this.updateAssistButtons();
    }

    renderGrid() {
        const gridElement = document.getElementById('gameGrid');
        gridElement.innerHTML = '';
        
        this.gameState.grid.forEach((number, index) => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = index;
            
            if (number === null) {
                cell.classList.add('empty');
            } else {
                cell.textContent = number;
                cell.onclick = () => this.selectCell(index);
            }
            
            gridElement.appendChild(cell);
        });
    }

    selectCell(index) {
        if (this.gameState.grid[index] === null) return;
        
        const cellElement = document.querySelector(`[data-index="${index}"]`);
        
        if (this.gameState.selectedCells.includes(index)) {
            // Deselect cell
            this.gameState.selectedCells = this.gameState.selectedCells.filter(i => i !== index);
            cellElement.classList.remove('selected');
        } else if (this.gameState.selectedCells.length < 2) {
            // Select cell
            this.gameState.selectedCells.push(index);
            cellElement.classList.add('selected');
            
            if (this.gameState.selectedCells.length === 2) {
                setTimeout(() => this.checkPair(), 300);
            }
        }
    }

    checkPair() {
        const [index1, index2] = this.gameState.selectedCells;
        const num1 = this.gameState.grid[index1];
        const num2 = this.gameState.grid[index2];
        
        if (this.isValidPair(num1, num2, index1, index2)) {
            this.processPair(num1, num2, index1, index2);
        } else {
            this.clearSelection();
        }
    }

    isValidPair(num1, num2, index1, index2) {
        // Check if numbers form a valid pair
        const isIdentical = num1 === num2;
        const sumToTen = num1 + num2 === 10;
        
        if (!isIdentical && !sumToTen) return false;
        
        // Check connectivity rules
        return this.areConnected(index1, index2);
    }

    areConnected(index1, index2) {
        const row1 = Math.floor(index1 / 9);
        const col1 = index1 % 9;
        const row2 = Math.floor(index2 / 9);
        const col2 = index2 % 9;
        
        // Adjacent cells
        if (Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1) return true;
        
        // Same row - check if path is clear
        if (row1 === row2) {
            const start = Math.min(col1, col2) + 1;
            const end = Math.max(col1, col2);
            for (let col = start; col < end; col++) {
                if (this.gameState.grid[row1 * 9 + col] !== null) return false;
            }
            return true;
        }
        
        // Same column - check if path is clear
        if (col1 === col2) {
            const start = Math.min(row1, row2) + 1;
            const end = Math.max(row1, row2);
            for (let row = start; row < end; row++) {
                if (this.gameState.grid[row * 9 + col1] !== null) return false;
            }
            return true;
        }
        
        // Row boundary rule - last of one row with first of next
        if (col1 === 8 && col2 === 0 && row2 === row1 + 1) return true;
        if (col2 === 8 && col1 === 0 && row1 === row2 + 1) return true;
        
        return false;
    }

    processPair(num1, num2, index1, index2) {
        // Save move for revert
        this.gameState.lastMove = {
            index1, index2, num1, num2, 
            scoreBefore: this.gameState.score
        };
        
        // Calculate points
        let points = 0;
        if (num1 === num2) {
            points = num1 === 5 ? 3 : 1; // Bonus for double fives
        } else {
            points = 2; // Sum to 10
        }
        
        // Update game state
        this.gameState.score += points;
        this.gameState.grid[index1] = null;
        this.gameState.grid[index2] = null;
        this.gameState.assists.revert = 1;
        
        // Update UI
        this.clearSelection();
        this.renderGrid();
        this.updateScore();
        this.updateAssistButtons();
        
        // Check win condition
        if (this.gameState.score >= this.gameState.targetScore) {
            this.endGame(true);
        }
    }

    clearSelection() {
        this.gameState.selectedCells.forEach(index => {
            const cell = document.querySelector(`[data-index="${index}"]`);
            if (cell) cell.classList.remove('selected');
        });
        this.gameState.selectedCells = [];
    }

    updateScore() {
        document.getElementById('currentScore').textContent = this.gameState.score;
    }

    updateAssistButtons() {
        document.getElementById('hintsCounter').textContent = '∞';
        document.getElementById('revertCounter').textContent = this.gameState.assists.revert;
        document.getElementById('addNumbersCounter').textContent = this.gameState.assists.addNumbers;
        document.getElementById('shuffleCounter').textContent = this.gameState.assists.shuffle;
        document.getElementById('eraserCounter').textContent = this.gameState.assists.eraser;
        
        document.getElementById('revertBtn').disabled = this.gameState.assists.revert === 0;
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.gameState.timer++;
            const minutes = Math.floor(this.gameState.timer / 60).toString().padStart(2, '0');
            const seconds = (this.gameState.timer % 60).toString().padStart(2, '0');
            document.getElementById('timer').textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    resetGame() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.startGame(this.gameState.mode);
    }

    saveGame() {
        localStorage.setItem('pairEmUpSave', JSON.stringify(this.gameState));
        alert('Game saved!');
    }

    continueGame() {
        const savedGame = localStorage.getItem('pairEmUpSave');
        if (savedGame) {
            this.gameState = JSON.parse(savedGame);
            this.createGameScreen();
            this.startTimer();
        }
    }

    // Placeholder methods for assists
    useHint() {
        const validMoves = this.countValidMoves();
        const display = validMoves > 5 ? '5+' : validMoves.toString();
        alert(`Available moves: ${display}`);
    }

    useRevert() {
        if (this.gameState.assists.revert > 0 && this.gameState.lastMove) {
            const move = this.gameState.lastMove;
            this.gameState.grid[move.index1] = move.num1;
            this.gameState.grid[move.index2] = move.num2;
            this.gameState.score = move.scoreBefore;
            this.gameState.assists.revert = 0;
            this.gameState.lastMove = null;
            
            this.renderGrid();
            this.updateScore();
            this.updateAssistButtons();
        }
    }

    useAddNumbers() {
        if (this.gameState.assists.addNumbers > 0) {
            // Implementation will be added in next phase
            this.gameState.assists.addNumbers--;
            this.updateAssistButtons();
        }
    }

    useShuffle() {
        if (this.gameState.assists.shuffle > 0) {
            // Implementation will be added in next phase
            this.gameState.assists.shuffle--;
            this.updateAssistButtons();
        }
    }

    useEraser() {
        if (this.gameState.assists.eraser > 0) {
            // Implementation will be added in next phase
            this.gameState.assists.eraser--;
            this.updateAssistButtons();
        }
    }

    countValidMoves() {
        let count = 0;
        for (let i = 0; i < this.gameState.grid.length; i++) {
            if (this.gameState.grid[i] === null) continue;
            for (let j = i + 1; j < this.gameState.grid.length; j++) {
                if (this.gameState.grid[j] === null) continue;
                if (this.isValidPair(this.gameState.grid[i], this.gameState.grid[j], i, j)) {
                    count++;
                }
            }
        }
        return count;
    }

    endGame(won) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        const message = won ? 'Congratulations! You won!' : 'Game Over!';
        alert(`${message}\nFinal Score: ${this.gameState.score}\nTime: ${Math.floor(this.gameState.timer / 60)}:${(this.gameState.timer % 60).toString().padStart(2, '0')}`);
        this.createStartScreen();
    }

    // Placeholder methods
    showSettings() {
        alert('Settings panel - will be implemented in next phase');
    }

    showResults() {
        alert('Results panel - will be implemented in next phase');
    }
}

// Initialize game
const game = new PairEmUpGame();