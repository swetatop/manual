// telegram-webhook.js - Обработчик callback кнопок
export default async function handler(req, res) {
    console.log('🔔 Webhook получен');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const update = req.body;
        console.log('📨 Update:', JSON.stringify(update, null, 2));

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

            // 2. Редактируем сообщение с кнопками
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: ADMIN_ID,
                    message_id: callback.message.message_id,
                    text: action === 'approve' 
                        ? `✅ *ДОСТУП НАДАНО*\n\nКористувачу ${userId} надано доступ до адмін-панелі.`
                        : `❌ *ДОСТУП ВІДХИЛЕНО*\n\nКористувачу ${userId} відхилено доступ.`,
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
