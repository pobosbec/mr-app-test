/**
 * Created by Magnus Svensson on 09/03/16.
 */

angular.module('message', ['ngCordova'])
      .factory('messageRepository', ['$http', '$window', '$rootScope', '$location', '$q', '$state', 'tokenService', '$cordovaSQLite', function ($http, win, $rootScope, $location, $q, $state, tokenService, $cordovaSQLite) {
          var factory = {};
          factory.dabataseConfiguration = {
              db: "bosbec1.db"
          }

          factory.dabataseConnection = function () {
              return "";
          }

          factory.messages = [];

          factory.getMessages = function () {
              var result = [
                  {
                      AuthorAvatar: "img/profile-pics/6.jpg",
                      AuthorDisplayName: "Testa Testsson",
                      CreatedOn: "2016-03-09 15:36:05",
                      Content: "Testmeddelande 1",
                      Comments: null
                  },
                  {
                      AuthorAvatar: "img/profile-pics/2.jpg",
                      AuthorDisplayName: "Börje Tumme",
                      CreatedOn: "2016-02-25 15:36:05",
                      Content: "Testmeddelande 2",
                      Comments: [
                          {
                              AuthorAvatar: "img/profile-pics/6.jpg",
                              AuthorDisplayName: "Testa Testsson",
                              Content: "Gu va trevligt"
                          }
                      ]
                  },
                  {
                      AuthorAvatar: "img/profile-pics/5.jpg",
                      AuthorDisplayName: "Pannbandine Grön",
                      CreatedOn: "2016-01-12 15:36:05",
                      Content: "Testmeddelande 3 :)",
                      Comments: null
                  }
              ];
              return result;
          }

          factory.messageAdded = function (data) {
              $rootScope.$broadcast('message-added', data);
          }
          factory.messageUpdated = function (data) {
              $rootScope.$broadcast('message-updated', data);
          }
          factory.messagesChanged = function (data) {
              $rootScope.$broadcast('messages-changed', data);
          }

          factory.on = function (event, args) {
              switch (event.name) {
                  case 'updated-message':
                      console.log("updated-message");
                      console.log(args);
                      break;
                  case 'new-message':
                      console.log("new-message");
                      console.log(args);
                      break;
              default:
                      break;
              }
          }

          return factory;
      }])
