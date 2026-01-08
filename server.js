const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

// Инициализация Firebase
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Инициализация бота
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 Глобальные переменные
const ADMIN_ID = '5316593741'; // Твой Telegram ID

// 🔥 Функция генерации токена
function generateToken(userId) {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 8);
  return `${timestamp}_${random}_${userId.substring(0, 4)}`;
}

// 🔥 Проверка токена (опционально)
function validateToken(token, userId) {
  if (!token) return true;
  return token.includes(userId.substring(0, 4));
}

// 🔥 Основной вебхук
app.post('/webhook', async (req, res) => {
  console.log('📥 Получен вебхук:', req.body.type || 'unknown');
  
  try {
    const { type, user, raw_params, source } = req.body;
    
    // 1. Обработка Telegram Widget логина
    if (type === 'telegram_widget_login' || type === 'widget_callback') {
      const { id, first_name, username, hash, auth_date } = user || {};
      
      console.log(`🔔 Telegram Widget: ${first_name} (${id})`);
      
      // Сохраняем/обновляем пользователя в Firebase
      const userRef = db.collection('users').doc(id.toString());
      const userDoc = await userRef.get();
      
      if (!userDoc.exists()) {
        // Новый пользователь
        await userRef.set({
          telegram_id: id,
          name: first_name,
          username: username || '',
          status: 'pending',
          widget_user: true,
          created_at: new Date(),
          last_login: new Date(),
          hash: hash || '',
          auth_date: auth_date || Date.now()
        });
        
        console.log(`🆕 Новый пользователь создан: ${first_name}`);
      } else {
        // Обновляем существующего
        await userRef.update({
          last_login: new Date(),
          hash: hash || '',
          auth_date: auth_date || Date.now()
        });
        
        console.log(`🔄 Пользователь обновлен: ${first_name}`);
      }
      
      // Проверяем статус пользователя
      const userData = userDoc.exists() ? userDoc.data() : { status: 'pending' };
      
      // Если пользователь уже одобрен или это админ
      if (userData.status === 'approved' || id === ADMIN_ID) {
        console.log(`✅ Пользователь уже одобрен: ${first_name}`);
        
        // Отправляем сообщение пользователю
        await bot.sendMessage(id,
          `🎉 Вітаємо, ${first_name}!\n\n` +
          `Ваш обліковий запис вже активований.\n` +
          `Можете увійти в адмін-панель:\n` +
          `https://swetatop.github.io/manual/`
        );
        
        return res.json({ 
          success: true, 
          already_approved: true,
          user: { id, first_name, username }
        });
      }
      
      // Если новый пользователь - отправляем админу на подтверждение
      const message = `🔔 <b>Новий запит на вхід (Telegram Widget)</b>\n\n` +
                     `👤 <b>Користувач:</b>\n` +
                     `├ ID: <code>${id}</code>\n` +
                     `├ Ім'я: ${first_name}\n` +
                     `└ Логін: @${username || 'немає'}\n\n` +
                     `🔧 <b>Технічне:</b>\n` +
                     `├ Джерело: Telegram Widget\n` +
                     `├ auth_date: ${auth_date || Date.now()}\n` +
                     `└ Хеш: ${hash ? hash.substring(0, 20) + '...' : 'немає'}`;
      
      // Генерация callback данных
      const callbackData = `approve_widget:${id}:${first_name}`;
      const rejectData = `reject_widget:${id}`;
      
      await bot.sendMessage(ADMIN_ID, message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Підтвердити вхід', callback_data: callbackData },
              { text: '❌ Відхилити', callback_data: rejectData }
            ]
          ]
        }
      });
      
      console.log(`📨 Запрос отправлен админу для ${first_name}`);
      
      return res.json({ 
        success: true, 
        message: 'Запрос отправлен админу',
        status: 'pending',
        user_id: id
      });
    }
    
    // 2. Обработка callback кнопок
    if (type === 'callback_query') {
      const { callback_query } = req.body;
      const callbackData = callback_query.data;
      const chatId = callback_query.from.id;
      
      console.log(`🔄 Callback получен: ${callbackData} от ${chatId}`);
      
      // Ответ на callback
      await bot.answerCallbackQuery(callback_query.id, { text: 'Обробляємо...' });
      
      // 🔥 ОБРАБОТКА Telegram Widget подтверждения
      if (callbackData.startsWith('approve_widget:')) {
        const parts = callbackData.split(':');
        const userId = parts[1];
        const userName = parts[2] || 'Користувач';
        
        console.log(`✅ Одобряем пользователя от Widget: ${userName} (${userId})`);
        
        try {
          // Обновляем Firebase
          const userRef = db.collection('users').doc(userId);
          await userRef.set({
            telegram_id: userId,
            name: userName,
            status: 'approved',
            approved_at: new Date(),
            approved_by: chatId,
            isAdmin: userId === ADMIN_ID,
            widget_user: true,
            last_updated: new Date()
          }, { merge: true });
          
          console.log(`✅ Firebase обновлен для ${userId}`);
          
          // Генерация токена
          const token = generateToken(userId);
          
          // Формируем ссылку для auto-login
          const autoLoginUrl = `https://swetatop.github.io/manual/auto-login.html?` +
            `id=${userId}&` +
            `first_name=${encodeURIComponent(userName)}&` +
            `approved=true&` +
            `token=${token}&` +
            `source=telegram_widget`;
          
          // Отправляем админу ссылку
          await bot.sendMessage(chatId,
            `✅ <b>Користувач підтверджений!</b>\n\n` +
            `👤 <b>${userName}</b>\n` +
            `🆔 ID: <code>${userId}</code>\n\n` +
            `🔗 Натисніть посилання для автоматичного входу в адмінку:`,
            {
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [[
                  {
                    text: '🚀 Увійти в адмінку',
                    url: autoLoginUrl
                  }
                ]]
              }
            }
          );
          
          // Уведомляем пользователя
          await bot.sendMessage(userId,
            `🎉 <b>Вітаємо, ${userName}!</b>\n\n` +
            `Ваш обліковий запис підтверджено адміністратором.\n\n` +
            `Тепер ви можете увійти в адмін-панель:\n` +
            `https://swetatop.github.io/manual/\n\n` +
            `Для швидкого входу використовуйте посилання вище.`,
            { parse_mode: 'HTML' }
          );
          
          console.log(`📨 Уведомления отправлены для ${userId}`);
          
          return res.json({ 
            success: true, 
            action: 'approved',
            user_id: userId,
            auto_login_url: autoLoginUrl
          });
          
        } catch (error) {
          console.error('❌ Ошибка при одобрении:', error);
          await bot.sendMessage(chatId, '❌ Помилка при підтвердженні користувача.');
          return res.json({ success: false, error: error.message });
        }
      }
      
      // 🔥 ОТКЛОНЕНИЕ Telegram Widget
      if (callbackData.startsWith('reject_widget:')) {
        const userId = callbackData.split(':')[1];
        
        console.log(`❌ Отклоняем пользователя: ${userId}`);
        
        try {
          // Обновляем статус в Firebase
          const userRef = db.collection('users').doc(userId);
          await userRef.update({
            status: 'rejected',
            rejected_at: new Date(),
            rejected_by: chatId
          });
          
          // Уведомляем пользователя
          await bot.sendMessage(userId,
            `❌ <b>Ваш запит відхилено</b>\n\n` +
            `Адміністратор відхилив ваш запит на доступ до адмін-панелі.\n\n` +
            `Якщо ви вважаєте це помилкою, зверніться до адміністратора.`,
            { parse_mode: 'HTML' }
          );
          
          await bot.sendMessage(chatId, `❌ Запит користувача ${userId} відхилено.`);
          
          return res.json({ 
            success: true, 
            action: 'rejected',
            user_id: userId 
          });
          
        } catch (error) {
          console.error('Ошибка при отклонении:', error);
          return res.json({ success: false, error: error.message });
        }
      }
      
      // 🔥 СТАРЫЙ обработчик (оставляем для совместимости)
      if (callbackData.startsWith('approve:')) {
        const parts = callbackData.split(':');
        const userId = parts[1];
        const userName = parts[2] || '';
        const userUsername = parts[3] || '';
        
        console.log(`✅ Старый обработчик: Одобряем ${userName}`);
        
        // ... твой существующий код для approve: ...
      }
      
      return res.json({ success: true, processed: true });
    }
    
    // 3. Обработка проверки пользователя
    if (type === 'check_user') {
      const { user_id } = req.body;
      
      if (!user_id) {
        return res.json({ success: false, error: 'Нет user_id' });
      }
      
      try {
        const userDoc = await db.collection('users').doc(user_id.toString()).get();
        
        if (!userDoc.exists()) {
          return res.json({ 
            success: true, 
            exists: false,
            approved: false 
          });
        }
        
        const userData = userDoc.data();
        
        return res.json({
          success: true,
          exists: true,
          approved: userData.status === 'approved',
          isAdmin: userData.isAdmin || false,
          user: {
            id: userData.telegram_id,
            name: userData.name,
            username: userData.username
          }
        });
        
      } catch (error) {
        console.error('Ошибка проверки пользователя:', error);
        return res.json({ success: false, error: error.message });
      }
    }
    
    // 4. Тестовый endpoint
    if (type === 'test') {
      console.log('🧪 Тестовый запрос:', req.body);
      return res.json({ 
        success: true, 
        message: 'Сервер работает',
        timestamp: new Date().toISOString(),
        version: '2.0'
      });
    }
    
    // Если тип не распознан
    return res.json({ 
      success: false, 
      error: 'Unknown type',
      received: req.body 
    });
    
  } catch (error) {
    console.error('❌ Ошибка в webhook:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 🔥 Endpoint для auto-login (опционально)
app.post('/auto-login', async (req, res) => {
  const { user_id, token } = req.body;
  
  if (!user_id || !token) {
    return res.json({ success: false, error: 'Missing parameters' });
  }
  
  try {
    // Проверяем токен
    if (!validateToken(token, user_id)) {
      return res.json({ success: false, error: 'Invalid token' });
    }
    
    // Проверяем пользователя в Firebase
    const userDoc = await db.collection('users').doc(user_id.toString()).get();
    
    if (!userDoc.exists()) {
      return res.json({ success: false, error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    if (userData.status !== 'approved') {
      return res.json({ success: false, error: 'User not approved' });
    }
    
    // Генерируем сессионный токен
    const sessionToken = generateToken(user_id);
    const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 часа
    
    // Сохраняем сессию (опционально)
    await db.collection('sessions').doc(sessionToken).set({
      user_id: user_id,
      created_at: new Date(),
      expires_at: new Date(expires),
      ip: req.ip
    });
    
    return res.json({
      success: true,
      user: {
        id: userData.telegram_id,
        name: userData.name,
        username: userData.username,
        isAdmin: userData.isAdmin || false
      },
      session_token: sessionToken,
      expires: expires
    });
    
  } catch (error) {
    console.error('Ошибка auto-login:', error);
    return res.json({ success: false, error: error.message });
  }
});

// 🔥 Endpoint для проверки сессии
app.post('/verify-session', async (req, res) => {
  const { session_token } = req.body;
  
  if (!session_token) {
    return res.json({ success: false, error: 'No session token' });
  }
  
  try {
    const sessionDoc = await db.collection('sessions').doc(session_token).get();
    
    if (!sessionDoc.exists()) {
      return res.json({ success: false, error: 'Invalid session' });
    }
    
    const sessionData = sessionDoc.data();
    
    if (sessionData.expires_at.toDate() < new Date()) {
      // Удаляем просроченную сессию
      await db.collection('sessions').doc(session_token).delete();
      return res.json({ success: false, error: 'Session expired' });
    }
    
    // Получаем данные пользователя
    const userDoc = await db.collection('users').doc(sessionData.user_id).get();
    
    if (!userDoc.exists()) {
      return res.json({ success: false, error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    return res.json({
      success: true,
      user: {
        id: userData.telegram_id,
        name: userData.name,
        username: userData.username,
        isAdmin: userData.isAdmin || false
      },
      session: {
        created: sessionData.created_at,
        expires: sessionData.expires_at
      }
    });
    
  } catch (error) {
    console.error('Ошибка проверки сессии:', error);
    return res.json({ success: false, error: error.message });
  }
});

// 🔥 Тестовый endpoint для проверки работы
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Telegram Webhook',
    version: '2.0',
    endpoints: [
      'POST /webhook',
      'POST /auto-login',
      'POST /verify-session',
      'GET /health'
    ]
  });
});

// 🔥 Старт сервера
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 Открой: http://localhost:${PORT}`);
  console.log(`🤖 Бот: @${process.env.BOT_USERNAME || 'UGgtavBot'}`);
  console.log(`👑 Админ: ${ADMIN_ID}`);
});
