/**
 * Created by robinpipirs on 09/12/15.
 */
angular.module('messages', [])
    .controller('messagesController', ['$scope', '$http', 'tokenService', function ($scope, $http, tokenService) {


        $scope.username = "username";

        $scope.$watch('$viewContentLoaded', function () {


           // $scope.username = tokenService.getUsername();

        });






        /**
         *
         * gets messages
         *
         * @precondition $scope.adminId != null, $scope.settings variables != null;
         *
         */
        $scope.httpRequest = function(url, path,data,options) {

            var req = {
                method: 'POST',
                url: url+path,
                headers: {
                    'Content-Type': 'application/json'
                },
                data:{"Data":data,
                "AuthenticationToken": tokenService.getAuthToken(),
                "Tags":null}
            };

            $scope.request = req;

            $http(req
            ).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

                $scope.statusMessage = response.data.status;
                $scope.response = response.data;

                if(options == EXTRAS_LISTMESSAGES){
                    populateTable(response.data.data.items);
                }

                $scope.refreshList();



            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                //$scope.master = response.data;

                $scope.response = response.data;


            });
        };


    }]);