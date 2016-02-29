'use strict';

// Create the Socket.io wrapper service
angular.module('core').service('ModalService', ['$rootScope',
  function ($rootScope) {
    var modalService = {};

    modalService.broadcastClose = broadcastClose;

    function broadcastClose() {
      $rootScope.$broadcast('closeModal');
    }

    return modalService;
  }
]);
