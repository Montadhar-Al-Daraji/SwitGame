// ============================================
// ===== GameXO - لعبة XO =====
// ============================================
const GameXO = {
    board: Array(9).fill(''),
    currentTurn: 'X',
    scores: { X: 0, O: 0 },
    gameActive: false,
    vsComputer: false,

    start() {
        const container = document.getElementById('gameContainer');
        container.style.display = 'block';
        container.innerHTML = `
            <div class="game-wrapper">
                <div class="game-header">
                    <h3>⭕❌ لعبة XO</h3>
                    <button class="back-btn" onclick="GameXO.exit()">🚪 خروج</button>
                </div>
                
                <div class="game-mode-select" id="xoModeSelect">
                    <button class="mode-btn" onclick="GameXO.startGame(false)">
                        👥 ضد صديق
                    </button>
                    <button class="mode-btn" onclick="GameXO.startGame(true)">
                        🤖 ضد الكمبيوتر
                    </button>
                </div>

                <div id="xoGameArea" style="display:none;">
                    <div class="player-info">
                        <div class="player" id="player1Box">
                            <div class="symbol">❌</div>
                            <div class="name" id="p1Name">لاعب 1</div>
                            <div class="score" id="p1Score">0</div>
                        </div>
                        <div class="vs">VS</div>
                        <div class="player" id="player2Box">
                            <div class="symbol">⭕</div>
                            <div class="name" id="p2Name">لاعب 2</div>
                            <div class="score" id="p2Score">0</div>
                        </div>
                    </div>

                    <div class="game-status" id="xoStatus">دور اللاعب ❌</div>
                    <div class="board" id="xoBoard"></div>
                    <button class="reset-btn" onclick="GameXO.reset()">🔄 جولة جديدة</button>
                </div>
            </div>
        `;
    },

    startGame(vsComputer) {
        this.vsComputer = vsComputer;
        document.getElementById('xoModeSelect').style.display = 'none';
        document.getElementById('xoGameArea').style.display = 'block';
        
        document.getElementById('p1Name').textContent = 'أنت';
        document.getElementById('p2Name').textContent = vsComputer ? 'الكمبيوتر' : 'صديق';
        
        this.reset();
    },

    exit() {
        document.getElementById('gameContainer').style.display = 'none';
        this.gameActive = false;
    },

    reset() {
        this.board = Array(9).fill('');
        this.currentTurn = 'X';
        this.gameActive = true;
        this.renderBoard();
        this.updateTurnUI();
    },

    renderBoard() {
        const el = document.getElementById('xoBoard');
        if (!el) return;
        el.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const c = document.createElement('div');
            c.className = 'cell' + (this.board[i] ? ' taken ' + this.board[i].toLowerCase() : '');
            c.textContent = this.board[i] === 'X' ? '❌' : this.board[i] === 'O' ? '⭕' : '';
            c.onclick = () => this.handleClick(i);
            el.appendChild(c);
        }
    },

    handleClick(i) {
        if (!this.gameActive || this.board[i]) return;
        if (this.vsComputer && this.currentTurn === 'O') return;
        
        this.makeMove(i);
        
        if (this.vsComputer && this.gameActive && this.currentTurn === 'O') {
            setTimeout(() => this.computerMove(), 500);
        }
    },

    computerMove() {
        if (!this.gameActive) return;
        
        // ذكاء اصطناعي بسيط
        let move = this.findWinningMove('O') ?? 
                   this.findWinningMove('X') ?? 
                   this.findBestMove();
        
        if (move !== null) {
            this.makeMove(move);
        }
    },

    findWinningMove(symbol) {
        const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        for (const [a,b,c] of wins) {
            if (this.board[a] === symbol && this.board[b] === symbol && !this.board[c]) return c;
            if (this.board[a] === symbol && this.board[c] === symbol && !this.board[b]) return b;
            if (this.board[b] === symbol && this.board[c] === symbol && !this.board[a]) return a;
        }
        return null;
    },

    findBestMove() {
        if (!this.board[4]) return 4;
        const corners = [0, 2, 6, 8].filter(i => !this.board[i]);
        if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
        const empty = this.board.map((v, i) => v ? null : i).filter(v => v !== null);
        return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
    },

    makeMove(i) {
        if (!this.gameActive || this.board[i]) return;
        this.board[i] = this.currentTurn;
        this.renderBoard();
        
        const w = this.checkWin();
        if (w) {
            this.gameActive = false;
            w.forEach(idx => document.querySelectorAll('.cell')[idx].classList.add('win'));
            const winner = this.currentTurn;
            this.scores[winner]++;
            this.updateScoresUI();
            
            const isPlayerWin = !this.vsComputer || winner === 'X';
            const name = winner === 'X' ? 'أنت' : (this.vsComputer ? 'الكمبيوتر' : 'صديق');
            document.getElementById('xoStatus').textContent = `🎉 فاز ${name}!`;
            
            if (isPlayerWin) {
                Points.add(10, 'فوز في XO');
            }
            
            setTimeout(() => {
                if (confirm(`فاز ${name}! جولة جديدة؟`)) this.reset();
            }, 800);
            return;
        }
        
        if (this.board.every(c => c)) {
            this.gameActive = false;
            document.getElementById('xoStatus').textContent = '🤝 تعادل!';
            Points.add(3, 'تعادل في XO');
            setTimeout(() => {
                if (confirm('تعادل! جولة جديدة؟')) this.reset();
            }, 800);
            return;
        }
        
        this.currentTurn = this.currentTurn === 'X' ? 'O' : 'X';
        this.updateTurnUI();
    },

    checkWin() {
        const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        for (const [a,b,c] of wins) {
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                return [a,b,c];
            }
        }
        return null;
    },

    updateTurnUI() {
        const s = document.getElementById('xoStatus');
        if (s) s.textContent = `دور اللاعب ${this.currentTurn === 'X' ? '❌' : '⭕'}`;
        const p1 = document.getElementById('player1Box');
        const p2 = document.getElementById('player2Box');
        if (p1) p1.classList.toggle('active', this.currentTurn === 'X');
        if (p2) p2.classList.toggle('active', this.currentTurn === 'O');
    },

    updateScoresUI() {
        const s1 = document.getElementById('p1Score');
        const s2 = document.getElementById('p2Score');
        if (s1) s1.textContent = this.scores.X;
        if (s2) s2.textContent = this.scores.O;
    }
};
