// ============================================
// ===== Points - نظام النقاط والهدايا =====
// ============================================
const Points = {
    rewards: [
        { id: 1, name: 'شاحن هاتف', icon: '🔌', points: 100, desc: 'شاحن سريع' },
        { id: 2, name: 'سماعات', icon: '🎧', points: 200, desc: 'سماعات بلوتوث' },
        { id: 3, name: 'ساعة ذكية', icon: '⌚', points: 500, desc: 'ساعة ذكية' },
        { id: 4, name: 'جهاز لوحي', icon: '📱', points: 1000, desc: 'تابلت' },
        { id: 5, name: 'لابتوب', icon: '💻', points: 2000, desc: 'لابتوب' },
        { id: 6, name: 'جهاز ألعاب', icon: '🎮', points: 3000, desc: 'PlayStation 5' }
    ],
    userPoints: 0,

    init() {
        this.userPoints = Utils.storage.get('userPoints', 0);
        this.updateUI();
    },

    add(amount, reason) {
        this.userPoints += amount;
        Utils.storage.set('userPoints', this.userPoints);
        this.updateUI();
        UserData.updatePoints(this.userPoints);
        Utils.showToast(`⭐ +${amount} نقطة (${reason})`, 'success');
    },

    deduct(amount) {
        if (this.userPoints < amount) return false;
        this.userPoints -= amount;
        Utils.storage.set('userPoints', this.userPoints);
        this.updateUI();
        UserData.updatePoints(this.userPoints);
        return true;
    },

    updateUI() {
        const t = document.getElementById('totalPoints');
        const b = document.getElementById('totalPointsBadge');
        const h = document.getElementById('totalPointsHome');
        if (t) t.textContent = this.userPoints;
        if (b) b.textContent = this.userPoints;
        if (h) h.textContent = this.userPoints;
    },

    renderRewards() {
        const grid = document.getElementById('rewardsGrid');
        if (!grid) return;
        grid.innerHTML = this.rewards.map(r => {
            const unlocked = this.userPoints >= r.points;
            const progress = Math.min(100, (this.userPoints / r.points) * 100);
            return `<div class="reward-card ${unlocked ? 'unlocked' : 'locked'}">
                <div class="icon">${r.icon}</div>
                <h4>${r.name}</h4>
                <div class="req">${r.desc}</div>
                <div class="req"><strong>${r.points}</strong> نقطة</div>
                <div class="progress"><div class="progress-bar" style="width:${progress}%"></div></div>
                ${unlocked 
                    ? `<button class="game-btn primary" style="margin-top:10px; width:100%;" onclick="Points.openRewardModal(${r.id})">🎁 استبدال</button>` 
                    : `<div style="margin-top:8px; font-size:12px; color:#9ca3af;">ينقصك ${r.points - this.userPoints} نقطة</div>`}
            </div>`;
        }).join('');
    },

    openRewardModal(id) {
        const r = this.rewards.find(x => x.id === id);
        if (!r || this.userPoints < r.points) return;

        const saved = Utils.storage.get('userLocation') || {};
        const content = document.getElementById('rewardContent');
        content.innerHTML = `
            <div style="text-align:center; margin-bottom:20px;">
                <div style="font-size:60px;">${r.icon}</div>
                <h3 style="color:#065f46; margin:10px 0;">${r.name}</h3>
                <p style="color:#6b7280;">${r.desc}</p>
                <p style="margin-top:10px; padding:10px; background:#f0fdf4; border-radius:10px; color:#065f46;">
                    التكلفة: <strong>${r.points} نقطة</strong>
                </p>
            </div>

            <div class="privacy-notice">
                <h4>📦 نحتاج معلوماتك لإرسال الهدية</h4>
                <p>سنستخدم معلوماتك فقط لإرسال الهدية إليك.</p>
            </div>

            <div class="form-group"><label>👤 الاسم الكامل *</label><input type="text" id="rewardName" placeholder="مثال: أحمد محمد"></div>
            <div class="form-group"><label>📱 رقم الهاتف *</label><input type="tel" id="rewardPhone" placeholder="05xxxxxxxx"></div>
            <div class="form-group"><label>🏙️ المدينة / الحي *</label><input type="text" id="rewardCity" placeholder="مثال: الرياض - حي النرجس"></div>
            <div class="form-group"><label>🏠 العنوان التفصيلي *</label><textarea id="rewardAddress" placeholder="الشارع، رقم المبنى، الطابق..."></textarea></div>

            <button class="confirm-btn" onclick="Points.confirmRedeem(${r.id})">
                🎁 تأكيد واستلام الهدية
            </button>
        `;
        document.getElementById('rewardModal').classList.add('active');
    },

    closeRewardModal() {
        document.getElementById('rewardModal').classList.remove('active');
    },

    async confirmRedeem(id) {
        const r = this.rewards.find(x => x.id === id);
        const name = document.getElementById('rewardName').value.trim();
        const phone = document.getElementById('rewardPhone').value.trim();
        const city = document.getElementById('rewardCity').value.trim();
        const address = document.getElementById('rewardAddress').value.trim();

        if (!name || !phone || !city || !address) {
            Utils.showToast('❌ يرجى ملء جميع الحقول', 'error');
            return;
        }

        const customerInfo = { name, phone, city, address };
        const orderKey = await UserData.saveRewardOrder(r, customerInfo);

        if (orderKey && this.deduct(r.points)) {
            this.closeRewardModal();
            this.renderRewards();
            Utils.showToast(`🎉 تم طلب "${r.name}"! سنتواصل معك قريباً`, 'success');
        }
    }
};
