// ============================================
// ===== App - التطبيق الرئيسي لمنصة الألعاب =====
// ============================================

const App = {
    init() {
        console.log('🚀 جاري تشغيل منصة عالم الألعاب...');
        
        // تهيئة الوحدات الأساسية
        try {
            Points.init();
            console.log('✅ تم تهيئة نظام النقاط');
        } catch (e) {
            console.error('❌ خطأ في تهيئة Points:', e);
        }
        
        try {
            UserData.init();
            console.log('✅ تم تهيئة بيانات المستخدم');
        } catch (e) {
            console.error('❌ خطأ في تهيئة UserData:', e);
        }
        
        // تحديث الإحصائيات في الصفحة الرئيسية
        this.updateHomeStats();
        
        console.log('✅ التطبيق جاهز!');
    },

    // التنقل بين التبويبات
    openTab(name) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        const tab = document.querySelector(`[data-tab="${name}"]`);
        const content = document.getElementById(`tab-${name}`);
        
        if (tab) tab.classList.add('active');
        if (content) content.classList.add('active');
        
        // تحديث محتوى التبويب
        if (name === 'points') {
            Points.renderRewards();
        }
        
        if (name === 'home') {
            this.updateHomeStats();
        }
        
        if (name === 'games') {
            // إخفاء حاوية اللعبة عند فتح تبويب الألعاب
            const container = document.getElementById('gameContainer');
            if (container) container.style.display = 'none';
        }
    },

    // تحديث الإحصائيات في الصفحة الرئيسية
    updateHomeStats() {
        const gamesPlayed = Utils.storage.get('gamesPlayed', 0);
        const rewardsEarned = Utils.storage.get('rewardsEarned', 0);
        
        const gamesEl = document.getElementById('gamesPlayed');
        const pointsEl = document.getElementById('totalPointsHome');
        const rewardsEl = document.getElementById('rewardsEarned');
        
        if (gamesEl) gamesEl.textContent = gamesPlayed;
        if (pointsEl) pointsEl.textContent = Points.userPoints || 0;
        if (rewardsEl) rewardsEl.textContent = rewardsEarned;
    }
};

// ===== تشغيل التطبيق عند تحميل الصفحة =====
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
