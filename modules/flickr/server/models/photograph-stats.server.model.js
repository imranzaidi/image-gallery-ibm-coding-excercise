'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Article Schema
 */
var PhotographStatsSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  _id: {
    type: String,
    default: 'image_statistics',
    trim: true,
    required: 'ID cannot be blank'
  },
  totalNumImages: {
    type: Number,
    default: 0,
    required: 'Total number of Images (totalNumImages) cannot be blank'
  },
  // TODO: keep track of number of rest calls made
  // totalNumRestCallsInLastHour: {
  //   type: Number,
  //   default: 0,
  //   required: 'Total number of rest calls (totalNumRestCallsInLastHour) cannot be blank'
  // }
});

mongoose.model('PhotographStats', PhotographStatsSchema);
