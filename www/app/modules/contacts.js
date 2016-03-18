/**
 * Created by Kristofer on 2016-03-17.
 */
angular.module('contacts', [])
    .controller('contactsCtrl', ['$scope', function($scope) {

        $scope.contacts = [];

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
        }

        getAllContacts();
    }])