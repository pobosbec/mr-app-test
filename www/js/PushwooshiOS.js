/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

function registerPushwooshIOS() {
    console.log("registerPushwooshIOS");
    alert("registerPushwooshIOS");

    var pushNotification = cordova.require("pushwoosh-cordova-plugin.PushNotification");

    //set push notification callback before we initialize the plugin
    document.addEventListener('push-notification',
		function (event) {
		    alert("New push iOS");
		    var notification = event.notification;
		    alert("iOS PUSH: " + notification.animationPlayState.alert);
		    pushNotification.setApplicationIconBadgeNumber(0);
		}
	);

    //initialize the plugin
    console.log("initing plugin with on device ready, pushwoshios");
    //pushNotification.onDeviceReady({ pw_appid: "A014B-AC83E" });
    pushNotification.onDeviceReady({ pw_appid: "A014B-AC83E", appname: "com.bosbec.testapp" });

    console.log("check if token is registeredpushwooshios.js on resume");

    //check so that we have a token or not before registering. if we register with a present token then we will disable the push service..
    //pushNotification.getPushToken(
	//	function (token) {
	//	    console.log("pushToken is not null: " + JSON.stringify(token));
	//	    console.warn('push token: ' + token);

	//	    if (token != null) {
	//	        console.log("pushToken is not null");
	//	        alert("iOS: pushToken is not null, don't re-register");
	//	    }
	//	    else {

	//	        console.log("pushToken is null re register: ");
	//	        pushNotification.registerDevice({alert:true, badge:true, sound:true}, 
	//					function (token) {
	//					    alert("iOS: registerDevice: " + JSON.stringify(token));
	//					    console.log("pushNotification.registerDevice, from PushwooshiOS.js, token: " + JSON.stringify(token));

	//					    var deviceToken = token.deviceToken;
						    
	//					    onPushwooshiOSInitialized(deviceToken);
	//					},
	//				function (status) {
	//				    console.warn('failed to register : ' + JSON.stringify(status));
	//				}
	//			);
	//	    }
	//	}
	//);

    pushNotification.registerDevice({ alert: true, badge: true, sound: true },
        function(token) {
            alert("iOS: registerDevice: " + JSON.stringify(token));
            console.log("pushNotification.registerDevice, from PushwooshiOS.js, token: " + JSON.stringify(token));

            var deviceToken = token.deviceToken;

            onPushwooshiOSInitialized(deviceToken);
        },
        function(status) {
            console.warn('failed to register : ' + JSON.stringify(status));
        }
    );

    pushNotification.getPendingNotifications(function (notifications) {
        //console.log(JSON.stringify(['getPendingNotifications', notifications]));
        alert("iOS: Pending push: " + notifications);
    });

}

function onPushwooshiOSInitialized(pushToken) {
    console.log("onPushwooshiOSInitialized");
    alert("onPushwooshiOSInitialized: " + pushToken);

    //var pushNotification = cordova.require("pushwoosh-cordova-plugin.PushNotification");

    ////retrieve the tags for the device
    //pushNotification.getTags(
    //	function (tags) {
    //	    console.warn('tags for the device: ' + JSON.stringify(tags));
    //	},
    //	function (error) {
    //	    console.warn('get tags error: ' + JSON.stringify(error));
    //	}
    //);

    ////example how to get push token at a later time
    //pushNotification.getPushToken(
    //	function (token) {
    //	    console.warn('push token device: ' + token);
    //	}
    //);

    ////example how to get Pushwoosh HWID to communicate with Pushwoosh API
    //pushNotification.getPushwooshHWID(
    //	function (token) {
    //	    console.warn('Pushwoosh HWID: ' + token);
    //	}
    //);

    //var evt = document.createEvent('Event');
    //evt.initEvent('push-service-initialized', true, true);
    //document.dispatchEvent(evt);
}
