// ============================================
// ===== Game - لعبة XO المحلية =====
// ============================================
const Game = {
    board: Array(9).fill(''),
    currentTurn: 'X',
    scores: { X: 0, O: 0 },
    gameActive: false,
    mode: null, // 'local' أو 'online'

    startLocal() {
        this.mode = 'local';
        this.reset();
        this.showScreen();
        setTimeout(() => {
            const p1 = document.getElementById('p1Name');
            const p2 = document.getElementById('p2Name');
            if (p1) p1.textContent = 'لاعب 1';
            if (p2) p2.textContent = 'لاعب 2';
        }, 50);
    },

    showScreen() {
        document.getElementById('gameModeSelect').style.display = 'none';
        document.getElementById('onlineLobby').style.display = 'none';
        const s = document.getElementById('gameScreen');
        s.style.display = 'block';
        s.innerHTML = `
            <div class="game-container">
                <div class="game-header">
                    <h3 style="color:#4c1d95;">🎮 لعبة XO</h3>
                    <button class="back-btn" onclick="Game.exit()">🚪 خروج</button>
                </div>
                <div class="player-info">
                    <div class="player" id="player1Box">
                        <div class="symbol">❌</div>
                        <div class="name" id="p1Name">لاعب 1</div>
                        <div class="score" id="p1Score">0</div>
                    </div>
                    <div style="display:flex; align-items:center; color:#9ca3af; font-weight:bold;">VS</div>
                    <div class="player" id="player2Box">
                        <div class="symbol">⭕</div>
                        <div class="name" id="p2Name">لاعب 2</div>
                        <div class="score" id="p2Score">0</div>
                    </div>
                </div>
                <div class="game-status" id="gameStatus">دور اللاعب ❌</div>
                <div class="board" id="board"></div>
                <div class="game-actions">
                    <button class="game-btn secondary" onclick="Game.reset()">🔄 جولة جديدة</button>
                </div>
            </div>
        `;
        this.renderBoard();
    },

    exit() {
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('gameModeSelect').style.display = 'block';
        this.gameActive = false;
        PeerGame.cleanup();
    },

    reset() {
        this.board = Array(9).fill('');
        this.currentTurn = 'X';
        this.scores = { X: 0, O: 0 };
        this.gameActive = true;
        this.renderBoard();
        this.updateTurnUI();
        this.updateScoresUI();
    },

    renderBoard() {
        const el = document.getElementById('board');
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
        if (this.mode === 'online' && this.currentTurn !== PeerGame.mySymbol) {
            Utils.showToast('⏳ ليس دورك', 'error');
            return;
        }
        if (this.mode === 'online') PeerGame.sendMove(i);
        this.makeMove(i);
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
            const name = this.getWinnerName(winner);
            document.getElementById('gameStatus').textContent = `🎉 فاز ${name}!`;
            if (this.mode === 'local' || winner === PeerGame.mySymbol) {
                Points.add(10, 'فوز في XO');
            }
            setTimeout(() => {
                if (confirm(`فاز ${name}! جولة جديدة؟`)) this.startNewRound();
            }, 800);
            return;
        }
        
        if (this.board.every(c => c)) {
            this.gameActive = false;
            document.getElementById('gameStatus').textContent = '🤝 تعادل!';
            Points.add(3, 'تعادل في XO');
            setTimeout(() => {
                if (confirm('تعادل! جولة جديدة؟')) this.startNewRound();
            }, 800);
            return;
        }
        
        this.currentTurn = this.currentTurn === 'X' ? 'O' : 'X';
        this.updateTurnUI();
    },

    startNewRound() {
        this.board = Array(9).fill('');
        this.currentTurn = 'X';
        this.gameActive = true;
        this.renderBoard();
        this.updateTurnUI();
        if (this.mode === 'online' && PeerGame.isHost && PeerGame.conn?.open) {
            PeerGame.conn.send({ type: 'start' });
        }
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
        const s = document.getElementById('gameStatus');
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
    },

    getWinnerName(s) {
        if (this.mode === 'local') return s === 'X' ? 'لاعب 1' : 'لاعب 2';
        return s === PeerGame.mySymbol ? 'أنت' : 'الخصم';
    }
};
