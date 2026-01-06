// api/update-firebase.js - РАБОЧАЯ ВЕРСИЯ ЧЕРЕЗ REALTIME DATABASE
export default async function handler(req, res) {
  console.log('🔥 Update Firebase API called');
  
  // Разрешаем CORS
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
    const { userId, status, userName } = req.body;
    
    if (!userId || !status) {
      return res.status(400).json({ error: 'Missing userId or status' });
    }
    
    console.log(`🔄 Updating user ${userId} to ${status}`);
    
    // ТВОЙ FIREBASE DATABASE URL
    const DATABASE_URL = "https://manual-moderation-ukraine-gta5-default-rtdb.europe-west1.firebasedatabase.app";
    
    // Обновляем в Realtime Database (проще чем Firestore)
    const response = await fetch(`${DATABASE_URL}/users/${userId}/status.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        value: status,
        updated_at: new Date().toISOString(),
        reviewed_by: 'admin',
        reviewed_at: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Firebase error:', errorText);
      return res.status(500).json({ 
        error: 'Firebase update failed',
        details: errorText 
      });
    }
    
    const result = await response.json();
    console.log(`✅ Firebase updated for ${userId}:`, result);
    
    return res.status(200).json({ 
      success: true, 
      message: `User ${userId} updated to ${status}`,
      firebaseResult: result
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
