angular.module('zlCart.fulfilment', [])

.service('fulfilmentProvider', ['$injector', function ($injector) {
  this._obj = {
    service: undefined,
    settings: undefined
  };

  this.setService = function (service) {
    this._obj.service = service;
  };

  this.setSettings = function (settings) {
    this._obj.settings = settings;
  };

  this.checkout = function () {
    var provider = $injector.get('zlCart.fulfilment.' + this._obj.service);
    return provider.checkout(this._obj.settings);
  }
}])

.service('zlCart.fulfilment.log', ['$q', '$log', 'zlCart', function ($q, $log, zlCart) {
  this.checkout = function () {
    var deferred = $q.defer();
    $log.info(zlCart.toObject());
    deferred.resolve({
      cart: zlCart.toObject()
    });
    return deferred.promise;
  }
}])

.service('zlCart.fulfilment.http', ['$http', 'zlCart', function ($http, zlCart) {
  this.checkout = function (settings) {
    return $http.post(settings.url, {
      data: zlCart.toObject(),
      options: settings.options
    });
  }
}])

.service('zlCart.fulfilment.meowalet', ['$http', 'zlCart', function ($http, zlCart) {
  this.checkout = function (settings) {
    return $http.post(settings.url, {
      data: zlCart.toObject()
    });
  }
}])

.service('zlCart.fulfilment.paypal', ['$http', 'zlCart', function ($http, zlCart) {

}]);