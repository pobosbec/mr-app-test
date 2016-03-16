/**
 * Created by Robin Jobb on 2016-03-16.
 */
mobileresponseWebbApp
    .filter('startFrom', function () {
        return function (input, start) {
            start = +start;
            return input.slice(start);
        }
    })
    .filter('startFromEnd', function () {
        return function (input, start) {
            if(input.length>Math.abs(start)){
            start = +start;
            return input.slice(start);
            }
            else{
                console.log("invalid input to short");
            return input;
            }

        }
    })
    .filter('reverse', function() {
        return function(items) {
            return items.slice().reverse();
        };
    })
