// ============================================
// ===== PeerGame - اللعب العالمي عبر الإنترنت =====
// ============================================
const PeerGame = {
    peer: null,
    conn: null,
    isHost: false,
    mySymbol: 'X',
    currentCode: null,

    // عرض اللوبي
    showLobby() {
        document.getElementById('gameModeSelect').style.display = 'none';
        const l = document.getElementById('onlineLobby');
        l.style.display = 'block';
        l.innerHTML = `
            <div class="lobby">
                <h3>🌍 غرفة اللعب العالمي</h3>
                
                <div class="lobby-section">
                    <h4>🏠 إنشاء غرفة جديدة</h4>
                    <p>أنشئ غرفة وشارك الرابط أو الكود أو QR مع أي شخص في العالم:</p>
                    <button class="game-btn primary" style="width:100%;" onclick="PeerGame.createRoom()">
                        ➕ إنشاء غرفة
                    </button>
                    <div id="createdRoom" style="display:none;"></div>
                </div>

                <div class="lobby-section">
                    <h4>🚪 الانضمام لغرفة</h4>
                    <p>أدخل الكود الذي شاركه معك صديقك:</p>
                    <div class="input-group">
                        <input type="text" id="joinCode" placeholder="ABC123" maxlength="6">
                        <button onclick="PeerGame.joinRoom()">انضمام</button>
                    </div>
                    <div class="connection-status" id="joinStatus" style="display:none;"></div>
                </div>

                <button class="game-btn secondary" style="width:100%; margin-top:10px;" onclick="PeerGame.back()">
                    ⬅️ العودة
                </button>
            </div>
        `;

        // التحقق من وجود كود انضمام في الرابط
        const joinCode = Utils.getJoinCodeFromURL();
        if (joinCode && joinCode.length === 6) {
            document.getElementById('joinCode').value = joinCode;
            setTimeout(() => {
                if (confirm(`تم اكتشاف كود دعوة: ${joinCode}\nهل تريد الانضمام للغرفة؟`)) {
                    this.joinRoom();
                }
            }, 500);
        }
    },

    back() {
        this.cleanup();
        document.getElementById('onlineLobby').style.display = 'none';
        document.getElementById('gameModeSelect').style.display = 'block';
        // تنظيف الرابط
        if (window.history.replaceState) {
            const url = new URL(window.location.href);
            url.search = '';
            window.history.replaceState({}, '', url);
        }
    },

    cleanup() {
        if (this.peer) { this.peer.destroy(); this.peer = null; }
        if (this.conn) { this.conn.close(); this.conn = null; }
        this.currentCode = null;
    },

    // إنشاء غرفة
    createRoom() {
        const code = Utils.generateRoomCode();
        this.currentCode = code;
        this.isHost = true;
        this.mySymbol = 'X';
        
        this.peer = new Peer('xo-game-' + code, { debug: 0 });
        
        this.peer.on('open', () => {
            const roomDiv = document.getElementById('createdRoom');
            roomDiv.style.display = 'block';
            const gameURL = Utils.generateGameURL(code);
            
            roomDiv.innerHTML = `
                <p style="margin-top:10px; color:#065f46; font-weight:600;">📋 كود الغرفة:</p>
                <div class="room-code" onclick="PeerGame.copyCode('${code}')">${code}</div>
                
                <div class="share-link-box">
                    <label>🔗 رابط الدعوة (شاركه مع صديقك):</label>
                    <input type="text" id="gameURL" value="${gameURL}" readonly onclick="this.select()">
                    <div class="share-buttons">
                        <button class="share-btn copy" onclick="PeerGame.copyURL()">📋 نسخ الرابط</button>
                        <button class="share-btn whatsapp" onclick="PeerGame.shareWhatsApp()">📱 واتساب</button>
                        <button class="share-btn telegram" onclick="PeerGame.shareTelegram()">✈️ تيليجرام</button>
                    </div>
                </div>

                <div class="qr-container">
                    <p style="color:#4c1d95; font-weight:600; margin-bottom:10px;">📷 أو امسح الـ QR للانضمام:</p>
                    <canvas id="qrCanvas"></canvas>
                    <p class="qr-hint">اطلب من صديقك مسح هذا الرمز بكاميرا الهاتف</p>
                </div>

                <div class="connection-status connecting" id="hostStatus">
                    ⏳ في انتظار انضمام لاعب آخر...
                </div>
            `;

            // توليد QR code
            setTimeout(() => {
                const canvas = document.getElementById('qrCanvas');
                if (canvas && typeof QRCode !== 'undefined') {
                    QRCode.toCanvas(canvas, gameURL, {
                        width: 200,
                        margin: 2,
                        color: { dark: '#4c1d95', light: '#ffffff' }
                    });
                }
            }, 100);
        });
        
        this.peer.on('connection', (connection) => {
            this.conn = connection;
            this.setupConnection();
        });
        
        this.peer.on('error', (err) => {
            const s = document.getElementById('hostStatus');
            if (s) {
                s.className = 'connection-status error';
                s.textContent = '❌ خطأ: ' + err.type;
            }
        });
    },

    // الانضمام لغرفة
    joinRoom() {
        const code = document.getElementById('joinCode').value.trim().toUpperCase();
        if (code.length !== 6) {
            Utils.showToast('❌ الكود يجب أن يكون 6 أحرف', 'error');
            return;
        }
        
        this.isHost = false;
        this.mySymbol = 'O';
        this.currentCode = code;
        const s = document.getElementById('joinStatus');
        s.style.display = 'block';
        s.className = 'connection-status connecting';
        s.textContent = '⏳ جاري الانضمام...';
        
        this.peer = new Peer({ debug: 0 });
        
        this.peer.on('open', () => {
            this.conn = this.peer.connect('xo-game-' + code, { reliable: true });
            this.setupConnection();
        });
        
        this.peer.on('error', (err) => {
            s.className = 'connection-status error';
            s.textContent = '❌ خطأ: ' + err.type + ' - تأكد من صحة الكود';
        });
    },

    // إعداد الاتصال
    setupConnection() {
        const s = this.isHost ? document.getElementById('hostStatus') : document.getElementById('joinStatus');
        
        this.conn.on('open', () => {
            s.className = 'connection-status connected';
            s.textContent = '✅ تم الاتصال! جاري بدء اللعبة...';
            
            setTimeout(() => {
                Game.mode = 'online';
                Game.showScreen();
                setTimeout(() => {
                    const p1 = document.getElementById('p1Name');
                    const p2 = document.getElementById('p2Name');
                    if (p1) p1.textContent = this.isHost ? 'أنت' : 'المنشئ';
                    if (p2) p2.textContent = this.isHost ? 'المنضم' : 'أنت';
                }, 50);
                if (this.isHost) Game.reset();
            }, 800);
        });
        
        this.conn.on('data', (data) => this.handleMessage(data));
        
        this.conn.on('close', () => {
            Utils.showToast('❌ انقطع الاتصال باللاعب الآخر', 'error');
            setTimeout(() => Game.exit(), 2000);
        });
        
        this.conn.on('error', () => {
            s.className = 'connection-status error';
            s.textContent = '❌ خطأ في الاتصال';
        });
    },

    // معالجة الرسائل
    handleMessage(data) {
        if (data.type === 'move') {
            Game.makeMove(data.index);
        } else if (data.type === 'start') {
            Game.board = Array(9).fill('');
            Game.currentTurn = 'X';
            Game.gameActive = true;
            Game.renderBoard();
            Game.updateTurnUI();
        }
    },

    // إرسال حركة
    sendMove(index) {
        if (this.conn && this.conn.open) {
            this.conn.send({ type: 'move', index });
        }
    },

    // نسخ الكود
    async copyCode(code) {
        if (await Utils.copyToClipboard(code)) {
            Utils.showToast('📋 تم نسخ الكود!', 'success');
        }
    },

    // نسخ الرابط
    async copyURL() {
        const url = document.getElementById('gameURL')?.value;
        if (url && await Utils.copyToClipboard(url)) {
            Utils.showToast('📋 تم نسخ الرابط!', 'success');
        }
    },

    // مشاركة عبر واتساب
    shareWhatsApp() {
        const url = document.getElementById('gameURL')?.value;
        if (!url) return;
        const text = `🎮 تعال العب XO معي! اضغط الرابط للانضمام:\n${url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    },

    // مشاركة عبر تيليجرام
    shareTelegram() {
        const url = document.getElementById('gameURL')?.value;
        if (!url) return;
        const text = `🎮 تعال العب XO معي!`;
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
    }
};
