// api/telegram.js
export default async function handler(request) {
  try {
    const update = await request.json();
    console.log('📱 Telegram webhook:', JSON.stringify(update).substring(0, 200));
    
    // Только для теста - всегда отвечаем OK
    return new Response(JSON.stringify({ 
      ok: true, 
      message: 'Webhook received' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
