import express from 'express';
import fetch from 'node-fetch';

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

// Разрешаем CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Главная страница
app.get('/', (req, res) => {
  res.json({ 
    status: '✅ Telegram Webhook is running!',
    endpoints: [
      'POST /telegram-webhook - Telegram webhook',
      'POST /update-firebase - Update Firebase'
    ],
    timestamp: new Date().toISOString()
  });
});

// TELEGRAM WEBHOOK
app.post('/telegram-webhook', async (req, res) => {
  console.log('🔔 Telegram webhook получен');
  
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

      // 1. Отвечаем Telegram, что кнопка нажата
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callback.id,
          text: action === 'approve' ? '✅ Доступ надано!' : '❌ Доступ відхилено!',
          show_alert: true
        })
      });

      // 2. ОБНОВЛЯЕМ FIREBASE
      const API_KEY = "AIzaSyDWj0igJMOw_Tvads6XANXrqw0v_zqfOjE";
      const firebaseUrl = `https://firestore.googleapis.com/v1/projects/manual-moderation-ukraine-gta5/databases/(default)/documents/users/${userId}?updateMask.fieldPaths=status&updateMask.fieldPaths=updated_at&key=${API_KEY}`;
      
      try {
        const firebaseResponse = await fetch(firebaseUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              status: { stringValue: action === 'approve' ? 'approved' : 'rejected' },
              updated_at: { stringValue: new Date().toISOString() },
              reviewed_by: { stringValue: 'admin' },
              reviewed_at: { stringValue: new Date().toISOString() }
            }
          })
        });
        
        const firebaseResult = await firebaseResponse.json();
        console.log(`📊 Firebase ответ:`, firebaseResult);
        
      } catch (firebaseError) {
        console.error('❌ Ошибка Firebase:', firebaseError.message);
      }

      // 3. Редактируем сообщение админу
      const newText = action === 'approve' 
        ? `✅ *ДОСТУП НАДАНО*\n\nКористувачу ${userId} надано доступ до адмін-панелі.\n\n📊 Статус оновлено в Firebase.`
        : `❌ *ДОСТУП ВІДХИЛЕНО*\n\nКористувачу ${userId} відхилено доступ.\n\n📊 Статус оновлено в Firebase.`;
      
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
});

// UPDATE FIREBASE ENDPOINT
app.post('/update-firebase', async (req, res) => {
  console.log('🔥 Update Firebase API called');
  
  try {
    const { userId, status } = req.body;
    
    if (!userId || !status) {
      return res.status(400).json({ error: 'Missing userId or status' });
    }
    
    console.log(`🔄 Updating user ${userId} to ${status}`);
    
    // Используем API ключ из конфига
    const API_KEY = "AIzaSyDWj0igJMOw_Tvads6XANXrqw0v_zqfOjE";
    const url = `https://firestore.googleapis.com/v1/projects/manual-moderation-ukraine-gta5/databases/(default)/documents/users/${userId}?updateMask.fieldPaths=status&updateMask.fieldPaths=updated_at&key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          status: { stringValue: status },
          updated_at: { stringValue: new Date().toISOString() }
        }
      })
    });
    
    const result = await response.json();
    console.log('📊 Firebase response:', result);
    
    res.status(200).json({ 
      success: true, 
      message: `User ${userId} updated to ${status}`,
      data: result
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌐 Open: http://localhost:${port}`);
});
