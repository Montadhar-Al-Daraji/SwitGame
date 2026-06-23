// ============================================
// ===== إعدادات Firebase - تم ربطه بمشروعك =====
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyD8jLXCopW1Klgm97FdHrY7VzpcrFE2s9s",
    authDomain: "switgame-a4227.firebaseapp.com",
    databaseURL: "https://switgame-a4227-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "switgame-a4227",
    storageBucket: "switgame-a4227.firebasestorage.app",
    messagingSenderId: "871810794908",
    appId: "1:871810794908:web:a55a81099041c74b1fb459"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// مراجع قاعدة البيانات
const DB = {
    users: () => db.ref('users'),
    user: (id) => db.ref(`users/${id}`),
    userData: (id) => db.ref(`users/${id}/data`),
    userPoints: (id) => db.ref(`users/${id}/points`),
    rewards: () => db.ref('rewards'),
    orders: () => db.ref('orders')
};

console.log('✅ تم تهيئة Firebase بنجاح');
