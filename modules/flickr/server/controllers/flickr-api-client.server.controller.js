'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  path = require('path'),
  mongoose = require('mongoose'),
  request = require('request'),
  async = require('async'),
  Photograph = mongoose.model('Photograph'),
  PhotographStats = mongoose.model('PhotographStats'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));


/**
 * Module members.
 */
var apiUrl = 'https://api.flickr.com/services/rest/',
  apiKey = 'a5e95177da353f58113fd60296e1d250',
  nasaUserId = '24662369@N07',
  methodString = '?method=',
  formatString = '&format=json&nojsoncallback=1',
  imageStatisticsDocumentId = 'image_statistics';


/**
 * Initial REST call to determine total number of pictures.
 */
function fetchPublicImagesStatistics(callback) {
  var pageNumber = 1,
    resultsPerPage = 500,
    timeStamp = Date.now();

  // use the fetchPage() to get statistics and first page
  fetchPage(pageNumber, resultsPerPage, function (err, data) {
    if (err) {
      return callback(err);
    }

    var statsObject, stats, queryObject, firstPageImagesData;
    
    firstPageImagesData = data.photo;
    queryObject = { _id: imageStatisticsDocumentId };
    /**
     * TODO: Keep track of number of rest calls made. Skipped, refer to note below.
     *
     * TODO: Implementation skipped to avoid any caching or other API use terms and
     * policies issues. Also note NASA's account has thousands of images, to issue a
     * separate request for each item to serve additional data and enrich the user
     * experience would require caching and background tasks to periodically store
     * this data.
     */
    statsObject = {
      _id: imageStatisticsDocumentId,
      totalNumImages: data.total
    };

    // store images statistics to DB if they don't exist, update if needed
    PhotographStats.findOne(queryObject, function (findError, photographStatistics) {
      if (findError) {
        console.log('fetchPublicImagesStatistics() > PhotographStats.findOne() error:', findError);
        return callback(findError);
      }

      if (!photographStatistics) {
        // create DB entry for image statistics
        stats = new PhotographStats(statsObject);

        stats.save(function (createError, createdData){
          if (createError) {
            console.log('fetchPublicImagesStatistics() > stats.save() create error:', createError);
            return callback(createError);
          }

          createdData.firstPageImagesData = firstPageImagesData;
          callback(null, createdData);
        });
      }
      else {
        // update statistics if needed
        if (photographStatistics.totalNumImages !== statsObject.totalNumImages) {
          photographStatistics.totalNumPages = statsObject.totalNumImages;

          photographStatistics.save(function (updateError, updatedData) {
            if (updateError) {
              console.log('fetchPublicImagesStatistics() > stats.save() update error:', updateError);
              return callback(updateError);
            }

            updatedData.firstPageImagesData = firstPageImagesData;
            callback(null, updatedData);
          });
        } else {

          statsObject.firstPageImagesData = firstPageImagesData;
          callback(null, statsObject);
        }
      }
    });
  });
}


/**
 * Fetch basic data for all images per page.
 */
function fetchPage(page, imagesPerPage, callback) {
  var method, pageNumber, url, perPage;

  method = 'flickr.people.getPublicPhotos';
  pageNumber = page ? page : 1;
  perPage = imagesPerPage ? imagesPerPage : 100;

  url = apiUrl + methodString + method + '&api_key=' + apiKey + '&user_id=' +
    nasaUserId + '&page=' + pageNumber + '&per_page=' + perPage + formatString;

  request(url, function (err, response, body) {
    if (err) {
      console.log('fetchPage() > request() error:', err);
      return callback(err);
    }

    var responseBody = JSON.parse(response.body.toString());
    callback(null, responseBody.photos);
  });
}


/**
 * Fetch basic data for all images.
 */
function fetchAllPages(totalNumImages, imagesPerPage, callback) {
  var perPage = imagesPerPage ? imagesPerPage : 500,
    numPages = parseInt(totalNumImages / perPage) + ((totalNumImages % perPage) ? 1 : 0),
    pageNumbers = [],
    imagesData = [];

  for (var i = 1; i < numPages + 1; i++) {
    pageNumbers.push(i);
  }

  async.eachSeries(pageNumbers, function (pageNumber, eachCallback) {
    fetchPage(pageNumber, perPage, function (pageFetchError, pageData) {
      if (pageFetchError) {
        console.log('fetchAllPages() > fetchPage() > async.eachSeries() error:', pageFetchError);
        return eachCallback(pageFetchError);
      }

      imagesData = imagesData.concat(pageData.photo);
      eachCallback();
    });
  }, function (err) {
    if (err) {
      console.log('fetchAllPages() > fetchPage() > async.eachSeries() [final callback] error:', err);
      return callback(err);
    }
    
    callback(null, imagesData);
  });
}


/**
 * Store data for all images to DB. This is called upon the first time retrieval
 * of all image data.
 *
 * TODO: Implementation skipped to avoid any caching or other API use terms and
 * policies issues. Also note NASA's account has thousands of images, to issue a
 * separate request for each item to serve additional data and enrich the user
 * experience would require caching and background tasks to periodically store
 * this data.
 */
function saveAllImageData(data, callback) {

}


/**
 * Store data for an image to DB.
 *
 * TODO: Implementation skipped to avoid any caching or other API use terms and
 * policies issues. Also note NASA's account has thousands of images, to issue a
 * separate request for each item to serve additional data and enrich the user
 * experience would require caching and background tasks to periodically store
 * this data.
 */
function saveImageData(data, callback) {

}


/**
 * Gets firts page of image data to have something ready for client to consume
 * once the app starts.
 */
function initialSet(req, res) {
  var pageNumber = 2,
    resultsPerPage = 500;

  fetchPublicImagesStatistics(function (err, stats) {
    if (err) {
      console.log('initialSet() > findError error:', err);

      return res.status(500).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    var imagesData = stats.firstPageImagesData;
    res.send(imagesData);
  });
}


/**
 * Gets entire collection of image data and serves it after client invokes
 * initialSet.
 */
function getAllImagesBasicData(req, res) {
  var resultsPerPage = 500,
    queryObject = { _id: imageStatisticsDocumentId };

  PhotographStats.findOne(queryObject, function (findError, photographStatistics) {
    if (findError) {
      console.log('getAllImagesBasicData() > findError error:', findError);

      return res.status(500).send({
        message: errorHandler.getErrorMessage(findError)
      });
    }

    var fetchAllImageData = function () {
      fetchAllPages(photographStatistics.totalNumImages, resultsPerPage, function (pagesFetchError, imagesData) {
        if (pagesFetchError) {
          console.log('test() > fetchAllPages() error:', pagesFetchError);
          return res.status(500).send({
            message: errorHandler.getErrorMessage(pagesFetchError)
          });
        }

        console.log('test() > fetchAllPages() response object:', imagesData);
        res.send(imagesData);
      });
    };

    if (photographStatistics) {
      fetchAllImageData();
    } else {
      fetchPublicImagesStatistics(fetchAllImageData);
    }
  });
}


/**
 * Expose functions.
 */
module.exports = {
  initialSet: initialSet,
  getAllImagesBasicData: getAllImagesBasicData
};