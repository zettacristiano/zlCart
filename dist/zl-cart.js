'use strict';

angular.module('zlCart', ['zlCart.directives'])

.config([function() {}])

.provider('$zlCart', function() {
  this.$get = function() {};
})

.run(['$rootScope', 'zlCart', 'zlCartItem', 'zlStore', function($rootScope, zlCart, zlCartItem, zlStore) {
  $rootScope.$on('zlCart:change', function() {
    zlCart.$save();
  });

  if (angular.isObject(zlStore.get('zlcart'))) {
    zlCart.$restore(zlStore.get('zlcart'));
  } else {
    zlCart.init();
  }
}])

.service('zlCart', ['$rootScope', 'zlCartItem', 'zlStore', function($rootScope, zlCartItem, zlStore) {
  this.init = function() {
    this.$cart = {
      shipping: null,
      promoCode: null,
      items: []
    };
  };

  this.addItem = function(id, name, price, tax, quantity, discount, data) {
    var inCart = this.getItemById(id);
    if (typeof inCart === 'object') {
      //Update quantity of an item if it's already in the cart
      inCart.setQuantity(quantity, true);
    } else {
      var newItem = new zlCartItem(id, name, price, tax, quantity, discount, data);
      this.$cart.items.push(newItem);
      $rootScope.$broadcast('zlCart:itemAdded', newItem);
    }

    $rootScope.$broadcast('zlCart:change', {});
  };

  this.getItemById = function(itemId) {
    var items = this.getCart().items;
    var build = false;

    angular.forEach(items, function(item) {
      if (item.getId() === itemId) {
        build = item;
      }
    });
    return build;
  };

  this.setPromoCode = function(code) {
    this.$cart.promoCode = code;
    return this.getPromoCode();
  };

  this.getPromoCode = function() {
    return this.getCart().promoCode;
  };

  this.setShipping = function(shipping) {
    this.$cart.shipping = shipping;
    return this.getShipping();
  };

  this.getShipping = function() {
    if (this.getCart().items.length == 0) return 0;
    return this.getCart().shipping;
  };

  this.setCart = function(cart) {
    this.$cart = cart;
    return this.getCart();
  };

  this.getCart = function() {
    return this.$cart;
  };

  this.getItems = function() {
    return this.getCart().items;
  };

  this.getTotalItems = function() {
    var count = 0;
    var items = this.getItems();
    angular.forEach(items, function(item) {
      count += item.getQuantity();
    });
    return count;
  };

  this.getTotalUniqueItems = function() {
    return this.getCart().items.length;
  };

  this.getSubTotal = function() {
    var total = 0;
    angular.forEach(this.getCart().items, function(item) {
      total += item.getTotal();
    });
    return +parseFloat(total).toFixed(2);
  };

  this.getSubTotalWithoutTax = function() {
    var total = 0;
    angular.forEach(this.getCart().items, function(item) {
      total += item.getTotalWithoutTax();
    });
    return +parseFloat(total).toFixed(2);
  };

  this.getSubTotalWithDiscount = function() {
    var total = 0;
    angular.forEach(this.getCart().items, function(item) {
      total += item.getTotalWithDiscount();
    });
    return +parseFloat(total).toFixed(2);
  };

  this.getTotalDiscount = function() {
    var total = 0;
    angular.forEach(this.getCart().items, function(item) {
      total += item.getTotal() - item.getTotalWithDiscount();
    });
    return +parseFloat(total).toFixed(2);
  };

  this.totalCost = function() {
    return +parseFloat(this.getSubTotal() - this.getTotalDiscount() + this.getShipping());
  };

  this.removeItem = function(index) {
    this.$cart.items.splice(index, 1);
    $rootScope.$broadcast('zlCart:itemRemoved', {});
    $rootScope.$broadcast('zlCart:change', {});
  };

  this.removeItemById = function(id) {
    var cart = this.getCart();
    angular.forEach(cart.items, function(item, index) {
      if (item.getId() === id) {
        cart.items.splice(index, 1);
      }
    });
    this.setCart(cart);
    $rootScope.$broadcast('zlCart:itemRemoved', {});
    $rootScope.$broadcast('zlCart:change', {});
  };

  this.empty = function() {
    $rootScope.$broadcast('zlCart:change', {});
    this.$cart.items = [];
    localStorage.removeItem('zlcart');
  };

  this.isEmpty = function() {
    return (this.$cart.items.length > 0 ? false : true);
  };

  this.toObject = function() {
    if (this.getItems().length === 0) return false;
    var items = [];
    angular.forEach(this.getItems(), function(item) {
      items.push(item.toObject());
    });

    return {
      shipping: this.getShipping(),
      promoCode: this.getPromoCode(),
      subTotal: this.getSubTotal(),
      totalCost: this.totalCost(),
      items: items
    }
  };

  this.$restore = function(storedCart) {
    var _self = this;
    _self.init();
    _self.$cart.shipping = storedCart.shipping;

    angular.forEach(storedCart.items, function(item) {
      _self.$cart.items.push(new zlCartItem(item._id, item._name, item._price, item._tax, item._quantity, item._discount, item._data));
    });
    this.$save();
  };

  this.$save = function() {
    return zlStore.set('zlcart', JSON.stringify(this.getCart()));
  }
}])

.factory('zlCartItem', ['$rootScope', '$log', function($rootScope, $log) {
  var item = function(id, name, price, tax, quantity, discount, data) {
    this.setId(id);
    this.setName(name);
    this.setTax(tax);
    this.setPrice(price);
    this.setDiscount(discount);
    this.setQuantity(quantity);
    this.setData(data);
  };

  item.prototype.setId = function(id) {
    if (id) this._id = id;
    else {
      $log.error('An ID must be provided');
    }
  };

  item.prototype.getId = function() {
    return this._id;
  };

  item.prototype.setName = function(name) {
    if (name) this._name = name;
    else {
      $log.error('A name must be provided');
    }
  };

  item.prototype.getName = function() {
    return this._name;
  };

  item.prototype.setTax = function(tax) {
    this._tax = +tax;
  };

  item.prototype.getTax = function(tax) {
    return this._tax;
  };

  item.prototype.setPrice = function(price) {
    var priceFloat = parseFloat(price || 0);
    if (priceFloat >= 0) {
      this._price = priceFloat;
    } else {
      $log.error('A price must be over 0');
    }
  };

  item.prototype.getPrice = function() {
    return this._price;
  };

  item.prototype.getPriceWithoutTax = function() {
    return this._price - (this._price / 100 * this._tax);
  };

  item.prototype.getPriceWithDiscount = function() {
    var priceFloat = this.getPrice();
    return priceFloat - (priceFloat * (this.getDiscount() / 100));
  };

  item.prototype.setDiscount = function(discount) {
    var discountInt = parseInt(discount || 0);
    if (discountInt >= 0) {
      this._discount = discountInt;
    } else {
      this._discount = 0;
    }
    $rootScope.$broadcast('zlCart:change', {});
  };

  item.prototype.getDiscount = function() {
    return this._discount;
  };

  item.prototype.setQuantity = function(quantity, relative) {
    var quantityInt = parseInt(quantity);
    if (quantityInt % 1 === 0) {
      if (relative === true) {
        this._quantity += quantityInt;
      } else {
        this._quantity = quantityInt;
      }
      if (this._quantity < 1) this._quantity = 1;

    } else {
      this._quantity = 1;
      $log.info('Quantity must be an integer and was defaulted to 1');
    }
    $rootScope.$broadcast('zlCart:change', {});
  };

  item.prototype.getQuantity = function() {
    return this._quantity;
  };

  item.prototype.setData = function(data) {
    if (data) this._data = data;
  };

  item.prototype.getData = function() {
    if (this._data) return this._data;
    else $log.info('This item has no data');
  };

  item.prototype.getTotal = function() {
    return +parseFloat(this.getQuantity() * this.getPrice()).toFixed(2);
  };

  item.prototype.getTotalWithoutTax = function() {
    return +parseFloat(this.getQuantity() * this.getPriceWithoutTax()).toFixed(2);
  };

  item.prototype.getTotalWithDiscount = function() {
    return +parseFloat(this.getQuantity() * this.getPriceWithDiscount()).toFixed(2);
  };

  item.prototype.toObject = function() {
    return {
      id: this.getId(),
      name: this.getName(),
      price: this.getPrice(),
      priceWithoutTax: this.getPriceWithoutTax(),
      priceWithDiscount: this.getPriceWithDiscount(),
      tax: this.getTax(),
      discount: this.getDiscount(),
      quantity: this.getQuantity(),
      data: this.getData(),
      total: this.getTotal(),
      totalWithoutTax: this.getTotalWithoutTax(),
      totalWithDiscount: this.getTotalWithDiscount()
    }
  };
  return item;
}])

.service('zlStore', ['$window', function($window) {
  return {
    get: function(key) {
      if ($window.localStorage[key]) {
        var cart = angular.fromJson($window.localStorage[key]);
        return JSON.parse(cart);
      }
      return false;
    },


    set: function(key, val) {
      if (val === undefined) {
        $window.localStorage.removeItem(key);
      } else {
        $window.localStorage[key] = angular.toJson(val);
      }
      return $window.localStorage[key];
    }
  }
}])

.service('zlCartDiscount', ['$rootScope', 'zlCart', '$http', '$q', function($rootScope, zlCart, $http, $q) {
  this.init = function() {
    this.urlDiscount = "/api/getdiscount/";
  };

  this.setUrlDiscount = function(url) {
    this.urlDiscount = url;
  };

  this.getUrlDiscount = function() {
    return this.urlDiscount;
  };

  this.setDiscount = function(code, callback) {
    var cart = zlCart.getCart();
    $http.post(this.getUrlDiscount() + code, {
      cart: cart
    }).then(function(response) {
      if (response.data) {
        zlCart.setPromoCode(code);
        zlCart.$restore(angular.fromJson(response.data));
      }
      callback();
    }).catch(function(error) {
      callback(error);
    });
  };
}])

.controller('CartController', ['$scope', 'zlCart', function($scope, zlCart) {
  $scope.zlCart = zlCart;
}])

.value('version', '1.0.15');;'use strict';

angular.module('zlCart.directives', ['zlCart.fulfilment'])

.controller('zlCartController', ['$scope', 'zlCart', function($scope, zlCart) {
  $scope.zlCart = zlCart;
}])

.directive('zlcartAddtocart', ['zlCart', function(zlCart) {
  return {
    restrict: 'E',
    controller: 'zlCartController',
    scope: {
      id: '@',
      name: '@',
      quantity: '@',
      quantityMax: '@',
      price: '@',
      tax: '@',
      data: '='
    },
    transclude: true,
    replace: true,
    templateUrl: function(element, attrs) {
      if (typeof attrs.templateUrl == 'undefined') {
        return 'template/addtocart.html';
      } else {
        return attrs.templateUrl;
      }
    },
    link: function(scope, element, attrs) {
      scope.attrs = attrs;
      scope.inCart = function() {
        return zlCart.getItemById(attrs.id);
      };

      if (scope.inCart()) {
        scope.q = zlCart.getItemById(attrs.id).getQuantity();
      } else {
        scope.q = parseInt(scope.quantity);
      }

      scope.qtyOpt = [];
      for (var i = 1; i <= scope.quantityMax; i++) {
        scope.qtyOpt.push(i);
      }
    }
  };
}])

.directive('zlcartCart', [function() {
  return {
    restrict: 'E',
    controller: 'zlCartController',
    scope: {},
    replace: true,
    templateUrl: function(element, attrs) {
      if (typeof attrs.templateUrl == 'undefined') {
        return 'template/cart.html';
      } else {
        return attrs.templateUrl;
      }
    },
    link: function(scope, element, attrs) {

    }
  };
}])

.directive('zlcartSummary', [function() {
  return {
    restrict: 'E',
    controller: 'zlCartController',
    scope: {},
    transclude: true,
    replace: true,
    templateUrl: function(element, attrs) {
      if (typeof attrs.templateUrl == 'undefined') {
        return 'template/summary.html';
      } else {
        return attrs.templateUrl;
      }
    }
  };
}])

.directive('zlcartTax', ['zlCart', function(zlCart) {
  return {
    restrict: 'E',
    controller: 'zlCartController',
    scope: {},
    transclude: true,
    replace: true,
    templateUrl: function(element, attrs) {
      if (typeof attrs.templateUrl == 'undefined') {
        return 'template/carttax.html';
      } else {
        return attrs.templateUrl;
      }
    },
    link: function(scope, element, attrs) {
      function init() {
        var flags = [];
        var taxOut = [];
        var total = 0;
        angular.forEach(zlCart.getCart().items, function(item) {
          var taxRate = item.getTax();
          var taxTotal = item.getTotalWithDiscount();
          var taxValue = +parseFloat(taxTotal / 100 * taxRate).toFixed(2);
          if (!flags[taxRate]) {
            flags[taxRate] = true;
            taxOut.push({
              rate: taxRate,
              tax: taxValue,
              value: taxTotal
            });
          } else {
            for (var x = 0; x < taxOut.length; x++) {
              if (taxOut[x].rate !== taxRate) continue;
              taxOut[x].tax += taxValue;
              taxOut[x].value += taxTotal;
            }
          }
        });
        taxOut.forEach(function(item) {
          total += item.value;
        })

        scope.taxsRate = taxOut;
        scope.taxTotal = total;
      }
      scope.$on("zlCart:change", function() {
        init();
      });
      init();
    }
  };
}])

.directive('zlcartDiscount', ['zlCartDiscount', function(zlCartDiscount) {
  return {
    restrict: 'E',
    controller: 'zlCartController',
    scope: {},
    transclude: true,
    replace: false,
    templateUrl: function(element, attrs) {
      if (typeof attrs.templateUrl == 'undefined') {
        return 'template/discount.html';
      } else {
        return attrs.templateUrl;
      }
    },
    link: function(scope, element, attrs) {
      scope.attrs = attrs;
      scope.message = {};
      if (scope.zlCart.getPromoCode()) {
        scope.code = scope.zlCart.getPromoCode();
      }
      scope.$watch('code', function(newValue, oldValue) {
        if (newValue !== oldValue) scope.message = {};
      });

      scope.setCodeDiscount = function(code) {
        zlCartDiscount.setDiscount(code, function(err) {
          scope.message.msg = true;
          if (err) {
            scope.message.success = false;
            scope.message.text = err.data;
            return;
          }

          scope.message.success = true;
          scope.message.text = 'Código consumido com sucesso.';

          scope.code = "";
        });
      };
    }
  };
}])

.directive('zlcartCheckout', [function() {
  return {
    restrict: 'E',
    scope: {
      service: '@',
      settings: '='
    },
    transclude: true,
    replace: false,
    templateUrl: function(element, attrs) {
      if (typeof attrs.templateUrl == 'undefined') {
        return 'template/checkout.html';
      } else {
        return attrs.templateUrl;
      }
    },
    controller: ('zlCartController', ['$rootScope', '$scope', '$window', 'zlCart', 'fulfilmentProvider', function($rootScope, $scope, $window, zlCart, fulfilmentProvider) {
      $scope.zlCart = zlCart;

      $scope.checkout = function() {
        fulfilmentProvider.setService($scope.service);
        fulfilmentProvider.setSettings($scope.settings);
        fulfilmentProvider.checkout()
          .then(function(response) {
            if ($scope.service === 'meowallet') {
              $window.location.href = response.data.url_redirect;
            }
            $rootScope.$broadcast('zlCart:checkout_succeeded', data);
          })
          .catch(function(response) {
            $rootScope.$broadcast('zlCart:checkout_failed', {
              statusCode: response.status,
              error: response.data
            });
          });
      }
    }])
  };
}]);;angular.module('zlCart.fulfilment', [])

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

.service('zlCart.fulfilment.meowallet', ['$http', 'zlCart', function ($http, zlCart) {
  this.checkout = function (settings) {
    return $http.post(settings.url, {
      data: zlCart.toObject()
    });
  }
}])

.service('zlCart.fulfilment.paypal', ['$http', 'zlCart', function ($http, zlCart) {
}]);