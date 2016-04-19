/**
 * Created by Kristofer on 2016-03-29.
 */
angular.module('conversations', [])
    .controller('conversationsCtrl', [
        '$scope', '$http', '$rootScope', 'tokenService', 'contactsService', 'communicationService', 'messageRepository', function ($scope, $http, $rootScope, tokenService, contactsService, communicationService, messageRepository) {

            $scope.loading = true;
            $scope.conversations = [];
            $scope.userId = null;
            $scope.appUsers = [];

            /* Make a request to the api to check if a conversation exists
         */
            $scope.doesConversationExist = function (users) {
                return communicationService.doesConversationExist(users);
            };

            /* Makes a request to the api to get messages between two dateTimes. Could be used in a syncing service
         * if the user has dropped the local database.
         */
            $scope.sync = function (from, to) {
                communicationService.syncPeriodMessages(from.toJSON(), to.toJSON(), 0, 50);
            };

            /* Gets the url for a user. Used in an ng-repeat to display the avatar.
         */
            $scope.getAvatar = function (appUserId) {

                var found = null;

                for (var i = 0; i < $scope.appUsers.length; i++) {
                    var appUser = $scope.appUsers[i];
                    if (typeof appUser !== "undefined" && appUser.hasOwnProperty("id")) {
                        if (appUser.id === appUserId) {
                            found = $scope.appUsers[i].avatar;
                        }
                    }
                }

                if (found != null) {
                    return found;
                }
            };

            $scope.getUsername = function (appUserId) {
                var found = null;

                for (var i = 0; i < $scope.appUsers.length; i++) {
                    var appUser = $scope.appUsers[i];
                    if (typeof appUser !== "undefined" && appUser.hasOwnProperty("id")) {
                        if (appUser.id === appUserId) {
                            found = $scope.appUsers[i].displayName;
                        }
                    }
                }

                if (found != null) {
                    return found;
                }
            };

            $scope.selfFirst = function (appUserId) {
                if (appUserId === $scope.userId) {
                    return 1;
                }
            }

            $scope.conversationsSorting = function (convo) {
                var date = new Date(convo.Messages[0].createdOn);
                return 0-date;
            }

            // The events that this view reacts on
            $scope.$on('messages-added', function (event, args) {

                var promise = messageRepository.getMessagesByTime(0, 50);
                promise.then(
                    function (messages) {
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
                                    function (newConversationsPromiseSuccess) {

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
                                                        function (success) {
                                                            if (success.data.items.length) {
                                                                $scope.appUsers.push(success.data.items[0]);
                                                                contactsService.addAppUser(success.data.items[0]);
                                                            }
                                                        },
                                                        function (error) {
                                                            console.error('Could not sync user: ' + conversation.Participants[i]);
                                                        });
                                                }
                                            }
                                        }

                                        function syncAppUserParticipant(participantId) {
                                            return contactsService.searchAppUser(participantId);
                                        }
                                    },
                                    function (conversationsPromiseError) {
                                        console.error('Could not sync conversations.');
                                    });
                            }
                        }
                    },
                    function (error) {
                        console.log(error);
                    });
            });

            function addConversations(conversations, conversationsLimit, conversationMessages) {
                if (typeof conversationsLimit != "number") {
                    conversationsLimit = 1000;
                }
                if (typeof conversationMessages != "number") {
                    conversationMessages = 10;
                }

                var processedConvos = 0;
                // for each conversation, create and add to $scope.conversation. Check if all Authors are available as appUsers. If not, make details call and add to $scope.appusers + save to db
                for (var convo in conversations.data.usersInConversations) {
                    // Check if conversation is already present in $scope.conversations.
                    if ($scope.conversations.filter(function (e) { return e.ConversationId == convo; }).length > 0) {
                        continue;
                    }

                    processedConvos++;
                    var conversation = {
                        ConversationId: convo,
                        Messages: [],
                        Participants: conversations.data.usersInConversations[convo]
                    };
                    syncConversationParticipants(conversation);
                    // Break after fetching the desired ammount of conversations.
                    if (processedConvos <= conversationsLimit) {
                        syncConversationMessages(conversation, conversationMessages);
                    } else {
                        break;
                    }
                    $scope.conversations.push(conversation);
                }


                function syncConversationMessages(conversation, amount) {
                    var messagesPromise = communicationService.downloadMessagesForConversation(conversation.ConversationId, false, 0, amount);
                    messagesPromise.then(function (result) {
                        var messages = result.data.items.sort(function (a, b) {
                            if (a.CreatedOn > b.CreatedOn) {
                                return 1;
                            }
                            if (a.CreatedOn < b.CreatedOn) {
                                return -1;
                            }
                            return 0;
                        });
                        for (var i = 0; i < messages.length; i++) {
                            conversation.Messages.push(messages[i]);
                        }
                    });
                }

                function syncConversationParticipants(conversation) {
                    for (var i = 0; i < conversation.Participants.length; i++) {
                        //if (!isParticipantAppUser(conversation.Participants[i])) {
                        if (!$scope.appUsers.some(function (e) { e.userId === conversation.Participants[i] })) {
                            $scope.appUsers.push({ userId: conversation.Participants[i] });
                            var promise = syncAppUserParticipant(conversation.Participants[i]);
                            promise.then(
                                function (success) {
                                    if (success.data.items[0]) {
                                        $scope.appUsers.push(success.data.items[0]);
                                        contactsService.addAppUser(success.data.items[0]);
                                    }
                                },
                                function (error) {
                                    console.error('Could not sync user: ' + conversation.Participants[i]);
                                });
                        } else {
                            console.warn(conversation.Participants[i] + " already in array");
                        }
                    }
                }

                function syncAppUserParticipant(participantId) {
                    return contactsService.searchAppUser(participantId);
                }
            }

            function fetchConversations() {
                $scope.loading = true;
                var conversationsFromApiPromise = communicationService.getAllConversations(null);
                conversationsFromApiPromise.then(
                    function (conversationsPromiseSuccess) {
                        addConversations(conversationsPromiseSuccess, 10, 1);
                        $scope.loading = false;
                        if (Object.keys(conversationsPromiseSuccess.data.usersInConversations).length >= $scope.conversations.length) {
                            var fetchConversationsTimeout = setTimeout(function () {
                                fetchConversations();
                            }, 10000);
                        }
                    });
            }

            /**
             * Sets first quickload data (10*10 messages) 
             */
            function quickLoad() {
                var quickLoadConversationsSize = 10;
                var quickLoadMessagesSize = 10;
                console.log("QUICK LOADING");
                var conversationsFromApiPromise = communicationService.getAllConversations(null);
                conversationsFromApiPromise.then(
                    function (conversationsPromiseSuccess) {
                        addConversations(conversationsPromiseSuccess, quickLoadConversationsSize, quickLoadMessagesSize);
                    });
            }

            /* Sets initial values.
             */
            function init() {
                $scope.loading = true;
                $scope.userId = tokenService.getAppUserId();
                var appUsersPromise = contactsService.getAppUsers();

                appUsersPromise.then(
                    function (success) {
                        $scope.appUsers = success;
                    },
                    function (error) {
                        console.log(JSON.stringify(error));
                    });

                // Deliver what ever data we have asap:
                var conversationsFromDatabasePromise = messageRepository.getConversationsByTime(10, 0, 10);
                //Let's load the initial 10
                conversationsFromDatabasePromise.then(
                    function (conversationsPromiseSuccess) {
                        
                        for (var cid in conversationsPromiseSuccess) {
                            var conversation = conversationsPromiseSuccess[cid];
                            $scope.conversations.push(conversation);
                        }
                    }, function (conversationsPromiseError) {
                        console.warn(conversationsPromiseError);
                    }).then(function () {
                        
                        if (!$scope.conversations.length) {
                            // No messages from Database, Let's do a quick fetch to have at least something initial to show.
                            quickLoad();
                        } else {
                            // Database seems to have data, let's try getting up to 200 conversations
                            // Improvements can definately be done here. The function is paged after all.
                            var moreConversationsFromDatabasePromise = messageRepository.getConversationsByTime(5, 0, 200);
                            moreConversationsFromDatabasePromise.then(
                                function (conversationsPromiseSuccess) {
                                    for (var cid in conversationsPromiseSuccess) {
                                        var conversation = conversationsPromiseSuccess[cid];
                                        if (!$scope.conversations.some(function (e) { return e.ConversationId === conversation.ConversationId })) {
                                            $scope.conversations.push(conversation);
                                        }
                                    }
                                });
                        }
                    }).then(function () {
                        
                        $scope.loading = false;
                        // Time to do some extra conversations loading from api broken down into intervals.
                        var fetchConversationsTimeout = setTimeout(function () {
                            fetchConversations();
                        }, 10000);
                    });
            };
            init();
        }])
    .controller('conversationCtrl', [
            '$scope', '$http', '$rootScope', 'tokenService', 'contactsService', 'communicationService', 'messageRepository', '$stateParams', '$uibModal', function ($scope, $http, $rootScope, tokenService, contactsService, communicationService, messageRepository, $stateParams, $uibModal) {
                $scope.conversationId = $stateParams.conversationId;
                $scope.userId = null;
                $scope.conversation = [];
                $scope.appUsers = [];
                $scope.pageIndex = 0;
                $scope.pageSize = 10;

                /* Reply to the current conversation
             */
                $scope.reply = function (message, conversationId) {

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
                        function (success) {
                            //var newMessage = {
                            //    MessageId: success.data.messageId,
                            //    Author: success.data.authorId,
                            //    ConversationId: success.data.conversationId,
                            //    Content: success.data.content,
                            //    CreatedOn: success.data.createdOn
                            //};
                            //$scope.conversation.Messages.push(newMessage);
                        },
                        function (error) {
                            console.log('Could not reply to conversation.');
                        });
                }

                function removeDuplicates(messages) {
                    messages.some(function (a) {
                        if (!$scope.conversation.Messages.some(
                            function (e) {
                                return e.MessageId === a.MessageId;
                        })) {
                            $scope.conversation.Messages.push(a);
                        }
                    });
                }

                /* Gets more messages for the current conversation
             */
                $scope.loadMoreForConversation = function () {

                    //TODO: this might cause the user to have to press the load more button several times before old messages actually starts loading..
                    // TODO: perhapts it is better not to use a paging mechanism for fetching messages as page 0 will contain the newest messages and it becomes hard
                    // to keep track of what pages that have been fetched. a better way would be to not think of the messages as pages, but as a stream where we would use 
                    // time or messageId as index to where we are in the stream. if both the messageRespository and the api could be have functions to support this it would
                    // be very easy to fetch new/old messages and keep track of what has been loaded 

                    $scope.pageIndex++;

                    var promise = messageRepository.getMessagesByConversation(
                        $scope.conversationId,
                        $scope.pageIndex,
                        $scope.pageSize);

                    promise.then(
                        function (success) {
                            if (success.length === 0) {
                                $scope.pageIndex--;
                            }
                            removeDuplicates(success);
                        },
                        function (error) {
                            $scope.pageIndex--;
                            console.log('Could not get older messages for conversation.');
                        });
                }

                $scope.viewConversationInfo = function (size) {

                    $uibModal.open({
                        animation: $scope.animationsEnabled,
                        templateUrl: 'template/conversation-info-modal.html',
                        controller: 'conversationInfoCtrl',
                        size: size,
                        resolve: {
                            conversationParticipants: function () {
                                return $scope.appUsers;
                            }
                        }
                    });
                };

                /* Gets the url for a user. Used in an ng-repeat to display the avatar.
                */
                $scope.getAvatar = function (appUserId) {

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

                $scope.getUsername = function (appUserId) {
                    var found = null;

                    for (var i = 0; i < $scope.appUsers.length; i++) {
                        var appUser = $scope.appUsers[i];

                        if (appUser.id === appUserId) {
                            found = $scope.appUsers[i].displayName;
                        }
                    }

                    if (found != null) {
                        return found;
                    }
                };

                // The events that this view reacts on
                $scope.$on('messages-added', function (event, args) {

                    var messagesPromise = messageRepository.getMessagesByConversation($scope.conversationId, 0, $scope.pageSize);

                    messagesPromise.then(
                        function (gotMessages) {
                                removeDuplicates(gotMessages);
                        },
                        function (errorGettingMessages) {
                            console.warn('Could not get messages.');
                        });


                });

                // This is required for ng-repeat order by date
                $scope.sortMessage = function (message) {
                    var date = new Date(message.CreatedOn);
                    return date;
                };

                var fetchMessagesInterval = setInterval(function () {
                    var oneMinuteAgo = new Date();
                    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
                    communicationService.syncPeriodMessages(oneMinuteAgo.toJSON(), new Date().toJSON(), 0, 50);
                }, 3000);

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
                            messageRepository.getMessagesByConversation(conversation.ConversationId, $scope.pageIndex, $scope.pageSize);

                        conversationMessagesPromise.then(
                            function (conversationMessagesSuccess) {
                                conversation.Messages = conversationMessagesSuccess;

                                var participantsPromise = communicationService.getAllConversations(conversationIds);

                                participantsPromise.then(
                                    function (success) {
                                        for (var i = 0; i < success.data.usersInConversations[id].length; i++) {
                                            conversation.Participants.push(success.data.usersInConversations[id][i]);
                                        }
                                        syncUsers(conversation);
                                    },
                                    function (error) {
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
                                                function (success) {
                                                    $scope.appUsers.push(success.data.items[0]);
                                                },
                                                function (error) {
                                                    console.error('Could not get details for user ' + authorId);
                                                });
                                        }
                                    }
                                }
                            },
                            function (error) {
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
                $scope.getAvatar = function (appUserId) {

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

                $scope.getUsername = function (appUserId) {
                    var found = null;

                    for (var i = 0; i < $scope.appUsers.length; i++) {
                        var appUser = $scope.appUsers[i];

                        if (appUser.id === appUserId) {
                            found = $scope.appUsers[i].displayName;
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
