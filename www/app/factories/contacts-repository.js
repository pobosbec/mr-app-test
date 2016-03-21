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
        }

        function getAllPhoneContacts() {
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

        factory.searchForAppUser = function searchForAppUser(queries){

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
                        Queries: queries
                    },
                    AuthenticationToken: tokenService.getAppAuthToken()
                }
            };

            $http(req
            ).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                var data = response.data.data;

                var foundAppUsers = [];

                for(var i = 0; i < data.length; i++){
                    var user = { UserId: data[i].userId, Username: data[i].username };
                    foundAppUsers.push(user);
                }

                return foundAppUsers;

            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                return null;
            });
        }

        factory.findAppUsersFromAllContacts = function(){
            var query = ['p-o@bosbec.se', 'whitespacetest', '+46704738757'];

            for(var i = 0; i < contacts.length; i++){
                var contact = contacts[i];
                query.push(contact.phoneNumer);
                query.push(contact.emailAddress);
            }

            var foundAppUsers = factory.searchForAppUser(query);

            if(foundAppUsers.length > 0){
                for(var i = 0; i < foundAppUsers.length; i++){
                    appUsers.push(foundAppUsers);
                }
            }
        }

        factory.getAppUsers = function(){
            return appUsers;
        };

        function saveAppUsers(){
            if (typeof (Storage) !== "undefined") {
                localStorage.setItem('appUsers', appUsers);
            } else {
                alert("ach nein! keiner storage!!!1");
                return;
            }
        };

        return factory;
    }])