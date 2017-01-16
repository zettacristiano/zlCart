'use strict';

angular.module('zlCart', ['zlCart.directives'])

  .config([function () {}])

  .provider('$zlCart', function () {
    this.$get = function () {};
  })

  .run(['$rootScope', 'zlCart', 'zlCartItem', 'zlStore', function ($rootScope, zlCart, zlCartItem, zlStore) {
    $rootScope.$on('zlCart:change', function () {
      zlCart.$save();
    });

    if (angular.isObject(zlStore.get('zlcart'))) {
      zlCart.$restore(zlStore.get('zlcart'));
    } else {
      zlCart.init();
    }
  }])

  .service('zlCart', ['$rootScope', 'zlCartItem', 'zlStore', function ($rootScope, zlCartItem, zlStore) {
    this.init = function () {
      this.$cart = {
        shipping: null,
        promoCode: null,
        items: []
      };
    };

    this.addItem = function (id, name, price, tax, quantity, discount, data) {
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

    this.getItemById = function (itemId) {
      var items = this.getCart().items;
      var build = false;

      angular.forEach(items, function (item) {
        if (item.getId() === itemId) {
          build = item;
        }
      });
      return build;
    };

    this.setPromoCode = function (code) {
      this.$cart.promoCode = code;
      return this.getPromoCode();
    };

    this.getPromoCode = function () {
      return this.getCart().promoCode;
    };

    this.setShipping = function (shipping) {
      this.$cart.shipping = shipping;
      return this.getShipping();
    };

    this.getShipping = function () {
      if (this.getCart().items.length == 0) return 0;
      return this.getCart().shipping;
    };

    this.setCart = function (cart) {
      this.$cart = cart;
      return this.getCart();
    };

    this.getCart = function () {
      return this.$cart;
    };

    this.getItems = function () {
      return this.getCart().items;
    };

    this.getTotalItems = function () {
      var count = 0;
      var items = this.getItems();
      angular.forEach(items, function (item) {
        count += item.getQuantity();
      });
      return count;
    };

    this.getTotalUniqueItems = function () {
      return this.getCart().items.length;
    };

    this.getSubTotal = function () {
      var total = 0;
      angular.forEach(this.getCart().items, function (item) {
        total += item.getTotal();
      });
      return +parseFloat(total).toFixed(2);
    };

    this.getSubTotalWithoutTax = function () {
      var total = 0;
      angular.forEach(this.getCart().items, function (item) {
        total += item.getTotalWithoutTax();
      });
      return +parseFloat(total).toFixed(2);
    };

    this.getSubTotalWithDiscount = function () {
      var total = 0;
      angular.forEach(this.getCart().items, function (item) {
        total += item.getTotalWithDiscount();
      });
      return +parseFloat(total).toFixed(2);
    };

    this.getTotalDiscount = function () {
      var total = 0;
      angular.forEach(this.getCart().items, function (item) {
        total += item.getTotal() - item.getTotalWithDiscount();
      });
      return +parseFloat(total).toFixed(2);
    };

    this.totalCost = function () {
      return +parseFloat(this.getSubTotal() - this.getTotalDiscount() + this.getShipping());
    };

    this.removeItem = function (index) {
      this.$cart.items.splice(index, 1);
      $rootScope.$broadcast('zlCart:itemRemoved', {});
      $rootScope.$broadcast('zlCart:change', {});
    };

    this.removeItemById = function (id) {
      var cart = this.getCart();
      angular.forEach(cart.items, function (item, index) {
        if (item.getId() === id) {
          cart.items.splice(index, 1);
        }
      });
      this.setCart(cart);
      $rootScope.$broadcast('zlCart:itemRemoved', {});
      $rootScope.$broadcast('zlCart:change', {});
    };

    this.empty = function () {
      $rootScope.$broadcast('zlCart:change', {});
      this.$cart.items = [];
      localStorage.removeItem('zlcart');
    };

    this.isEmpty = function () {
      return (this.$cart.items.length > 0 ? false : true);
    };

    this.toObject = function () {
      if (this.getItems().length === 0) return false;
      var items = [];
      angular.forEach(this.getItems(), function (item) {
        items.push(item.toObject());
      });

      return {
        shipping: this.getShipping(),
        subTotal: this.getSubTotal(),
        totalCost: this.totalCost(),
        items: items
      }
    };

    this.$restore = function (storedCart) {
      var _self = this;
      _self.init();
      _self.$cart.shipping = storedCart.shipping;

      angular.forEach(storedCart.items, function (item) {
        _self.$cart.items.push(new zlCartItem(item._id, item._name, item._price, item._tax, item._quantity, item._discount, item._data));
      });
      this.$save();
    };

    this.$save = function () {
      return zlStore.set('zlcart', JSON.stringify(this.getCart()));
    }
  }])

  .factory('zlCartItem', ['$rootScope', '$log', function ($rootScope, $log) {
    var item = function (id, name, price, tax, quantity, discount, data) {
      this.setId(id);
      this.setName(name);
      this.setTax(tax);
      this.setPrice(price);
      this.setDiscount(discount);
      this.setQuantity(quantity);
      this.setData(data);
    };

    item.prototype.setId = function (id) {
      if (id) this._id = id;
      else {
        $log.error('An ID must be provided');
      }
    };

    item.prototype.getId = function () {
      return this._id;
    };

    item.prototype.setName = function (name) {
      if (name) this._name = name;
      else {
        $log.error('A name must be provided');
      }
    };

    item.prototype.getName = function () {
      return this._name;
    };

    item.prototype.setTax = function (tax) {
      this._tax = +tax;
    };

    item.prototype.getTax = function (tax) {
      return this._tax;
    };

    item.prototype.setPrice = function (price) {
      var priceFloat = parseFloat(price || 0);
      if (priceFloat >= 0) {
        this._price = priceFloat;
      } else {
        $log.error('A price must be over 0');
      }
    };

    item.prototype.getPrice = function () {
      return this._price;
    };

    item.prototype.getPriceWithoutTax = function () {
      return this._price - (this._price / 100 * this._tax);
    };

    item.prototype.getPriceWithDiscount = function () {
      var priceFloat = this.getPrice();
      return priceFloat - (priceFloat * (this.getDiscount() / 100));
    };

    item.prototype.setDiscount = function (discount) {
      var discountInt = parseInt(discount || 0);
      if (discountInt >= 0) {
        this._discount = discountInt;
      } else {
        this._discount = 0;
      }
      $rootScope.$broadcast('zlCart:change', {});
    };

    item.prototype.getDiscount = function () {
      return this._discount;
    };

    item.prototype.setQuantity = function (quantity, relative) {
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

    item.prototype.getQuantity = function () {
      return this._quantity;
    };

    item.prototype.setData = function (data) {
      if (data) this._data = data;
    };

    item.prototype.getData = function () {
      if (this._data) return this._data;
      else $log.info('This item has no data');
    };

    item.prototype.getTotal = function () {
      return +parseFloat(this.getQuantity() * this.getPrice()).toFixed(2);
    };

    item.prototype.getTotalWithoutTax = function () {
      return +parseFloat(this.getQuantity() * this.getPriceWithoutTax()).toFixed(2);
    };

    item.prototype.getTotalWithDiscount = function () {
      return +parseFloat(this.getQuantity() * this.getPriceWithDiscount()).toFixed(2);
    };

    item.prototype.toObject = function () {
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

  .service('zlStore', ['$window', function ($window) {
    return {
      get: function (key) {
        if ($window.localStorage[key]) {
          var cart = angular.fromJson($window.localStorage[key]);
          return JSON.parse(cart);
        }
        return false;
      },


      set: function (key, val) {
        if (val === undefined) {
          $window.localStorage.removeItem(key);
        } else {
          $window.localStorage[key] = angular.toJson(val);
        }
        return $window.localStorage[key];
      }
    }
  }])

  .service('zlCartDiscount', ['$rootScope', 'zlCart', '$http', '$q', function ($rootScope, zlCart, $http, $q) {
    this.init = function () {
      this.urlDiscount = "/api/getdiscount/";
    };

    this.setUrlDiscount = function (url) {
      this.urlDiscount = url;
    };

    this.getUrlDiscount = function () {
      return this.urlDiscount;
    };

    this.setDiscount = function (code, callback) {
      var cart = zlCart.getCart();
      $http.post(this.getUrlDiscount() + code, {
        cart: cart
      }).then(function (response) {
        if (response.data) {
          zlCart.$restore(angular.fromJson(response.data));
        }
        callback();
      }, function (error) {
        callback(error);
      })
    };
  }])

  .controller('CartController', ['$scope', 'zlCart', function ($scope, zlCart) {
    $scope.zlCart = zlCart;
  }])

  .value('version', '1.0.11');