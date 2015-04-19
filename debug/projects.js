var module = angular.module("projectsView", []);

module.controller("ProjectsController", ["$scope", function($scope) {

    $scope.properties = initProperties();
    $scope.allProjects = initAllProjects();

    function initProperties() {
        var unit = new Unit({});
        var properties = [];
        for (var key in unit) {
            // Consider only properties that aren't functions
            if ( unit[key] !== undefined && !(unit[key].call)) {
                properties.push(key);
            }
        }
        return properties;
    }

    function initAllProjects() {
        var units = [];
        for (var i = 0; i < Unit.Types.length; i++) {
            units.push(new Unit(Unit.Types[i]));
        }
        return units;
    }

}]);
