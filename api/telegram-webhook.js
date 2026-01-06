// api/telegram-webhook.js - ОБНОВЛЕННЫЙ
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

      // 2. ОБНОВЛЯЕМ FIREBASE через твою функцию
      try {
        const firebaseResponse = await fetch('https://manual-moderds.vercel.app/api/update-firebase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            status: action === 'approve' ? 'approved' : 'rejected',
            userName: callback.from?.first_name || 'User'
          })
        });
        
        const firebaseResult = await firebaseResponse.json();
        console.log(`✅ Firebase update result:`, firebaseResult);
        
        // Если Firebase успешно обновлен, отправляем уведомление пользователю
        if (firebaseResult.success) {
          try {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: userId,
                text: action === 'approve' 
                  ? `🎉 *ВІТАЮ! ДОСТУП НАДАНО!*\n\nВаш запит до адмін-панелі Ukraine GTA 5 підтверджено!\n\n✅ Статус: Активний\n\nСторінка авторизації автоматично оновиться.`
                  : `❌ *ДОСТУП ВІДХИЛЕНО*\n\nВаш запит до адмін-панелі Ukraine GTA 5 відхилено.\n\n📞 Для деталей зверніться до адміністратора.`,
                parse_mode: 'Markdown'
              })
            });
          } catch (telegramError) {
            console.log('⚠️ Не удалось отправить уведомление пользователю:', telegramError.message);
          }
        }
        
      } catch (firebaseError) {
        console.error('❌ Firebase update failed:', firebaseError.message);
      }

      // 3. Редактируем сообщение админу
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
