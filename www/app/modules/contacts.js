/**
 * Created by Kristofer on 2016-03-17.
 */
angular.module('contacts', [])
    .controller('contactsController', ['$scope', '$http', '$rootScope', 'communicationService', 'messageRepository','tokenService', '$cordovaContacts', function ($scope, $http, $rootScope, communicationService, messageRepository,tokenService, $cordovaContacts) {

        $scope.contacts = [];

        function getContacts(){
            $cordovaContacts.find().then(function(allContacts) { //omitting parameter to .find() causes all contacts to be returned
                $scope.contacts = allContacts;
            });
        }

        getContacts();

    }]);