export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log the webhook payload
    console.log('🔔 Polar webhook received:', {
      type: req.body.type,
      timestamp: new Date().toISOString(),
      data: req.body.data
    });
    
    // Handle different event types
    const { type, data } = req.body;
    
    switch (type) {
      case 'checkout.session.completed':
        console.log('✅ Checkout completed:', data);
        // Here you could update your database, send emails, etc.
        break;
        
      case 'subscription.created':
        console.log('🆕 Subscription created:', data);
        break;
        
      case 'subscription.updated':
        console.log('🔄 Subscription updated:', data);
        break;
        
      case 'subscription.canceled':
        console.log('❌ Subscription canceled:', data);
        break;
        
      case 'subscription.uncanceled':
        console.log('🔄 Subscription uncanceled:', data);
        break;
        
      case 'customer.created':
        console.log('👤 Customer created:', data);
        break;
        
      case 'customer.updated':
        console.log('👤 Customer updated:', data);
        break;
        
      default:
        console.log('❓ Unhandled event type:', type);
    }
    
    // Always return 200 to acknowledge receipt
    res.status(200).json({ 
      received: true, 
      timestamp: new Date().toISOString(),
      eventType: type 
    });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
