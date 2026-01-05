// api/update-firebase.js - Альтернативный способ обновления Firebase
export default async function handler(req, res) {
  console.log('🔥 Update Firebase API called');
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, status } = req.body;
    
    if (!userId || !status) {
      return res.status(400).json({ error: 'Missing userId or status' });
    }
    
    console.log(`🔄 Updating user ${userId} to ${status}`);
    
    // Здесь должен быть код для обновления Firebase
    // Для теста просто возвращаем успех
    console.log(`✅ Firebase update simulated for ${userId}: ${status}`);
    
    return res.status(200).json({ 
      success: true, 
      message: `User ${userId} updated to ${status}` 
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
