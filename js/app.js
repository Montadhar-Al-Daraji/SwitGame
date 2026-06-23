// ============================================
// ===== App - التطبيق الرئيسي (النسخة الجديدة) =====
// ============================================

const App = {
    init() {
        console.log('🚀 جاري تشغيل منصة عالم الألعاب...');
        
        // تهيئة نظام النقاط
        try {
            Points.init();
            console.log('✅ تم تهيئة نظام النقاط');
        } catch (e) {
            console.error('❌ خطأ في Points:', e);
        }
        
        // تهيئة بيانات المستخدم
        try {
            UserData.init();
            console.log('✅ تم تهيئة بيانات المستخدم');
        } catch (e) {
            console.error('❌ خطأ في UserData:', e);
        }
        
        // تحديث الإحصائيات
        this.updateHomeStats();
        
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
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
