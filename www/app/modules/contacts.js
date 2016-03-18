/**
 * Created by Kristofer on 2016-03-17.
 */
angular.module('contacts', [])
    .controller('contactsCtrl', ['$scope', '$http', 'tokenService', function($scope, $http, tokenService) {

        $scope.contacts = [];
        $scope.appUsers = [];
        $scope.inboxId = '8a0958a2-a163-4a20-8afa-e7315012e2d8';

        function getAllContacts() {
            var options      = new ContactFindOptions();
            options.multiple = true;
            var fields       = [navigator.contacts.fieldType.displayName, navigator.contacts.fieldType.name];
            navigator.contacts.find(fields,
                function(contacts){
                    $scope.contacts = contacts;
                },
                function(){
                    console.log('Could not get contacts!')
                }, options);
        };

        function searchForAppUser(queries){

                var req = {
                    method: 'POST',
                    ignoreLoadingBar: true,
                    url: tokenService.currentAppApiUrl + 'app/inboxes/search-multiple',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        Data: {
                            InboxId: $scope.inboxId,
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

                    for(var i = 0; i < data.length; i++){
                        var user = { UserId: data[i].UserId, Username: data[i].Username };
                        $scope.appUsers.push(user);
                    }

                }, function errorCallback(response) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                });
        }

        function getTempContacts(){
           var contact = { displayName: "test", phoneNumbers: [{"id":"4","pref":false,"value":"0763793585","type":"mobile"}]};
            $scope.contacts.push(contact);
        };

        var queries = [ "kristofer@bosbec.se", "p-o@bosbec.se"];

        searchForAppUser(queries);

        //getAllContacts();
        //getTempContacts();
    }])