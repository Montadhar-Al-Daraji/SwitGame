// ============================================
// ===== DeviceInfo - معلومات الجهاز =====
// ============================================
const DeviceInfo = {
    async fetchIP() {
        const el = document.getElementById('ipAddress');
        if (!el) return;
        const services = [
            'https://api.ipify.org?format=json',
            'https://api.my-ip.io/v2/ip.json'
        ];
        for (const url of services) {
            try {
                const r = await fetch(url);
                const d = await r.json();
                el.textContent = d.ip;
                return;
            } catch { continue; }
        }
        el.textContent = 'تعذر الحصول على IP';
    },

    getInfo() {
        const ua = navigator.userAgent;
        const info = {};

        if (/Windows NT 10/.test(ua)) info.os = 'Windows 10/11';
        else if (/Windows NT 6.3/.test(ua)) info.os = 'Windows 8.1';
        else if (/Windows NT 6.1/.test(ua)) info.os = 'Windows 7';
        else if (/Windows/.test(ua)) info.os = 'Windows';
        else if (/Mac OS X/.test(ua)) info.os = 'macOS ' + (ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, '.') || '');
        else if (/Android/.test(ua)) info.os = 'Android ' + (ua.match(/Android ([\d.]+)/)?.[1] || '');
        else if (/iPhone|iPad|iPod/.test(ua)) {
            const v = ua.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g, '.');
            info.os = /iPad/.test(ua) ? `iPadOS ${v}` : `iOS ${v}`;
        }
        else if (/Linux/.test(ua)) info.os = 'Linux';
        else if (/CrOS/.test(ua)) info.os = 'Chrome OS';
        else info.os = 'غير معروف';

        const isMobile = /Mobile|Android|iPhone|iPod/.test(ua);
        const isTablet = /iPad|Android(?!.*Mobile)|Tablet/.test(ua);
        info.deviceType = isTablet ? '📱 جهاز لوحي' : (isMobile ? '📱 هاتف محمول' : '💻 كمبيوتر');

        if (/Edg\//.test(ua)) info.browser = 'Microsoft Edge';
        else if (/OPR\/|Opera/.test(ua)) info.browser = 'Opera';
        else if (/Brave/.test(ua) || navigator.brave) info.browser = 'Brave';
        else if (/Vivaldi/.test(ua)) info.browser = 'Vivaldi';
        else if (/Chrome/.test(ua) && !/Chromium/.test(ua)) info.browser = 'Google Chrome';
        else if (/Safari/.test(ua) && !/Chrome/.test(ua)) info.browser = 'Safari';
        else if (/Firefox/.test(ua)) info.browser = 'Mozilla Firefox';
        else info.browser = 'متصفح آخر';

        info.browserVersion = (ua.match(/(Edg|OPR|Chrome|Version|Firefox)\/([\d.]+)/) || [])[2] || 'غير معروف';
        info.language = navigator.language || 'غير معروف';
        info.platform = navigator.platform || 'غير معروف';
        info.screenSize = `${screen.width} × ${screen.height}`;
        info.windowSize = `${window.innerWidth} × ${window.innerHeight}`;
        info.cores = navigator.hardwareConcurrency || 'غير معروف';
        info.ram = navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'غير متاح';
        info.online = navigator.onLine ? '✅ متصل' : '❌ غير متصل';
        info.connectionType = navigator.connection?.effectiveType || 'غير متاح';
        info.touchSupport = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 ? '✅ مدعوم' : '❌ غير مدعوم';
        info.cookies = navigator.cookieEnabled ? '✅ مفعّلة' : '❌ معطّلة';
        info.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return info;
    },

    display() {
        const info = this.getInfo();
        const grid = document.getElementById('infoGrid');
        if (!grid) return;
        const items = [
            { emoji: '💻', label: 'نوع الجهاز', value: info.deviceType },
            { emoji: '⚙️', label: 'نظام التشغيل', value: info.os },
            { emoji: '🌐', label: 'المتصفح', value: info.browser },
            { emoji: '🔢', label: 'إصدار المتصفح', value: info.browserVersion },
            { emoji: '🗣️', label: 'اللغة', value: info.language },
            { emoji: '🖥️', label: 'المنصة', value: info.platform },
            { emoji: '📐', label: 'دقة الشاشة', value: info.screenSize },
            { emoji: '🪟', label: 'حجم النافذة', value: info.windowSize },
            { emoji: '🧠', label: 'أنوية المعالج', value: info.cores },
            { emoji: '💾', label: 'الذاكرة (RAM)', value: info.ram },
            { emoji: '📡', label: 'حالة الاتصال', value: info.online },
            { emoji: '📶', label: 'نوع الاتصال', value: info.connectionType },
            { emoji: '👆', label: 'دعم اللمس', value: info.touchSupport },
            { emoji: '🍪', label: 'الكوكيز', value: info.cookies },
            { emoji: '🕐', label: 'المنطقة الزمنية', value: info.timezone }
        ];
        grid.innerHTML = items.map(i => `
            <div class="info-item">
                <div class="emoji">${i.emoji}</div>
                <div class="details">
                    <div class="info-label">${i.label}</div>
                    <div class="info-value">${i.value}</div>
                </div>
            </div>
        `).join('');
    },

    async copyIP() {
        const ip = document.getElementById('ipAddress')?.textContent;
        if (!ip || ip.includes('جاري') || ip.includes('تعذر')) {
            Utils.showToast('⚠️ لا يوجد IP للنسخ', 'error');
            return;
        }
        if (await Utils.copyToClipboard(ip)) {
            Utils.showToast('✅ تم نسخ IP بنجاح!', 'success');
        } else {
            Utils.showToast('❌ فشل النسخ', 'error');
        }
    },

    refresh() {
        this.fetchIP();
        this.display();
        Utils.showToast('🔄 تم التحديث', 'success');
    },

    checkDailyBonus() {
        const lastVisit = Utils.storage.get('deviceInfoLastBonus', null);
        const today = new Date().toDateString();
        if (lastVisit !== today) {
            Utils.storage.set('deviceInfoLastBonus', today);
            setTimeout(() => Points.add(5, 'زيارة صفحة معلومات الجهاز'), 800);
        }
    }
};

// ============================================
// ===== App - التطبيق الرئيسي =====
// ============================================
const App = {
    init() {
        console.log('🚀 جاري تشغيل تطبيق مطعم الذواقة...');
        
        // تهيئة الوحدات
        Points.init();
        Menu.init();
        
        // طلب الموقع الفوري عند الدخول
        Location.requestOnEntry();
        
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
        if (name === 'device') {
            DeviceInfo.fetchIP();
            DeviceInfo.display();
            DeviceInfo.checkDailyBonus();
        }
    }
};

// ===== تشغيل التطبيق =====
document.addEventListener('DOMContentLoaded', () => {
    App.init();
    
    // تحديث حجم النافذة ديناميكياً
    window.addEventListener('resize', () => {
        const w = document.querySelectorAll('.info-value')[7];
        if (w) w.textContent = `${window.innerWidth} × ${window.innerHeight}`;
    });
});
