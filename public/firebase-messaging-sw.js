// public/firebase-messaging-sw.js
// Service Worker for Firebase Cloud Messaging (Web Push Notifications)

importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDlpcLDohZYWG-UnpXORXUUd9O5xE53QL8',
  authDomain: 'project-8129dcb9-c383-42e8-b10.firebaseapp.com',
  projectId: 'project-8129dcb9-c383-42e8-b10',
  storageBucket: 'project-8129dcb9-c383-42e8-b10.firebasestorage.app',
  messagingSenderId: '36141190693',
  appId: '1:36141190693:web:296e4573992876765939cc',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle =
    (payload && payload.notification && payload.notification.title) ||
    'New Gym Nudge! 🏋️‍♂️';
  const notificationOptions = {
    body:
      (payload && payload.notification && payload.notification.body) ||
      'Bạn tập vừa gửi lời nhắc Đi tập đê!',
    icon: '/ditapde-logo.svg',
    badge: '/ditapde-logo.svg',
    data: (payload && payload.data) || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});
