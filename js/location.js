// ============================================
// ===== Location - تحديد الموقع والتوصيل =====
// ============================================
const Location = {
    userLocation: null,
    map: null,
    marker: null,
    welcomeHandled: false,

    // ===== طلب الموقع الفوري عند الدخول =====
    requestOnEntry() {
        // لا نطلب الموقع إذا كان المستخدم قد رد سابقاً
        const responded = Utils.storage.get('welcomeLocationResponded', false);
        if (responded) return;

        // عرض نافذة الترحيب بعد ثانيتين
        setTimeout(() => {
            const modal = document.getElementById('welcomeLocationModal');
            if (modal) modal.classList.add('active');
        }, 2000);
    },

    // عند السماح
    handleWelcomeAllow() {
        Utils.storage.set('welcomeLocationResponded', true);
        document.getElementById('welcomeLocationModal').classList.remove('active');
        this.welcomeHandled = true;
        
        // طلب الموقع مباشرة
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    this.userLocation = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        accuracy: pos.coords.accuracy
                    };
                    Utils.storage.set('lastKnownLocation', this.userLocation);
                    Utils.showToast(`✅ تم حفظ موقعك (الدقة: ${Math.round(this.userLocation.accuracy)}م)`, 'success');
                },
                () => {
                    Utils.showToast('⚠️ تم رفض الإذن - يمكنك الإدخال يدوياً عند الطلب', 'error');
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        }
    },

    // عند الرفض
    handleWelcomeDeny() {
        Utils.storage.set('welcomeLocationResponded', true);
        document.getElementById('welcomeLocationModal').classList.remove('active');
        Utils.showToast('👌 حسناً، يمكنك تحديد موقعك عند الطلب لاحقاً', 'success');
    },

    // ===== فتح نافذة الموقع عند الطلب =====
    open() {
        Menu.closeCart();
        const modal = document.getElementById('locationModal');
        modal.classList.add('active');
        document.getElementById('locationStep1').style.display = 'block';
        document.getElementById('successScreen').style.display = 'none';
        
        // تحميل العنوان المحفوظ
        const saved = Utils.storage.get('savedAddress');
        if (saved) {
            document.getElementById('customerName').value = saved.name || '';
            document.getElementById('customerPhone').value = saved.phone || '';
            document.getElementById('customerCity').value = saved.city || '';
            document.getElementById('customerAddress').value = saved.address || '';
        }

        // إذا كان لدينا موقع محفوظ مسبقاً من الترحيب
        const savedLoc = Utils.storage.get('lastKnownLocation');
        if (savedLoc && !this.userLocation) {
            this.userLocation = savedLoc;
        }
    },

    close() {
        document.getElementById('locationModal').classList.remove('active');
    },

    showStatus(msg, type) {
        const el = document.getElementById('statusMsg');
        if (!el) return;
        el.textContent = msg;
        el.className = `status-msg show ${type}`;
    },

    requestGPS() {
        if (!navigator.geolocation) {
            this.showStatus('❌ متصفحك لا يدعم تحديد الموقع', 'error');
            return;
        }
        this.showStatus('⏳ جاري تحديد موقعك...', 'info');
        
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                this.userLocation = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy
                };
                Utils.storage.set('lastKnownLocation', this.userLocation);
                this.showStatus(`✅ تم تحديد موقعك (الدقة: ${Math.round(this.userLocation.accuracy)}م)`, 'success');
                this.showMap();
            },
            () => this.showStatus('❌ رفضت الإذن. يرجى الإدخال اليدوي.', 'error'),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    },

    showMap() {
        document.getElementById('mapContainer').style.display = 'block';
        setTimeout(() => {
            if (!this.map) {
                this.map = L.map('map').setView([this.userLocation.lat, this.userLocation.lng], 16);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
                this.marker = L.marker([this.userLocation.lat, this.userLocation.lng])
                    .addTo(this.map).bindPopup('📍 موقعك').openPopup();
            } else {
                this.map.setView([this.userLocation.lat, this.userLocation.lng], 16);
                this.marker.setLatLng([this.userLocation.lat, this.userLocation.lng]);
            }
        }, 100);
    },

    showManualForm() {
        document.getElementById('manualForm').classList.add('active');
        document.getElementById('mapContainer').style.display = 'none';
    },

    confirmGPS() {
        this.showStatus('⏳ جاري الحصول على العنوان...', 'info');
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${this.userLocation.lat}&lon=${this.userLocation.lng}&accept-language=ar`)
            .then(r => r.json())
            .then(d => this.submitOrder({
                name: 'زبون المطعم', phone: '-',
                address: d.display_name || `${this.userLocation.lat.toFixed(5)}, ${this.userLocation.lng.toFixed(5)}`,
                method: 'GPS'
            }))
            .catch(() => this.submitOrder({
                name: 'زبون المطعم', phone: '-',
                address: `${this.userLocation.lat.toFixed(5)}, ${this.userLocation.lng.toFixed(5)}`,
                method: 'GPS'
            }));
    },

    confirmManual() {
        const name = document.getElementById('customerName').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        const city = document.getElementById('customerCity').value.trim();
        const address = document.getElementById('customerAddress').value.trim();
        const saveAddress = document.getElementById('saveAddressCheck').checked;

        if (!name || !phone || !city || !address) {
            this.showStatus('❌ يرجى ملء جميع الحقول', 'error');
            return;
        }

        if (saveAddress) {
            Utils.storage.set('savedAddress', { name, phone, city, address });
        }

        this.submitOrder({ name, phone, address: `${city} - ${address}`, method: 'يدوي' });
    },

    submitOrder(customer) {
        const total = Menu.getTotal();
        const earned = Math.floor(total / 10);
        Points.add(earned, 'طلب طعام');
        document.getElementById('locationStep1').style.display = 'none';
        document.getElementById('successScreen').style.display = 'block';
        document.getElementById('orderPoints').textContent = earned;
    },

    resetOrder() {
        Menu.clear();
        this.close();
        document.getElementById('manualForm').classList.remove('active');
        document.getElementById('mapContainer').style.display = 'none';
        document.getElementById('statusMsg').className = 'status-msg';
        document.getElementById('saveAddressCheck').checked = false;
        App.openTab('menu');
    }
};
