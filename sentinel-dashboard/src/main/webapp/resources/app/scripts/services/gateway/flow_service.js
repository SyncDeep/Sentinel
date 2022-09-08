var app = angular.module('sentinelDashboardApp');

app.service('GatewayFlowService', ['$http', function ($http) {
  this.queryRules = function (app, ip, port) {
    var param = {
      app: app,
      ip: ip,
      port: port
    };

    return $http({
      url: '/gateway/flow/list.json',
      params: param,
      method: 'GET'
    });
  };

  this.newRule = function (rule) {
    return $http({
      url: '/gateway/flow/new.json',
      data: rule,
      method: 'POST'
    });
  };

  this.saveRule = function (rule) {
    return $http({
      url: '/gateway/flow/save.json',
      data: rule,
      method: 'POST'
    });
  };

  this.deleteRule = function (rule) {
    var param = {
      id: rule.id,
      app: rule.app
    };

    return $http({
      url: '/gateway/flow/delete.json',
      params: param,
      method: 'POST'
    });
  };

  this.checkRuleValid = function (rule) {
    if (rule.resource === undefined || rule.resource === '') {
      alert('API name cannot be empty');
      return false;
    }

    if (rule.paramItem != null) {
      if (rule.paramItem.parseStrategy == 2 ||
          rule.paramItem.parseStrategy == 3 ||
          rule.paramItem.parseStrategy == 4) {
        if (rule.paramItem.fieldName === undefined || rule.paramItem.fieldName === '') {
          alert('When the parameter attribute is Header, URL parameter, Cookie, the parameter name cannot be empty');
          return false;
        }

        if (rule.paramItem.pattern === '') {
          alert('Match string cannot be empty');
          return false;
        }
      }
    }

    if (rule.count === undefined || rule.count < 0) {
      alert((rule.grade === 1 ? 'QPS threshold' : 'Threads') + 'Must be greater than or equal to 0');
      return false;
    }

    return true;
  };
}]);
