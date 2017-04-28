//ZLCART.JS
'use strict';

angular.module('zlCart', ['zlCart.directives', 'LocalStorageModule'])

.config(['localStorageServiceProvider', function(localStorageServiceProvider) {
  localStorageServiceProvider
    .setPrefix('zlCart')
    .setStorageType('sessionStorage');
}])

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
      taxIncluded: null,
      shipping: null,
      promo: null,
      items: []
    };
  };

  this.addItem = function(id, name, price, tax, quantity, discount, data) {
    var inCart = this.getItemById(id);
    if (typeof inCart === 'object') {
      inCart.setQuantity(quantity); //Update quantity of an item if it's already in the cart
    } else {
      price = +(this.getTaxIncluded() ? (+price / (1 + (+tax / 100))) : +price).toFixed(2);
      var newItem = new zlCartItem(id, name, price, tax, quantity, discount, this.getPromo(), data);
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
  this.getItemByRegex = function(expression) {
    var items = this.getCart().items;
    var build = false;
    var exp = new RegExp(expression, "ig");
    angular.forEach(items, function(item) {
      if (exp.test(item.getId())) {
        build = item;
      }
    });
    return build;
  };

  this.setPromo = function(objPromo) {
    this.$cart.promo = objPromo;
    var items = this.getItems();
    angular.forEach(items, function(item) {
      if (objPromo) {
        var isChecked = objPromo.products.some(function(element, index, array) {
          return element.productId.toString() === item.getId() && element.check;
        });
        if (isChecked) { item.setPromo(objPromo); } else { item.setPromo(null); }
      } else {
        item.setPromo(objPromo);
      }
    });
    $rootScope.$broadcast('zlCart:change', {});
  };
  this.getPromo = function() {
    return this.getCart().promo || null;
  };

  this.setShipping = function(shipping) {
    this.$cart.shipping = shipping;
    return this.getShipping();
  };
  this.getShipping = function() {
    if (this.getCart().items.length == 0) return 0;
    return this.getCart().shipping;
  };

  this.setTaxIncluded = function(taxIncluded) {
    this.$cart.taxIncluded = taxIncluded;
    return this.getTaxIncluded();
  };
  this.getTaxIncluded = function() {
    return this.getCart().taxIncluded;
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
  this.getSubTotalWithTax = function() {
    var total = 0;
    angular.forEach(this.getCart().items, function(item) {
      total += item.getTotalWithTax();
    });
    return +parseFloat(total).toFixed(2);
  };
  this.getTotalDiscount = function() {
    var promo = this.getPromo();
    var items = this.getItems();
    if (!promo || items.length === 0) return 0;
    var total = 0;
    angular.forEach(items, function(item) {
      total += +item.getTotalDiscount();
    });
    return +parseFloat(total).toFixed(2);
  };

  this.totalCost = function() {
    return +parseFloat(this.getSubTotalWithTax() + this.getShipping());
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
    this.$cart.items = [];
    $rootScope.$broadcast('zlCart:change', {});
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
      promo: this.getPromo(),
      subTotal: this.getSubTotal(),
      subTotalWithTax: this.getSubTotalWithTax(),
      totalDiscount: this.getTotalDiscount(),
      totalCost: this.totalCost(),
      items: items
    };
  };

  this.$restore = function(storedCart) {
    var _self = this;
    _self.init();
    _self.$cart.shipping = storedCart.shipping;
    _self.$cart.promo = storedCart.promo;
    _self.$cart.taxIncluded = storedCart.taxIncluded;

    angular.forEach(storedCart.items, function(item) {
      _self.$cart.items.push(new zlCartItem(item._id, item._name, item._price, item._tax, item._quantity, item._discount, item._promo, item._data));
    });
    this.$save();
  };
  this.$save = function() {
    return zlStore.set('zlcart', JSON.stringify(this.getCart()));
  };
}])

.factory('zlCartItem', ['$rootScope', '$log', function($rootScope, $log) {
  var item = function(id, name, price, tax, quantity, discount, promo, data) {
    this.setId(id);
    this.setName(name);
    this.setTax(tax);
    this.setPrice(price);
    this.setDiscount(discount);
    this.setQuantity(quantity);
    this.setPromo(promo);
    this.setData(data);
  };

  item.prototype.round = function(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
  }

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
    return +(this._price - (this._price * this.getDiscount() / 100).toFixed(2));
  };

  item.prototype.setDiscount = function(discount) {
    this._discount = discount || 0;
  };
  item.prototype.getDiscount = function() {
    return this._discount;
  };

  item.prototype.setPromo = function(promo) {
    this._promo = promo;
  };
  item.prototype.getPromo = function() {
    return this._promo || null;
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

  item.prototype.getTotalDiscount = function() {
    var promo = this.getPromo();
    var quantity = this.getQuantity();
    var price = this.getPrice();
    var total = 0;
    if (!promo || quantity === 0) return total.toFixed(2);

    var valDiscount = promo.value;
    var total = valDiscount;
    if (promo.symbol === "%") { valDiscount = +parseFloat(price * valDiscount / 100).toFixed(2); }

    var quantityToDiscount = quantity;
    var parcial = (promo.parcial || 1);
    quantityToDiscount = quantity - (quantity % parcial);

    if (promo.symbol === "%") { total = valDiscount * quantityToDiscount; } else { total = valDiscount * (quantityToDiscount / parcial); }
    return +parseFloat(total).toFixed(2);
  };
  item.prototype.getTotal = function() {
    return +parseFloat(+this.getPrice() * +this.getQuantity() - +this.getTotalDiscount()).toFixed(2);
  };
  item.prototype.getTotalWithTax = function() {
    return +parseFloat(this.getTotal() + (this.getTotal() * this.getTax() / 100)).toFixed(2);
  };

  item.prototype.toObject = function() {
    return {
      id: this.getId(),
      name: this.getName(),
      price: this.getPrice(),
      tax: this.getTax(),
      promo: this.getPromo(),
      quantity: this.getQuantity(),
      data: this.getData(),
      total: this.getTotal(),
      totalDiscount: this.getTotalDiscount(),
      totalWithTax: this.getTotalWithTax()
    };
  };

  return item;
}])

.service('zlStore', ['localStorageService', function(localStorageService) {
  this.get = function(key) {
    if (localStorageService.get(key)) {
      var cart = angular.fromJson(localStorageService.get(key));
      return (typeof cart === 'object' ? cart : JSON.parse(cart));
    }
    return false;
  };

  this.set = function(key, val) {
    if (val === undefined) {
      localStorageService.remove(key);
    } else {
      localStorageService.set(key, val);
    }
    return localStorageService.get(key);
  };
}])

.service('zlCartDiscount', ['$rootScope', 'zlCart', '$http', '$q', function($rootScope, zlCart, $http, $q) {
  this.init = function() {
    this.urlDiscount = null;
  };

  this.canApplyDiscount = function() {
    return (typeof this.urlDiscount !== 'undefined');
  }

  this.setUrlDiscount = function(url) {
    this.urlDiscount = url;
  };

  this.getUrlDiscount = function() {
    return this.urlDiscount;
  };

  this.setDiscount = function(code, callback) {
    var cart = zlCart.getCart();
    $http.post(this.getUrlDiscount() + code, { cart: cart }).then(function(response) {
      if (response.data) {
        zlCart.setPromo(response.data);
      }
      callback();
    }).catch(function(response) {
      zlCart.setPromo(null);
      callback(response.data.error);
    });
  };
}])

.service('zlCartUtil', function() {
  this.round = function(value, decimals) {
    if (decimals === undefined) {
      decimals = 0;
    }

    var multiplicator = Math.pow(10, decimals);
    value = +(parseFloat((value * multiplicator).toFixed(11))).toFixed(1);
    return (Math.round(value) / multiplicator).toFixed(2);
  };
})

.value('version', '1.0.25');;//ZLCART.DIRECTIVES.JS
'use strict';

angular.module('zlCart.directives', ['zlCart.fulfilment'])

.controller('zlCartController', ['$scope', 'zlCart', function($scope, zlCart) {
  $scope.zlCart = zlCart;
}])

.directive('zlcartAddtocart', ['zlCart', 'zlCartDiscount', function(zlCart, zlCartDiscount) {
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
      data: '=',
      checkItem: '@?'
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
        if (attrs.checkItem) {
          return zlCart.getItemByRegex(attrs.checkItem);
        } else {
          return zlCart.getItemById(attrs.id);
        }
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
      var inProcess = false;

      function init() {
        var flags = [];
        var taxOut = [];
        var total = 0;
        var totalIva = 0;
        angular.forEach(zlCart.getItems(), function(item) {
          var rate = item.getTax();
          var taxValue = item.getTotalWithTax() - item.getTotal();
          var taxPrice = item.getTotal();
          var taxPriceTax = +(taxValue + taxPrice);
          if (!flags[rate]) {
            flags[rate] = true;
            taxOut.push({
              rate: rate,
              tax: taxValue,
              value: taxPrice,
              subTotal: taxPriceTax
            });
          } else {
            for (var x = 0; x < taxOut.length; x++) {
              if (taxOut[x].rate !== rate) { continue; }
              taxOut[x].tax += taxValue;
              taxOut[x].value += taxPrice;
              taxOut[x].subTotal += taxPriceTax;
            }
          }
          total += taxPriceTax;
          totalIva += taxValue;
        });

        scope.taxsRate = taxOut;
        scope.taxTotalIva = totalIva;
        scope.taxTotal = total;
        inProcess = false;
      }
      init();

      scope.$on("zlCart:change", function(event, args) {
        if (!inProcess) {
          inProcess = true;
          init();
        }
      });
    }
  };
}])

.directive('zlcartDiscount', ['zlCart', 'zlCartDiscount', function(zlCart, zlCartDiscount) {
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
      if (zlCart.getPromo()) {
        scope.code = zlCart.getPromo().code;
      }
      scope.$watch('code', function(newValue, oldValue) {
        if (newValue !== oldValue) scope.message = {};
      });

      scope.removeCodeDiscount = function(code) {
        zlCart.setPromo(null);
      };

      scope.setCodeDiscount = function(code) {
        zlCartDiscount.setDiscount(code, function(err) {
          scope.message.msg = true;
          if (err) {
            scope.message.success = false;
            scope.message.text = err;
            return;
          }

          scope.message.success = true;
          scope.message.text = 'Código aplicado com sucesso.';
          scope.code = (zlCart.getPromo() || {}).code;
          setTimeout(function() {
            scope.message.msg = false;
            scope.$apply();
          }, 2500);
        });
      };

      scope.$on("zlCart:itemAdded", function(newItem) {
        zlCart.setPromo(zlCart.getPromo());
      });
    }
  };
}])

.directive('zlcartCheckout', [function() {
  return {
    restrict: 'E',
    scope: { service: '@', settings: '=' },
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
        fulfilmentProvider.checkout().then(function(response) {
          if (response.data.url_redirect) {
            $window.location.href = response.data.url_redirect;
          }
          $rootScope.$broadcast('zlCart:checkout_succeeded', data);
        }).catch(function(response) {
          $rootScope.$broadcast('zlCart:checkout_failed', {
            statusCode: response.status,
            error: response.data
          });
        });
      };
    }])
  };
}]);;//ZLCART.FULFILMENT.JS
angular.module('zlCart.fulfilment', [])

.service('fulfilmentProvider', ['$injector', function($injector) {
  this._obj = {
    service: undefined,
    settings: undefined
  };

  this.setService = function(service) {
    this._obj.service = service;
  };

  this.setSettings = function(settings) {
    this._obj.settings = settings;
  };

  this.checkout = function() {
    var provider = $injector.get('zlCart.fulfilment.' + this._obj.service);
    return provider.checkout(this._obj.settings);
  }
}])

.service('zlCart.fulfilment.log', ['$q', '$log', 'zlCart', function($q, $log, zlCart) {
  this.checkout = function() {
    var deferred = $q.defer();
    $log.info(zlCart.toObject());
    deferred.resolve({
      cart: zlCart.toObject()
    });
    return deferred.promise;
  }
}])

.service('zlCart.fulfilment.http', ['$http', 'zlCart', function($http, zlCart) {
  this.checkout = function(settings) {
    return $http.post(settings.url, {
      data: zlCart.toObject(),
      options: settings.options
    });
  }
}])

.service('zlCart.fulfilment.meowallet', ['$http', 'zlCart', function($http, zlCart) {
  this.checkout = function(settings) {
    return $http.post(settings.url, {
      data: zlCart.toObject()
    });
  }
}])

.service('zlCart.fulfilment.paypal', ['$http', 'zlCart', function($http, zlCart) {}]);