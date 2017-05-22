
let _ = function (id) {
    return document.getElementById(id);
};

let appServerURL = "http://localhost:8080/push";
let appServerTokenURL = "http://localhost:8080/push/token";
let appServerTopicURL = "http://localhost:8080/push/topic";

let messaging = firebase.messaging();

function enablePushRequest() {
    _('subscribe').classList.add('subscribing');
    _('push').disabled = false;
    _('title').disabled = false;
    _('body').disabled = false;
    _('url').disabled = false;
    _('icon').disabled = false;
}

function disablePushRequest() {
    _('subscribe').classList.remove('subscribing');
    _('push').disabled = true;
    _('title').disabled = true;
    _('body').disabled = true;
    _('url').disabled = true;
    _('icon').disabled = true;
}

function togglePushSubscription() {
    if (!_('subscribe').classList.contains('subscribing')) {
        requestPermission();
        enablePushRequest();
    } else {
        deleteToken();
        disablePushRequest();
    }
}

function toggleTopicSubscription() {
    if (!_('topic-subscribe').classList.contains('subscribing')) {
        requestSubscribeTopic();
        _('topic-subscribe').classList.add('subscribing');
    } else {
        requestUnSubscribeTopic();
        _('topic-subscribe').classList.remove('subscribing');
    }
}

function deleteToken() {
    messaging.getToken()
        .then(function(currentToken) {
            messaging.deleteToken(currentToken)
                .then(function() {
                    console.log('Token deleted.');
                })
                .catch(function(err) {
                    console.log('Unable to delete token. ', err);
                });
        })
        .catch(function(err) {
            console.log('An error occurred while retrieving token. ', err);
        });
}

messaging.onTokenRefresh(function() {
    messaging.getToken()
        .then(function(refreshedToken) {
            console.log('Token refreshed.');
        })
        .catch(function(err) {
            console.log('Unable to retrieve refreshed token ', err);
        });
});

messaging.onMessage(function(payload) {
    console.log("Message received. ", payload);
});

function requestPermission() {
    console.log('Requesting permission...');
    messaging.requestPermission()
        .then(function() {
            console.log('Notification permission granted.');
            messaging.getToken()
                .then(function(currentToken) {
                    fetch(appServerTokenURL, {
                        credentials: 'include',
                        method: 'POST',
                        headers: {'Content-Type': 'application/json; charset=UTF-8'},
                        body: JSON.stringify({
                            to: currentToken
                        })
                    });
                })
                .catch(function(err) {
                    console.log('An error occurred while retrieving token. ', err);
                });
        })
        .catch(function(err) {
            console.log('Unable to get permission to notify.', err);
        });
}

function requestPushNotification() {
    messaging.getToken()
        .then(function(currentToken) {

            var url = '';
            if (_('topic').checked) {
                url = appServerURL + "?topic=/topics/movies";
            } else {
                url = appServerURL;
            }

            fetch(url, {
                method: 'POST',
                headers: {'Content-Type': 'application/json; charset=UTF-8'},
                body: JSON.stringify({
                    to: currentToken,
                    payload: {
                        title: _('title').value || '(empty)',
                        body: _('body').value || '(empty)',
                        tag: 'tag',
                        icon: _('icon').value || '/image/ic_alarm_black_48dp_2x.png',
                        click_action: _('url').value
                    }
                })
            });
        })
        .catch(function(err) {
            console.log('Unable to retrieve refreshed token ', err);
        });
}

function requestSubscribeTopic() {
    messaging.getToken()
        .then(function(currentToken) {
            fetch(appServerTopicURL + "/" + currentToken + '?topic=/topics/movies', {
                method: 'POST',
                headers: {'Content-Type': 'application/json; charset=UTF-8'},
                body: JSON.stringify({})
            });
        })
        .catch(function(err) {
            console.log('Unable to retrieve refreshed token ', err);
        });
}

function requestUnSubscribeTopic() {
    messaging.getToken()
        .then(function(currentToken) {
            fetch(appServerTopicURL + "/" + currentToken + '?topic=/topics/movies', {
                method: 'DELETE'
            });
        })
        .catch(function(err) {
            console.log('Unable to retrieve refreshed token ', err);
        });
}

function serviceWorkerReady(registration) {
    if('pushManager' in registration) {
        var s = _('subscribe');
        s.disabled = false;
        s.classList.remove('subscribing');

        var topic = _('topic-subscribe');
        topic.disabled = false;

        messaging.getToken()
            .then(function(currentToken) {
                if (currentToken) {
                    enablePushRequest();
                } else {
                    disablePushRequest();
                }
            })
            .catch(function(err) {
                console.log('An error occurred while retrieving token. ', err);
            });
    }
}

function init() {
    if ('serviceWorker' in navigator) {
        _('subscribe').addEventListener('click', togglePushSubscription, false);
        _('topic-subscribe').addEventListener('click', toggleTopicSubscription, false);
        _('push').addEventListener('click', requestPushNotification, false);
        navigator.serviceWorker.ready.then(serviceWorkerReady);
        navigator.serviceWorker.register('serviceworker.js');
    } else {
        console.log("disabled serviceWorker")
    }
}

window.addEventListener('load', init, false);