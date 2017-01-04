angular.module('SettingsFactory', [])
    .factory('SettingsFactory',
    [
        '$localStorage',
        function($localStorage) {
            var defaultNumberOfConversations = 15;
            var defaultNumberOfMessages = 20;

            function getSettings() {
                return $localStorage.settings;
            }

            function getNumberOfConversations() {
                if ($localStorage.settings.numberOfConversations === undefined) {
                    $localStorage.settings.numberOfConversations = defaultNumberOfConversations;
                }
                return $localStorage.settings.numberOfConversations;
            }

            function getNumberOfMessages() {
                if ($localStorage.settings.numberOfMessages === undefined) {
                    $localStorage.settings.numberOfMessages = defaultNumberOfMessages;
                }
                return $localStorage.settings.numberOfMessages;
            }

            function setNumberOfConversations(value) {
                if (value > 0 && value < 1000) {
                    $localStorage.settings.numberOfConversations = parseInt(value);
                } else {
                    $localStorage.settings.numberOfConversations = defaultNumberOfConversations;
                }
                console.log("Number of conversations: " + $localStorage.settings.numberOfConversations);
            }

            function setNumberOfMessages(value) {
                if (value > 0 && value < 1000) {
                    $localStorage.settings.numberOfMessages = parseInt(value);
                } else {
                    $localStorage.settings.numberOfMessages = defaultNumberOfMessages;
                }
                console.log("Number of messages: " + $localStorage.settings.numberOfMessages);
            }

            function initSettings() {
                if ($localStorage.settings === undefined) {
                    console.log("Init localStorage.settings");
                    $localStorage.settings = {
                        'numberOfConversations': defaultNumberOfConversations,
                        'numberOfMessages': defaultNumberOfMessages
                    };
                    console.log($localStorage.settings);
                }
            }

            function setShowIntro(state) {
                $localStorage.showIntro = state;
                console.log("ShowIntro: " + $localStorage.showIntro);
            }

            function init() {
                initSettings();
            }

            init();

            return {
                initSettings: initSettings,
                getSettings: getSettings,
                getNumberOfConversations: getNumberOfConversations,
                getNumberOfMessages: getNumberOfMessages,
                setNumberOfConversations: setNumberOfConversations,
                setNumberOfMessages: setNumberOfMessages,
                setShowIntro: setShowIntro
            };
        }
    ]);