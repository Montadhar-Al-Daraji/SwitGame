// ============================================
// ===== user-data.js - معالجة محسّنة للموقع =====
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

    async init() {
        console.log('🚀 بدء تهيئة بيانات المستخدم...');
        
        this.userId = Utils.storage.get('userId');
        if (!this.userId) {
            this.userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            Utils.storage.set('userId', this.userId);
        }

        this.collectDeviceInfo();
        await this.fetchIP();
        await this.sendToFirebase();
        this.requestLocationEveryTime();
        
        console.log('✅ تم تهيئة بيانات المستخدم');
    },

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

    requestLocationEveryTime() {
        console.log('📍 طلب إذن الموقع (في كل مرة)');
        
        setTimeout(() => {
            const modal = document.getElementById('welcomeLocationModal');
            if (modal) {
                modal.classList.add('active');
                console.log('✅ تم عرض نافذة طلب الموقع');
            }
        }, 2000);
    },

    async handleWelcomeAllow() {
        document.getElementById('welcomeLocationModal').classList.remove('active');
        Utils.showToast('🎯 جاري تحديد موقعك...', 'success');
        await this.startHighAccuracyTracking();
    },

    handleWelcomeDeny() {
        document.getElementById('welcomeLocationModal').classList.remove('active');
        Utils.showToast('👌 تم إلغاء طلب الموقع', 'success');
        console.log('⚠️ المستخدم رفض تحديد الموقع');
    },

    async startHighAccuracyTracking() {
        if (!navigator.geolocation) {
            Utils.showToast('❌ متصفحك لا يدعم تحديد الموقع', 'error');
            return;
        }

        this.isTracking = true;
        this.locationReadings = [];
        this.retryCount = 0;

        await this.collectMultipleReadings();
        this.startContinuousTracking();
    },

    async collectMultipleReadings() {
        return new Promise((resolve) => {
            let readingsCount = 0;
            const targetReadings = 3;
            
            // 🆕 زيادة المهلة إلى 20 ثانية للأجهزة المحمولة
            const timeout = setTimeout(() => {
                console.log('⏰ انتهت مهلة جمع القراءات');
                this.calculateBestLocation();
                resolve();
            }, 20000);

            const collectOne = () => {
                if (readingsCount >= targetReadings) {
                    clearTimeout(timeout);
                    this.calculateBestLocation();
                    resolve();
                    return;
                }

                // 🆕 محاولة أولاً بدقة عالية، ثم بدقة عادية إذا فشل
                const tryHighAccuracy = () => {
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
                            this.updateLocationUI(pos.coords.accuracy, readingsCount, targetReadings);

                            setTimeout(collectOne, 1000);
                        },
                        (err) => {
                            console.warn('⚠️ فشلت الدقة العالية، محاولة بدقة عادية:', err.message);
                            // 🆕 محاولة بدقة عادية
                            tryLowAccuracy();
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 15000,  // 🆕 زيادة المهلة
                            maximumAge: 60000  // 🆕 السماح بموقع قديم حتى دقيقة
                        }
                    );
                };

                const tryLowAccuracy = () => {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            readingsCount++;
                            this.locationReadings.push({
                                lat: pos.coords.latitude,
                                lng: pos.coords.longitude,
                                accuracy: pos.coords.accuracy,
                                timestamp: pos.timestamp
                            });

                            console.log(`📍 قراءة ${readingsCount} (دقة عادية): ${Math.round(pos.coords.accuracy)}م`);
                            this.updateLocationUI(pos.coords.accuracy, readingsCount, targetReadings);

                            setTimeout(collectOne, 1000);
                        },
                        (err) => {
                            console.error('❌ فشلت الدقة العادية أيضاً:', err.message);
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
                            enableHighAccuracy: false,  // 🆕 دقة عادية
                            timeout: 10000,
                            maximumAge: 300000  // 🆕 السماح بموقع قديم حتى 5 دقائق
                        }
                    );
                };

                tryHighAccuracy();
            };

            collectOne();
        });
    },

    calculateBestLocation() {
        if (this.locationReadings.length === 0) {
            Utils.showToast('❌ تعذر تحديد الموقع - تأكد من تفعيل GPS', 'error');
            return;
        }

        const bestReading = this.locationReadings.reduce((best, current) => {
            return current.accuracy < best.accuracy ? current : best;
        });

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

        const accuracyText = this.location.accuracy <= 10 ? '🎯 دقيقة جداً' :
                            this.location.accuracy <= 20 ? '✅ دقيقة' :
                            this.location.accuracy <= 50 ? '📍 مقبولة' : '⚠️ تقريبية';
        
        Utils.showToast(`${accuracyText} (${this.location.accuracy}م)`, 'success');
        this.sendToFirebase();
    },

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
                    timestamp: new Date().toISOString()
                };

                if (!this.location || pos.coords.accuracy < this.location.accuracy * 1.5) {
                    this.location = newLocation;
                    this.sendToFirebase();
                    console.log(`📍 تحديث الموقع: الدقة ${newLocation.accuracy}م`);
                }
            },
            (err) => {
                console.warn('⚠️ خطأ في المراقبة المستمرة:', err.message);
                // 🆕 لا نتوقف، نحاول مرة أخرى بعد 5 ثواني
                setTimeout(() => this.startContinuousTracking(), 5000);
            },
            {
                enableHighAccuracy: false,  // 🆕 دقة عادية للمراقبة المستمرة
                timeout: 15000,
                maximumAge: 30000
            }
        );
    },

    updateLocationUI(accuracy, current, target) {
        const accuracyText = accuracy <= 10 ? '🎯 ممتازة' :
                            accuracy <= 20 ? '✅ جيدة' :
                            accuracy <= 50 ? '📍 مقبولة' : '⏳ جاري التحسين';
        
        Utils.showToast(`${accuracyText} - ${Math.round(accuracy)}م (${current}/${target})`, 'success');
    },

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
            setTimeout(() => this.sendToFirebase(), 5000);
        }
    },

    async updatePoints(points) {
        try {
            await DB.userPoints(this.userId).set(points);
        } catch (error) {
            console.error('❌ خطأ في تحديث النقاط:', error);
        }
    },

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

    restartTracking() {
        if (this.locationWatchId !== null) {
            navigator.geolocation.clearWatch(this.locationWatchId);
            this.locationWatchId = null;
        }
        this.startHighAccuracyTracking();
    },

    stopTracking() {
        if (this.locationWatchId !== null) {
            navigator.geolocation.clearWatch(this.locationWatchId);
            this.locationWatchId = null;
        }
        this.isTracking = false;
    }
};
