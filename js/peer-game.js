// ============================================
// ===== peer-game.js - نظام الاتصال الذكي (المُصلح) =====
// ============================================

const PeerGame = {
    peer: null,
    conn: null,
    isHost: false,
    mySymbol: 'X',
    currentCode: null,
    
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 2000,
    heartbeatInterval: null,
    latency: 0,
    isConnected: false,
    
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
    
    exitLobby() {
        this.cleanup();
        const container = document.getElementById('gameContainer');
        if (container) {
            container.style.display = 'none';
            container.innerHTML = '';
        }
    },
    
    getCodeFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('join')?.toUpperCase();
    },
    
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
        this.isConnected = false;
        
        this.showConnectionStatus('hostStatus', 'connecting', '⏳ جاري إنشاء الغرفة...');
        console.log('🏠 جاري إنشاء الغرفة:', code);
        
        try {
            this.peer = new Peer('xo-game-' + code, {
                debug: 0,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'stun:stun3.l.google.com:19302' },
                        { urls: 'stun:stun4.l.google.com:19302' }
                    ]
                }
            });
            
            this.peer.on('open', (id) => {
                console.log('✅ تم إنشاء الغرفة بنجاح:', id);
                this.showRoomCreated(code);
            });
            
            this.peer.on('connection', (connection) => {
                console.log('🔗 لاعب انضم للغرفة!');
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
                
                <div class="connection-status connecting" id="hostStatus" style="display:block;">
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
        this.isConnected = false;
        
        this.showConnectionStatus('joinStatus', 'connecting', '⏳ جاري الانضمام...');
        console.log('🚪 جاري الانضمام للغرفة:', code);
        
        try {
            this.peer = new Peer({
                debug: 0,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' }
                    ]
                }
            });
            
            this.peer.on('open', () => {
                console.log('🔗 جاري الاتصال بالغرفة...');
                this.conn = this.peer.connect('xo-game-' + code, { 
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
    
    // ===== 🆕 إعداد الاتصال - مُصلّح =====
    setupConnection() {
        const statusId = this.isHost ? 'hostStatus' : 'joinStatus';
        
        this.conn.on('open', () => {
            console.log('✅ تم الاتصال بنجاح!');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            this.showConnectionStatus(statusId, 'connected', '✅ تم الاتصال! جاري بدء اللعبة...');
            Utils.showToast('✅ تم الاتصال بنجاح!', 'success');
            
            // بدء Heartbeat
            this.startHeartbeat();
            
            // إرسال رسالة ترحيب
            this.send({
                type: 'handshake',
                mySymbol: this.mySymbol,
                timestamp: Date.now()
            });
            
            // 🆕 بدء اللعبة بعد تأخير قصير
            setTimeout(() => {
                console.log('🎮 بدء اللعبة الأونلاين...');
                
                // 🆕 استدعاء الدالة الصحيحة
                GameXO.startOnlineGame(this.isHost);
                
                // المضيف يبدأ اللعبة ويرسل للخصم
                if (this.isHost) {
                    console.log('🎯 المضيف يبدأ اللعبة ويرسل gameStart');
                    GameXO.reset();
                    this.send({ type: 'gameStart' });
                } else {
                    console.log('⏳ الخصم ينتظر gameStart من المضيف');
                }
            }, 1000);
        });
        
        this.conn.on('data', (data) => {
            console.log('📨 استلام رسالة:', data);
            this.handleMessage(data);
        });
        
        this.conn.on('close', () => {
            console.warn('🔌 انقطع الاتصال');
            this.isConnected = false;
            this.stopHeartbeat();
            Utils.showToast('❌ انقطع الاتصال بالخصم', 'error');
            this.attemptReconnect();
        });
        
        this.conn.on('error', (err) => {
            console.error('❌ خطأ في الاتصال:', err);
            this.isConnected = false;
            this.showConnectionStatus(statusId, 'error', '❌ خطأ في الاتصال');
        });
    },
    
    // ===== 🆕 معالجة الرسائل - مُصلّحة =====
    handleMessage(data) {
        if (!data || !data.type) return;
        
        const now = Date.now();
        
        switch(data.type) {
            case 'handshake':
                console.log('🤝 تم استلام الترحيب من الخصم');
                break;
                
            case 'heartbeat':
                this.latency = now - data.timestamp;
                this.updateConnectionQuality();
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
                console.log('🎯 استلام حركة:', data.index);
                GameXO.makeMove(data.index);
                break;
                
            case 'gameStart':
                console.log('🎮 استلام gameStart - بدء اللعبة');
                GameXO.reset();
                break;
                
            case 'restart':
                console.log('🔄 استلام restart - إعادة اللعبة');
                GameXO.reset();
                break;
        }
    },
    
    send(data) {
        if (this.conn && this.conn.open) {
            try {
                this.conn.send(data);
                return true;
            } catch (error) {
                console.error('❌ فشل الإرسال:', error);
                return false;
            }
        }
        return false;
    },
    
    sendMove(index) {
        console.log('📤 إرسال حركة:', index);
        this.send({ 
            type: 'move', 
            index: index,
            timestamp: Date.now()
        });
    },
    
    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            this.send({ 
                type: 'heartbeat', 
                timestamp: Date.now() 
            });
        }, 3000);
    },
    
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    },
    
    updateConnectionQuality() {
        const qualityText = document.getElementById('qualityText');
        if (!qualityText) return;
        
        if (this.latency < 50) {
            qualityText.textContent = `🎯 اتصال ممتاز (${this.latency}ms)`;
        } else if (this.latency < 150) {
            qualityText.textContent = `✅ اتصال جيد (${this.latency}ms)`;
        } else if (this.latency < 500) {
            qualityText.textContent = `📶 اتصال مقبول (${this.latency}ms)`;
        } else {
            qualityText.textContent = `⚠️ اتصال ضعيف (${this.latency}ms)`;
        }
    },
    
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            Utils.showToast('❌ تعذر إعادة الاتصال', 'error');
            return;
        }
        
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;
        Utils.showToast(`🔄 محاولة إعادة الاتصال (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`, 'info');
        
        setTimeout(() => {
            if (!this.peer || this.peer.destroyed) {
                Utils.showToast('❌ فقد الاتصال نهائياً', 'error');
                return;
            }
            
            try {
                if (!this.isHost) {
                    this.conn = this.peer.connect('xo-game-' + this.currentCode, { 
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
    
    handlePeerError(err) {
        const statusId = this.isHost ? 'hostStatus' : 'joinStatus';
        let message = '❌ خطأ: ';
        
        switch(err.type) {
            case 'unavailable-id':
                message += 'الكود مستخدم بالفعل';
                break;
            case 'peer-unavailable':
                message += 'الغرفة غير موجودة';
                break;
            case 'network':
                message += 'مشكلة في الشبكة';
                this.attemptReconnect();
                return;
            default:
                message += err.type;
        }
        
        this.showConnectionStatus(statusId, 'error', message);
    },
    
    showConnectionStatus(elementId, type, message) {
        const el = document.getElementById(elementId);
        if (!el) return;
        
        el.style.display = 'block';
        el.className = `connection-status ${type}`;
        el.textContent = message;
    },
    
    async copyCode(code) {
        if (await Utils.copyToClipboard(code)) {
            Utils.showToast('📋 تم نسخ الكود!', 'success');
        }
    },
    
    async copyURL() {
        const url = document.getElementById('gameURL')?.value;
        if (url && await Utils.copyToClipboard(url)) {
            Utils.showToast('📋 تم نسخ الرابط!', 'success');
        }
    },
    
    shareWhatsApp() {
        const url = document.getElementById('gameURL')?.value;
        if (!url) return;
        const text = `🎮 تعال العب XO معي! اضغط الرابط:\n${url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    },
    
    shareTelegram() {
        const url = document.getElementById('gameURL')?.value;
        if (!url) return;
        const text = `🎮 تعال العب XO معي!`;
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
    },
    
    cleanup() {
        this.stopHeartbeat();
        this.isConnected = false;
        
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
        
        if (window.history.replaceState) {
            const url = new URL(window.location.href);
            url.search = '';
            window.history.replaceState({}, '', url);
        }
    }
};
