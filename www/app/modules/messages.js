/**
 * Created by robinpipirs on 09/12/15.
 */
angular.module('messages', [])
    .controller('messagesController', ['$scope', '$http', 'tokenService', function ($scope, $http, tokenService) {


        $scope.messages = [
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



    }]);