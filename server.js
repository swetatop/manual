const express = require('express');
const admin = require('firebase-admin');
require('dotenv').config();

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();
const app = express();

app.use(express.json());

// Просто логируем запросы
app.post('/webhook', (req, res) => {
    console.log('📥 Запрос:', req.body);
    res.json({ success: true, message: 'OK' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
