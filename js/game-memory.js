// ============================================
// ===== GameMemory - لعبة الذاكرة =====
// ============================================
const GameMemory = {
    cards: [],
    flipped: [],
    matched: [],
    moves: 0,
    gameActive: false,

    emojis: ['🎮', '🎯', '🎲', '🎨', '🎭', '🎪', '🎸', '🎺'],

    start() {
        const container = document.getElementById('gameContainer');
        container.style.display = 'block';
        container.innerHTML = `
            <div class="game-wrapper">
                <div class="game-header">
                    <h3>🧠 لعبة الذاكرة</h3>
                    <button class="back-btn" onclick="GameMemory.exit()">🚪 خروج</button>
                </div>
                <div class="memory-stats">
                    <div>المحاولات: <span id="memoryMoves">0</span></div>
                    <div>المتبقي: <span id="memoryRemaining">8</span></div>
                </div>
                <div class="memory-board" id="memoryBoard"></div>
                <button class="reset-btn" onclick="GameMemory.reset()">🔄 لعبة جديدة</button>
            </div>
        `;
        this.reset();
    },

    exit() {
        document.getElementById('gameContainer').style.display = 'none';
        this.gameActive = false;
    },

    reset() {
        this.cards = [...this.emojis, ...this.emojis].sort(() => Math.random() - 0.5);
        this.flipped = [];
        this.matched = [];
        this.moves = 0;
        this.gameActive = true;
        this.renderBoard();
        this.updateStats();
    },

    renderBoard() {
        const board = document.getElementById('memoryBoard');
        if (!board) return;
        board.innerHTML = '';
        this.cards.forEach((emoji, i) => {
            const card = document.createElement('div');
            card.className = 'memory-card' + (this.matched.includes(i) ? ' matched' : '') + (this.flipped.includes(i) ? ' flipped' : '');
            card.innerHTML = this.flipped.includes(i) || this.matched.includes(i) ? emoji : '❓';
            card.onclick = () => this.flipCard(i);
            board.appendChild(card);
        });
    },

    flipCard(i) {
        if (!this.gameActive || this.flipped.includes(i) || this.matched.includes(i)) return;
        
        this.flipped.push(i);
        this.renderBoard();
        
        if (this.flipped.length === 2) {
            this.moves++;
            this.updateStats();
            
            const [a, b] = this.flipped;
            if (this.cards[a] === this.cards[b]) {
                this.matched.push(a, b);
                this.flipped = [];
                this.renderBoard();
                
                if (this.matched.length === this.cards.length) {
                    this.gameActive = false;
                    Points.add(15, 'إكمال لعبة الذاكرة');
                    setTimeout(() => {
                        alert(`🎉 أحسنت! أكملت اللعبة في ${this.moves} محاولة`);
                    }, 300);
                }
            } else {
                setTimeout(() => {
                    this.flipped = [];
                    this.renderBoard();
                }, 1000);
            }
        }
    },

    updateStats() {
        const moves = document.getElementById('memoryMoves');
        const remaining = document.getElementById('memoryRemaining');
        if (moves) moves.textContent = this.moves;
        if (remaining) remaining.textContent = (this.cards.length - this.matched.length) / 2;
    }
};
