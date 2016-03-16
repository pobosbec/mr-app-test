/**
 * Created by Robin Jobb on 2016-03-16.
 */
mobileresponseWebbApp
    .filter('reverse', function() {
         return function(items) {
            return items.slice().reverse();
        };
    })
    .filter('startFrom', function () {
        return function (input, start) {
            start = +start;
            return input.slice(start);
        }
    })
