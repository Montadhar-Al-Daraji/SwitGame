// ============================================
// ===== Menu - إدارة القائمة والسلة =====
// ============================================
const Menu = {
    items: [
        { id: 1, name: 'برجر كلاسيك', desc: 'لحم بقري مع جبنة شيدر', price: 25, emoji: '🍔' },
        { id: 2, name: 'بيتزا مارجريتا', desc: 'جبنة موزاريلا وطماطم', price: 35, emoji: '🍕' },
        { id: 3, name: 'شاورما دجاج', desc: 'دجاج مشوي مع ثوم', price: 18, emoji: '🌯' },
        { id: 4, name: 'كبسة لحم', desc: 'أرز بسمتي مع لحم', price: 45, emoji: '🍛' },
        { id: 5, name: 'سلطة سيزر', desc: 'خس مع دجاج مشوي', price: 22, emoji: '🥗' },
        { id: 6, name: 'باستا ألفريدو', desc: 'معكرونة بصلصة كريما', price: 28, emoji: '🍝' },
        { id: 7, name: 'سوشي مشكل', desc: '8 قطع سوشي', price: 55, emoji: '🍣' },
        { id: 8, name: 'كنافة', desc: 'حلوى بالجبنة', price: 15, emoji: '🍰' }
    ],
    cart: {},

    init() {
        this.render();
    },

    render() {
        const grid = document.getElementById('menuGrid');
        if (!grid) return;
        grid.innerHTML = this.items.map(item => `
            <div class="menu-item">
                <div class="img">${item.emoji}</div>
                <div class="info">
                    <h3>${item.name}</h3>
                    <div class="desc">${item.desc}</div>
                    <div class="footer">
                        <span class="price">${item.price} ر.س</span>
                        <button class="add-btn" onclick="Menu.addToCart(${item.id})">+ إضافة</button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    addToCart(id) {
        this.cart[id] = (this.cart[id] || 0) + 1;
        this.updateBadge();
        Utils.showToast('✅ تمت الإضافة للسلة', 'success');
    },

    updateBadge() {
        const total = Object.values(this.cart).reduce((a, b) => a + b, 0);
        const b = document.getElementById('cartBadge');
        if (b) b.textContent = total;
    },

    changeQty(id, delta) {
        this.cart[id] = (this.cart[id] || 0) + delta;
        if (this.cart[id] <= 0) delete this.cart[id];
        this.updateBadge();
        this.renderCart();
    },

    renderCart() {
        const content = document.getElementById('cartContent');
        if (!content) return;
        const items = Object.keys(this.cart);
        if (items.length === 0) {
            content.innerHTML = `<div style="text-align:center; padding:40px; color:#9ca3af;">
                <div style="font-size:60px;">🛒</div><p>سلتك فارغة</p></div>`;
            return;
        }
        let total = 0, html = '';
        items.forEach(id => {
            const item = this.items.find(m => m.id == id);
            const sub = item.price * this.cart[id];
            total += sub;
            html += `<div class="cart-item">
                <div class="name">${item.emoji} ${item.name}</div>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="Menu.changeQty(${id}, -1)">−</button>
                    <span style="font-weight:bold; min-width:20px; text-align:center;">${this.cart[id]}</span>
                    <button class="qty-btn" onclick="Menu.changeQty(${id}, 1)">+</button>
                </div>
                <div style="min-width:70px; text-align:left; color:#d97706; font-weight:bold;">${sub} ر.س</div>
            </div>`;
        });
        html += `<div class="total-row"><span>الإجمالي:</span><span>${total} ر.س</span></div>
            <button class="checkout-btn" onclick="Location.open()">📍 متابعة للطلب</button>`;
        content.innerHTML = html;
    },

    openCart() {
        this.renderCart();
        document.getElementById('cartModal').classList.add('active');
    },

    closeCart() {
        document.getElementById('cartModal').classList.remove('active');
    },

    getTotal() {
        return Object.keys(this.cart).reduce((t, id) => {
            return t + this.items.find(m => m.id == id).price * this.cart[id];
        }, 0);
    },

    clear() {
        this.cart = {};
        this.updateBadge();
    }
};
