import express from 'express';
import fetch from 'node-fetch';

const app = express();
const port = process.env.PORT || 3000;

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
    ]
  });
});

// Telegram webhook
app.post('/telegram-webhook', async (req, res) => {
  console.log('🔔 Webhook received');
  
  try {
    const update = req.body;
    console.log('📨 Update:', JSON.stringify(update, null, 2));
    
    if (update.callback_query) {
      const callback = update.callback_query;
      const [action, userId] = callback.data.split('_');
      
      const BOT_TOKEN = "8506586970:AAEEhVuyML6qBI5nG3U5HlgjaN2B0pR1xeA";
      const ADMIN_ID = "5316593741";
      
      console.log(`🔘 Processing: ${action} for ${userId}`);

      // 1. Answer Telegram
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callback.id,
          text: action === 'approve' ? '✅ Доступ надано!' : '❌ Доступ відхилено!',
          show_alert: true
        })
      });

      // 2. Update Firebase
      const API_KEY = "AIzaSyDWj0igJMOw_Tvads6XANXrqw0v_zqfOjE";
      const firebaseUrl = `https://firestore.googleapis.com/v1/projects/manual-moderation-ukraine-gta5/databases/(default)/documents/users/${userId}?updateMask.fieldPaths=status&updateMask.fieldPaths=updated_at&key=${API_KEY}`;
      
      const firebaseResponse = await fetch(firebaseUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            status: { stringValue: action === 'approve' ? 'approved' : 'rejected' },
            updated_at: { stringValue: new Date().toISOString() }
          }
        })
      });

      console.log(`📊 Firebase response: ${firebaseResponse.status}`);

      // 3. Edit admin message
      const newText = action === 'approve' 
        ? `✅ *ДОСТУП НАДАНО*\n\nКористувачу ${userId} надано доступ.\n\n📊 Статус оновлено в Firebase.`
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

      console.log(`✅ Success: ${action} for ${userId}`);
    }

    res.status(200).json({ ok: true });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update Firebase endpoint
app.post('/update-firebase', async (req, res) => {
  try {
    const { userId, status } = req.body;
    
    if (!userId || !status) {
      return res.status(400).json({ error: 'Missing userId or status' });
    }
    
    console.log(`🔄 Updating user ${userId} to ${status}`);
    
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

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌐 Open: http://localhost:${port}`);
});
