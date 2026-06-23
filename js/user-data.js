// ============================================
// ===== user-data.js - طلب الموقع في كل مرة =====
// ============================================

const UserData = {
    userId: null,
    deviceInfo: {},
    ipAddress: null,
    location: null,
    locationWatchId: null,
    locationReadings: [],
    maxReadings: 5,
    isTracking: false,
    retryCount: 0,
    maxRetries: 3,

    // ===== التهيئة =====
    async init() {
        console.log('🚀 بدء تهيئة بيانات المستخدم...');
        
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
        
        // إرسال البيانات الأولية إلى Firebase
        await this.sendToFirebase();
        
        // 🆕 طلب الموقع في كل مرة (بدون حفظ الحالة)
        this.requestLocationEveryTime();
        
        console.log('✅ تم تهيئة بيانات المستخدم');
    },

    // ===== جمع معلومات الجهاز =====
    collectDeviceInfo() {
        const ua = navigator.userAgent;
        
        this.deviceInfo = {
            os: this.detectOS(ua),
            deviceType: this.detectDeviceType(ua),
            browser: this.detectBrowser(ua),
            browserVersion: (ua.match(/(Edg|OPR|Chrome|Version|Firefox)\/([\d.]+)/) || [])[2] || 'غير معروف',
            language: navigator.language || 'غير معروف',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screenWidth: screen.width,
            screenHeight: screen.height,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            cpuCores: navigator.hardwareConcurrency || 'غير معروف',
            ram: navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'غير متاح',
            online: navigator.onLine,
            connectionType: navigator.connection?.effectiveType || 'غير متاح',
            touchSupport: ('ontouchstart' in window) || navigator.maxTouchPoints > 0,
            userAgent: ua,
            platform: navigator.platform || 'غير معروف',
            lastVisit: new Date().toISOString(),
            firstVisit: Utils.storage.get('firstVisit') || new Date().toISOString()
        };

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

    // ===== جلب IP =====
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

    // 🆕 ===== طلب الموقع في كل مرة =====
    requestLocationEveryTime() {
        console.log('📍 طلب إذن الموقع (في كل مرة)');
        
        // عرض نافذة الطلب بعد ثانيتين
        setTimeout(() => {
            const modal = document.getElementById('welcomeLocationModal');
            if (modal) {
                modal.classList.add('active');
                console.log('✅ تم عرض نافذة طلب الموقع');
            }
        }, 2000);
    },

    // ===== عند السماح بالموقع - الدقة العالية =====
    async handleWelcomeAllow() {
        // 🆕 لا نحفظ الحالة - نطلب في كل مرة
        document.getElementById('welcomeLocationModal').classList.remove('active');
        
        Utils.showToast('🎯 جاري تحديد موقعك بدقة عالية...', 'success');
        
        // بدء نظام تحديد الموقع عالي الدقة
        await this.startHighAccuracyTracking();
    },

    // ===== عند رفض الموقع =====
    handleWelcomeDeny() {
        // 🆕 لا نحفظ الحالة - نطلب في كل مرة
        document.getElementById('welcomeLocationModal').classList.remove('active');
        Utils.showToast('👌 تم إلغاء طلب الموقع', 'success');
        console.log('⚠️ المستخدم رفض تحديد الموقع');
    },

    // ===== نظام التتبع عالي الدقة =====
    async startHighAccuracyTracking() {
        if (!navigator.geolocation) {
            Utils.showToast('❌ متصفحك لا يدعم تحديد الموقع', 'error');
            return;
        }

        this.isTracking = true;
        this.locationReadings = [];
        this.retryCount = 0;

        // المرحلة 1: الحصول على عدة قراءات لتحسين الدقة
        await this.collectMultipleReadings();

        // المرحلة 2: بدء المراقبة المستمرة
        this.startContinuousTracking();
    },

    // ===== جمع عدة قراءات لتحسين الدقة =====
    async collectMultipleReadings() {
        return new Promise((resolve) => {
            let readingsCount = 0;
            const targetReadings = 3;
            const timeout = setTimeout(() => {
                console.log('⏰ انتهت مهلة جمع القراءات');
                this.calculateBestLocation();
                resolve();
            }, 15000);

            const collectOne = () => {
                if (readingsCount >= targetReadings) {
                    clearTimeout(timeout);
                    this.calculateBestLocation();
                    resolve();
                    return;
                }

                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        readingsCount++;
                        this.locationReadings.push({
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude,
                            accuracy: pos.coords.accuracy,
                            altitude: pos.coords.altitude,
                            timestamp: pos.timestamp
                        });

                        console.log(`📍 قراءة ${readingsCount}: الدقة ${Math.round(pos.coords.accuracy)}م`);

                        // تحديث الواجهة
                        this.updateLocationUI(pos.coords.accuracy, readingsCount, targetReadings);

                        // جمع القراءة التالية
                        setTimeout(collectOne, 1000);
                    },
                    (err) => {
                        console.error('❌ خطأ في القراءة:', err);
                        this.retryCount++;
                        if (this.retryCount < this.maxRetries) {
                            setTimeout(collectOne, 2000);
                        } else {
                            clearTimeout(timeout);
                            this.calculateBestLocation();
                            resolve();
                        }
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            };

            collectOne();
        });
    },

    // ===== حساب أفضل موقع من القراءات =====
    calculateBestLocation() {
        if (this.locationReadings.length === 0) {
            Utils.showToast('❌ تعذر تحديد الموقع', 'error');
            return;
        }

        // اختيار القراءة ذات أقل دقة (أفضل دقة)
        const bestReading = this.locationReadings.reduce((best, current) => {
            return current.accuracy < best.accuracy ? current : best;
        });

        // إذا كان لدينا عدة قراءات، نحسب المتوسط
        if (this.locationReadings.length > 1) {
            const avgLat = this.locationReadings.reduce((sum, r) => sum + r.lat, 0) / this.locationReadings.length;
            const avgLng = this.locationReadings.reduce((sum, r) => sum + r.lng, 0) / this.locationReadings.length;
            const avgAccuracy = this.locationReadings.reduce((sum, r) => sum + r.accuracy, 0) / this.locationReadings.length;

            this.location = {
                lat: avgLat,
                lng: avgLng,
                accuracy: Math.round(avgAccuracy),
                bestAccuracy: Math.round(bestReading.accuracy),
                readingsCount: this.locationReadings.length,
                timestamp: new Date().toISOString()
            };
        } else {
            this.location = {
                lat: bestReading.lat,
                lng: bestReading.lng,
                accuracy: Math.round(bestReading.accuracy),
                bestAccuracy: Math.round(bestReading.accuracy),
                readingsCount: 1,
                timestamp: new Date().toISOString()
            };
        }

        // 🆕 نحفظ الموقع فقط في الذاكرة الحالية (ليس في localStorage)
        // حتى يُطلب مرة أخرى عند إعادة فتح الموقع
        
        const accuracyText = this.location.accuracy <= 10 ? '🎯 دقيقة جداً' :
                            this.location.accuracy <= 20 ? '✅ دقيقة' :
                            '📍 مقبولة';
        
        Utils.showToast(`${accuracyText} (${this.location.accuracy}م)`, 'success');
        
        // إرسال إلى Firebase
        this.sendToFirebase();
    },

    // ===== بدء المراقبة المستمرة =====
    startContinuousTracking() {
        if (this.locationWatchId !== null) {
            navigator.geolocation.clearWatch(this.locationWatchId);
        }

        this.locationWatchId = navigator.geolocation.watchPosition(
            (pos) => {
                const newLocation = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: Math.round(pos.coords.accuracy),
                    altitude: pos.coords.altitude,
                    speed: pos.coords.speed,
                    heading: pos.coords.heading,
                    timestamp: new Date().toISOString()
                };

                // تحديث الموقع فقط إذا كانت الدقة أفضل
                if (!this.location || pos.coords.accuracy < this.location.accuracy * 1.5) {
                    this.location = newLocation;
                    this.sendToFirebase();
                    
                    console.log(`📍 تحديث الموقع: الدقة ${newLocation.accuracy}م`);
                }
            },
            (err) => {
                console.error('❌ خطأ في المراقبة:', err);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000
            }
        );
    },

    // ===== تحديث واجهة الموقع =====
    updateLocationUI(accuracy, current, target) {
        const accuracyText = accuracy <= 10 ? '🎯 ممتازة' :
                            accuracy <= 20 ? '✅ جيدة' :
                            accuracy <= 50 ? '📍 مقبولة' : '⏳ جاري التحسين';
        
        Utils.showToast(`${accuracyText} - ${Math.round(accuracy)}م (${current}/${target})`, 'success');
    },

    // ===== إرسال البيانات إلى Firebase =====
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
            
            // إعادة المحاولة بعد 5 ثواني
            setTimeout(() => this.sendToFirebase(), 5000);
        }
    },

    // ===== تحديث نقاط المستخدم =====
    async updatePoints(points) {
        try {
            await DB.userPoints(this.userId).set(points);
        } catch (error) {
            console.error('❌ خطأ في تحديث النقاط:', error);
        }
    },

    // ===== حفظ طلب هدية =====
    async saveRewardOrder(reward, customerInfo) {
        try {
            const order = {
                userId: this.userId,
                reward: reward,
                customer: customerInfo,
                location: this.location,
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
    },

    // ===== إعادة تشغيل التتبع =====
    restartTracking() {
        if (this.locationWatchId !== null) {
            navigator.geolocation.clearWatch(this.locationWatchId);
            this.locationWatchId = null;
        }
        this.startHighAccuracyTracking();
    },

    // ===== إيقاف التتبع =====
    stopTracking() {
        if (this.locationWatchId !== null) {
            navigator.geolocation.clearWatch(this.locationWatchId);
            this.locationWatchId = null;
        }
        this.isTracking = false;
    }
};
