/**
 * Created by Magnus Svensson on 09/03/16.
 */

angular.module('message', [])
    .factory('messageRepository', ['$http','$window','$rootScope','$location','$q','$state', 'tokenService', function($http, win, $rootScope, $location, $q,$state,tokenService) {

        factory.getMessages = function () {
            var result =  [
                {
                    AuthorAvatar: "img/profile-pics/6.jpg",
                    AuthorDisplayName: "Testa Testsson",
                    CreatedOn: "2016-03-09 15:36:05",
                    Content: "Testmeddelande 1",
                    Comments: null
                },
                {
                    AuthorAvatar: "img/profile-pics/2.jpg",
                    AuthorDisplayName: "B�rje Tumme",
                    CreatedOn: "2016-02-25 15:36:05",
                    Content: "Testmeddelande 2",
                    Comments: [
                        {
                            AuthorAvatar: "img/profile-pics/6.jpg",
                            AuthorDisplayName: "Testa Testsson",
                            Content: "Gu va trevligt"
                        }
                    ]
                },
                {
                    AuthorAvatar: "img/profile-pics/5.jpg",
                    AuthorDisplayName: "Pannbandine Gr�n",
                    CreatedOn: "2016-01-12 15:36:05",
                    Content: "Testmeddelande 3 :)",
                    Comments: null
                }
            ];
            return result;
        }

        return factory;
    }])
