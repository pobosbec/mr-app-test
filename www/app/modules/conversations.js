/**
 * Created by Kristofer on 2016-03-29.
 */
angular.module('conversations', [])
    .controller('conversationsCtrl', [
        '$scope', '$http', '$rootScope', 'tokenService', 'contactsService', '$q', 'communicationService', 'messageRepository', 'moment', function ($scope, $http, $rootScope, tokenService, contactsService, $q, communicationService, messageRepository, angularMoment) {
            $scope.isPhoneGap = window.isPhoneGap;
            $scope.isLoading = true;
            $scope.conversations = [];
            $scope.userId = null;
            $scope.appUsers = [];
            $scope.unSyncedAppUsers = [];
            $scope.unProccessedConversations = [];
            $scope.moreConversationsAreAvailable = true;

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


                console.log('Loading more conversations');

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
            $scope.$on('messages-added', function (event, args) {

                var promise = messageRepository.getMessagesByTime(0, 50);
                promise.then(
                    function (messages) {
                        for (var i = 0; i < messages.length; i++) {
                            var message = messages[i];
                            var newConversation = true;

                            for (var j = 0; j < $scope.conversations.length; j++) {
                                if (messages[i].ConversationId === $scope.conversations[j].ConversationId) {
                                    newConversation = false;
                                }
                            }

                            function addNewConversation(firstMessage) {
                                var newConversations = [firstMessage.ConversationId];

                                var newConversationPromise = communicationService.getAllConversations(newConversations);

                                newConversationPromise.then(
                                    function (newConversationsPromiseSuccess) {

                                        var conversation = {
                                            ConversationId: firstMessage.ConversationId,
                                            Messages: [firstMessage],
                                            Participants: newConversationsPromiseSuccess.data.usersInConversations[firstMessage.ConversationId]
                                        };

                                        // TODO: should have some service that transforms to required property
                                        conversation.Messages[0].createdOn = conversation.Messages[0].CreatedOn;
                                        conversation.Messages[0].content = conversation.Messages[0].Content;
                                        conversation.Messages[0].avatar = conversation.Messages[0].Avatar;
                                        conversation.Messages[0].authorDisplayName = conversation.Messages[0].AuthorDisplayName;

                                        syncConversationParticipants(conversation);

                                        $scope.conversations.push(conversation);

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

                            if (newConversation === true) {
                                addNewConversation(message);
                            }
                            else {
                                // new message?
                                var newMessage = true;
                                for (var k = 0; k < $scope.conversations.length; k++) {
                                    for (var l = 0; l < $scope.conversations[k].Messages.length; l++) {
                                        if ($scope.conversations[k].Messages[l].messageId === message.MessageId) {
                                            newMessage = false;
                                        }
                                    }
                                }
                                if (newMessage) {
                                    for (var m = 0; m < $scope.conversations.length; m++) {
                                        if ($scope.conversations[m].ConversationId === message.ConversationId) {

                                            $scope.conversations[m].Messages.push(messageRepository.reMapMessage(message));
                                            $scope.conversations[m].Messages.sort(function (a, b) {
                                                if (a.createdOn > b.createdOn) {
                                                    return -1;
                                                };
                                                if (a.createdOn < b.createdOn) {
                                                    return 1;
                                                };
                                                return 0;
                                            });
                                        }
                                    }
                                } else {
                                    // if the message is old we dont want to do anything with it
                                }
                            }
                        }
                    },
                    function (error) {
                        console.log(error);
                    });
            });

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

            function addConversations(conversations, conversationsLimit, conversationMessages) {
                if (typeof conversationsLimit != "number") {
                    conversationsLimit = 1000;
                }
                if (typeof conversationMessages != "number") {
                    conversationMessages = 10;
                }

                var processedConvos = 0;

                conversations.some(function (conversation) {
                    if (typeof conversation === "undefined" || conversation === null) {
                        return;
                    }
                    processedConvos++;

                    // Break after fetching the desired ammount of conversations.
                    if (processedConvos <= conversationsLimit) {
                        syncConversationMessages(conversation, conversationMessages);
                        $scope.conversations.push(conversation);
                        syncConversationParticipants(conversation);
                    } else {
                        $scope.unProccessedConversations.push(conversation);
                        $scope.moreConversationsAreAvailable = $scope.unProccessedConversations.length > 0;
                    }
                });

                if ($scope.unSyncedAppUsers != null) {
                    if ($scope.unSyncedAppUsers.length > 0) {
                        var promise = syncAppUserParticipant($scope.unSyncedAppUsers);

                        promise.then(
                            function (success) {
                                if (success.data.items != null) {
                                    success.data.items.some(function (appUser) {
                                        $scope.appUsers.push(appUser);
                                        contactsService.addAppUser(appUser);
                                    });
                                }
                                $scope.unSyncedAppUsers = [];

                            },
                            function (error) {
                                console.error('Could not sync user: ' + JSON.stringify(error));
                            });
                    }
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
                        if (!$scope.appUsers.some(function (e) { e.userId === conversation.Participants[i] })) {
                            $scope.unSyncedAppUsers.push(conversation.Participants[i]);
                        } else {
                            console.warn(conversation.Participants[i] + " already in array");
                        }
                    }
                }

                function syncAppUserParticipant(participantId) {
                    var query = '';

                    participantId.some(function (id) {
                        query += "," + id;
                    });

                    query = query.slice(0, -1);
                    query = query.slice(1, query.length);

                    return contactsService.searchAppUser(query);
                }
            }


            /**
             * Sets first quickload data (10*10 messages) 
             */
            function quickLoad() {
                var promise = $q(function (resolve, reject) {
                    var quickLoadConversationsSize = 10;
                    var quickLoadMessagesSize = 10;
                    console.log("QUICK LOADING");
                    var conversationsFromApiPromise = communicationService.getAllConversations(null);
                    conversationsFromApiPromise.then(
                        function (conversationsPromiseSuccess) {
                            var conversations = [];

                            for (var convo in conversationsPromiseSuccess.data.usersInConversations) {
                                // Check if conversation is already present in $scope.conversations.
                                if ($scope.conversations.filter(function (e) { return e.ConversationId == convo; }).length > 0) {
                                    continue;
                                }

                                var conversation = {
                                    ConversationId: convo,
                                    Messages: [],
                                    Participants: conversationsPromiseSuccess.data.usersInConversations[convo]
                                };

                                conversations.push(conversation);
                            }

                            addConversations(conversations, quickLoadConversationsSize, quickLoadMessagesSize);
                            resolve();
                        });

                });
                return promise;
            }

            /* Sets initial values.
             */
            function init() {
                $scope.isLoading = true;
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
                        var promise = $q(function (resolve, reject) {

                            if (!$scope.conversations.length) {
                                // No messages from Database, Let's do a quick fetch to have at least something initial to show.
                                var quickLoadPromise = quickLoad();
                                quickLoadPromise.then(function (result) {
                                    resolve();
                                });
                            } else {
                                resolve();
                            }
                            //else {
                            //    // Database seems to have data, let's try getting up to 200 conversations
                            //    // Improvements can definately be done here. The function is paged after all.
                            //    var moreConversationsFromDatabasePromise = messageRepository.getConversationsByTime(5, 0, 200);
                            //    moreConversationsFromDatabasePromise.then(
                            //        function (conversationsPromiseSuccess) {
                            //            for (var cid in conversationsPromiseSuccess) {
                            //                var conversation = conversationsPromiseSuccess[cid];
                            //                if (!$scope.conversations.some(function (e) { return e.ConversationId === conversation.ConversationId })) {
                            //                    $scope.conversations.push(conversation);
                            //                }
                            //            }
                            //            resolve();
                            //        });
                            //}
                        });

                        promise.then(function () {
                            $scope.isLoading = false;
                            console.log("Initial loading of conversations done.");
                        });
                    });
            };

            console.log("Running init()");
            init();
        }])
    .controller('conversationCtrl', [
            '$scope', '$http', '$rootScope', 'tokenService', 'contactsService', 'communicationService', 'messageRepository', '$stateParams', '$uibModal', 'moment', '$timeout', '$window', '$q', function ($scope, $http, $rootScope, tokenService, contactsService, communicationService, messageRepository, $stateParams, $uibModal, angularMoment, $timeout, $window, $q) {
                $scope.conversationId = $stateParams.conversationId;
                $scope.userId = null;
                $scope.conversation = {};
                $scope.appUsers = [];
                $scope.pageIndex = 0;
                $scope.pageSize = 10;
                $scope.isGroupConversation = false;
                $scope.isLoading = false;
                $scope.unConfirmedIds = 0;
                $scope.currentReplyMessage = null;
                $scope.advancedSettings = false;
                $scope.atBottom = true;
                $scope.unseenMessages = !$scope.atBottom;

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

                /**
                 * Removes messages from provided list from the loaded conversations messages 
                 * and adds the messages that aren't added to '$scope.conversation.Messages'
                 * and when the messages are added angular will add the messages to the view 
                 * @param {} messages 
                 * @returns {} 
                 */
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
                                $('#conversationMessagesBody').scrollTop($('#conversationMessagesBody')[0].scrollHeight);
                                // $("#conversationMessagesBody").animate({ scrollTop: $("#conversationMessagesBody")[0].scrollHeight }, "slow");
                            };
                        }
                    });

                    $scope.pageIndex = Math.floor($scope.conversation.Messages.length / $scope.pageSize);
                }

                /**
                 * Loads older messages when reaching the top
                 * Will also set scroll the the new messages are added above the screen
                 */
                $scope.$watch("scrollTop",
                    function (value, lastValue, sender) {
                        if (value > lastValue ||
                            $scope.isLoading) {
                            return;
                        }

                        if (!$scope.fetchingMore && value < 200) {
                            var viewBody = $("#conversationMessagesBody");
                            $scope.fetchingMore = true;
                            // var heightBeforeLoad = viewBody[0].scrollHeight;

                            var $container = $('#conversationMessagesBody');
                            var $topItem = $('.lv-item:first');
                            var oScrollTop = $container.scrollTop();
                            var oOffset = $topItem.length ? $topItem.position().top : 0;


                            $scope.loadMoreForConversation()
                                .then(function () {
                                    $scope.$$postDigest(function () {
                                      //  var scrollTo = viewBody[0].scrollHeight - heightBeforeLoad - value;
                                      ////  console.log('Setting scroll to: ' + scrollTo + '. Before load: ' + heightBeforeLoad + '. New height: ' + viewBody[0].scrollHeight);
                                      //  viewBody.scrollTop(scrollTo);

                                        if ($container.scrollTop() !== 0) {
                                            $container.scrollTop(oScrollTop + ($topItem.length ? $topItem.position().top : 0) - oOffset);
                                        }
                                    });
                                });
                        } else if ($scope.fetchingMore && value > 200) {
                            $scope.fetchingMore = false;
                        }
                    });

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

                /**
                 * Gets more messages for the current conversation
                 * Will return a promise if needed and will set the value $scope.isLoading while fetching messages
                 */
                $scope.loadMoreForConversation = function () {

                    //TODO: this might cause the user to have to press the load more button several times before old messages actually starts loading..
                    // TODO: perhapts it is better not to use a paging mechanism for fetching messages as page 0 will contain the newest messages and it becomes hard
                    // to keep track of what pages that have been fetched. a better way would be to not think of the messages as pages, but as a stream where we would use 
                    // time or messageId as index to where we are in the stream. if both the messageRespository and the api could be have functions to support this it would
                    // be very easy to fetch new/old messages and keep track of what has been loaded 
                    //$scope.pageIndex++;

                    return $q(function (response, reject) {
                        $scope.isLoading = true;
                        if ($scope.pageIndex === 0) {
                            $scope.pageIndex++;
                        }

                        var promise = messageRepository.getMessagesByConversation(
                            $scope.conversationId,
                            $scope.pageIndex,
                            $scope.pageSize);

                        promise.then(
                            function (success) {
                                removeDuplicates(success);
                                response();
                                $scope.isLoading = false;
                            },
                            function (error) {
                                //$scope.pageIndex--;
                                $scope.isLoading = false;
                                console.log('Could not get older messages for conversation.');
                                reject(error);
                            });
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

                /* Sets initial values and fetches a limited number of messages for the current conversation
             */
                function init() {

                    // TODO: this might be duplicate code from conversationS-controller
                    function syncUsers() {
                        if ($scope.conversation !== null &&
                        typeof $scope.conversation !== "undefined" &&
                            $scope.conversation.hasOwnProperty("Participants") &&
                            $scope.conversation.Participants.length &&
                            $scope.conversation.Participants !== null &&
                            typeof $scope.conversation.Participants !== "undefined")
                            $scope.conversation.Participants.some(function (e) {
                                var contactsPromise = contactsService.getAppUser(e);

                                contactsPromise.then(
                                    function (userFound) {
                                        if (userFound.length === 1 &&
                                            userFound[0] !== null &&
                                            typeof userFound[0] !== "undefined" &&
                                            userFound[0].hasOwnProperty("UserId") &&
                                            e === userFound[0].UserId) {
                                            $scope.appUsers.push(userFound[0]);
                                        }
                                    },
                                    function (userNotFound) {
                                        console.log('Could not find appUser. Syncing from api. Error: ' + JSON.stringify(userNotFound));
                                        var promise = contactsService.searchAppUser(e);

                                        promise.then(
                                            function (success) {
                                                if (success !== null &&
                                                    typeof success !== "undefined" && success.hasOwnProperty("data") && success.data.hasOwnProperty("items") &&
                                                    success.data.items !== null && typeof success.data.items !== "undefined" && success.data.items.length &&
                                                    success.data.items[0] !== null && typeof success.data.items[0] !== "undefined" && success.data.items[0].hasOwnProperty("userId") &&
                                                    success.data.items[0].userId !== null && typeof success.data.items[0].userId !== "undefined" && e === success.data.items[0].userId) {
                                                    $scope.appUsers.push(success.data.items[0]);
                                                }
                                            },
                                            function (error) {
                                                console.error('Could not get details for user ' + authorId + ". Error: " + JSON.stringify(error));
                                            });
                                    });
                            });
                    }

                    $scope.userId = tokenService.getAppUserId();

                    function setupConversation(id) {
                        $scope.conversation = {
                            ConversationId: id,
                            Messages: [],
                            Participants: []
                        };

                        var participantsPromise = messageRepository.getConversationParticipants($scope.conversation.ConversationId);

                        participantsPromise.then(
                            function (success) {
                                $scope.conversation.Participants = success;
                                if ($scope.conversation.Participants.length > 2) {
                                    $scope.isGroupConversation = true;
                                }
                                syncUsers();
                            },
                            function (error) {
                                console.error('Could not get conversation participants from database.');
                            });

                        var conversationMessagesPromise =
                            messageRepository.getMessagesByConversation($scope.conversation.ConversationId, $scope.pageIndex, $scope.pageSize);

                        conversationMessagesPromise.then(
                            function (conversationMessagesSuccess) {
                                $scope.conversation.Messages = conversationMessagesSuccess;
                                $timeout(function () {
                                    //test for not scrolling to bottom
                                    //var scroller = document.getElementById('conversationMessagesBody');
                                    //scroller.scrollTop = scroller.scrollHeight;
                                }, 0, false);
                            },
                            function (error) {
                                console.log('Could not get messages for conversation. Error: ' + JSON.stringify(error));
                            });
                    }

                    setupConversation($scope.conversationId);
                };

                init();

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
