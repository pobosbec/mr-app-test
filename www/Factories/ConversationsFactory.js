function ConversationsFactory($http, $timeout, $filter, apiFactory, usersFactory) {

    var conversations = [];
    var currentConversation = null;
    var reloadConversations = false;
    var lastUpdate = null;

    function whatIsNew(callback, error) {

        if (lastUpdate == null) {
            lastUpdate = $filter('date')(new Date() - (5 * 60000), 'yyyy-MM-ddTHH:mm:ssZ');
        }

        var whatIsNewRequest = {
            authenticationToken: apiFactory.getToken(),
            data: {
                'lastUpdate':lastUpdate,
                'deviceId': 'XXX-YYY'
            }
        };
        //console.log(whatIsNewRequest);
        apiFactory.functions.call('conversations/what-is-new', whatIsNewRequest, function(response) {
            lastUpdate = $filter('date')(new Date() - (1 * 60000), 'yyyy-MM-ddTHH:mm:ssZ');

            if (response.data.messages.length > 0) {
                //filterWhatsNewResponse(response.data.messages);
                callback(response.data.messages);
                //console.log(response.data.messages);
            } else {
                callback(null);
            }

        }, function (e) {
            error(e);
            console.log(e);
        });
    }
    
    function filterWhatsNewResponse(newMessages) {
        // new conversations?
        for (var i = 0; i < newMessages.length; i++) {
            var found = $filter('filter')(conversations, { itemId: newMessages[i].conversationId }, true);
            if (found != null) {
                //console.log(conversations);
                console.log("Conversation already exists: " + newMessages[i].conversationId);
                newMessages.splice(i, 1);
                console.log(found);
            }
        }
    }

    function replaceUserIdWithDisplayName(usersWithDisplayName, displayString) {
        //var participants = displayString.split(", ");

        for (var q = 0; q < usersWithDisplayName.length; q++) {
            displayString = displayString.replace(usersWithDisplayName[q].userId, usersWithDisplayName[q].displayName);
        }

        return displayString;

    }

    function findUserById(userId, users) {
        for (var i = 0; i < users.length; i++) {
            if (users[i].userId == userId) {
                return users[i];
            }
        }
        return null;
    }

    function getAvatarsForConversation(conversation, users) {
        var avatars = [];
        for (var q = 0; q < conversation.participants.length; q++) {
            var user = findUserById(conversation.participants[q],users);
            if (user != null) {
                //if (user.avatar != null) {
                //    //console.log(user.avatar);
                //} else {
                //    //user.avatar = "http://findicons.com/files/icons/175/halloween_avatar/128/mike.png";
                //    //console.log("Changed: "+ user.avatar);
                //}
                avatars.push(user);
            }
        }
        // add myself
        user = findUserById(conversation.userId, users);
        //console.log(users);
        if (user != null) {
            if (user.avatar != '') {
                avatars.push(user);
            }
        }
        return avatars;
    }

    function getAllUniqueUserIdsInConversations(conversations) {
        // remove userId from displayName and get Name for other id:s
        var usersInConversations = [];
        
        // get all userId:s
        for (var i = 0; i < conversations.length; i++) {
            var myUserId = conversations[i].userId;
            var participantsInConversation = [];
            var participants = conversations[i].displayName.split(", ");

            // remove my userId from displayName
            conversations[i].displayName = conversations[i].displayName.replace(", " + myUserId, '');
            conversations[i].displayName = conversations[i].displayName.replace(myUserId + ", ", '');

            for (var q = 0; q < participants.length; q++) {
                usersInConversations.push(participants[q]);
                if (participants[q] != myUserId) {
                    participantsInConversation.push(participants[q]);
                } 
            }

            conversations[i].participants = participantsInConversation;
        }

        return usersInConversations;
    }

    function setReloadConversations() {
        reloadConversations = true;
    }
    
    function setCurrentConversation(conversation) {
        currentConversation = conversation;
    }

    function getCurrentConversation() {
        return currentConversation;
    }
    
    function listConversations(token, inboxId, callback, error) {

        var listConversationsRequest = {
            authenticationToken: apiFactory.getToken(),
            data: {
                'inboxId': inboxId,
                'pageIndex': 1,
                'pageSize': 15
            }
        };
        apiFactory.functions.call('inboxes/list-content', listConversationsRequest, function(response) {
            if (response.data != null) {

                conversations = response.data.items;
                // all users in all conversations
                var usersInConversations = getAllUniqueUserIdsInConversations(conversations);
                usersFactory.addUsersById(usersInConversations, inboxId, function(users) {
                    for (var k = 0; k < conversations.length; k++) {
                        conversations[k].name = replaceUserIdWithDisplayName(users, conversations[k].displayName);
                        conversations[k].avatars = getAvatarsForConversation(conversations[k], users);
                    }
                    //console.log(conversations);
                    callback(conversations);

                }, function(e) {
                    error(e);
                });

            } else {
                error('No conversations');
            }
        });

    }

    function createNewConversation(inboxId, participants, message, callback, error) {
        var newConversationRequest = {
            authenticationToken: apiFactory.getToken(),
            data: {
                'instanceName': apiFactory.apiSettings.instanceName,
                'inboxId': inboxId,
                'participants': participants,
                'message': message
            }
        };
        //console.log(newConversationRequest);
        apiFactory.functions.call('conversations/create-message', newConversationRequest, function (response) {
            if (response.data != null) {
                callback(response.data);
            }
        }, function (e) {
            error(e);
        });

    }

    return {
        conversations: conversations,
        listConversations: listConversations,
        setCurrentConversation: setCurrentConversation,
        getCurrentConversation: getCurrentConversation,
        setReloadConversations: setReloadConversations,
        whatIsNew: whatIsNew,
        createNewConversation: createNewConversation
};

}