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
function initPushwoosh() {
    if (window.isPhoneGap) {
        console.log("initPushwoosh, isPhoneGap");
        if (cordova !== null && typeof cordova !== "undefined" && cordova.require !== null && typeof cordova.require !== "undefined") {
            if (device.platform == "Android") {
                console.log("registering Android");
                registerPushwooshAndroid();
            }

            if (device.platform == "iPhone" || device.platform == "iOS") {
                console.log("registering pushwooshIOS");
                registerPushwooshIOS();
            }

            if (device.platform == "Win32NT") {
                registerPushwooshWP();
            }
        }
    }
}

var app = {
    // Application Constructor
    initialize: function () {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function () {
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function () {
        console.log('Contacts: ' + navigator.contacts);
        //alert("index.js>deviceready");
        //initPushwoosh();
        //app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function (id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
        try {
            var myDB = window.sqlitePlugin.openDatabase({ name: "bosbec1.db" });
            console.log('Open db: ');
            myDB.transaction(function (transaction) {
                transaction.executeSql('CREATE TABLE IF NOT EXISTS bosbec (id integer primary key, title text, desc text)', [],
                function (tx, result) {
                    document.sqlVal = "Table created successfully";
                    console.log('Db OK: ' + document.sqlVal + ". RESULT: " + result);
                },
                function (error) {
                    console.log('Database error: ' + error);
                    document.sqlVal = "Error occurred while creating the table.";
                });
            });
        } catch (ex) {
            console.log("Exception with db: " + ex.message);
        }
    }
};
