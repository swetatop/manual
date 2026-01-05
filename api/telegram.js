// api/telegram.js
export default async function handler(req, res) {
  try {
    console.log('📱 Telegram webhook received');
    
    // Для теста - всегда OK
    return res.status(200).json({ 
      ok: true, 
      message: 'Webhook working' 
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
