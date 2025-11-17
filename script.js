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
        this.eraserMode = false;
        this.init();
    }

    init() {
        this.createStartScreen();
        this.loadSettings();
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('pairEmUpSettings') || '{"sound": true, "theme": "dark"}');
        this.applyTheme(settings.theme);
    }

    createStartScreen() {
        document.body.innerHTML = `
            <div class="container">
                <div class="start-screen">
                    <h1 class="title">Pair 'em Up</h1>
                    <div class="author">
                        <p>By <a href="https://github.com/AlanKowalzky" target="_blank">@AlanKowalzky</a></p>
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
        this.eraserMode = false;
        
        this.generateGrid(mode);
        this.createGameScreen();
        this.startTimer();
    }

    generateGrid(mode) {
        this.gameState.grid = [];
        
        switch(mode) {
            case 'classic':
                for (let i = 1; i <= 9; i++) {
                    this.gameState.grid.push(i);
                }
                for (let i = 10; i <= 19; i++) {
                    this.gameState.grid.push(i);
                }
                break;
                
            case 'random':
                const numbers = [];
                for (let i = 1; i <= 9; i++) numbers.push(i);
                for (let i = 10; i <= 19; i++) numbers.push(i);
                this.gameState.grid = this.shuffleArray([...numbers]);
                break;
                
            case 'chaotic':
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
                cell.onclick = () => {
                    if (this.eraserMode) {
                        this.eraseCell(index);
                    } else {
                        this.selectCell(index);
                    }
                };
            }
            
            gridElement.appendChild(cell);
        });
    }

    selectCell(index) {
        if (this.gameState.grid[index] === null) return;
        
        const cellElement = document.querySelector(`[data-index="${index}"]`);
        
        if (this.gameState.selectedCells.includes(index)) {
            this.gameState.selectedCells = this.gameState.selectedCells.filter(i => i !== index);
            cellElement.classList.remove('selected');
            this.playSound('deselect');
        } else if (this.gameState.selectedCells.length < 2) {
            this.gameState.selectedCells.push(index);
            cellElement.classList.add('selected');
            this.playSound('select');
            
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
            this.showPairFeedback([index1, index2], false);
            this.playSound('invalidPair');
            setTimeout(() => this.clearSelection(), 500);
        }
    }

    isValidPair(num1, num2, index1, index2) {
        const isIdentical = num1 === num2;
        const sumToTen = num1 + num2 === 10;
        
        if (!isIdentical && !sumToTen) return false;
        
        return this.areConnected(index1, index2);
    }

    areConnected(index1, index2) {
        const row1 = Math.floor(index1 / 9);
        const col1 = index1 % 9;
        const row2 = Math.floor(index2 / 9);
        const col2 = index2 % 9;
        
        if (Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1) return true;
        
        if (row1 === row2) {
            const start = Math.min(col1, col2) + 1;
            const end = Math.max(col1, col2);
            for (let col = start; col < end; col++) {
                if (this.gameState.grid[row1 * 9 + col] !== null) return false;
            }
            return true;
        }
        
        if (col1 === col2) {
            const start = Math.min(row1, row2) + 1;
            const end = Math.max(row1, row2);
            for (let row = start; row < end; row++) {
                if (this.gameState.grid[row * 9 + col1] !== null) return false;
            }
            return true;
        }
        
        if (col1 === 8 && col2 === 0 && row2 === row1 + 1) return true;
        if (col2 === 8 && col1 === 0 && row1 === row2 + 1) return true;
        
        return false;
    }

    processPair(num1, num2, index1, index2) {
        this.gameState.lastMove = {
            index1, index2, num1, num2, 
            scoreBefore: this.gameState.score
        };
        
        let points = 0;
        if (num1 === num2) {
            points = num1 === 5 ? 3 : 1;
        } else {
            points = 2;
        }
        
        this.showPairFeedback([index1, index2], true);
        this.playSound('validPair');
        
        this.gameState.score += points;
        this.gameState.grid[index1] = null;
        this.gameState.grid[index2] = null;
        this.gameState.assists.revert = 1;
        
        setTimeout(() => {
            this.clearSelection();
            this.renderGrid();
            this.updateScore();
            this.updateAssistButtons();
            
            if (this.gameState.score >= this.gameState.targetScore) {
                this.playSound('win');
                this.endGame(true);
                return;
            }
            
            this.checkLoseConditions();
        }, 500);
    }

    checkLoseConditions() {
        const validMoves = this.countValidMoves();
        const hasAssists = this.gameState.assists.addNumbers > 0 || 
                          this.gameState.assists.shuffle > 0 || 
                          this.gameState.assists.eraser > 0;
        
        const totalRows = Math.ceil(this.gameState.grid.length / 9);
        if (totalRows >= 50) {
            this.playSound('lose');
            this.endGame(false, 'Grid limit reached!');
            return;
        }
        
        if (validMoves === 0 && !hasAssists) {
            this.playSound('lose');
            this.endGame(false, 'No moves available!');
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
        
        const addBtn = document.querySelector('[onclick="game.useAddNumbers()"]');
        const shuffleBtn = document.querySelector('[onclick="game.useShuffle()"]');
        const eraserBtn = document.querySelector('[onclick="game.useEraser()"]');
        
        if (addBtn) addBtn.disabled = this.gameState.assists.addNumbers === 0;
        if (shuffleBtn) shuffleBtn.disabled = this.gameState.assists.shuffle === 0;
        if (eraserBtn) eraserBtn.disabled = this.gameState.assists.eraser === 0;
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
        this.showMessage('Game saved!');
    }

    continueGame() {
        const savedGame = localStorage.getItem('pairEmUpSave');
        if (savedGame) {
            this.gameState = JSON.parse(savedGame);
            this.createGameScreen();
            this.startTimer();
        }
    }

    useHint() {
        const validMoves = this.countValidMoves();
        const display = validMoves > 5 ? '5+' : validMoves.toString();
        this.showMessage(`Available moves: ${display}`);
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
            this.playSound('assist');
            const remainingNumbers = this.gameState.grid.filter(n => n !== null).length;
            
            if (remainingNumbers === 0) {
                this.showMessage('No numbers to add - grid is empty!');
                return;
            }
            
            const currentRows = Math.ceil(this.gameState.grid.length / 9);
            const newRows = Math.ceil((this.gameState.grid.length + remainingNumbers) / 9);
            
            if (newRows >= 50) {
                this.showMessage('Cannot add numbers - would exceed 50-line limit!');
                return;
            }
            
            switch(this.gameState.mode) {
                case 'classic':
                    const nonNullNumbers = this.gameState.grid.filter(n => n !== null);
                    if (nonNullNumbers.length === 0) {
                        for (let i = 1; i <= Math.min(19, remainingNumbers); i++) {
                            this.gameState.grid.push(i);
                        }
                    } else {
                        const maxNum = Math.max(...nonNullNumbers);
                        for (let i = 0; i < remainingNumbers; i++) {
                            this.gameState.grid.push(maxNum + 1 + i);
                        }
                    }
                    break;
                    
                case 'random':
                    const existingNums = this.gameState.grid.filter(n => n !== null);
                    const allNums = [];
                    for (let i = 1; i <= 9; i++) allNums.push(i);
                    for (let i = 10; i <= 19; i++) allNums.push(i);
                    
                    let availableNums = allNums.filter(n => !existingNums.includes(n));
                    
                    if (availableNums.length === 0) {
                        availableNums = [...allNums];
                    }
                    
                    const shuffled = this.shuffleArray(availableNums);
                    const numbersToAdd = Math.min(remainingNumbers, shuffled.length);
                    
                    for (let i = 0; i < numbersToAdd; i++) {
                        this.gameState.grid.push(shuffled[i % shuffled.length]);
                    }
                    break;
                    
                case 'chaotic':
                    for (let i = 0; i < remainingNumbers; i++) {
                        this.gameState.grid.push(Math.floor(Math.random() * 9) + 1);
                    }
                    break;
            }
            
            this.gameState.assists.addNumbers--;
            this.renderGrid();
            this.updateAssistButtons();
        }
    }

    useShuffle() {
        if (this.gameState.assists.shuffle > 0) {
            this.playSound('assist');
            const numbers = [];
            const positions = [];
            
            this.gameState.grid.forEach((num, index) => {
                if (num !== null) {
                    numbers.push(num);
                    positions.push(index);
                }
            });
            
            const shuffledNumbers = this.shuffleArray(numbers);
            
            positions.forEach((pos, i) => {
                this.gameState.grid[pos] = shuffledNumbers[i];
            });
            
            this.gameState.assists.shuffle--;
            this.renderGrid();
            this.updateAssistButtons();
        }
    }

    useEraser() {
        if (this.gameState.assists.eraser > 0) {
            this.showMessage('Click on a number to erase it');
            this.eraserMode = true;
            this.playSound('assist');
            
            const grid = document.getElementById('gameGrid');
            grid.classList.add('eraser-mode');
        }
    }

    eraseCell(index) {
        if (this.eraserMode && this.gameState.grid[index] !== null) {
            this.gameState.grid[index] = null;
            this.gameState.assists.eraser--;
            this.eraserMode = false;
            
            const grid = document.getElementById('gameGrid');
            grid.classList.remove('eraser-mode');
            
            this.renderGrid();
            this.updateAssistButtons();
            this.checkLoseConditions();
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

    endGame(won, reason = '') {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.saveGameResult(won);
        
        const message = won ? 'Congratulations! You won!' : `Game Over! ${reason}`;
        const time = `${Math.floor(this.gameState.timer / 60)}:${(this.gameState.timer % 60).toString().padStart(2, '0')}`;
        
        setTimeout(() => {
            this.showGameResult(won, message, this.gameState.score, time);
        }, 500);
    }

    saveGameResult(won) {
        const result = {
            mode: this.gameState.mode,
            score: this.gameState.score,
            time: this.gameState.timer,
            won: won,
            date: new Date().toISOString()
        };
        
        let results = JSON.parse(localStorage.getItem('pairEmUpResults') || '[]');
        results.unshift(result);
        results = results.slice(0, 5);
        
        localStorage.setItem('pairEmUpResults', JSON.stringify(results));
        localStorage.removeItem('pairEmUpSave');
    }

    showGameResult(won, message, score, time) {
        document.body.innerHTML = `
            <div class="container">
                <div class="start-screen">
                    <h1 class="title">${won ? '🏆 Victory!' : '💀 Game Over'}</h1>
                    <div class="result-info">
                        <p>${message}</p>
                        <p><strong>Final Score:</strong> ${score}</p>
                        <p><strong>Time:</strong> ${time}</p>
                        <p><strong>Mode:</strong> ${this.gameState.mode.charAt(0).toUpperCase() + this.gameState.mode.slice(1)}</p>
                    </div>
                    <div class="mode-buttons">
                        <button class="btn btn-primary" onclick="game.startGame('${this.gameState.mode}')">Play Again</button>
                        <button class="btn btn-secondary" onclick="game.createStartScreen()">Main Menu</button>
                        <button class="btn btn-secondary" onclick="game.showResults()">View Results</button>
                    </div>
                </div>
            </div>
        `;
    }

    showResults() {
        const results = JSON.parse(localStorage.getItem('pairEmUpResults') || '[]');
        
        let resultsHTML = '<h2>Game Results (Latest 5)</h2>';
        
        if (results.length === 0) {
            resultsHTML += '<p>No games played yet.</p>';
        } else {
            resultsHTML += '<div class="results-table">';
            results.forEach((result, index) => {
                const time = `${Math.floor(result.time / 60)}:${(result.time % 60).toString().padStart(2, '0')}`;
                const status = result.won ? '🏆 Won' : '💀 Lost';
                resultsHTML += `
                    <div class="result-row">
                        <span>${status}</span>
                        <span>${result.mode.charAt(0).toUpperCase() + result.mode.slice(1)}</span>
                        <span>Score: ${result.score}</span>
                        <span>Time: ${time}</span>
                    </div>
                `;
            });
            resultsHTML += '</div>';
        }
        
        document.body.innerHTML = `
            <div class="container">
                <div class="start-screen">
                    ${resultsHTML}
                    <div class="mode-buttons">
                        <button class="btn btn-secondary" onclick="game.createStartScreen()">Back to Menu</button>
                    </div>
                </div>
            </div>
        `;
    }

    showSettings() {
        const settings = JSON.parse(localStorage.getItem('pairEmUpSettings') || '{"sound": true, "theme": "dark"}');
        
        document.body.innerHTML = `
            <div class="container">
                <div class="start-screen">
                    <h2>Settings</h2>
                    <div class="settings-panel">
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="soundToggle" ${settings.sound ? 'checked' : ''}>
                                Sound Effects
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                Theme:
                                <select id="themeSelect">
                                    <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                                    <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
                                </select>
                            </label>
                        </div>
                    </div>
                    <div class="mode-buttons">
                        <button class="btn btn-primary" onclick="game.saveSettings()">Save Settings</button>
                        <button class="btn btn-secondary" onclick="game.createStartScreen()">Back to Menu</button>
                    </div>
                </div>
            </div>
        `;
    }

    saveSettings() {
        const settings = {
            sound: document.getElementById('soundToggle').checked,
            theme: document.getElementById('themeSelect').value
        };
        
        localStorage.setItem('pairEmUpSettings', JSON.stringify(settings));
        this.applyTheme(settings.theme);
        this.showMessage('Settings saved!');
        setTimeout(() => this.createStartScreen(), 1000);
    }

    applyTheme(theme) {
        document.body.className = theme === 'light' ? 'light-theme' : '';
    }

    showMessage(text) {
        const existingMsg = document.querySelector('.message');
        if (existingMsg) existingMsg.remove();
        
        const msg = document.createElement('div');
        msg.className = 'message';
        msg.textContent = text;
        
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 2000);
    }

    showPairFeedback(indices, isValid) {
        indices.forEach(index => {
            const cell = document.querySelector(`[data-index="${index}"]`);
            if (cell) {
                cell.classList.add(isValid ? 'valid-pair' : 'invalid-pair');
                setTimeout(() => {
                    cell.classList.remove('valid-pair', 'invalid-pair');
                }, 500);
            }
        });
    }

    playSound(type) {
        const settings = JSON.parse(localStorage.getItem('pairEmUpSettings') || '{"sound": true}');
        if (!settings.sound) return;
        
        try {
            if (!window.AudioContext && !window.webkitAudioContext) {
                console.warn('Web Audio API not supported');
                return;
            }
            
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    this.createSound(audioContext, type);
                }).catch(err => {
                    console.warn('Audio context resume failed:', err);
                });
            } else {
                this.createSound(audioContext, type);
            }
        } catch (error) {
            console.warn('Audio playback failed:', error);
        }
    }
    
    createSound(audioContext, type) {
        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            const frequencies = {
                select: 440,
                deselect: 330,
                validPair: 660,
                invalidPair: 220,
                assist: 550,
                win: 880,
                lose: 165
            };
            
            oscillator.frequency.setValueAtTime(frequencies[type] || 440, audioContext.currentTime);
            oscillator.type = type === 'invalidPair' || type === 'lose' ? 'sawtooth' : 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            console.warn('Sound creation failed:', error);
        }
    }
}

const game = new PairEmUpGame();