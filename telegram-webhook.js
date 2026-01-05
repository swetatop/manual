// telegram-webhook.js - Обработчик callback кнопок
import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDWj0igJMOw_Tvads6XANXrqw0v_zqfOjE",
    authDomain: "manual-moderation-ukraine-gta5.firebaseapp.com",
    projectId: "manual-moderation-ukraine-gta5",
    storageBucket: "manual-moderation-ukraine-gta5.firebasestorage.app",
    messagingSenderId: "28969074318",
    appId: "1:28969074318:web:ad85a4163a0d811de4d3df"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const BOT_TOKEN = "8506586970:AAEEhVuyML6qBI5nG3U5HlgjaN2B0pR1xeA";
const ADMIN_ID = "5316593741";

// Основная функция обработки
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const update = req.body;
        console.log('📨 Получен запрос:', JSON.stringify(update, null, 2));

        // Обработка callback от кнопок
        if (update.callback_query) {
            await handleCallbackQuery(update.callback_query);
            return res.status(200).json({ ok: true });
        }

        // Обработка обычных сообщений (опционально)
        if (update.message) {
            await handleMessage(update.message);
        }

        res.status(200).json({ ok: true });
    } catch (error) {
        console.error('❌ Ошибка обработки:', error);
        res.status(500).json({ error: error.message });
    }
}

// Обработка нажатия кнопки
async function handleCallbackQuery(callback) {
    const { id, data, message, from } = callback;
    const [action, userId] = data.split('_');
    
    console.log(`🔘 Обработка кнопки: ${action} для пользователя ${userId}`);

    try {
        // 1. Отвечаем Telegram, что кнопка нажата
        await answerCallbackQuery(id, action === 'approve' ? '✅ Доступ надано!' : '❌ Доступ відхилено!');
        
        // 2. Обновляем статус в Firebase
        await updateUserStatus(userId, action);
        
        // 3. Редактируем сообщение с кнопками
        await editMessage(message.chat.id, message.message_id, action, userId);
        
        // 4. Отправляем уведомление пользователю (если у него есть username)
        await notifyUser(userId, action);
        
        console.log(`✅ Успешно обработано: ${action} для ${userId}`);
        
    } catch (error) {
        console.error('❌ Ошибка обработки callback:', error);
        await answerCallbackQuery(id, '❌ Помилка обробки запиту');
    }
}

// Функция ответа на callback
async function answerCallbackQuery(callbackId, text) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            callback_query_id: callbackId,
            text: text,
            show_alert: true
        })
    });
    
    return response.json();
}

// Обновление статуса пользователя в Firebase
async function updateUserStatus(userId, action) {
    const userRef = doc(db, "users", userId);
    
    await updateDoc(userRef, {
        status: action === 'approve' ? 'approved' : 'rejected',
        updated_at: new Date().toISOString(),
        approved_by: ADMIN_ID,
        approved_at: new Date().toISOString(),
        approved_via: 'telegram_bot'
    });
    
    console.log(`📝 Обновлен статус для ${userId}: ${action}`);
}

// Редактирование сообщения с кнопками
async function editMessage(chatId, messageId, action, userId) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`;
    
    const newText = action === 'approve' 
        ? `✅ *ДОСТУП НАДАНО*\n\nКористувачу \`${userId}\` надано доступ до адмін-панелі.`
        : `❌ *ДОСТУП ВІДХИЛЕНО*\n\nКористувачу \`${userId}\` відхилено доступ.`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text: newText,
            parse_mode: 'Markdown'
        })
    });
    
    return response.json();
}

// Уведомление пользователя (если есть username)
async function notifyUser(userId, action) {
    try {
        // Сначала получаем данные пользователя из Firebase
        const userDoc = await getDoc(doc(db, "users", userId));
        if (!userDoc.exists()) return;
        
        const userData = userDoc.data();
        if (!userData.username) return; // Нельзя отправить сообщение без username
        
        const message = action === 'approve' 
            ? `🎉 *Вітаємо!*\n\nВаш запит на доступ до адмін-панелі Ukraine GTA 5 підтверджено!\n\nТепер ви можете увійти: https://swetatop.github.io/manual/`
            : `😔 *Повідомлення*\n\nВаш запит на доступ до адмін-панелі Ukraine GTA 5 відхилено адміністратором.`;
        
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: userId,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        
    } catch (error) {
        console.log('⚠️ Не вдалося відправити повідомлення користувачу:', error.message);
    }
}

// Обработка обычных сообщений (опционально)
async function handleMessage(message) {
    if (message.text?.startsWith('/')) {
        await handleCommand(message);
    }
}

// Обработка команд (дополнительно)
async function handleCommand(message) {
    const { chat, text } = message;
    
    if (chat.id.toString() !== ADMIN_ID) {
        await sendMessage(chat.id, '⛔ У вас немає доступу до цієї команди.');
        return;
    }
    
    if (text === '/start') {
        await sendMessage(chat.id, '👋 Привіт, адміне! Бот для модерації Ukraine GTA 5 працює.\n\nОчікуйте запити на доступ від користувачів.');
    }
    
    if (text.startsWith('/approve')) {
        const userId = text.split(' ')[1];
        if (userId) {
            await updateUserStatus(userId, 'approve');
            await sendMessage(chat.id, `✅ Користувачу ${userId} надано доступ.`);
        }
    }
    
    if (text.startsWith('/reject')) {
        const userId = text.split(' ')[1];
        if (userId) {
            await updateUserStatus(userId, 'reject');
            await sendMessage(chat.id, `❌ Користувачу ${userId} відхилено доступ.`);
        }
    }
}

// Отправка сообщения
async function sendMessage(chatId, text) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown'
        })
    });
    
    return response.json();
}
