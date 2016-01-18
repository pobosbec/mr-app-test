function MainController(apiFactory, $rootScope, $scope, $location, $filter, $timeout, conversationsFactory) {

    var checkWhatsNew = function() {
        conversationsFactory.whatIsNew(function(messages) {
            if (messages != null && messages.length > 0) {
                //BROADCAST
                $scope.$broadcast('newMessages', messages);
            }
            $timeout(function() {
                checkWhatsNew();
            }, 5000);
        }, function(error) {
            console.log(error);
        });
    };

    $scope.$on('$viewContentLoaded', function () {
        
        var token = $rootScope.authenticationToken;
        
        if ($rootScope.authenticationToken != undefined) {

            if ($scope.inboxes == undefined) {

                listInboxes(token, function (response) {

                    getInbox(token, $scope.inboxes[0].inboxId, function (response) {
                        if ($scope.inboxes[0].inboxId != undefined) {
                            $location.path('http://webapp.aws.mobileresponse.se.s3-website-eu-west-1.amazonaws.com/conversations/' + $scope.inboxes[0].inboxId);
                        }
                    });
                    checkWhatsNew();
                });

            }
        }
    });

    $rootScope.validateLoad = function (part) {
        if (part == 'inboxes') {
            if ($scope.inboxes != undefined) {
                return true;
            }
        } else if (part == 'inbox') {
            if ($scope.inbox != undefined) {
                return true;
            }
        } else if (part == 'profile') {
            if ($rootScope.myAppUser != undefined) {
                return true;
            }
        } else if (part == 'logout') {
            if ($rootScope.authenticationToken != undefined) {
                return true;
            }
        } else if (part == 'newConversation') {
            if ($rootScope.authenticationToken != undefined) {
                return true;
            }
        }

        return false;
    };

    function listInboxes(token, callback) {

        var listInboxesRequest = {
            authenticationToken: token,
            data: {
                'pageIndex': 0,
                'pageSize': 10
            }
        };
        apiFactory.functions.call('inboxes/list', listInboxesRequest, function (response) {
            $scope.inboxes = response.data.items;
            callback(response);
        }, function(error) {
            
        });
        
    }

    function getInbox(token, inboxId, callback) {

        var getInboxRequest = {
            authenticationToken: token,
            data: {
                'inboxId': inboxId
            }
        };
        apiFactory.functions.call('inboxes/details', getInboxRequest, function (response) {
            $scope.inbox = response.data;
            callback();
        });
        
    }

    

}