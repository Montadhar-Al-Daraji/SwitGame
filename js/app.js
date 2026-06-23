// ============================================
// ===== app.js - التطبيق الرئيسي =====
// ============================================

const App = {
    init() {
        console.log('🚀 جاري تشغيل منصة عالم الألعاب...');
        
        try {
            Points.init();
            console.log('✅ تم تهيئة نظام النقاط');
        } catch (e) {
            console.error('❌ خطأ في Points:', e);
        }
        
        try {
            UserData.init();
            console.log('✅ تم تهيئة بيانات المستخدم');
        } catch (e) {
            console.error('❌ خطأ في UserData:', e);
        }
        
        this.updateHomeStats();
        this.startLocationMonitoring();
        
        console.log('✅ التطبيق جاهز!');
    },

    openTab(name) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        const tab = document.querySelector(`[data-tab="${name}"]`);
        const content = document.getElementById(`tab-${name}`);
        
        if (tab) tab.classList.add('active');
        if (content) content.classList.add('active');
        
        if (name === 'points') Points.renderRewards();
        if (name === 'home') this.updateHomeStats();
        if (name === 'location') this.updateLocationTab();
        if (name === 'games') {
            const container = document.getElementById('gameContainer');
            if (container) container.style.display = 'none';
        }
    },

    updateHomeStats() {
        const gamesPlayed = Utils.storage.get('gamesPlayed', 0);
        const rewardsEarned = Utils.storage.get('rewardsEarned', 0);
        
        const gamesEl = document.getElementById('gamesPlayed');
        const pointsEl = document.getElementById('totalPointsHome');
        const rewardsEl = document.getElementById('rewardsEarned');
        
        if (gamesEl) gamesEl.textContent = gamesPlayed;
        if (pointsEl) pointsEl.textContent = Points.userPoints || 0;
        if (rewardsEl) rewardsEl.textContent = rewardsEarned;
    },

    startLocationMonitoring() {
        setInterval(() => {
            this.updateLocationBadge();
        }, 3000);
    },

    updateLocationBadge() {
        const badge = document.getElementById('locationAccuracyBadge');
        if (!UserData.location) {
            if (badge) {
                badge.textContent = '-';
                badge.style.background = '#6b7280';
            }
            return;
        }
        
        const accuracy = UserData.location.accuracy;
        if (badge) {
            badge.textContent = `${accuracy}م`;
            
            if (accuracy <= 10) badge.style.background = '#10b981';
            else if (accuracy <= 20) badge.style.background = '#3b82f6';
            else if (accuracy <= 50) badge.style.background = '#f59e0b';
            else badge.style.background = '#ef4444';
        }
    },

    updateLocationTab() {
        const statusIcon = document.getElementById('locationStatusIcon');
        const statusTitle = document.getElementById('locationStatusTitle');
        const statusDesc = document.getElementById('locationStatusDesc');
        const accuracyValue = document.getElementById('accuracyValue');
        const accuracyFill = document.getElementById('accuracyFill');
        const accuracyHint = document.getElementById('accuracyHint');
        const locationDetails = document.getElementById('locationDetails');
        
        if (!UserData.location) {
            if (statusIcon) statusIcon.textContent = '⏳';
            if (statusTitle) statusTitle.textContent = 'جاري تحديد الموقع...';
            if (statusDesc) statusDesc.textContent = 'يرجى الانتظار';
            return;
        }
        
        const loc = UserData.location;
        const accuracy = loc.accuracy;
        
        if (statusIcon) {
            statusIcon.textContent = accuracy <= 10 ? '🎯' : 
                                     accuracy <= 20 ? '✅' : 
                                     accuracy <= 50 ? '📍' : '⚠️';
        }
        
        if (statusTitle) {
            statusTitle.textContent = accuracy <= 10 ? 'موقع دقيق جداً!' :
                                      accuracy <= 20 ? 'موقعك محدد بدقة' :
                                      accuracy <= 50 ? 'موقعك محدد' : 'موقع تقريبي';
        }
        
        if (statusDesc) statusDesc.textContent = `الدقة: ${accuracy} متر`;
        if (accuracyValue) accuracyValue.textContent = `${accuracy} متر`;
        
        if (accuracyFill) {
            const percentage = Math.max(5, Math.min(100, 100 - (accuracy / 2)));
            accuracyFill.style.width = percentage + '%';
        }
        
        if (accuracyHint) {
            accuracyHint.textContent = accuracy <= 10 ? '🎯 ممتاز - مثل GPS احترافي' :
                                       accuracy <= 20 ? '✅ جيد جداً - مناسب للتوصيل' :
                                       accuracy <= 50 ? '📍 مقبول - جاري التحسين' :
                                       '⚠️ ضعيف - حاول الخروج إلى مكان مفتوح';
        }
        
        if (locationDetails) {
            locationDetails.style.display = 'block';
            document.getElementById('latValue').textContent = loc.lat.toFixed(6);
            document.getElementById('lngValue').textContent = loc.lng.toFixed(6);
            document.getElementById('readingsCount').textContent = loc.readingsCount || 1;
            document.getElementById('lastUpdate').textContent = 
                new Date(loc.timestamp).toLocaleTimeString('ar');
        }
    }
};

// ===== دالة عرض الموقع على الخريطة =====
function showLocationOnMap() {
    const mapDiv = document.getElementById('locationMap');
    if (!mapDiv) return;
    
    mapDiv.style.display = 'block';
    
    if (!UserData.location) {
        Utils.showToast('⚠️ الموقع غير محدد بعد', 'warning');
        return;
    }
    
    const loc = UserData.location;
    
    if (!window.userMap) {
        window.userMap = L.map('locationMap').setView([loc.lat, loc.lng], 17);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(window.userMap);
        
        window.userMarker = L.marker([loc.lat, loc.lng]).addTo(window.userMap)
            .bindPopup(`📍 موقعك الحالي<br>الدقة: ${loc.accuracy}م`)
            .openPopup();
        
        window.accuracyCircle = L.circle([loc.lat, loc.lng], {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
            radius: loc.accuracy
        }).addTo(window.userMap);
    } else {
        window.userMap.setView([loc.lat, loc.lng], 17);
        window.userMarker.setLatLng([loc.lat, loc.lng]);
        window.accuracyCircle.setLatLng([loc.lat, loc.lng]);
        window.accuracyCircle.setRadius(loc.accuracy);
    }
    
    setTimeout(() => window.userMap.invalidateSize(), 100);
}

// تحديث الخريطة كل 3 ثواني
setInterval(() => {
    if (window.userMap && UserData.location) {
        const loc = UserData.location;
        window.userMarker.setLatLng([loc.lat, loc.lng]);
        window.accuracyCircle.setLatLng([loc.lat, loc.lng]);
        window.accuracyCircle.setRadius(loc.accuracy);
    }
}, 3000);

// ===== بدء التشغيل =====
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
