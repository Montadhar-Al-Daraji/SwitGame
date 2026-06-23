// ============================================
// ===== Utils - دوال مساعدة عامة =====
// ============================================
const Utils = {
    // إظهار رسالة Toast
    showToast(msg, type = '') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.className = `toast show ${type}`;
        setTimeout(() => toast.classList.remove('show'), 2500);
    },

    // التخزين المحلي
    storage: {
        get(key, defaultValue = null) {
            const v = localStorage.getItem(key);
            if (v === null) return defaultValue;
            try { return JSON.parse(v); } catch { return v; }
        },
        set(key, value) {
            localStorage.setItem(key, JSON.stringify(value));
        },
        remove(key) {
            localStorage.removeItem(key);
        }
    },

    // توليد كود غرفة عشوائي
    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    },

    // نسخ النص إلى الحافظة
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // fallback
            const temp = document.createElement('textarea');
            temp.value = text;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);
            return true;
        }
    },

    // توليد رابط اللعبة مع كود الانضمام
    generateGameURL(code) {
        const url = new URL(window.location.href);
        url.search = '';
        url.hash = '';
        url.searchParams.set('join', code);
        return url.toString();
    },

    // استخراج كود الانضمام من الرابط الحالي
    getJoinCodeFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('join');
    }
};
