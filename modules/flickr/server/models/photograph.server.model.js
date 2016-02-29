'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Article Schema
 */
var PhotographSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  _id: {
    type: String,
    default: '',
    trim: true,
    unique: true,
    required: 'ID cannot be blank'
  },
  title: {
    type: String,
    default: '',
    trim: true,
    required: 'Title cannot be blank'
  },
  secret: {
    type: String,
    default: '',
    trim: true,
    required: 'Secret cannot be blank'
  },
  server: {
    type: String,
    default: '',
    trim: true,
    required: 'Server cannot be blank'
  }
});

mongoose.model('Photograph', PhotographSchema);
