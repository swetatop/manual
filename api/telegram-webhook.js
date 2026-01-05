// api/telegram-webhook.js
export default async function handler(req, res) {
  console.log('🔔 Webhook получен');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    console.log('📨 Получен запрос от Telegram:', JSON.stringify(update, null, 2));
    
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

      // 2. Обновляем Firebase через API
      try {
        const firebaseResponse = await fetch('https://firestore.googleapis.com/v1/projects/manual-moderation-ukraine-gta5/databases/(default)/documents/users/' + userId, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.FIREBASE_ACCESS_TOKEN}`
          },
          body: JSON.stringify({
            fields: {
              status: { stringValue: action === 'approve' ? 'approved' : 'rejected' },
              updated_at: { stringValue: new Date().toISOString() }
            }
          })
        });
        
        if (firebaseResponse.ok) {
          console.log(`✅ Firebase обновлен для ${userId}`);
        } else {
          console.log(`⚠️ Не удалось обновить Firebase: ${firebaseResponse.status}`);
        }
      } catch (firebaseError) {
        console.log('⚠️ Ошибка обновления Firebase:', firebaseError.message);
      }

      // 3. Редактируем сообщение с кнопками
      const newText = action === 'approve' 
        ? `✅ *ДОСТУП НАДАНО*\n\nКористувачу ${userId} надано доступ до адмін-панелі.\n\nСтатус оновлено в системі.`
        : `❌ *ДОСТУП ВІДХИЛЕНО*\n\nКористувачу ${userId} відхилено доступ.\n\nСтатус оновлено в системі.`;
      
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
