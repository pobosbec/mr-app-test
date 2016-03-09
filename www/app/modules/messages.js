/**
 * Created by robinpipirs on 09/12/15.
 */
angular.module('messages', [])
    .controller('messagesController', ['$scope', '$http', 'tokenService', function ($scope, $http, tokenService) {



        var EXTRAS_LISTMESSAGES = "LIST_MESSAGES";
        $scope.EXTRAS_TRAFFICTYPES ="TRAFICTYPES";
        $scope.EXTRAS_MESSAGESTATUS = "MESSAGESTATUS";

        $scope.date ='2016-02-12';

        $scope.startDate ="";
        $scope.endDate = "";
        $scope.dateOptions = {format: 'yyyy-mm-dd'};

        $scope.traffic = [
            {name: "Sms",
            activated: true},
            {name: "Email",
            activated:true},
            {name: "App",
            activated: true},
            {name: "Iot",
            activated:true}
        ];
        $scope.messageStatus = [
            {name: "Delivered",
                activated: true},
            {name: "Pending",
                activated:true},
            {name: "Failed",
                activated: true}
        ];

        $scope.receipient = "";
        $scope.sender = "";
        $scope.contents ="";

        $scope.messages = [];

        //the instance of the Timeout event that run keepTokenAlive
        var timer;
        //The intervall which refreshList and initiation should be runned
        var intervall = 3000;


        /**
         *
         *
         * { "id": "9df90e77-ec98-3d4a-d2e3-c066c9d8ffbe",
         * "workflowId": "00000000-0000-0000-0000-000000000000",
         * "name": "Rabben",
         * "isSequential": false,
         * "isUpdateable": false,
         * "startPath": "00000000-0000-0000-0000-000000000000",
         * "paths": [],
         * "allowMultipleAnswers": false,
         * "metaData": null }
         *
         * @type {Array}
         */


        $scope.toggle = function(index,type){

            if( type == $scope.EXTRAS_TRAFFICTYPES){

             $scope.traffic[index].activated = !$scope.traffic[index].activated;

            }
            else if(type == $scope.EXTRAS_MESSAGESTATUS){
                $scope.messageStatus[index].activated = !$scope.messageStatus[index].activated;
            }

        };

        $scope.msgSettings = function(){

            $('#messages-modal').modal();
        };


        function getSettings() {
            var settings = {
                Types: [],
                PeriodStart: '',
                PeriodEnd: '',
                Countries: [],
                Statuses: [],
                Recipient: '',
                Sender: '',
                Contents: '',
                PageIndex: 0,
                PageSize: 1000
            };

            var trafficTypes = {
                Sms: "sms",
                Email: "email",
                App: "app",
                Iot: "iot"
            };

            var deliveryStatuses = {
                delivered: 0,
                pending: 1,
                failed: 2
            };

            if ($scope.traffic[0].activated) {
                settings.Types.push(trafficTypes.Sms);
            }

            if ($scope.traffic[1].activated) {
                settings.Types.push(trafficTypes.Email);
            }

            if ($scope.traffic[2].activated) {
                settings.Types.push(trafficTypes.App);
            }
            if ($scope.traffic[3].activated) {
                settings.Types.push(trafficTypes.Iot);
            }


            settings.PeriodStart = utcDate(new Date($scope.startDate));
            settings.PeriodEnd = utcDate(new Date($scope.endDate + ' 23:59:59'));


            /**
            var selectedCountries = $(countrySelector).find(':selected');
            for (var i = 0; i < selectedCountries.length; i++) {
                settings.countries.push($(selectedCountries[i]).val());
            }*/

            if ($scope.messageStatus[0].activated) {
                settings.Statuses.push(deliveryStatuses.delivered);
            }

            if ($scope.messageStatus[1].activated) {
                settings.Statuses.push(deliveryStatuses.pending);
            }

            if ($scope.messageStatus[2].activated) {
                settings.Statuses.push(deliveryStatuses.failed);
            }

            settings.Recipient = $scope.receipient;
            settings.Sender = $scope.sender;
            settings.Contents = $scope.contents;

            return settings;
        }


        function utcDate(now){
            return new Date(Date.UTC(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                now.getHours(),
                now.getMinutes()
            ));
        }




        $scope.$watch('$viewContentLoaded', function () {


            var settings = getSettings();
            $scope.httpRequest(tokenService.currentApiUrl,"message-history/search",settings,EXTRAS_LISTMESSAGES);


        });


        $(document).ready(function () {

        });


        $scope.statusTime = function(updateTime,time) {
            var start = moment(updateTime).valueOf();
            var end = moment(time).valueOf();
            var diff = start-end;
            return moment.utc(moment.duration(diff).asMilliseconds()).format('HH:mm:ss');

        };


        /**
         *
         * function that refreshes the list
         *
         * @var intervall here you can set the interval time for refresh 1000 = 1s, 60000 = 1min
         *
         */
        $scope.refreshList = function() {

            timer = setTimeout(function(){
                var settings = getSettings();
                $scope.httpRequest(tokenService.currentApiUrl,"message-history/search",settings,EXTRAS_LISTMESSAGES);
            },intervall);

        };



        /**
         *
         * gets messages
         *
         * @precondition $scope.adminId != null, $scope.settings variables != null;
         *
         */
        $scope.httpRequest = function(url, path,data,options) {

            $scope.code = null;
            $scope.response = null;

            var req = {
                method: 'POST',
                url: url+path,
                headers: {
                    'Content-Type': 'application/json'
                },
                data:{"Data":data,
                "AuthenticationToken": tokenService.getAuthToken(),
                "Tags":null}
            };

            $scope.request = req;

            $http(req
            ).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

                $scope.statusMessage = response.data.status;
                $scope.response = response.data;


                if(options == EXTRAS_LISTMESSAGES){
                    populateTable(response.data.data.items);
                }

                $scope.refreshList();



            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                //$scope.master = response.data;

                $scope.response = response.data;


            });
        };




        function populateTable(list) {

            $scope.messages = [];

            $.each(list, function (idx, elem) {

                $scope.messages.push(list[idx]);

            });
        }




        /**
         *
         *
         * Pagination controls
         *
         *
         */

        $scope.itemsPerPage = 10;
        $scope.currentPage = 0;

        $scope.totalCounts = [10,25,50,100];

        $scope.items = function(amount){
            $scope.itemsPerPage = amount;
        };

        $scope.thisPage = function(data){
            return data == $scope.itemsPerPage;
        };

        $scope.prevPage = function() {
            if ($scope.currentPage > 0) {
                $scope.currentPage--;
            }
        };

        $scope.prevPageDisabled = function() {
            return $scope.currentPage === 0 ? "disabled" : "";
        };

        $scope.pageCount = function() {
            return Math.ceil($scope.messages.length/$scope.itemsPerPage)-1;
        };

        $scope.nextPage = function() {
            if ($scope.currentPage < $scope.pageCount()) {
                $scope.currentPage++;
            }
        };

        $scope.nextPageDisabled = function() {
            return $scope.currentPage === $scope.pageCount() ? "disabled" : "";
        };




    }]);