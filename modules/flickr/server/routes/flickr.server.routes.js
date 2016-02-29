'use strict';

/**
 * Module dependencies.
 */
var controller = require('../controllers/flickr-api-client.server.controller');

module.exports = function (app) {
  // Initial test call route for first set of images
  app.route('/api/images/initial-set')
    .get(controller.initialSet)
    .post(controller.initialSet);

  // Initial test call route for first set of images
  app.route('/api/images/collection')
    .get(controller.getAllImagesBasicData)
    .post(controller.getAllImagesBasicData);
};
