/**
 * Created by Kristofer on 2016-03-29.
 */
angular.module('conversations', [])
    .controller('conversationsCtrl', [
        '$scope', '$http', '$rootScope', 'tokenService', 'contactsService', '$q', 'communicationService', 'messageRepository', 'moment', 'dataService', function ($scope, $http, $rootScope, tokenService, contactsService, $q, communicationService, messageRepository, angularMoment, dataService) {
            $scope.isPhoneGap = window.isPhoneGap;
            $scope.conversations = dataService.conversations;
            $scope.userId = tokenService.getAppUserId();
            $scope.appUsers = contactsService.appUsers;

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
                    sortOrder = new Date(convo.Messages[0].CreatedOn);
                }
                return 0 - sortOrder;
            }

            $scope.messagesSorting = function (message) {
                var sortOrder = 0;
                if (message.hasOwnProperty('CreatedOn')) {
                    sortOrder = new Date(message.CreatedOn);
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
                $scope.userId = tokenService.getAppUserId();
                $scope.conversation = {};
                $scope.appUsers = contactsService.appUsers;
                $scope.pageIndex = 0;
                $scope.pageSize = 10;
                $scope.isGroupConversation = false;
                $scope.isLoading = false;
                $scope.unConfirmedIds = 0;
                $scope.currentReplyMessage = null;
                $scope.advancedSettings = false;
                $scope.atBottom = true;
                $scope.unseenMessages = !$scope.atBottom;

                //if (!conversation.Messages.some(
                //    function (e) {
                //        return e.messageId === a.MessageId;
                //})) {
                //    // TODO: magnus code
                //    //if (!conversation.Messages.some(function (x) {
                //    //    return x.CreatedOn > a.CreatedOn;
                //    //})) {
                //    //    factory.unseenMessages = factory.unseenMessages || !factory.atBottom;
                //    //}

                //    conversation.Messages.push(a);

                //    // TODO: robins code 
                //    //if (factory.atBottom) {
                //    //    $('#conversationMessagesBody').scrollTop($('#conversationMessagesBody')[0].scrollHeight);
                //    //};
                //}

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

                $scope.loadMoreForConversation = function () {
                    $scope.pageIndex = Math.floor($scope.conversation.Messages.length / $scope.pageSize);
                    dataService.loadMessages($scope.conversation.ConversationId, $scope.pageIndex, $scope.pageSize);
                }

                $scope.viewConversationInfo = function (size) {

                    $uibModal.open({
                        animation: $scope.animationsEnabled,
                        templateUrl: 'template/conversation-info-modal.html',
                        controller: 'conversationInfoCtrl',
                        size: size,
                        resolve: {
                            conversationInfo: function () {

                                var participants = [];

                                $scope.conversation.Participants.some(function(participant) {
                                    $scope.appUsers.some(function(appUser) {
                                        if (participant === appUser.UserId) {
                                            participants.push(appUser);
                                            return true;
                                        }
                                    });
                                });

                                return { Participants: participants, ConversationId: $scope.conversationId };
                            }
                        }
                    });
                };

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

                // This is required for ng-repeat order by date
                $scope.sortMessage = function (message) {
                    var date = new Date(message.CreatedOn);
                    return date;
                };
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

                $scope.close = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            }
        ])
