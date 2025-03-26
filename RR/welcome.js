document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already logged in
  chrome.storage.local.get(['userEmail', 'isLoggedIn'], (result) => {
    if (result.isLoggedIn && result.userEmail) {
      // User is already logged in, redirect to main popup
      window.location.href = 'popup.html';
    }
  });

  // Set up Google login button
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  googleLoginBtn.addEventListener('click', async () => {
    try {
      // Launch Google auth flow
      await authenticateWithGoogle();
    } catch (error) {
      console.error('Google auth error:', error);
      alert('Failed to log in with Google. Please try again later.');
    }
  });
});

// Function to authenticate with Google
async function authenticateWithGoogle() {
  return new Promise((resolve, reject) => {
    try {
      // Use Chrome identity API to get Google auth
      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        if (chrome.runtime.lastError) {
          console.error('Auth error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }

        if (!token) {
          reject(new Error('Failed to get auth token'));
          return;
        }

        // Get user info with token
        try {
          const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch user info');
          }
          
          const userInfo = await response.json();
          
          if (userInfo && userInfo.email) {
            // Save user info
            await chrome.storage.local.set({ 
              userEmail: userInfo.email,
              userName: userInfo.name,
              userPicture: userInfo.picture,
              isLoggedIn: true,
              loginMethod: 'google',
              loginTime: new Date().toISOString()
            });
            
            // Verify subscription status based on email
            await verifySubscription(userInfo.email);
            
            // Redirect to main popup
            window.location.href = 'popup.html';
            resolve(userInfo);
          } else {
            reject(new Error('No email in user info'));
          }
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Function to verify subscription status
async function verifySubscription(email) {
  try {
    // Get base URL from configuration
    const storageData = await chrome.storage.local.get('apiBaseUrl');
    const apiBaseUrl = storageData.apiBaseUrl || 'http://localhost:3000';
    
    // Call your server endpoint to verify subscription by email
    const response = await fetch(`${apiBaseUrl}/verify-subscription-by-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Save subscription details to local storage
      await chrome.storage.local.set({
        isPro: data.isPro,
        subscriptionStartDate: data.subscriptionStartDate,
        subscriptionEndDate: data.subscriptionEndDate,
        subscriptionVerified: true
      });
      
      return data;
    } else {
      console.error('Failed to verify subscription:', await response.text());
      return { isPro: false };
    }
  } catch (error) {
    console.error('Error verifying subscription:', error);
    return { isPro: false };
  }
} 