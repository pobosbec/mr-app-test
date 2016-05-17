/**
 * Created by Kristofer on 2016-03-29.
 */
angular.module('conversations', [])
    .controller('conversationsCtrl', [
        '$scope', '$http', '$rootScope', 'tokenService', 'contactsService', '$q', 'communicationService', 'messageRepository', 'moment', 'dataService', function ($scope, $http, $rootScope, tokenService, contactsService, $q, communicationService, messageRepository, angularMoment, dataService) {
            $scope.isPhoneGap = window.isPhoneGap;
            $scope.conversations = dataService.conversations;
            $scope.userId = null;
            $scope.appUsers = contactsService.getAppUsers();

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
                return contactsService.getUsername(appUserId);
            };

            $scope.selfFirst = function (appUserId) {
                if (appUserId === $scope.userId) {
                    return 1;
                }
            }

            $scope.conversationsSorting = function (convo) {
                var sortOrder = 0;
                if (convo.Messages.length) {
                    sortOrder = new Date(convo.Messages[0].createdOn);
                }
                return 0 - sortOrder;
            }

            $scope.messagesSorting = function (message) {
                var sortOrder = 0;
                if (message.hasOwnProperty('createdOn')) {
                    sortOrder = new Date(message.createdOn);
                }
                return 0 - sortOrder;
            }

            $scope.loadUnprocessedConversations = function () {
                var conversationToProcess = [];

                if ($scope.unProccessedConversations.length < 10) {
                    for (var i = 0; i < $scope.unProccessedConversations.length; i++) {
                        conversationToProcess.push($scope.unProccessedConversations.shift());
                    }
                } else {
                    for (var j = 0; j < 10; j++) {
                        conversationToProcess.push($scope.unProccessedConversations.shift());
                    }
                }
                $scope.moreConversationsAreAvailable = $scope.unProccessedConversations.length > 0;
                addConversations(conversationToProcess);
            }

            // The events that this view reacts on
            //$scope.$on('messages-added', function (event, args) {

            //    var promise = messageRepository.getMessagesByTime(0, 50);
            //    promise.then(
            //        function (messages) {
            //            for (var i = 0; i < messages.length; i++) {
            //                var message = messages[i];
            //                var newConversation = true;

            //                for (var j = 0; j < $scope.conversations.length; j++) {
            //                    if (messages[i].ConversationId === $scope.conversations[j].ConversationId) {
            //                        newConversation = false;
            //                    }
            //                }

            //                function addNewConversation(firstMessage) {
            //                    var newConversations = [firstMessage.ConversationId];

            //                    var newConversationPromise = communicationService.getAllConversations(newConversations);

            //                    newConversationPromise.then(
            //                        function (newConversationsPromiseSuccess) {

            //                            var conversation = {
            //                                ConversationId: firstMessage.ConversationId,
            //                                Messages: [firstMessage],
            //                                Participants: newConversationsPromiseSuccess.data.usersInConversations[firstMessage.ConversationId]
            //                            };

            //                            // TODO: should have some service that transforms to required property
            //                            conversation.Messages[0].createdOn = conversation.Messages[0].CreatedOn;
            //                            conversation.Messages[0].content = conversation.Messages[0].Content;
            //                            conversation.Messages[0].avatar = conversation.Messages[0].Avatar;
            //                            conversation.Messages[0].authorDisplayName = conversation.Messages[0].AuthorDisplayName;

            //                            syncConversationParticipants(conversation);

            //                            $scope.conversations.push(conversation);

            //                            function isParticipantAppUser(participantId) {
            //                                var found = false;

            //                                for (var i = 0; i < $scope.appUsers.length; i++) {
            //                                    if ($scope.appUsers[i].userId === participantId) {
            //                                        found = true;
            //                                    }
            //                                }

            //                                return found;
            //                            }

            //                            function syncConversationParticipants(conversation) {
            //                                for (var i = 0; i < conversation.Participants.length; i++) {
            //                                    if (isParticipantAppUser(conversation.Participants[i]) === false) {
            //                                        var promise = syncAppUserParticipant(conversation.Participants[i]);

            //                                        promise.then(
            //                                            function (success) {
            //                                                if (success.data.items.length) {
            //                                                    $scope.appUsers.push(success.data.items[0]);
            //                                                    contactsService.addAppUser(success.data.items[0]);
            //                                                }
            //                                            },
            //                                            function (error) {
            //                                                console.error('Could not sync user: ' + conversation.Participants[i]);
            //                                            });
            //                                    }
            //                                }
            //                            }

            //                            function syncAppUserParticipant(participantId) {
            //                                return contactsService.searchAppUser(participantId);
            //                            }
            //                        },
            //                        function (conversationsPromiseError) {
            //                            console.error('Could not sync conversations.');
            //                        });
            //                }

            //                if (newConversation === true) {
            //                    addNewConversation(message);
            //                }
            //                else {
            //                    // new message?
            //                    var newMessage = true;
            //                    for (var k = 0; k < $scope.conversations.length; k++) {
            //                        for (var l = 0; l < $scope.conversations[k].Messages.length; l++) {
            //                            if ($scope.conversations[k].Messages[l].messageId === message.MessageId) {
            //                                newMessage = false;
            //                            }
            //                        }
            //                    }
            //                    if (newMessage) {
            //                        for (var m = 0; m < $scope.conversations.length; m++) {
            //                            if ($scope.conversations[m].ConversationId === message.ConversationId) {

            //                                $scope.conversations[m].Messages.push(messageRepository.reMapMessage(message));
            //                                $scope.conversations[m].Messages.sort(function (a, b) {
            //                                    if (a.createdOn > b.createdOn) {
            //                                        return -1;
            //                                    };
            //                                    if (a.createdOn < b.createdOn) {
            //                                        return 1;
            //                                    };
            //                                    return 0;
            //                                });
            //                            }
            //                        }
            //                    } else {
            //                        // if the message is old we dont want to do anything with it
            //                    }
            //                }
            //            }
            //        },
            //        function (error) {
            //            console.log(error);
            //        });
            //});

            $scope.formatMode = function (dateString) {
                var then = angularMoment(dateString + "+00:00");
                var now = angularMoment();
                if (now.subtract(1, 'day') < then) {
                    return 1;
                } else if (now.subtract(1, 'year') < then) {
                    return 2;
                } else {
                    return 3;
                }
            }

            $scope.format = function (dateString) {
                var parsed = angularMoment(dateString + "+00:00");
                var returnV = parsed.format('YYYY-MM-DD HH:mm:ss Z');
                return returnV;
            }
        }])
    .controller('conversationCtrl', [
            '$scope', '$http', '$rootScope', 'tokenService', 'contactsService', 'communicationService', 'messageRepository', '$stateParams', '$uibModal', 'moment', '$timeout', '$window', 'dataService', function ($scope, $http, $rootScope, tokenService, contactsService, communicationService, messageRepository, $stateParams, $uibModal, angularMoment, $timeout, $window, dataService) {
                $scope.conversationId = $stateParams.conversationId;
                $scope.userId = null;
                $scope.conversation = {};
                $scope.appUsers = contactsService.getAppUsers();
                $scope.pageIndex = 0;
                $scope.pageSize = 10;
                $scope.isGroupConversation = false;
                $scope.isLoading = false;
                $scope.unConfirmedIds = 0;
                $scope.currentReplyMessage = null;
                $scope.advancedSettings = false;
                $scope.atBottom = true;
                $scope.unseenMessages = !$scope.atBottom;

                $scope.setConversation = function () {
                    // TODO: Handle if conversation is not in dataService? 

                    dataService.conversations.some(function (conversation) {
                        if (conversation.ConversationId === $scope.conversationId) {
                            $scope.conversation = conversation;
                        }
                    });
                }

                $scope.setConversation();

                $scope.openDefaultBrowserWindow = function (url) {
                    $window.open(url);
                }

                $scope.containsFormLink = function (message) {

                    if (message.MetaData === null || message.MetaData === undefined || !(message.MetaData.constructor === Array)) {
                        return false;
                    }

                    if (message.Form != null || message.Form != undefined) {
                        return true;
                    }

                    var found = false;

                    message.MetaData.some(function (element) {
                        if (element.contentType === 'application/vnd.bosbec.form') {
                            message.Form = element;
                            message.Form.Value = JSON.parse(element.value);
                            message.Form.Url = "http://m.mobileresponse.se/?formId=" + message.Form.Value.id;
                            found = true;
                            return true;
                        }
                    });

                    return found;
                };

                /* Reply to the current conversation
                */
                $scope.reply = function () {

                    if ($scope.currentReplyMessage === null || $scope.currentReplyMessage === '' || $scope.currentReplyMessage === undefined) {
                        return;
                    }

                    function guid() {
                        function s4() {
                            return Math.floor((1 + Math.random()) * 0x10000)
                              .toString(16)
                              .substring(1);
                        }
                        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                          s4() + '-' + s4() + s4() + s4();
                    }

                    var msg = {
                        MessageId: guid(),
                        ConversationId: $scope.conversationId,
                        CreatedOn: new Date().toJSON(),
                        Content: $scope.currentReplyMessage,
                        Author: $scope.userId,
                        Failed: false,
                        tmpMessage: true,
                        Retrying: false
                    };

                    $scope.conversation.Messages.push(msg);

                    // ugly solution, should be a directive
                    $timeout(function () {
                        var scroller = document.getElementById('conversationMessagesBody');
                        scroller.scrollTop = scroller.scrollHeight;
                    }, 0, false);

                    var req = {
                        method: 'POST',
                        url: tokenService.currentAppApiUrl + 'app/conversations/reply',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        data: {
                            Data: {
                                ConversationId: $scope.conversationId,
                                Message: $scope.currentReplyMessage,
                                MetaData: []
                            },
                            AuthenticationToken: tokenService.getAppAuthToken()
                        }
                    };

                    $scope.currentReplyMessage = null;

                    var promise = tokenService.httpPost(req);

                    promise.then(
                        function (success) {

                            if (success.errors.length > 0) {
                                for (var j = 0; j < success.errors.length; j++) {
                                    console.error(success.errors[j].errorMessage);
                                }
                                msg.Failed = true;
                                return;
                            }

                            var foundIndex = -1;

                            for (var i = 0; i < $scope.conversation.Messages.length; i++) {
                                var msgInArray = $scope.conversation.Messages[i];
                                if (msgInArray.MessageId === msg.MessageId) {
                                    foundIndex = i;
                                    continue;
                                }
                            }

                            $scope.conversation.Messages[foundIndex].MessageId = success.data.messageId;
                            $scope.conversation.Messages[foundIndex].CreatedOn = success.data.createdOn;
                            $scope.conversation.Messages[foundIndex].ParticipantId = success.data.participantId;
                            $scope.conversation.Messages[foundIndex].ConversationId = success.data.conversationId;
                            $scope.conversation.Messages[foundIndex].AuthorDisplayName = success.data.authorDisplayName;
                            $scope.conversation.Messages[foundIndex].Author = success.data.authorId;
                            $scope.conversation.Messages[foundIndex].Author = success.data.authorId;
                            $scope.conversation.Messages[foundIndex].tmpMessage = false;

                            var fiveMinutesAgo = new Date();
                            fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
                            var args = {
                                PeriodStart: fiveMinutesAgo,
                                PeriodEnd: new Date().toJSON(),
                                PageIndex: 0,
                                PageSize: 50
                            };
                            $rootScope.$broadcast('download-messages', args);
                        },
                        function (error) {
                            msg.Failed = true;
                            console.log('Could not reply to conversation.');
                        });
                }

                $scope.resendMessage = function (message) {

                    message.Retrying = true;

                    var req = {
                        method: 'POST',
                        url: tokenService.currentAppApiUrl + 'app/conversations/reply',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        data: {
                            Data: {
                                ConversationId: $scope.conversationId,
                                Message: message.Content,
                                MetaData: []
                            },
                            AuthenticationToken: tokenService.getAppAuthToken()
                        }
                    };

                    var promise = tokenService.httpPost(req);

                    promise.then(
                        function (success) {

                            message.Retrying = false;

                            if (success.errors.length > 0) {
                                for (var j = 0; j < success.errors.length; j++) {
                                    console.error(success.errors[j].errorMessage);
                                }
                                message.Failed = true;
                                return;
                            }

                            var foundIndex = -1;

                            for (var i = 0; i < $scope.conversation.Messages.length; i++) {
                                var msgInArray = $scope.conversation.Messages[i];
                                if (msgInArray.MessageId === message.MessageId) {
                                    foundIndex = i;
                                    continue;
                                }
                            }

                            $scope.conversation.Messages[foundIndex].MessageId = success.data.messageId;
                            $scope.conversation.Messages[foundIndex].CreatedOn = success.data.createdOn;
                            $scope.conversation.Messages[foundIndex].ParticipantId = success.data.participantId;
                            $scope.conversation.Messages[foundIndex].ConversationId = success.data.conversationId;
                            $scope.conversation.Messages[foundIndex].AuthorDisplayName = success.data.authorDisplayName;
                            $scope.conversation.Messages[foundIndex].Author = success.data.authorId;
                            $scope.conversation.Messages[foundIndex].tmpMessage = false;
                            $scope.conversation.Messages[foundIndex].Failed = false;

                            var fiveMinutesAgo = new Date();
                            fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
                            var args = {
                                PeriodStart: fiveMinutesAgo,
                                PeriodEnd: new Date().toJSON(),
                                PageIndex: 0,
                                PageSize: 50
                            };

                            $timeout(function () {
                                var scroller = document.getElementById('conversationMessagesBody');
                                scroller.scrollTop = scroller.scrollHeight;
                            }, 0, false);

                            $rootScope.$broadcast('download-messages', args);
                        },
                        function (error) {
                            message.Retrying = false;
                            msg.Failed = true;
                            console.log('Could not reply to conversation.');
                        });
                }

                function removeDuplicates(messages) {
                    messages.some(function (a) {
                        if (!$scope.conversation.Messages.some(
                            function (e) {
                                return e.MessageId === a.MessageId;
                        })) {
                            if (!$scope.conversation.Messages.some(function (x) {
                                return x.CreatedOn > a.CreatedOn;
                            })) {
                                $scope.unseenMessages = $scope.unseenMessages || !$scope.atBottom;
                            }

                            $scope.conversation.Messages.push(a);

                            if ($scope.atBottom) {
                                //$('#conversationMessagesBody').scrollTop($('#conversationMessagesBody')[0].scrollHeight);
                                $("#conversationMessagesBody").animate({ scrollTop: $("#conversationMessagesBody")[0].scrollHeight }, "slow");
                            };
                        }
                    });
                    $scope.pageIndex = Math.floor($scope.conversation.Messages.length / $scope.pageSize);
                }

                $scope.formatMode = function (dateString) {
                    var then = angularMoment(dateString + "+00:00");
                    var now = angularMoment();
                    if (now.subtract(1, 'day') < then) {
                        return 1;
                    } else if (now.subtract(1, 'year') < then) {
                        return 2;
                    } else {
                        return 3;
                    }
                }

                $scope.filterOutOwnUser = function (id) {
                    if (id === $scope.userId) {
                        return false;
                    } else {
                        return true;
                    }
                }

                $scope.format = function (dateString) {
                    var parsed = angularMoment(dateString + "+00:00");
                    var returnV = parsed.format('YYYY-MM-DD HH:mm:ss Z');
                    return returnV;
                }

                /* Gets more messages for the current conversation
             */
                $scope.loadMoreForConversation = function () {

                    //TODO: this might cause the user to have to press the load more button several times before old messages actually starts loading..
                    // TODO: perhapts it is better not to use a paging mechanism for fetching messages as page 0 will contain the newest messages and it becomes hard
                    // to keep track of what pages that have been fetched. a better way would be to not think of the messages as pages, but as a stream where we would use 
                    // time or messageId as index to where we are in the stream. if both the messageRespository and the api could be have functions to support this it would
                    // be very easy to fetch new/old messages and keep track of what has been loaded 
                    //$scope.pageIndex++;

                    $scope.isLoading = true;

                    var promise = messageRepository.getMessagesByConversation(
                        $scope.conversationId,
                        $scope.pageIndex,
                        $scope.pageSize);

                    promise.then(
                        function (success) {
                            removeDuplicates(success);
                            $scope.isLoading = false;
                        },
                        function (error) {
                            //$scope.pageIndex--;
                            $scope.isLoading = false;
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
                            conversationInfo: function () {
                                return { Participants: $scope.appUsers, ConversationId: $scope.conversationId };
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

                    if (appUserId === $scope.userId) {
                        return 'you';
                    }

                    var displayName = '';

                    $scope.appUsers.some(function (appUser) {
                        if (appUser.id === appUserId) {
                            displayName = appUser.displayName;
                        }
                    });

                    return displayName;
                };

                $scope.checkIfGroupConversation = function () {
                    return $scope.isGroupConversation;
                }

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

                //   /* Sets initial values and fetches a limited number of messages for the current conversation
                //*/
                //   function init() {

                //       // TODO: this might be duplicate code from conversationS-controller
                //       function syncUsers() {
                //           if ($scope.conversation !== null &&
                //           typeof $scope.conversation !== "undefined" &&
                //               $scope.conversation.hasOwnProperty("Participants") &&
                //               $scope.conversation.Participants.length &&
                //               $scope.conversation.Participants !== null &&
                //               typeof $scope.conversation.Participants !== "undefined")
                //               $scope.conversation.Participants.some(function (e) {
                //                   var contactsPromise = contactsService.getAppUser(e);

                //                   contactsPromise.then(
                //                       function (userFound) {
                //                           if (userFound.length === 1 &&
                //                               userFound[0] !== null &&
                //                               typeof userFound[0] !== "undefined" &&
                //                               userFound[0].hasOwnProperty("UserId") &&
                //                               e === userFound[0].UserId) {
                //                               $scope.appUsers.push(userFound[0]);
                //                           }
                //                       },
                //                       function (userNotFound) {
                //                           console.log('Could not find appUser. Syncing from api. Error: ' + JSON.stringify(userNotFound));
                //                           var promise = contactsService.searchAppUser(e);

                //                           promise.then(
                //                               function (success) {
                //                                   if (success !== null &&
                //                                       typeof success !== "undefined" && success.hasOwnProperty("data") && success.data.hasOwnProperty("items") &&
                //                                       success.data.items !== null && typeof success.data.items !== "undefined" && success.data.items.length &&
                //                                       success.data.items[0] !== null && typeof success.data.items[0] !== "undefined" && success.data.items[0].hasOwnProperty("userId") &&
                //                                       success.data.items[0].userId !== null && typeof success.data.items[0].userId !== "undefined" && e === success.data.items[0].userId) {
                //                                       $scope.appUsers.push(success.data.items[0]);
                //                                   }
                //                               },
                //                               function (error) {
                //                                   console.error('Could not get details for user ' + authorId + ". Error: " + JSON.stringify(error));
                //                               });
                //                       });
                //               });
                //       }

                //       $scope.userId = tokenService.getAppUserId();

                //       function setupConversation(id) {
                //           $scope.conversation = {
                //               ConversationId: id,
                //               Messages: [],
                //               Participants: []
                //           };

                //           var participantsPromise = messageRepository.getConversationParticipants($scope.conversation.ConversationId);

                //           participantsPromise.then(
                //               function (success) {
                //                   $scope.conversation.Participants = success;
                //                   if ($scope.conversation.Participants.length > 2) {
                //                       $scope.isGroupConversation = true;
                //                   }
                //                   syncUsers();
                //               },
                //               function (error) {
                //                   console.error('Could not get conversation participants from database.');
                //               });

                //           var conversationMessagesPromise =
                //               messageRepository.getMessagesByConversation($scope.conversation.ConversationId, $scope.pageIndex, $scope.pageSize);

                //           conversationMessagesPromise.then(
                //               function (conversationMessagesSuccess) {
                //                   $scope.conversation.Messages = conversationMessagesSuccess;
                //                   $timeout(function () {
                //                       var scroller = document.getElementById('conversationMessagesBody');
                //                       scroller.scrollTop = scroller.scrollHeight;
                //                   }, 0, false);
                //               },
                //               function (error) {
                //                   console.log('Could not get messages for conversation. Error: ' + JSON.stringify(error));
                //               });
                //       }

                //       setupConversation($scope.conversationId);
                //   };

                //   init();

            }
    ])
        .controller('conversationInfoCtrl', [
            '$scope', '$http', 'tokenService', 'contactsService', 'conversationInfo', '$uibModalInstance', 'communicationService', function ($scope, $http, tokenService, contactsService, conversationInfo, $uibModalInstance, communicationService) {

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

                $scope.conversationParticipants = conversationInfo.Participants;

                $scope.syncMessages = function () {
                    communicationService.syncPeriodMessagesForConversation(conversationInfo.ConversationId, true, $scope.sync.From, $scope.sync.To, 0, 50);
                }

                $scope.close = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            }
        ])
