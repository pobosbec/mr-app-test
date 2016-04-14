/**
 * Created by Kristofer on 2016-03-29.
 */
angular.module('conversations', [])
    .controller('conversationsCtrl', [
        '$scope', '$http', '$rootScope', 'tokenService', 'contactsService', 'communicationService', 'messageRepository', function($scope, $http, $rootScope, tokenService, contactsService, communicationService, messageRepository) {

            $scope.conversations = [];
            $scope.userId = null;
            $scope.appUsers = [];

            /* Make a request to the api to check if a conversation exists
         */
            $scope.doesConversationExist = function(users) {
                return communicationService.doesConversationExist(users);
            };

            /* Makes a request to the api to get messages between two dateTimes. Could be used in a syncing service
         * if the user has dropped the local database.
         */
            $scope.sync = function(from, to) {
                communicationService.syncPeriodMessages(from.toJSON(), to.toJSON(), 0, 50);
            };

            /* Gets the url for a user. Used in an ng-repeat to display the avatar.
         */
            $scope.getAvatar = function(appUserId) {

                var found = null;

                for (var i = 0; i < $scope.appUsers.length; i++) {
                    var appUser = $scope.appUsers[i];

                    if (appUser.id === appUserId) {
                        found = $scope.appUsers[i].avatar;
                    }
                }

                if (found != null) {
                    return found;
                }
            };

            $scope.getUsername = function(appUserId) {
                var found = null;

                for (var i = 0; i < $scope.appUsers.length; i++) {
                    var appUser = $scope.appUsers[i];

                    if (appUser.id === appUserId) {
                        found = $scope.appUsers[i].username;
                    }
                }

                if (found != null) {
                    return found;
                }
            };

            $scope.selfFirst = function(appUserId) {
                if (appUserId === $scope.userId) {
                    return 1;
                }
            }

            // The events that this view reacts on
            $scope.$on('messages-added', function(event, args) {

                var promise = messageRepository.getMessagesByTime(0, 50);
                promise.then(
                    function(messages) {
                        for (var i = 0; i < messages.length; i++) {

                            var newConversation = true;

                            for (var j = 0; j < $scope.conversations.length; j++) {
                                if (messages[i].ConversationId === $scope.conversations[j].ConversationId) {
                                    newConversation = false;
                                }
                            }

                            if (newConversation === true) {
                                var newConversationsPromise = communicationService.getAllConversations(null);

                                newConversationsPromise.then(
                                    function(newConversationsPromiseSuccess) {

                                        // for each conversation, create and add to $scope.conversation. Check if all Authors are available as appUsers. If not, make details call and add to $scope.appusers + save to db
                                        for (var convo in newConversationsPromiseSuccess.data.usersInConversations) {
                                            var conversation = {
                                                ConversationId: convo,
                                                Messages: [],
                                                Participants: conversationsPromiseSuccess.data.usersInConversations[convo]
                                            };

                                            syncConversationParticipants(conversation);

                                            $scope.conversations.push(conversation);
                                        }

                                        function isParticipantAppUser(participantId) {
                                            var found = false;

                                            for (var i = 0; i < $scope.appUsers.length; i++) {
                                                if ($scope.appUsers[i].userId === participantId) {
                                                    found = true;
                                                }
                                            }

                                            return found;
                                        }

                                        function syncConversationParticipants(conversation) {
                                            for (var i = 0; i < conversation.Participants.length; i++) {
                                                if (isParticipantAppUser(conversation.Participants[i]) === false) {
                                                    var promise = syncAppUserParticipant(conversation.Participants[i]);

                                                    promise.then(
                                                        function(success) {
                                                            $scope.appUsers.push(success.data.items[0]);
                                                            contactsService.addAppUser(success.data.items[0]);
                                                        },
                                                        function(error) {
                                                            console.error('Could not sync user: ' + conversation.Participants[i]);
                                                        });
                                                }
                                            }
                                        }

                                        function syncAppUserParticipant(participantId) {
                                            return contactsService.searchAppUser(participantId);
                                        }
                                    },
                                    function(conversationsPromiseError) {
                                        console.error('Could not sync conversations.')
                                    });
                            }
                        }
                    },
                    function(error) {
                        console.log(error);
                    });
            });

            /* Sets initial values.
         */
            function init() {
                $scope.userId = tokenService.getAppUserId();

                var appUsersPromise = contactsService.getAppUsers();

                appUsersPromise.then(
                    function(success) {
                        $scope.appUsers = success;
                    },
                    function(error) {
                        console.log(JSON.stringify(error));
                    });
                // This should be made to return 10-ish conversations descending upon first init
                var conversationsPromise = communicationService.getAllConversations(null);

                conversationsPromise.then(
                    function(conversationsPromiseSuccess) {

                        // for each conversation, create and add to $scope.conversation. Check if all Authors are available as appUsers. If not, make details call and add to $scope.appusers + save to db
                        for (var convo in conversationsPromiseSuccess.data.usersInConversations) {
                            var conversation = {
                                ConversationId: convo,
                                Messages: [],
                                Participants: conversationsPromiseSuccess.data.usersInConversations[convo]
                            };

                            syncConversationParticipants(conversation);
                            syncConversationMessages(conversation);

                            $scope.conversations.push(conversation);
                        }

                        function isParticipantAppUser(participantId) {
                            var found = false;

                            for (var i = 0; i < $scope.appUsers.length; i++) {
                                if ($scope.appUsers[i].userId === participantId) {
                                    found = true;
                                }
                            }

                            return found;
                        }

                        function syncConversationParticipants(conversation) {
                            for (var i = 0; i < conversation.Participants.length; i++) {
                                if (isParticipantAppUser(conversation.Participants[i]) === false) {
                                    var promise = syncAppUserParticipant(conversation.Participants[i]);

                                    promise.then(
                                        function(success) {
                                            $scope.appUsers.push(success.data.items[0]);
                                            contactsService.addAppUser(success.data.items[0]);
                                        },
                                        function(error) {
                                            console.error('Could not sync user: ' + conversation.Participants[i]);
                                        });
                                }
                            }
                        }

                        function syncConversationMessages(conversation) {
                            var res = communicationService.downloadMessagesForConversation(conversation.ConversationId, false, 0, 10);
                            res.then(function(result) {
                                var messages = result.data.items.sort(function(a, b) {
                                    if (a.CreatedOn > b.CreatedOn) {
                                        return 1
                                    }
                                    if (a.CreatedOn < b.CreatedOn) {
                                        return -1
                                    }
                                    return 0;
                                });
                                for (var i = 0; i < messages.length; i++) {
                                    conversation.Messages.push(messages[i]);
                                }
                            });
                        }

                        function syncAppUserParticipant(participantId) {
                            return contactsService.searchAppUser(participantId);
                        }
                    },
                    function(conversationsPromiseError) {
                        console.error('Could not sync conversations.')
                    });
            };

            init();
        }
    ])
    .controller('conversationCtrl', [
        '$scope', '$http', '$rootScope', 'tokenService', 'contactsService', 'communicationService', 'messageRepository', '$stateParams', '$uibModal', function($scope, $http, $rootScope, tokenService, contactsService, communicationService, messageRepository, $stateParams, $uibModal) {

            $scope.conversationId = $stateParams.conversationId;
            $scope.userId = null;
            $scope.conversation = [];
            $scope.appUsers = [];

            /* Reply to the current conversation
         */
            $scope.reply = function(message, conversationId) {

                $scope.currentReplyMessage = "";

                var req = {
                    method: 'POST',
                    url: tokenService.currentAppApiUrl + 'app/conversations/reply',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        Data: {
                            ConversationId: conversationId,
                            Message: message,
                            MetaData: []
                        },
                        AuthenticationToken: tokenService.getAppAuthToken()
                    }
                };

                var promise = tokenService.httpPost(req);

                promise.then(
                    function(success) {
                        var newMessage = {
                            MessageId: success.data.messageId,
                            Author: success.data.authorId,
                            ConversationId: success.data.conversationId,
                            Content: success.data.content,
                            CreatedOn: success.data.createdOn
                        };
                        $scope.conversation.Messages.push(newMessage);
                    },
                    function(error) {
                        console.log('Could not reply to conversation.');
                    });
            }

            /* Gets more messages for the current conversation
         */
            $scope.loadMoreForConversation = function() {

                var promise = messageRepository.getMessagesForConversation(
                    $scope.conversationId,
                    $scope.conversation.Messages.length,
                    3);

                promise.then(
                    function(success) {
                        for (var i = 0; i < success.length; i++) {
                            $scope.conversation.Messages.push(success[i]);
                        }
                    },
                    function(error) {
                        console.log('Could not get older messages for conversation.');
                    });
            }

            $scope.viewConversationInfo = function (size) {

                $uibModal.open({
                    animation: $scope.animationsEnabled,
                    templateUrl: 'template/conversation-info-modal.html',
                    controller: 'conversationInfoCtrl',
                    size: size,
                    resolve: { conversationParticipants: function() {
                        return $scope.appUsers;
                    }}
                });
            };

            /* Gets the url for a user. Used in an ng-repeat to display the avatar.
            */
            $scope.getAvatar = function(appUserId) {

                var found = null;

                for (var i = 0; i < $scope.appUsers.length; i++) {
                    var appUser = $scope.appUsers[i];

                    if (appUser.id === appUserId) {
                        found = $scope.appUsers[i].avatar;
                    }
                }

                if (found != null) {
                    return found;
                }
            };

            $scope.getUsername = function(appUserId) {
                var found = null;

                for (var i = 0; i < $scope.appUsers.length; i++) {
                    var appUser = $scope.appUsers[i];

                    if (appUser.id === appUserId) {
                        found = $scope.appUsers[i].username;
                    }
                }

                if (found != null) {
                    return found;
                }
            };

            // The events that this view reacts on
            $scope.$on('messages-added', function(event, args) {

                var promise = messageRepository.getMessagesByTime(0, 50);
                promise.then(
                    function(messages) {
                        for (var i = 0; i < messages.length; i++) {
                            for (var j = 0; j < $scope.conversations.length; j++) {
                                if (messages[i].ConversationId === $scope.conversations[j].ConversationId) {

                                    var found = false;

                                    for (var k = 0; k < $scope.conversations[j].Messages.length; k++) {
                                        if ($scope.conversations[j].Messages[k].MessageId === messages[i].MessageId) {
                                            found = true;
                                        }
                                    }

                                    if (!found) {
                                        $scope.conversations[j].Messages.push(messages[i]);
                                    }

                                } else {
                                    // new conversation
                                    console.log('Message from new conversation!')
                                }
                            }
                        }
                    },
                    function(error) {
                        console.log(error);
                    });
            });

            // This is required for ng-repeat order by date
            $scope.sortMessage = function(message) {
                var date = new Date(message.CreatedOn);
                return date;
            };

            // The purpose of fetching messages in this controller is to be able to display that a new conversation has been started
            var fetchMessagesInterval = setInterval(function() {
                var oneMinuteAgo = new Date();
                oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
                communicationService.syncPeriodMessages(oneMinuteAgo.toJSON(), new Date().toJSON(), 0, 50);
            }, 50000);

            /* Sets initial values and fetches a limited number of messages for the current conversation
         */
            function init() {
                $scope.userId = tokenService.getAppUserId();

                function setupConversation(id) {
                    var conversation = {
                        ConversationId: id,
                        Messages: [],
                        Participants: []
                    };

                    var conversationIds = [id];

                    var conversationMessagesPromise =
                        messageRepository.getMessagesByConversation(conversation.ConversationId, 0, 5);

                    conversationMessagesPromise.then(
                        function(conversationMessagesSuccess) {
                            conversation.Messages = conversationMessagesSuccess;

                            var participantsPromise = communicationService.getAllConversations(conversationIds);

                            participantsPromise.then(
                                function(success) {
                                    for (var i = 0; i < success.data.usersInConversations[id].length; i++) {
                                        conversation.Participants.push(success.data.usersInConversations[id][i]);
                                    }
                                    syncUsers(conversation);
                                },
                                function(error) {
                                    console.error('Could not get conversation participants from api. Getting info from messages instead.');
                                    for (var j = 0; j < conversation.Messages.length; j++) {
                                        if (conversation.Participants.indexOf(conversation.Messages[j].Author) === -1) {
                                            conversation.Participants.push(conversation.Messages[j].Author);
                                        }
                                    }
                                    syncUsers(conversation);
                                });

                            // TODO: this might be duplicate code from conversationS-controller
                            function syncUsers(conversation) {
                                $scope.conversation = conversation;

                                for (var k = 0; k < $scope.conversation.Participants.length; k++) {
                                    var authorId = $scope.conversation.Participants[k];

                                    var found = false;

                                    for (var l = 0; l < $scope.appUsers.length; l++) {
                                        var appUser = $scope.appUsers[l];

                                        if (appUser.userId === authorId) {
                                            found == true;
                                        }
                                    }

                                    if (found === false) {
                                        var promise = contactsService.searchAppUser(authorId);

                                        promise.then(
                                            function(success) {
                                                $scope.appUsers.push(success.data.items[0]);
                                            },
                                            function(error) {
                                                console.error('Could not get details for user ' + authorId);
                                            });
                                    }
                                }
                            }
                        },
                        function(error) {
                            console.log('Could not get messages for conversation.');
                        });
                }

                setupConversation($scope.conversationId);
            };

            init();

        }
    ])
    .controller('conversationInfoCtrl', [
        '$scope', '$http', 'tokenService', 'contactsService', 'conversationParticipants', '$uibModalInstance', function ($scope, $http, tokenService, contactsService, conversationParticipants, $uibModalInstance) {

            /* Gets the url for a user. Used in an ng-repeat to display the avatar.
     */
            $scope.getAvatar = function(appUserId) {

                var found = null;

                for (var i = 0; i < $scope.appUsers.length; i++) {
                    var appUser = $scope.appUsers[i];

                    if (appUser.id === appUserId) {
                        found = $scope.appUsers[i].avatar;
                    }
                }

                if (found != null) {
                    return found;
                }
            };

            $scope.getUsername = function(appUserId) {
                var found = null;

                for (var i = 0; i < $scope.appUsers.length; i++) {
                    var appUser = $scope.appUsers[i];

                    if (appUser.id === appUserId) {
                        found = $scope.appUsers[i].username;
                    }
                }

                if (found != null) {
                    return found;
                }
            };

            $scope.conversationParticipants = conversationParticipants;

            $scope.close = function () {
                $uibModalInstance.dismiss('cancel');
            };
        }
    ])