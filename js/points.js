// ============================================
// ===== Points - نظام النقاط والمكافآت =====
// ============================================
const Points = {
    rewards: [
        { id: 1, name: 'مشروب مجاني', icon: '🥤', points: 50, desc: 'مشروب مع أي طلب', physical: false },
        { id: 2, name: 'خصم 10%', icon: '💰', points: 100, desc: 'كود خصم لطلبك القادم', physical: false },
        { id: 3, name: 'طبق جانبي', icon: '🍟', points: 150, desc: 'بطاطس أو سلطة مجاناً', physical: false },
        { id: 4, name: 'وجبة مجانية', icon: '🍔', points: 300, desc: 'وجبة كاملة مع توصيل', physical: true },
        { id: 5, name: 'عضوية VIP', icon: '👑', points: 500, desc: 'خصم 20% لمدة شهر', physical: false },
        { id: 6, name: 'هدية مميزة', icon: '🎁', points: 1000, desc: 'هدية فاخرة إلى عنوانك', physical: true }
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
        Utils.showToast(`⭐ +${amount} نقطة (${reason})`, 'success');
    },

    deduct(amount) {
        if (this.userPoints < amount) return false;
        this.userPoints -= amount;
        Utils.storage.set('userPoints', this.userPoints);
        this.updateUI();
        return true;
    },

    updateUI() {
        const t = document.getElementById('totalPoints');
        const b = document.getElementById('totalPointsBadge');
        if (t) t.textContent = this.userPoints;
        if (b) b.textContent = this.userPoints;
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

        const content = document.getElementById('rewardContent');
        if (r.physical) {
            // تحميل العنوان المحفوظ إن وجد
            const saved = Utils.storage.get('savedAddress') || {};
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
                    <h4>📦 نحتاج عنوانك لإرسال الهدية</h4>
                    <p>ستحتاج لإدخال عنوانك <strong>طوعاً</strong> لاستلام الهدية. معلوماتك لن تُستخدم إلا لهذا الغرض فقط.</p>
                </div>

                <div class="form-group"><label>👤 الاسم الكامل *</label><input type="text" id="rewardName" value="${saved.name || ''}" placeholder="مثال: أحمد محمد"></div>
                <div class="form-group"><label>📱 رقم الهاتف *</label><input type="tel" id="rewardPhone" value="${saved.phone || ''}" placeholder="05xxxxxxxx"></div>
                <div class="form-group"><label>🏙️ المدينة / الحي *</label><input type="text" id="rewardCity" value="${saved.city || ''}" placeholder="مثال: الرياض - حي النرجس"></div>
                <div class="form-group"><label>🏠 العنوان التفصيلي *</label><textarea id="rewardAddress" placeholder="الشارع، رقم المبنى، الطابق...">${saved.address || ''}</textarea></div>
                <div class="form-group"><label>📝 ملاحظات إضافية (اختياري)</label><textarea id="rewardNotes" placeholder="مثال: اتصل قبل الوصول..."></textarea></div>

                <div class="save-address-option">
                    <input type="checkbox" id="rewardSaveAddress" ${saved.name ? 'checked' : ''}>
                    <label for="rewardSaveAddress">💾 حفظ هذا العنوان للطلبات المستقبلية</label>
                </div>

                <button class="confirm-btn" onclick="Points.confirmRedeem(${r.id})">
                    🎁 تأكيد الاستبدال وإرسال الهدية
                </button>
            `;
        } else {
            content.innerHTML = `
                <div style="text-align:center; padding:20px;">
                    <div style="font-size:80px;">${r.icon}</div>
                    <h3 style="color:#065f46; margin:15px 0;">${r.name}</h3>
                    <p style="color:#6b7280; margin-bottom:20px;">${r.desc}</p>
                    <p style="padding:15px; background:#f0fdf4; border-radius:10px; color:#065f46;">
                        التكلفة: <strong>${r.points} نقطة</strong>
                    </p>
                    <button class="confirm-btn" style="margin-top:20px;" onclick="Points.redeemDigital(${r.id})">
                        ✅ استبدال الآن
                    </button>
                </div>
            `;
        }
        document.getElementById('rewardModal').classList.add('active');
    },

    closeRewardModal() {
        document.getElementById('rewardModal').classList.remove('active');
    },

    confirmRedeem(id) {
        const r = this.rewards.find(x => x.id === id);
        const name = document.getElementById('rewardName').value.trim();
        const phone = document.getElementById('rewardPhone').value.trim();
        const city = document.getElementById('rewardCity').value.trim();
        const address = document.getElementById('rewardAddress').value.trim();
        const notes = document.getElementById('rewardNotes').value.trim();
        const saveAddress = document.getElementById('rewardSaveAddress').checked;

        if (!name || !phone || !city || !address) {
            Utils.showToast('❌ يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        const order = {
            rewardId: r.id, rewardName: r.name,
            customer: { name, phone, address: `${city} - ${address}`, notes },
            timestamp: new Date().toISOString()
        };
        console.log('📦 طلب مكافأة:', order);

        if (saveAddress) {
            Utils.storage.set('savedAddress', { name, phone, city, address, notes });
        }

        if (this.deduct(r.points)) {
            this.closeRewardModal();
            this.renderRewards();
            Utils.showToast(`🎉 تم طلب "${r.name}"! سنتواصل معك قريباً`, 'success');
        }
    },

    redeemDigital(id) {
        const r = this.rewards.find(x => x.id === id);
        if (this.deduct(r.points)) {
            this.closeRewardModal();
            this.renderRewards();
            const code = 'GIFT-' + Utils.generateRoomCode();
            Utils.showToast(`🎁 كود المكافأة: ${code}`, 'success');
        }
    }
};
