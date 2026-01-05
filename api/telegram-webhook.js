// api/telegram-webhook.js - РАБОЧАЯ ВЕРСИЯ С FIREBASE ADMIN
import admin from 'firebase-admin';

// Инициализируем Firebase Admin один раз
if (!admin.apps.length) {
  try {
    const serviceAccount = {
      type: "service_account",
      project_id: "manual-moderation-ukraine-gta5",
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
      universe_domain: "googleapis.com"
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log('✅ Firebase Admin инициализирован');
  } catch (error) {
    console.error('❌ Ошибка инициализации Firebase:', error);
  }
}

const db = admin.firestore();

export default async function handler(req, res) {
  console.log('🔔 Webhook получен');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    console.log('📨 Получен запрос от Telegram');
    
    // Обработка callback от кнопок
    if (update.callback_query) {
      const callback = update.callback_query;
      const [action, userId] = callback.data.split('_');
      
      const BOT_TOKEN = "8506586970:AAEEhVuyML6qBI5nG3U5HlgjaN2B0pR1xeA";
      const ADMIN_ID = "5316593741";
      
      console.log(`🔘 Обработка: ${action} для ${userId}`);

      // 1. Отвечаем Telegram
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callback.id,
          text: action === 'approve' ? '✅ Доступ надано!' : '❌ Доступ відхилено!',
          show_alert: true
        })
      });

      // 2. ОБНОВЛЯЕМ FIREBASE ЧЕРЕЗ ADMIN SDK
      try {
        await db.collection('users').doc(userId).update({
          status: action === 'approve' ? 'approved' : 'rejected',
          updated_at: new Date().toISOString()
        });
        
        console.log(`✅ Firebase обновлен для ${userId}: ${action}`);
        
        // 3. Получаем данные пользователя для уведомления
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          
          // 4. Отправляем уведомление пользователю в Telegram
          try {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: userId,
                text: action === 'approve' 
                  ? `🎉 *ДОСТУП НАДАНО!*\n\nВаш запит підтверджено адміністратором!\n\n👤 Ім'я: ${userData.first_name}\n🆔 Ваш ID: ${userId}\n✅ Статус: Активний\n\nПоверніться на сторінку авторизації для входу в адмін-панель.`
                  : `❌ *ДОСТУП ВІДХИЛЕНО*\n\nВаш запит відхилено адміністратором.\n\n👤 Ім'я: ${userData.first_name}\n🆔 Ваш ID: ${userId}\n📞 Зв'яжіться з адміністратором для уточнень.`,
                parse_mode: 'Markdown'
              })
            });
          } catch (telegramError) {
            console.log('⚠️ Не удалось отправить уведомление пользователю:', telegramError.message);
          }
        }
        
      } catch (firebaseError) {
        console.error('❌ Ошибка Firebase:', firebaseError.message);
      }

      // 5. Редактируем сообщение админу
      const newText = action === 'approve' 
        ? `✅ *ДОСТУП НАДАНО*\n\nКористувачу ${userId} надано доступ до адмін-панелі.\n\n📊 Статус оновлено в базі даних.\n👤 Користувач отримав сповіщення.`
        : `❌ *ДОСТУП ВІДХИЛЕНО*\n\nКористувачу ${userId} відхилено доступ.\n\n📊 Статус оновлено в базі даних.\n👤 Користувач отримав сповіщення.`;
      
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_ID,
          message_id: callback.message.message_id,
          text: newText,
          parse_mode: 'Markdown'
        })
      });

      console.log(`✅ Успешно обработано: ${action} для ${userId}`);
    }

    res.status(200).json({ ok: true });
    
  } catch (error) {
    console.error('❌ Ошибка обработки:', error);
    res.status(500).json({ error: error.message });
  }
}
