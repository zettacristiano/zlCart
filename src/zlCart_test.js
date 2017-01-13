'use strict';

describe('zlCart module', function () {
  beforeEach(module('zlCart'));


  describe('value - version', function () {
    it('should return current version', inject(function (version) {
      expect(version).toEqual('1.0.10');
    }));
  });


  describe('CartController', function () {

    var $controller;

    beforeEach(inject(function (_$controller_) {
      // The injector unwraps the underscores (_) from around the parameter names when matching
      $controller = _$controller_;
    }));

    describe('$scope.zlCart', function () {

      var $scope;
      var controller;

      function addItem(id, name, price, tax, quantity, data) {
        $scope.zlCart.addItem(id, name, price, tax, quantity, data);
      }

      beforeEach(function () {
        $scope = {};
        controller = $controller('CartController', {
          $scope: $scope
        });

      });

      it('sets instance of zlCart to scope', function () {
        expect(typeof $scope.zlCart).toEqual('object');
      });


      it('should be able to add an item', function () {
        addItem(1, 'Test Item', 10, 23, 2);
        expect($scope.zlCart.getItems().length).toEqual(1);
      });


      it('should be able to empty', function () {
        $scope.zlCart.empty();
        expect($scope.zlCart.getItems().length).toEqual(0);
      });

      it('should be able to show isEmpty', function () {
        $scope.zlCart.empty();
        expect($scope.zlCart.isEmpty()).toEqual(true);
      });


      describe('zlCart', function () {


        beforeEach(function () {

          $scope.zlCart.setTaxRate(7.5);
          $scope.zlCart.setShipping(12.50);
          addItem(1, 'Work boots', 189.99, 23, 1);
          addItem(2, 'Hockey gloves', 85, 23, 2);
          addItem('cpBow', 'Compound bow', 499.95, 23, 1);
        });



        it('tax should be set', function () {
          expect($scope.zlCart.getTaxRate()).toEqual(7.5);
        });

        it('shipping should be set', function () {
          expect($scope.zlCart.getShipping()).toEqual(12.50);
        });

        it('tax charge should be ', function () {
          expect($scope.zlCart.getTax()).toEqual(64.5);
        });

        it('count items in total', function () {
          expect($scope.zlCart.getTotalItems()).toEqual(4);
        });

        it('count unique items in cart', function () {
          expect($scope.zlCart.getTotalUniqueItems()).toEqual(3);
        });


        it('check getItems has correct number of items', function () {
          expect($scope.zlCart.getItems().length).toEqual(3);
        });

        it('Have correct getSubTotal', function () {
          expect($scope.zlCart.getSubTotal()).toEqual(859.94);
        });

        it('should be able to show isEmpty correctly as false', function () {
          expect($scope.zlCart.isEmpty()).toEqual(false);
        });

        it('Have correct totalCost', function () {
          expect($scope.zlCart.totalCost()).toEqual(936.94);
        });


        it('find item by id (by int) ', function () {
          expect($scope.zlCart.getItemById(2).getName()).toEqual('Hockey gloves');
        });


        it('find item by id (by string) ', function () {
          expect($scope.zlCart.getItemById('cpBow').getName()).toEqual('Compound bow');
        });


        it('remove item by ID', function () {
          $scope.zlCart.removeItemById('cpBow');
          expect($scope.zlCart.getItemById('cpBow')).toEqual(false);
          expect($scope.zlCart.getTotalUniqueItems()).toEqual(2);
        });


        it('remove item by ID', function () {
          $scope.zlCart.removeItemById('cpBow');
          expect($scope.zlCart.getItemById('cpBow')).toEqual(false);
        });

        it('should create an object', function () {
          var obj = $scope.zlCart.toObject();
          expect(obj.shipping).toEqual(12.50);
          expect(obj.tax).toEqual(64.5);
          expect(obj.taxRate).toEqual(7.5);
          expect(obj.subTotal).toEqual(859.94);
          expect(obj.totalCost).toEqual(936.94);
          expect(obj.items.length).toEqual(3);
        });


      });

      describe('zlCartItem', function () {

        var zlCartItem;

        beforeEach(function () {
          addItem('lRope', 'Lariat rope', 39.99);
          zlCartItem = $scope.zlCart.getItemById('lRope');
        });


        it('should have correct Name', function () {
          expect(zlCartItem.getName()).toEqual('Lariat rope');
        });

        it('should default quantity to 1', function () {
          expect(zlCartItem.getQuantity()).toEqual(1);
        });

        it('should update quantity', function () {
          expect(zlCartItem.getName()).toEqual('Lariat rope');
        });

        it('should absolutely update quantity', function () {
          expect(zlCartItem.getQuantity()).toEqual(1);
          zlCartItem.setQuantity(5);
          expect(zlCartItem.getQuantity()).toEqual(5);
        });

        it('should relatively update quantity', function () {
          expect(zlCartItem.getQuantity()).toEqual(1);
          zlCartItem.setQuantity(1, true);
          expect(zlCartItem.getQuantity()).toEqual(2);
        });


        it('should get total', function () {
          expect(zlCartItem.getTotal()).toEqual(39.99);
        });

        it('should update total after quantity change', function () {
          zlCartItem.setQuantity(1, true);
          expect(zlCartItem.getTotal()).toEqual(79.98);
        });


        it('should create an object', function () {
          var obj = zlCartItem.toObject();
          expect(obj.id).toEqual('lRope');
          expect(obj.name).toEqual('Lariat rope');
          expect(obj.price).toEqual(39.99);
          expect(obj.quantity).toEqual(1);
          expect(obj.data).toEqual(null);
          expect(obj.total).toEqual(39.99);
        });


      })

    })
  });





  describe('zlCartItem', function () {

    //var zlCartItem;
    //
    //beforeEach(inject(function(_zlCartItem_){
    //    // The injector unwraps the underscores (_) from around the parameter names when matching
    //
    //
    //    var $rootScope = {};
    //     zlCartItem = _zlCartItem_('zlCartItem', { $rootScope: $rootScope });
    //
    //}));
    //
    //describe('$scope.zlCart', function() {
    //
    //    it('sets instance of zlCart to scope', function() {
    //       console.log( zlCartItem);
    //        expect(zlCartItem.getQuantity()).toEqual(1);
    //    });
    //
    //});
  });

  describe('zlCart', function () {

    //var $service;
    //
    //beforeEach(inject(function(_zlCartService_){
    //    // The injector unwraps the underscores (_) from around the parameter names when matching
    //    $service = _zlCartService_;
    //}));
    //
    //describe('zlCart.init', function() {
    //
    //    console.log ($service)
    //    it('sets instance of zlCart to scope', function() {
    //        var $scope = {};
    //        //var service = $service('zlCart', { $scope: $scope });
    //
    //        //expect('object').toEqual('object');
    //    });
    //
    //});
  });





});