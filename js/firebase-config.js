// ============================================
// ===== إعدادات Firebase =====
// ============================================

// ⚠️ استبدل هذه القيم بقيم مشروعك من Firebase Console
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
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
