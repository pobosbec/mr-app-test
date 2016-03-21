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
            var readStorage = JSON.parse(localStorage.getItem('appUsers'));
            if (readStorage && readStorage.constructor === Array) {
                appUsers = readStorage;
            }

            retriveAllPhoneContacts();
        }

        factory.findAppUsersFromAllContacts = function(){
            var query = ['p-o@bosbec.se', 'whitespacetest', '+46704738757'];

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
                var foundAppUsers = [];

                for(var i = 0; i < success.data.length; i++){
                    var user = { UserId: success.data[i].userId, Username: success.data[i].username };
                    appUsers.push(user);
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

        function saveAppUsers(){
            if (typeof (Storage) !== "undefined") {
                localStorage.setItem('appUsers', appUsers);
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

        return factory;
    }])