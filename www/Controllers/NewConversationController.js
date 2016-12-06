mrApp.controller('NewConversationController', ['ApiFactory','$rootScope','$scope','$location','$timeout','UsersFactory','ConversationsFactory',
    function(apiFactory, $rootScope, $scope, $location, $timeout, usersFactory, conversationsFactory) {

        $scope.inboxId = $rootScope.currentInboxId;

        $scope.successText = null;
        $scope.errorText = null;

        $scope.recipients = [];
        $scope.searchResult = [];

        function showAlert(text, type, duration) {
            if (type == 'success') {
                $scope.successText = text;
                $timeout(function () {
                    $scope.successText = null;
                }, duration);
            }
            if (type == 'error') {
                $scope.errorText = text;
                $timeout(function () {
                    $scope.errorText = null;
                }, duration);
            }

        }

        $scope.CreateNewConversation = function (inboxId, messageText) {
            var participants = [];
            for (var i = 0; i < $scope.recipients.length; i++) {
                participants.push($scope.recipients[i].userId);
            }
            participants.push($rootScope.myAppUser.id);
            conversationsFactory.createNewConversation(inboxId, participants, messageText, function (response) {
                //console.log(response);
                showAlert("New conversation created", "success", 5000);
                $location.path('/messages/' + response.conversationId);
            }, function (error) {
                showAlert("Failed to create conversation", "error", 5000);
                console.log(error);
            });
        };

        $scope.FindUser = function (searchText, inboxId) {
            $scope.searchResult = [];
            usersFactory.findUser(searchText, inboxId, function (response) {
                //console.log(response);
                $scope.searchResult = {
                    'numberOfItems': response.length,
                    'resultsToShow': 10,
                    'items': response.slice(0, 10)
                };
            }, function (error) {
                //console.log(error);
            });
        };

        $scope.AddRecipient = function (user) {
            $scope.recipients.push(user);
        };

        $scope.RemoveRecipient = function (user) {
            var index = $scope.recipients.indexOf(user);
            $scope.recipients.splice(index, 1);
        };

        function init() {
            $scope.$emit('viewChanged', 'newconversation');
            console.log($scope.inboxId);
        }

        init();
    }
]);
