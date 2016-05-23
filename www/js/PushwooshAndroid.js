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

function registerPushwooshAndroid() {
    var pushNotification = cordova.require("pushwoosh-cordova-plugin.PushNotification");

    //set push notifications handler
    document.addEventListener('push-notification',
		function (event) {
		    var title = event.notification.title;
		    var userData = event.notification.userdata;

		    if (typeof (userData) != "undefined") {
		        console.warn('user data: ' + JSON.stringify(userData));
		    }
		}
	);

    pushNotification.onDeviceReady({ projectid: "482590317251", appid: "A014B-AC83E" });

    //register for push notifications
    pushNotification.registerDevice(
		function(token) {
		    console.log('pushNotification.registerDevice token: ' + token);
		    //callback when pushwoosh is ready
		    onPushwooshAndroidInitialized(token);
		},
		function(status)
		{
		    alert("failed to register: " +  status);
		    console.warn(JSON.stringify(['failed to register ', status]));
		}
	);
}

function onPushwooshAndroidInitialized(pushToken) {
    console.log('onPushwooshAndroidInitialized push token: ' + pushToken);

    var pushNotification = cordova.require("pushwoosh-cordova-plugin.PushNotification");

    //if you need push token at a later time you can always get it from Pushwoosh plugin
    pushNotification.getPushToken(
		function (token) {
		    console.log('push token: ' + token);
		}
	);

    //and HWID if you want to communicate with Pushwoosh API
    pushNotification.getPushwooshHWID(
		function (token) {
		    console.warn('Pushwoosh HWID: ' + token);
		}
	);

    pushNotification.getTags(
		function (tags) {
		    console.warn('tags for the device: ' + JSON.stringify(tags));
		},
		function (error) {
		    console.warn('get tags error: ' + JSON.stringify(error));
		}
	);

    pushNotification.setLightScreenOnNotification(false);

    //settings tags
    pushNotification.setTags({ deviceName: "hello", deviceId: 10 },
		function (status) {
		    console.warn('setTags success');
		},
		function (status) {
		    console.warn('setTags failed');
		}
	);
}
