// ============================================
// ===== GameSnake - لعبة الثعبان =====
// ============================================
const GameSnake = {
    canvas: null,
    ctx: null,
    snake: [],
    food: null,
    direction: 'right',
    score: 0,
    gameLoop: null,
    gameActive: false,
    gridSize: 20,
    tileCount: 20,

    start() {
        const container = document.getElementById('gameContainer');
        container.style.display = 'block';
        container.innerHTML = `
            <div class="game-wrapper">
                <div class="game-header">
                    <h3>🐍 لعبة الثعبان</h3>
                    <button class="back-btn" onclick="GameSnake.exit()">🚪 خروج</button>
                </div>
                <div class="snake-score">النقاط: <span id="snakeScore">0</span></div>
                <canvas id="snakeCanvas" width="400" height="400"></canvas>
                <div class="snake-controls">
                    <button onclick="GameSnake.changeDirection('up')">⬆️</button>
                    <div>
                        <button onclick="GameSnake.changeDirection('left')">⬅️</button>
                        <button onclick="GameSnake.changeDirection('down')">⬇️</button>
                        <button onclick="GameSnake.changeDirection('right')">➡️</button>
                    </div>
                </div>
                <button class="reset-btn" onclick="GameSnake.reset()">🔄 لعبة جديدة</button>
            </div>
        `;
        
        this.canvas = document.getElementById('snakeCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;
            if (e.key === 'ArrowUp' && this.direction !== 'down') this.direction = 'up';
            if (e.key === 'ArrowDown' && this.direction !== 'up') this.direction = 'down';
            if (e.key === 'ArrowLeft' && this.direction !== 'right') this.direction = 'left';
            if (e.key === 'ArrowRight' && this.direction !== 'left') this.direction = 'right';
        });
        
        this.reset();
    },

    exit() {
        document.getElementById('gameContainer').style.display = 'none';
        this.gameActive = false;
        if (this.gameLoop) clearInterval(this.gameLoop);
    },

    reset() {
        this.snake = [{ x: 10, y: 10 }];
        this.direction = 'right';
        this.score = 0;
        this.gameActive = true;
        this.placeFood();
        this.updateScore();
        
        if (this.gameLoop) clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.update(), 100);
    },

    placeFood() {
        this.food = {
            x: Math.floor(Math.random() * this.tileCount),
            y: Math.floor(Math.random() * this.tileCount)
        };
    },

    update() {
        if (!this.gameActive) return;
        
        const head = { ...this.snake[0] };
        if (this.direction === 'up') head.y--;
        if (this.direction === 'down') head.y++;
        if (this.direction === 'left') head.x--;
        if (this.direction === 'right') head.x++;
        
        // التحقق من الاصطدام
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }
        
        for (const segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver();
                return;
            }
        }
        
        this.snake.unshift(head);
        
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.placeFood();
        } else {
            this.snake.pop();
        }
        
        this.draw();
    },

    draw() {
        this.ctx.fillStyle = '#1f2937';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // رسم الطعام
        this.ctx.fillStyle = '#ef4444';
        this.ctx.fillRect(this.food.x * this.gridSize, this.food.y * this.gridSize, this.gridSize - 2, this.gridSize - 2);
        
        // رسم الثعبان
        this.snake.forEach((segment, i) => {
            this.ctx.fillStyle = i === 0 ? '#10b981' : '#059669';
            this.ctx.fillRect(segment.x * this.gridSize, segment.y * this.gridSize, this.gridSize - 2, this.gridSize - 2);
        });
    },

    changeDirection(dir) {
        if (!this.gameActive) return;
        if (dir === 'up' && this.direction !== 'down') this.direction = 'up';
        if (dir === 'down' && this.direction !== 'up') this.direction = 'down';
        if (dir === 'left' && this.direction !== 'right') this.direction = 'left';
        if (dir === 'right' && this.direction !== 'left') this.direction = 'right';
    },

    updateScore() {
        const el = document.getElementById('snakeScore');
        if (el) el.textContent = this.score;
    },

    gameOver() {
        this.gameActive = false;
        clearInterval(this.gameLoop);
        
        const points = Math.floor(this.score / 10);
        if (points > 0) {
            Points.add(points, `لعبة الثعبان (${this.score} نقطة)`);
        }
        
        setTimeout(() => {
            alert(`💀 انتهت اللعبة!\nالنقاط: ${this.score}\nالنقاط المكتسبة: ${points}`);
        }, 100);
    }
};
