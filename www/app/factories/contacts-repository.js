/**
 * Created by Kristofer on 2016-03-21.
 */
angular.module('contacts', [])
    .factory('contactsService', ['$http', '$rootScope', '$q', 'tokenService', function ($http, $rootScope, $q, tokenService) {

        var factory = {};
        var appUsers = [];
        var contacts = [];
        var inboxId = '8a0958a2-a163-4a20-8afa-e7315012e2d8';

        factory.init = function init() {

            retriveAllPhoneContacts();

            var item = localStorage.getItem('appUsers');

            if(item == null || item === "" || item == undefined){
                return;
            }

            var readStorage = JSON.parse(item);
            if (readStorage && readStorage.constructor === Array) {
                factory.appUsers = readStorage;
            }
        }

        factory.findAppUsersFromAllContacts = function(){
            var query = ['+46704738757', 'bjorn@bosbec.se'];

            for(var i = 0; i < contacts.length; i++){
                var contact = contacts[i];
                query.push(contact.phoneNumer);
                query.push(contact.emailAddress);
            }

            var req = {
                method: 'POST',
                ignoreLoadingBar: true,
                url: tokenService.currentAppApiUrl + 'app/inboxes/search-multiple',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    Data: {
                        InboxId: inboxId,
                        Queries: query
                    },
                    AuthenticationToken: tokenService.getAppAuthToken()
                }
            };

            var promise = tokenService.httpPost(req);

            promise.then(function(success){
                for(var i = 0; i < success.data.length; i++){
                    factory.addOrUpdateAppUser(success.data[i]);
                }
            }, function(error){
                console.log('found no app-users!')
            });
        }

        factory.getAppUsers = function(){
            return appUsers;
        }

        factory.getPhoneContacts = function(){
            return contacts;
        }

        factory.addOrUpdateAppUser = function(appUser){
            var updated = false;

            for(var i = 0; i < appUsers.length; i++){
                var currentAppUser = appUsers[i];

                if(currentAppUser.userId === appUser.userId){
                    appUsers[i] = appUser;
                    updated = true;
                    console.log('Updated app-user.')
                }
            }

            if(updated === false){
                appUsers.push(appUser);
                console.log('Added new app-user.')
            }

            saveAppUsers();
        };

        function saveAppUsers(){
            if (typeof (Storage) !== "undefined") {
                localStorage.setItem('appUsers', JSON.stringify(appUsers));
            } else {
                alert("ach nein! keiner storage!!!1");
                return;
            }
        };

        function retriveAllPhoneContacts() {
            var options      = new ContactFindOptions();
            options.multiple = true;
            var fields       = [navigator.contacts.fieldType.displayName, navigator.contacts.fieldType.name];
            navigator.contacts.find(fields,
                function(phoneContacts){
                    contacts = phoneContacts;
                },
                function(){
                    console.log('Could not get contacts!')
                }, options);
        };

        factory.init();

        return factory;
    }])