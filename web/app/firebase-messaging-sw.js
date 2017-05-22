function showNotification(data) {

    var title = '';
    if (data.data) {
        title = data.notification.title + '(' + data.data.topic + ')';
    } else {
        title = data.notification.title
    }

    return self.registration.showNotification(title, {
        icon: data.notification.icon,
        body: data.notification.body || '(with empty payload)',
        data: data.notification.click_action,
        vibrate: [400,100,400]
    });
}

function receivePush(event) {
    var data = '';
    console.log("receivePush");
    console.log(event.data.json());
    if(event.data) {
        data = event.data.json();
    }

    if('showNotification' in self.registration) {
        event.waitUntil(showNotification(data));
    }
}

function notificationClick(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data)
    );
}

self.addEventListener('push', receivePush, false);
self.addEventListener('notificationclick', notificationClick, false);
