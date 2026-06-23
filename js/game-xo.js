// ============================================
// ===== game-xo.js - النسخة النهائية المُصلحة =====
// ============================================

const GameXO = {
    board: Array(9).fill(''),
    currentTurn: 'X',
    scores: { X: 0, O: 0 },
    gameActive: false,
    mode: null,
    vsComputer: false,

    start() {
        const container = document.getElementById('gameContainer');
        if (!container) return;
        
        container.style.display = 'block';
        container.innerHTML = `
            <div class="game-wrapper">
                <div class="game-header">
                    <h3 style="color:#4c1d95;">⭕❌ لعبة XO</h3>
                    <button class="back-btn" onclick="GameXO.exit()">🚪 خروج</button>
                </div>
                
                <div class="game-mode-select" id="xoModeSelect">
                    <button class="mode-btn" onclick="GameXO.startComputerGame()">
                        🤖 ضد الكمبيوتر
                    </button>
                    <button class="mode-btn" onclick="GameXO.startLocalGame()">
                        👥 محلي (نفس الجهاز)
                    </button>
                    <button class="mode-btn online" onclick="PeerGame.showLobby()">
                        🌍 أونلاين (عبر الإنترنت)
                    </button>
                </div>

                <div id="xoGameArea" style="display:none;"></div>
            </div>
        `;
    },

    startComputerGame() {
        this.mode = 'computer';
        this.vsComputer = true;
        this.showGameArea('أنت', 'الكمبيوتر 🤖');
        this.reset();
    },

    startLocalGame() {
        this.mode = 'local';
        this.vsComputer = false;
        this.showGameArea('لاعب 1', 'لاعب 2');
        this.reset();
    },

    // 🆕 الإصلاح النهائي: استخدام setTimeout للسماح بتحديث DOM
    startOnlineGame(isHost) {
        console.log('🎮 بدء اللعبة الأونلاين - المضيف:', isHost);
        
        this.mode = 'online';
        this.vsComputer = false;
        
        const p1Name = isHost ? 'أنت (❌)' : 'الخصم (❌)';
        const p2Name = isHost ? 'الخصم (⭕)' : 'أنت (⭕)';
        
        const container = document.getElementById('gameContainer');
        if (!container) {
            console.error('❌ gameContainer غير موجود!');
            return;
        }
        
        console.log('🔨 إنشاء شاشة اللعبة...');
        
        // استبدال محتوى الحاوية
        container.innerHTML = `
            <div class="game-wrapper">
                <div class="game-header">
                    <h3 style="color:#4c1d95;">⭕❌ لعبة XO - أونلاين</h3>
                    <button class="back-btn" onclick="GameXO.exit()">🚪 خروج</button>
                </div>
                
                <div class="connection-quality-indicator" id="connectionQuality">
                    <div class="quality-dot"></div>
                    <span id="qualityText">متصل</span>
                </div>
                
                <div class="player-info">
                    <div class="player" id="player1Box">
                        <div class="symbol">❌</div>
                        <div class="name" id="p1Name">${p1Name}</div>
                        <div class="score" id="p1Score">${this.scores.X}</div>
                    </div>
                    <div class="vs">VS</div>
                    <div class="player" id="player2Box">
                        <div class="symbol">⭕</div>
                        <div class="name" id="p2Name">${p2Name}</div>
                        <div class="score" id="p2Score">${this.scores.O}</div>
                    </div>
                </div>

                <div class="game-status" id="xoStatus">دور اللاعب ❌</div>
                <div class="board" id="xoBoard"></div>
                <button class="reset-btn" onclick="GameXO.reset()">🔄 جولة جديدة</button>
            </div>
        `;
        
        console.log('✅ تم إنشاء شاشة اللعبة');
        
        // 🆕 الحل: استخدام setTimeout للسماح للمتصفح بتحديث DOM
        setTimeout(() => {
            console.log('🔍 التحقق من وجود العناصر...');
            
            const xoBoard = document.getElementById('xoBoard');
            const xoStatus = document.getElementById('xoStatus');
            
            if (!xoBoard) {
                console.error('❌ xoBoard غير موجود حتى بعد التأخير!');
                console.log('🔨 محاولة إعادة إنشاء الشاشة...');
                // محاولة مرة أخرى
                container.innerHTML = `
                    <div class="game-wrapper">
                        <div class="game-header">
                            <h3 style="color:#4c1d95;">⭕❌ لعبة XO - أونلاين</h3>
                            <button class="back-btn" onclick="GameXO.exit()">🚪 خروج</button>
                        </div>
                        <div class="connection-quality-indicator" id="connectionQuality">
                            <div class="quality-dot"></div>
                            <span id="qualityText">متصل</span>
                        </div>
                        <div class="player-info">
                            <div class="player" id="player1Box">
                                <div class="symbol">❌</div>
                                <div class="name" id="p1Name">${p1Name}</div>
                                <div class="score" id="p1Score">${this.scores.X}</div>
                            </div>
                            <div class="vs">VS</div>
                            <div class="player" id="player2Box">
                                <div class="symbol">⭕</div>
                                <div class="name" id="p2Name">${p2Name}</div>
                                <div class="score" id="p2Score">${this.scores.O}</div>
                            </div>
                        </div>
                        <div class="game-status" id="xoStatus">دور اللاعب ❌</div>
                        <div class="board" id="xoBoard"></div>
                        <button class="reset-btn" onclick="GameXO.reset()">🔄 جولة جديدة</button>
                    </div>
                `;
            }
            
            // بدء اللعبة
            console.log('🎮 بدء اللعبة...');
            this.reset();
            console.log('✅ تم بدء اللعبة الأونلاين بنجاح');
        }, 100);  // 🆕 تأخير 100 ميلي ثانية
    },

    showGameArea(p1Name, p2Name) {
        const gameArea = document.getElementById('xoGameArea');
        const modeSelect = document.getElementById('xoModeSelect');
        
        if (modeSelect) modeSelect.style.display = 'none';
        
        if (!gameArea) {
            console.error('❌ xoGameArea غير موجود!');
            return;
        }
        
        gameArea.style.display = 'block';
        gameArea.innerHTML = `
            <div class="player-info">
                <div class="player" id="player1Box">
                    <div class="symbol">❌</div>
                    <div class="name" id="p1Name">${p1Name}</div>
                    <div class="score" id="p1Score">${this.scores.X}</div>
                </div>
                <div class="vs">VS</div>
                <div class="player" id="player2Box">
                    <div class="symbol">⭕</div>
                    <div class="name" id="p2Name">${p2Name}</div>
                    <div class="score" id="p2Score">${this.scores.O}</div>
                </div>
            </div>

            <div class="game-status" id="xoStatus">دور اللاعب ❌</div>
            <div class="board" id="xoBoard"></div>
            <button class="reset-btn" onclick="GameXO.reset()">🔄 جولة جديدة</button>
        `;
    },

    exit() {
        const container = document.getElementById('gameContainer');
        if (container) {
            container.style.display = 'none';
            container.innerHTML = '';
        }
        this.gameActive = false;
        this.mode = null;
        this.scores = { X: 0, O: 0 };
        
        if (typeof PeerGame !== 'undefined') {
            PeerGame.cleanup();
        }
    },

    reset() {
        this.board = Array(9).fill('');
        this.currentTurn = 'X';
        this.gameActive = true;
        this.renderBoard();
        this.updateTurnUI();
        console.log('🔄 تم إعادة تعيين اللعبة');
    },

    renderBoard() {
        const el = document.getElementById('xoBoard');
        if (!el) {
            console.warn('⚠️ xoBoard غير موجود - سيتم المحاولة مرة أخرى');
            // 🆕 محاولة مرة أخرى بعد تأخير قصير
            setTimeout(() => {
                const el2 = document.getElementById('xoBoard');
                if (el2) {
                    this.renderBoard();
                } else {
                    console.error('❌ xoBoard لا يزال غير موجود!');
                }
            }, 200);
            return;
        }
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
        
        if (this.mode === 'online') {
            if (this.currentTurn !== PeerGame.mySymbol) {
                Utils.showToast('⏳ ليس دورك الآن', 'warning');
                return;
            }
            PeerGame.sendMove(i);
        }
        
        this.makeMove(i);
    },

    makeMove(i) {
        if (!this.gameActive || this.board[i]) return;
        
        this.board[i] = this.currentTurn;
        this.renderBoard();
        
        const w = this.checkWin();
        if (w) {
            this.gameActive = false;
            w.forEach(idx => {
                const cells = document.querySelectorAll('.cell');
                if (cells[idx]) cells[idx].classList.add('win');
            });
            
            const winner = this.currentTurn;
            this.scores[winner]++;
            this.updateScoresUI();
            
            const name = this.getWinnerName(winner);
            const status = document.getElementById('xoStatus');
            if (status) status.textContent = `🎉 فاز ${name}!`;
            
            if (this.mode === 'local') {
                Points.add(10, 'فوز في XO');
            } else if (this.mode === 'online' && winner === PeerGame.mySymbol) {
                Points.add(15, 'فوز في XO أونلاين');
            } else if (this.mode === 'computer' && winner === 'X') {
                Points.add(10, 'فوز على الكمبيوتر');
            }
            
            setTimeout(() => {
                if (confirm(`فاز ${name}! جولة جديدة؟`)) {
                    this.reset();
                    if (this.mode === 'online' && PeerGame.isHost) {
                        PeerGame.send({ type: 'restart' });
                    }
                }
            }, 800);
            return;
        }
        
        if (this.board.every(c => c)) {
            this.gameActive = false;
            const status = document.getElementById('xoStatus');
            if (status) status.textContent = '🤝 تعادل!';
            Points.add(3, 'تعادل في XO');
            setTimeout(() => {
                if (confirm('تعادل! جولة جديدة؟')) {
                    this.reset();
                    if (this.mode === 'online' && PeerGame.isHost) {
                        PeerGame.send({ type: 'restart' });
                    }
                }
            }, 800);
            return;
        }
        
        this.currentTurn = this.currentTurn === 'X' ? 'O' : 'X';
        this.updateTurnUI();
        
        if (this.mode === 'computer' && this.currentTurn === 'O' && this.gameActive) {
            setTimeout(() => this.computerMove(), 500);
        }
    },

    computerMove() {
        if (!this.gameActive) return;
        let move = this.findWinningMove('O') ?? this.findWinningMove('X') ?? this.findBestMove();
        if (move !== null) this.makeMove(move);
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

    checkWin() {
        const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        for (const combo of wins) {
            const [a,b,c] = combo;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                return combo;
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
    },

    getWinnerName(symbol) {
        if (this.mode === 'local') return symbol === 'X' ? 'لاعب 1' : 'لاعب 2';
        if (this.mode === 'computer') return symbol === 'X' ? 'أنت' : 'الكمبيوتر';
        if (this.mode === 'online') return symbol === PeerGame.mySymbol ? 'أنت' : 'الخصم';
        return 'لاعب';
    }
};
