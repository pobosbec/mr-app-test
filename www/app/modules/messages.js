/**
 * Created by robinpipirs on 09/12/15.
 */
angular.module('messages', [])
    .controller('messagesController', ['$scope', '$http', 'tokenService', function ($scope, $http, tokenService) {

        $scope.token = tokenService.getAuthToken();
        $scope.username = tokenService.getUsername;


        $scope.test = [
            {
                AuthorAvatar: "img/profile-pics/6.jpg",
                AuthorDisplayName: "Testa Testsson",
                CreatedOn: "2016-03-09 15:36:05",
                Content : "Testmeddelande 1",
                Comments : null
            },
            {
                AuthorAvatar: "img/profile-pics/2.jpg",
                AuthorDisplayName: "Börje Tumme",
                CreatedOn: "2016-02-25 15:36:05",
                Content : "Testmeddelande 2",
                Comments : [{
                    AuthorAvatar: "img/profile-pics/6.jpg",
                    AuthorDisplayName: "Testa Testsson",
                    Content : "Gu va trevligt"}]
            },
            {
                AuthorAvatar: "img/profile-pics/5.jpg",
                AuthorDisplayName: "Pannbandine Grön",
                CreatedOn: "2016-01-12 15:36:05",
                Content : "Testmeddelande 3 :)",
                Comments : null
            }
        ];


        $scope.$watch('$viewContentLoaded', function () {
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