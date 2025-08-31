class TicTacToeGame {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameMode = 'pvp'; // 'pvp' or 'pvc'
        this.gameActive = true;
        this.scores = { X: 0, O: 0, draw: 0 };
        this.winningPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];
        this.isComputerThinking = false;
        
        this.initializeGame();
        this.bindEvents();
    }

    initializeGame() {
        this.updateDisplay();
        this.updateScoreDisplay();
    }

    bindEvents() {
        // Cell click events - ensure proper binding
        const cells = document.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            // Remove any existing event listeners first
            cell.replaceWith(cell.cloneNode(true));
        });
        
        // Re-select cells after cloning and add event listeners
        document.querySelectorAll('.cell').forEach((cell, index) => {
            cell.addEventListener('click', (e) => {
                console.log('Cell clicked:', index); // Debug log
                this.handleCellClick(e);
            });
        });

        // Mode selection events
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleModeChange(e));
        });

        // Control button events
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
    }

    handleCellClick(event) {
        const cellIndex = parseInt(event.target.dataset.index);
        console.log('Handling cell click for index:', cellIndex); // Debug log
        
        if (!this.gameActive || this.board[cellIndex] || this.isComputerThinking) {
            console.log('Click ignored - gameActive:', this.gameActive, 'cell occupied:', !!this.board[cellIndex], 'computer thinking:', this.isComputerThinking);
            return;
        }

        this.makeMove(cellIndex, this.currentPlayer);
        
        if (this.gameActive && this.gameMode === 'pvc' && this.currentPlayer === 'O') {
            this.isComputerThinking = true;
            this.showComputerThinking();
            
            setTimeout(() => {
                const computerMove = this.getBestMove();
                this.makeMove(computerMove, 'O');
                this.isComputerThinking = false;
                this.hideComputerThinking();
            }, 800);
        }
    }

    makeMove(cellIndex, player) {
        console.log('Making move:', cellIndex, player); // Debug log
        this.board[cellIndex] = player;
        const cell = document.querySelector(`[data-index="${cellIndex}"]`);
        
        // Clear any existing content
        cell.innerHTML = '';
        
        // Add symbol with animation
        const symbolSpan = document.createElement('span');
        symbolSpan.textContent = player;
        symbolSpan.classList.add('symbol');
        cell.appendChild(symbolSpan);
        cell.classList.add('occupied', `${player.toLowerCase()}-symbol`);

        // Check for game end conditions
        const winner = this.checkWinner();
        if (winner) {
            this.handleGameEnd(winner);
            return;
        }

        if (this.isBoardFull()) {
            this.handleGameEnd('draw');
            return;
        }

        // Switch players
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.updateDisplay();
    }

    checkWinner() {
        for (let pattern of this.winningPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                this.drawWinningLine(pattern);
                return this.board[a];
            }
        }
        return null;
    }

    drawWinningLine(pattern) {
        const line = document.getElementById('winningLine');
        const cells = document.querySelectorAll('.cell');
        const boardContainer = document.querySelector('.game-board-container');
        const board = document.querySelector('.game-board');
        
        const [start, , end] = pattern;
        const startCell = cells[start];
        const endCell = cells[end];
        
        // Get positions relative to the board container
        const containerRect = boardContainer.getBoundingClientRect();
        const startRect = startCell.getBoundingClientRect();
        const endRect = endCell.getBoundingClientRect();
        
        const startX = startRect.left + startRect.width / 2 - containerRect.left;
        const startY = startRect.top + startRect.height / 2 - containerRect.top;
        const endX = endRect.left + endRect.width / 2 - containerRect.left;
        const endY = endRect.top + endRect.height / 2 - containerRect.top;
        
        const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
        
        line.style.width = `${length}px`;
        line.style.height = '4px';
        line.style.left = `${startX}px`;
        line.style.top = `${startY - 2}px`;
        line.style.transform = `rotate(${angle}deg)`;
        line.style.transformOrigin = '0 50%';
        line.classList.add('show');
    }

    isBoardFull() {
        return this.board.every(cell => cell !== '');
    }

    handleGameEnd(result) {
        this.gameActive = false;
        const statusElement = document.getElementById('gameStatus');
        
        if (result === 'draw') {
            statusElement.textContent = "It's a draw!";
            statusElement.classList.add('draw');
            this.scores.draw++;
        } else {
            const winnerName = this.getPlayerName(result);
            statusElement.textContent = `${winnerName} wins!`;
            statusElement.classList.add('winner');
            this.scores[result]++;
        }
        
        this.updateScoreDisplay();
        this.disableBoard();
    }

    getPlayerName(player) {
        if (this.gameMode === 'pvc') {
            return player === 'X' ? 'Player' : 'Computer';
        }
        return player === 'X' ? 'Player 1' : 'Player 2';
    }

    disableBoard() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.style.pointerEvents = 'none';
        });
    }

    enableBoard() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.style.pointerEvents = 'auto';
        });
    }

    // Minimax Algorithm for AI
    getBestMove() {
        let bestScore = -Infinity;
        let bestMove = 0;
        
        for (let i = 0; i < 9; i++) {
            if (this.board[i] === '') {
                this.board[i] = 'O';
                let score = this.minimax(this.board, 0, false);
                this.board[i] = '';
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        
        return bestMove;
    }

    minimax(board, depth, isMaximizing) {
        const winner = this.checkWinnerForBoard(board);
        
        if (winner === 'O') return 10 - depth;
        if (winner === 'X') return depth - 10;
        if (this.isBoardFullForBoard(board)) return 0;
        
        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'O';
                    let score = this.minimax(board, depth + 1, false);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'X';
                    let score = this.minimax(board, depth + 1, true);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    checkWinnerForBoard(board) {
        for (let pattern of this.winningPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        return null;
    }

    isBoardFullForBoard(board) {
        return board.every(cell => cell !== '');
    }

    showComputerThinking() {
        const statusElement = document.getElementById('gameStatus');
        statusElement.textContent = 'Computer is thinking...';
        statusElement.classList.add('thinking');
    }

    hideComputerThinking() {
        const statusElement = document.getElementById('gameStatus');
        statusElement.classList.remove('thinking');
    }

    handleModeChange(event) {
        const newMode = event.target.dataset.mode;
        if (newMode === this.gameMode) return;
        
        // Update active button
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        this.gameMode = newMode;
        this.newGame();
        
        // Update player 2 label
        const player2Label = document.getElementById('player2Label');
        player2Label.textContent = newMode === 'pvc' ? 'Computer (O)' : 'Player 2 (O)';
    }

    resetGame() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.isComputerThinking = false;
        
        // Clear board
        document.querySelectorAll('.cell').forEach(cell => {
            cell.innerHTML = '';
            cell.classList.remove('occupied', 'x-symbol', 'o-symbol');
        });
        
        // Hide winning line
        const line = document.getElementById('winningLine');
        line.classList.remove('show');
        
        // Reset status
        const statusElement = document.getElementById('gameStatus');
        statusElement.classList.remove('winner', 'draw', 'thinking');
        
        this.enableBoard();
        this.updateDisplay();
        
        // Re-bind events to ensure they work after reset
        this.bindEvents();
    }

    newGame() {
        this.resetGame();
        this.scores = { X: 0, O: 0, draw: 0 };
        this.updateScoreDisplay();
    }

    updateDisplay() {
        const currentPlayerElement = document.getElementById('currentPlayer');
        const statusElement = document.getElementById('gameStatus');
        
        currentPlayerElement.textContent = this.currentPlayer;
        
        if (this.gameActive) {
            if (this.gameMode === 'pvc') {
                statusElement.textContent = this.currentPlayer === 'X' 
                    ? "Your turn" 
                    : "Computer's turn";
            } else {
                statusElement.textContent = `Player ${this.currentPlayer}'s turn`;
            }
        }
    }

    updateScoreDisplay() {
        document.getElementById('scoreX').textContent = this.scores.X;
        document.getElementById('scoreO').textContent = this.scores.O;
        document.getElementById('scoreDraw').textContent = this.scores.draw;
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...'); // Debug log
    window.game = new TicTacToeGame(); // Make it globally accessible for debugging
});

// Add ripple effect to buttons
document.addEventListener('DOMContentLoaded', () => {
    // Add ripple effect to buttons
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});

// Add ripple effect styles dynamically
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    .btn {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: rippleAnimation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes rippleAnimation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);