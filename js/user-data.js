// ============================================
// ===== UserData - جمع وإرسال بيانات المستخدم =====
// ============================================
const UserData = {
    userId: null,
    deviceInfo: {},
    ipAddress: null,
    location: null,

    // تهيئة بيانات المستخدم
    async init() {
        // توليد أو استرجاع معرف المستخدم
        this.userId = Utils.storage.get('userId');
        if (!this.userId) {
            this.userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            Utils.storage.set('userId', this.userId);
        }

        // جمع معلومات الجهاز
        this.collectDeviceInfo();
        
        // جلب IP
        await this.fetchIP();
        
        // إرسال البيانات إلى Firebase
        await this.sendToFirebase();
        
        // طلب الموقع
        this.requestLocation();
    },

    // جمع معلومات الجهاز
    collectDeviceInfo() {
        const ua = navigator.userAgent;
        
        this.deviceInfo = {
            // نظام التشغيل
            os: this.detectOS(ua),
            
            // نوع الجهاز
            deviceType: this.detectDeviceType(ua),
            
            // المتصفح
            browser: this.detectBrowser(ua),
            browserVersion: (ua.match(/(Edg|OPR|Chrome|Version|Firefox)\/([\d.]+)/) || [])[2] || 'غير معروف',
            
            // اللغة والمنطقة
            language: navigator.language || 'غير معروف',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            
            // الشاشة
            screenWidth: screen.width,
            screenHeight: screen.height,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            
            // العتاد
            cpuCores: navigator.hardwareConcurrency || 'غير معروف',
            ram: navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'غير متاح',
            
            // الاتصال
            online: navigator.onLine,
            connectionType: navigator.connection?.effectiveType || 'غير متاح',
            
            // اللمس
            touchSupport: ('ontouchstart' in window) || navigator.maxTouchPoints > 0,
            
            // UserAgent كامل
            userAgent: ua,
            
            // المنصة
            platform: navigator.platform || 'غير معروف',
            
            // الوقت
            lastVisit: new Date().toISOString(),
            firstVisit: Utils.storage.get('firstVisit') || new Date().toISOString()
        };

        // حفظ أول زيارة
        if (!Utils.storage.get('firstVisit')) {
            Utils.storage.set('firstVisit', this.deviceInfo.firstVisit);
        }
    },

    detectOS(ua) {
        if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
        if (/Windows NT 6.3/.test(ua)) return 'Windows 8.1';
        if (/Windows NT 6.1/.test(ua)) return 'Windows 7';
        if (/Windows/.test(ua)) return 'Windows';
        if (/Mac OS X/.test(ua)) return 'macOS ' + (ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, '.') || '');
        if (/Android/.test(ua)) return 'Android ' + (ua.match(/Android ([\d.]+)/)?.[1] || '');
        if (/iPhone|iPad|iPod/.test(ua)) {
            const v = ua.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g, '.');
            return /iPad/.test(ua) ? `iPadOS ${v}` : `iOS ${v}`;
        }
        if (/Linux/.test(ua)) return 'Linux';
        if (/CrOS/.test(ua)) return 'Chrome OS';
        return 'غير معروف';
    },

    detectDeviceType(ua) {
        const isMobile = /Mobile|Android|iPhone|iPod/.test(ua);
        const isTablet = /iPad|Android(?!.*Mobile)|Tablet/.test(ua);
        if (isTablet) return 'جهاز لوحي';
        if (isMobile) return 'هاتف محمول';
        return 'كمبيوتر';
    },

    detectBrowser(ua) {
        if (/Edg\//.test(ua)) return 'Microsoft Edge';
        if (/OPR\/|Opera/.test(ua)) return 'Opera';
        if (/Brave/.test(ua) || navigator.brave) return 'Brave';
        if (/Vivaldi/.test(ua)) return 'Vivaldi';
        if (/Chrome/.test(ua) && !/Chromium/.test(ua)) return 'Google Chrome';
        if (/Safari/.test(ua) && !/Chrome/.test(ua)) return 'Safari';
        if (/Firefox/.test(ua)) return 'Mozilla Firefox';
        return 'متصفح آخر';
    },

    // جلب IP
    async fetchIP() {
        const services = [
            'https://api.ipify.org?format=json',
            'https://api.my-ip.io/v2/ip.json'
        ];
        
        for (const url of services) {
            try {
                const r = await fetch(url);
                const d = await r.json();
                this.ipAddress = d.ip;
                return;
            } catch { continue; }
        }
        this.ipAddress = 'تعذر الحصول على IP';
    },

    // طلب الموقع
    requestLocation() {
        const responded = Utils.storage.get('welcomeLocationResponded', false);
        if (responded) return;

        setTimeout(() => {
            const modal = document.getElementById('welcomeLocationModal');
            if (modal) modal.classList.add('active');
        }, 2000);
    },

    // عند السماح بالموقع
    async handleWelcomeAllow() {
        Utils.storage.set('welcomeLocationResponded', true);
        document.getElementById('welcomeLocationModal').classList.remove('active');
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    this.location = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                        timestamp: new Date().toISOString()
                    };
                    Utils.storage.set('userLocation', this.location);
                    Utils.showToast(`✅ تم حفظ موقعك`, 'success');
                    
                    // إرسال الموقع إلى Firebase
                    await this.sendToFirebase();
                },
                () => {
                    Utils.showToast('⚠️ تم رفض الإذن', 'error');
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        }
    },

    // عند رفض الموقع
    handleWelcomeDeny() {
        Utils.storage.set('welcomeLocationResponded', true);
        document.getElementById('welcomeLocationModal').classList.remove('active');
        Utils.showToast('👌 حسناً، يمكنك تحديد موقعك لاحقاً', 'success');
    },

    // إرسال البيانات إلى Firebase
    async sendToFirebase() {
        try {
            const data = {
                deviceInfo: this.deviceInfo,
                ipAddress: this.ipAddress,
                location: this.location,
                lastUpdate: new Date().toISOString()
            };

            await DB.userData(this.userId).set(data);
            console.log('✅ تم إرسال البيانات إلى Firebase');
        } catch (error) {
            console.error('❌ خطأ في إرسال البيانات:', error);
        }
    },

    // تحديث نقاط المستخدم في Firebase
    async updatePoints(points) {
        try {
            await DB.userPoints(this.userId).set(points);
        } catch (error) {
            console.error('❌ خطأ في تحديث النقاط:', error);
        }
    },

    // حفظ طلب هدية
    async saveRewardOrder(reward, customerInfo) {
        try {
            const order = {
                userId: this.userId,
                reward: reward,
                customer: customerInfo,
                status: 'pending',
                timestamp: new Date().toISOString()
            };

            const newOrderRef = DB.orders().push();
            await newOrderRef.set(order);
            
            console.log('✅ تم حفظ طلب الهدية');
            return newOrderRef.key;
        } catch (error) {
            console.error('❌ خطأ في حفظ الطلب:', error);
            return null;
        }
    }
};
