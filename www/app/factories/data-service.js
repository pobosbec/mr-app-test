/**
 * Created by Kristofer on 2016-03-13.
 */
angular.module('services', [])
    .factory('dataService', [
        'contactsService', 'messageRepository', 'communicationService', 'tokenService', '$q', function (contactsService, messageRepository, communicationService, tokenService, $q) {
            var factory = {};

            factory.conversations = [];
            factory.userId = tokenService.getAppUserId();
            factory.pageSize = 10;

            function handleConversation(databasePromise) {
                for (var cid in databasePromise) {
                    var conversation = databasePromise[cid];
                    contactsService.usersExists(conversation.Participants);
                    factory.conversations.push(conversation);
                }
            }

            factory.loadConversations = function () {
                var pageIndex = Math.floor(factory.conversations.length / factory.pageSize);

                var conversationsFromDatabasePromise = messageRepository.getConversationsByTime(10, pageIndex, 10);

                conversationsFromDatabasePromise.then(
                    function (conversationsPromiseSuccess) {
                        handleConversation(conversationsPromiseSuccess);
                    }, function (conversationsPromiseError) {
                        console.warn(conversationsPromiseError);
                    });
            };

            factory.initializeConversations = function () {
                var promise = messageRepository.getAllConversationsAndParticipants();

                promise.then(function (success) {
                    factory.conversations.push(success);
                }, function (error) {
                    console.error(error);
                });

            };

            factory.on = function (event, data) {
                switch (event.name) {
                    case 'logged-out':
                        // Clear cache?
                        break;
                    case 'logged-in':
                        factory.initializeConversations();
                        break;
                    default:
                        break;
                }
            };

            return factory;
        }
    ]);
