// ============================================
// ===== peer-game.js - نظام اللعب الأونلاين الذكي =====
// ============================================

const PeerGame = {
    peer: null,
    conn: null,
    isHost: false,
    mySymbol: 'X',
    currentCode: null,
    
    // ===== إعدادات الاتصال الذكي =====
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 2000,
    heartbeatInterval: null,
    lastPingTime: 0,
    connectionQuality: 'excellent', // excellent, good, fair, poor
    latency: 0,
    
    // ===== حالة اللعبة =====
    gameState: null,
    pendingMoves: [],
    isReconnecting: false,
    
    // ===== عرض اللوبي =====
    showLobby() {
        const container = document.getElementById('gameContainer');
        if (!container) return;
        
        container.style.display = 'block';
        container.innerHTML = `
            <div class="game-wrapper">
                <div class="game-header">
                    <h3 style="color:#4c1d95;">🌍 اللعب العالمي</h3>
                    <button class="back-btn" onclick="PeerGame.exitLobby()">🚪 خروج</button>
                </div>
                
                <div class="connection-quality-indicator" id="connectionQuality">
                    <div class="quality-dot"></div>
                    <span>جاهز للاتصال</span>
                </div>
                
                <div class="lobby-sections">
                    <div class="lobby-section">
                        <h4>🏠 إنشاء غرفة جديدة</h4>
                        <p>أنشئ غرفة وشارك الكود أو الرابط مع صديقك</p>
                        <button class="game-btn primary" style="width:100%;" onclick="PeerGame.createRoom()">
                            ➕ إنشاء غرفة
                        </button>
                        <div id="createdRoom" style="display:none;"></div>
                    </div>
                    
                    <div class="lobby-divider">
                        <span>أو</span>
                    </div>
                    
                    <div class="lobby-section">
                        <h4>🚪 الانضمام لغرفة</h4>
                        <p>أدخل الكود الذي شاركه معك صديقك</p>
                        <div class="input-group">
                            <input type="text" id="joinCode" placeholder="ABC123" maxlength="6" 
                                   style="text-transform:uppercase; letter-spacing:3px; text-align:center;">
                            <button onclick="PeerGame.joinRoom()">انضمام</button>
                        </div>
                        <div class="connection-status" id="joinStatus" style="display:none;"></div>
                    </div>
                </div>
            </div>
        `;
        
        // التحقق من وجود كود في الرابط
        const urlCode = this.getCodeFromURL();
        if (urlCode) {
            document.getElementById('joinCode').value = urlCode;
            setTimeout(() => {
                if (confirm(`🎮 تم اكتشاف كود دعوة: ${urlCode}\nهل تريد الانضمام للغرفة؟`)) {
                    this.joinRoom();
                }
            }, 500);
        }
    },
    
    // ===== الخروج من اللوبي =====
    exitLobby() {
        this.cleanup();
        const container = document.getElementById('gameContainer');
        if (container) container.style.display = 'none';
    },
    
    // ===== استخراج الكود من الرابط =====
    getCodeFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('join')?.toUpperCase();
    },
    
    // ===== توليد رابط اللعبة =====
    generateGameURL(code) {
        const url = new URL(window.location.href);
        url.search = '';
        url.hash = '';
        url.searchParams.set('join', code);
        return url.toString();
    },
    
    // ===== إنشاء غرفة =====
    createRoom() {
        const code = Utils.generateRoomCode();
        this.currentCode = code;
        this.isHost = true;
        this.mySymbol = 'X';
        
        this.showConnectionStatus('hostStatus', 'connecting', '⏳ جاري إنشاء الغرفة...');
        
        try {
            this.peer = new Peer('switgame-' + code, {
                debug: 0,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'stun:stun3.l.google.com:19302' },
                        { urls: 'stun:stun4.l.google.com:19302' },
                        { urls: 'turn:openrelay.metered.ca:80',
                          username: 'openrelayproject',
                          credential: 'openrelayproject' }
                    ]
                }
            });
            
            this.peer.on('open', (id) => {
                console.log('✅ تم إنشاء الغرفة:', id);
                this.showRoomCreated(code);
            });
            
            this.peer.on('connection', (connection) => {
                console.log('🔗 لاعب انضم للغرفة');
                this.conn = connection;
                this.setupConnection();
            });
            
            this.peer.on('error', (err) => {
                console.error('❌ خطأ في PeerJS:', err);
                this.handlePeerError(err);
            });
            
            this.peer.on('disconnected', () => {
                console.warn('⚠️ انقطع الاتصال بالخادم، جاري إعادة الاتصال...');
                this.peer.reconnect();
            });
            
        } catch (error) {
            console.error('❌ فشل إنشاء الغرفة:', error);
            this.showConnectionStatus('hostStatus', 'error', '❌ فشل إنشاء الغرفة');
        }
    },
    
    // ===== عرض الغرفة المُنشأة =====
    showRoomCreated(code) {
        const roomDiv = document.getElementById('createdRoom');
        if (!roomDiv) return;
        
        const gameURL = this.generateGameURL(code);
        
        roomDiv.style.display = 'block';
        roomDiv.innerHTML = `
            <div class="room-created">
                <p style="margin-top:10px; color:#065f46; font-weight:600;">📋 كود الغرفة:</p>
                <div class="room-code" onclick="PeerGame.copyCode('${code}')">${code}</div>
                
                <div class="share-link-box">
                    <label>🔗 رابط الدعوة:</label>
                    <input type="text" id="gameURL" value="${gameURL}" readonly onclick="this.select()">
                    <div class="share-buttons">
                        <button class="share-btn copy" onclick="PeerGame.copyURL()">📋 نسخ</button>
                        <button class="share-btn whatsapp" onclick="PeerGame.shareWhatsApp()">📱 واتساب</button>
                        <button class="share-btn telegram" onclick="PeerGame.shareTelegram()">✈️ تيليجرام</button>
                    </div>
                </div>
                
                <div class="connection-status connecting" id="hostStatus">
                    ⏳ في انتظار انضمام لاعب آخر...
                </div>
            </div>
        `;
    },
    
    // ===== الانضمام لغرفة =====
    joinRoom() {
        const codeInput = document.getElementById('joinCode');
        if (!codeInput) return;
        
        const code = codeInput.value.trim().toUpperCase();
        if (code.length !== 6) {
            Utils.showToast('❌ الكود يجب أن يكون 6 أحرف', 'error');
            return;
        }
        
        this.isHost = false;
        this.mySymbol = 'O';
        this.currentCode = code;
        
        this.showConnectionStatus('joinStatus', 'connecting', '⏳ جاري الانضمام...');
        
        try {
            this.peer = new Peer({
                debug: 0,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'turn:openrelay.metered.ca:80',
                          username: 'openrelayproject',
                          credential: 'openrelayproject' }
                    ]
                }
            });
            
            this.peer.on('open', () => {
                console.log('🔗 جاري الاتصال بالغرفة:', code);
                this.conn = this.peer.connect('switgame-' + code, { 
                    reliable: true,
                    serialization: 'json'
                });
                this.setupConnection();
            });
            
            this.peer.on('error', (err) => {
                console.error('❌ خطأ:', err);
                this.handlePeerError(err);
            });
            
            this.peer.on('disconnected', () => {
                console.warn('⚠️ انقطع الاتصال، جاري إعادة الاتصال...');
                this.peer.reconnect();
            });
            
        } catch (error) {
            console.error('❌ فشل الانضمام:', error);
            this.showConnectionStatus('joinStatus', 'error', '❌ فشل الانضمام');
        }
    },
    
    // ===== إعداد الاتصال =====
    setupConnection() {
        const statusId = this.isHost ? 'hostStatus' : 'joinStatus';
        
        this.conn.on('open', () => {
            console.log('✅ تم الاتصال بنجاح!');
            this.reconnectAttempts = 0;
            this.showConnectionStatus(statusId, 'connected', '✅ تم الاتصال! جاري بدء اللعبة...');
            this.startHeartbeat();
            
            // إرسال رسالة ترحيب
            this.send({
                type: 'handshake',
                mySymbol: this.mySymbol,
                timestamp: Date.now()
            });
            
            setTimeout(() => {
                GameXO.mode = 'online';
                GameXO.showScreen();
                setTimeout(() => {
                    const p1 = document.getElementById('p1Name');
                    const p2 = document.getElementById('p2Name');
                    if (p1) p1.textContent = this.isHost ? 'أنت (❌)' : 'الخصم (❌)';
                    if (p2) p2.textContent = this.isHost ? 'الخصم (⭕)' : 'أنت (⭕)';
                }, 50);
                
                if (this.isHost) {
                    GameXO.reset();
                    this.send({ type: 'gameStart' });
                }
            }, 800);
        });
        
        this.conn.on('data', (data) => this.handleMessage(data));
        
        this.conn.on('close', () => {
            console.warn('🔌 انقطع الاتصال');
            this.stopHeartbeat();
            this.attemptReconnect();
        });
        
        this.conn.on('error', (err) => {
            console.error('❌ خطأ في الاتصال:', err);
            this.showConnectionStatus(statusId, 'error', '❌ خطأ في الاتصال');
        });
    },
    
    // ===== معالجة الرسائل =====
    handleMessage(data) {
        if (!data || !data.type) return;
        
        const now = Date.now();
        
        switch(data.type) {
            case 'handshake':
                console.log('🤝 تم استلام الترحيب من الخصم');
                break;
                
            case 'heartbeat':
                // قياس زمن الاستجابة
                this.latency = now - data.timestamp;
                this.updateConnectionQuality();
                // إرسال رد
                this.send({ 
                    type: 'heartbeat_ack', 
                    timestamp: now,
                    originalTimestamp: data.timestamp
                });
                break;
                
            case 'heartbeat_ack':
                this.latency = now - data.originalTimestamp;
                this.updateConnectionQuality();
                break;
                
            case 'move':
                GameXO.makeMove(data.index, false);
                break;
                
            case 'gameStart':
                GameXO.reset();
                break;
                
            case 'restart':
                GameXO.reset();
                break;
                
            case 'chat':
                Utils.showToast(`💬 ${data.message}`, 'info');
                break;
                
            case 'sync':
                // مزامنة حالة اللعبة
                if (data.gameState) {
                    this.gameState = data.gameState;
                    GameXO.syncState(data.gameState);
                }
                break;
        }
    },
    
    // ===== إرسال البيانات =====
    send(data) {
        if (this.conn && this.conn.open) {
            try {
                this.conn.send(data);
                return true;
            } catch (error) {
                console.error('❌ فشل الإرسال:', error);
                this.pendingMoves.push(data);
                return false;
            }
        } else {
            // حفظ في قائمة الانتظار
            this.pendingMoves.push(data);
            return false;
        }
    },
    
    // ===== إرسال حركة =====
    sendMove(index) {
        this.send({ 
            type: 'move', 
            index: index,
            timestamp: Date.now()
        });
    },
    
    // ===== نظام Heartbeat للكشف عن الانقطاع =====
    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            this.send({ 
                type: 'heartbeat', 
                timestamp: Date.now() 
            });
        }, 3000); // كل 3 ثواني
    },
    
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    },
    
    // ===== تحديث جودة الاتصال =====
    updateConnectionQuality() {
        const qualityEl = document.getElementById('connectionQuality');
        if (!qualityEl) return;
        
        let quality, color, text;
        
        if (this.latency < 50) {
            quality = 'excellent';
            color = '#10b981';
            text = `🎯 اتصال ممتاز (${this.latency}ms)`;
        } else if (this.latency < 150) {
            quality = 'good';
            color = '#3b82f6';
            text = `✅ اتصال جيد (${this.latency}ms)`;
        } else if (this.latency < 500) {
            quality = 'fair';
            color = '#f59e0b';
            text = `📶 اتصال مقبول (${this.latency}ms)`;
        } else {
            quality = 'poor';
            color = '#ef4444';
            text = `⚠️ اتصال ضعيف (${this.latency}ms)`;
        }
        
        this.connectionQuality = quality;
        qualityEl.innerHTML = `
            <div class="quality-dot" style="background:${color};"></div>
            <span>${text}</span>
        `;
    },
    
    // ===== إعادة الاتصال الذكي =====
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            Utils.showToast('❌ تعذر إعادة الاتصال', 'error');
            setTimeout(() => GameXO.exit(), 2000);
            return;
        }
        
        this.isReconnecting = true;
        this.reconnectAttempts++;
        
        const delay = this.reconnectDelay * this.reconnectAttempts;
        Utils.showToast(`🔄 محاولة إعادة الاتصال (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`, 'info');
        
        setTimeout(() => {
            if (!this.peer || this.peer.destroyed) {
                Utils.showToast('❌ فقد الاتصال نهائياً', 'error');
                return;
            }
            
            try {
                if (this.isHost) {
                    // المضيف ينتظر اتصال جديد
                    console.log('🔄 المضيف ينتظر اتصال جديد...');
                } else {
                    // اللاعب يحاول الانضمام مرة أخرى
                    this.conn = this.peer.connect('switgame-' + this.currentCode, { 
                        reliable: true,
                        serialization: 'json'
                    });
                    this.setupConnection();
                }
            } catch (error) {
                console.error('❌ فشل إعادة الاتصال:', error);
                this.attemptReconnect();
            }
        }, delay);
    },
    
    // ===== معالجة أخطاء PeerJS =====
    handlePeerError(err) {
        const statusId = this.isHost ? 'hostStatus' : 'joinStatus';
        let message = '❌ خطأ: ';
        
        switch(err.type) {
            case 'unavailable-id':
                message += 'الكود مستخدم بالفعل، جرب كود آخر';
                break;
            case 'peer-unavailable':
                message += 'الغرفة غير موجودة أو منتهية';
                break;
            case 'network':
                message += 'مشكلة في الشبكة';
                this.attemptReconnect();
                return;
            case 'server-error':
                message += 'خطأ في الخادم';
                break;
            case 'socket-error':
                message += 'خطأ في الاتصال';
                break;
            default:
                message += err.type;
        }
        
        this.showConnectionStatus(statusId, 'error', message);
    },
    
    // ===== إظهار حالة الاتصال =====
    showConnectionStatus(elementId, type, message) {
        const el = document.getElementById(elementId);
        if (!el) return;
        
        el.style.display = 'block';
        el.className = `connection-status ${type}`;
        el.textContent = message;
    },
    
    // ===== نسخ الكود =====
    async copyCode(code) {
        if (await Utils.copyToClipboard(code)) {
            Utils.showToast('📋 تم نسخ الكود!', 'success');
        }
    },
    
    // ===== نسخ الرابط =====
    async copyURL() {
        const url = document.getElementById('gameURL')?.value;
        if (url && await Utils.copyToClipboard(url)) {
            Utils.showToast('📋 تم نسخ الرابط!', 'success');
        }
    },
    
    // ===== مشاركة عبر واتساب =====
    shareWhatsApp() {
        const url = document.getElementById('gameURL')?.value;
        if (!url) return;
        const text = `🎮 تعال العب XO معي! اضغط الرابط:\n${url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    },
    
    // ===== مشاركة عبر تيليجرام =====
    shareTelegram() {
        const url = document.getElementById('gameURL')?.value;
        if (!url) return;
        const text = `🎮 تعال العب XO معي!`;
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
    },
    
    // ===== التنظيف =====
    cleanup() {
        this.stopHeartbeat();
        
        if (this.conn) {
            try { this.conn.close(); } catch(e) {}
            this.conn = null;
        }
        
        if (this.peer) {
            try { this.peer.destroy(); } catch(e) {}
            this.peer = null;
        }
        
        this.currentCode = null;
        this.reconnectAttempts = 0;
        this.pendingMoves = [];
        this.isReconnecting = false;
        
        // تنظيف الرابط
        if (window.history.replaceState) {
            const url = new URL(window.location.href);
            url.search = '';
            window.history.replaceState({}, '', url);
        }
    }
};
