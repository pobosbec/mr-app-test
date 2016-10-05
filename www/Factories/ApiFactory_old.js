function ApiFactory($http,$timeout) {

    var authenticationToken;
    var apiLog = [];
    var apiLogIndex = 0;

    var apiSettings = {
        baseApiUrl: 'https://api.mobileresponse.se/app/',
        //baseApiUrl: 'http://api.test.mobileresponse.se/app/',
        instanceName: 'mobileresponse',
        method: 'POST'
    };

    var appUser = {};
    var usersCache = [];
    var conversationsCache = [];

    function getAuthenticationToken() {
        return authenticationToken;
    }

    function authenticate(userCredentials, callback, error) {
        var request = { data: userCredentials };
        //console.log(request);
        call('authenticate', request, function (response) {
            if (response.data != null) {
                //console.log(response.data);
                angular.copy({ appUserId: response.data.appUserId }, appUser);
                authenticationToken = response.data.id;
                callback(response.data.id);
            } else {
                callback(response.data);
            }
        }, function(e) {
            error(e);
        });
    }

    function call(url, request, callback, error) {
        $http({
            url: apiSettings.baseApiUrl + url,
            method: apiSettings.method,
            data: request
        }).then(function (response) {
            //console.log(response);
            callback(response.data);
        }, function(e) {
            console.log(e);
            error(e);
        });
    }

    function callReturnId(url, request, callback) {
        call(url, request, function (response) {
            callback(response.data.id);
        });
    }

    function addToLog(type, text, url) {
        apiLog.push({
            type: type,
            text: text,
            url: url,
            timeStamp: Date.now(),
            index: apiLogIndex
        });
        apiLogIndex++;
    }

    return {
        getToken: getAuthenticationToken,
        apiSettings: apiSettings,
        myAppUser: appUser,
        functions: {
            authenticate: authenticate,
            call: call,
            callReturnId: callReturnId
        }
    };
    
}