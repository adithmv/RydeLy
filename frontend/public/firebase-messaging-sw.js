// Firebase Messaging Service Worker
// This handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: self.FIREBASE_API_KEY || '',
  authDomain: self.FIREBASE_AUTH_DOMAIN || '',
  projectId: self.FIREBASE_PROJECT_ID || '',
  appId: self.FIREBASE_APP_ID || '',
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'RydeLy';
  const notificationOptions = {
    body: payload.notification?.body || 'New ride request',
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data,
    actions: [
      { action: 'accept', title: 'Accept' },
      { action: 'decline', title: 'Decline' }
    ]
  };
  
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'accept') {
    // Handle accept action
    event.waitUntil(
      clients.openWindow(`/driver/portal?accept=${event.notification.data?.rideId}`)
    );
  } else if (event.action === 'decline') {
    // Handle decline action - could send a decline notification to server
    console.log('Ride declined via notification');
  } else {
    // Default click - open the app
    event.waitUntil(
      clients.openWindow('/driver/portal')
    );
  }
});