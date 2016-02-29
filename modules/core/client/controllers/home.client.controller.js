'use strict';

angular.module('core').controller('HomeController', ['$scope', '$http', '$log', '$window', '$uibModal', 'ModalService',
  function ($scope, $http, $log, $window, $uibModal, ModalService) {
    /**
     * Controller variables (private)
     */
    var fetchedImagesIdList = [],
      imageDomReferences = [],
      pageSetStartIndex = 0,
      pageSetEndIndex = 0,
      pageInputMaxDigits = 4,
      consts = Object.freeze({
        LATEST: 'Latest',
        EARLIEST: 'Earliest',
        PLACEHOLDER_IMAGE: 'modules/core/client/img/transparent.png',
        LOGO_IMAGE: 'modules/core/client/img/brand/nasa-logo.svg.png'
      });
    

    /**
     * Expose functions
     */
    $scope.imageUrl = imageUrl;
    $scope.nextPage = nextPage;
    $scope.previousPage = previousPage;
    $scope.changePage = changePage;
    $scope.validatePageInput = validatePageInput;
    $scope.jumpToPage = jumpToPage;
    $scope.search = search;
    $scope.searchAndUpdateView = searchAndUpdateView;
    $scope.sortImages = sortImages;
    $scope.viewImage = viewImage;
    $scope.closeImageView = closeImageView;
    $scope.clearSearch = clearSearch;


    /**
     * Expose data models
     */
    $scope.imagesData = [];
    $scope.imagesCollection = [];
    $scope.imagesPerPage = 12;
    $scope.maxSize = 5;
    $scope.maxSizeMobile = 3;
    $scope.numPages = 1;
    $scope.numImages = 0;
    $scope.pageInput = '1';
    $scope.currentPage = 1;
    $scope.currentPageSet = [];
    $scope.preloadImageList = [];
    $scope.firstPageImageData = [];
    $scope.lastPageImageData = [];
    $scope.lastPageStartingImageNumber = 0;
    $scope.visibleImageSetStartingNumber = 1;
    $scope.oneToTwelve = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    $scope.placeHolderImageUrl = consts.PLACEHOLDER_IMAGE;
    $scope.logoImageUrl = consts.LOGO_IMAGE;
    $scope.sortOptions = [consts.LATEST, consts.EARLIEST];
    $scope.imagesFetched = false;
    $scope.sortDisabled = true;
    $scope.sortedBy = consts.LATEST;
    $scope.searchInput = '';
    $scope.mobileMenuActive = false;
    $scope.searchEmpty = true;


    /**
     * Initializes the view by loading a small subset of the entire image
     * collection, and then fetches the remaining images data.
     */
    setImageDomReferences();
    getInitialImageSet(getEntireImageSet);


    /**
     * Handles view update logic when the page changes
     */
    function changePage() {
      $scope.pageInput = $scope.currentPage;

      resetImages(function updatePageView() {
        // preload page set
        determinePageSetIndices();
        $scope.preloadImageList = $scope.imagesData.slice(pageSetStartIndex,
          pageSetEndIndex + 1);

        updateVisibleImageSet();
        // fetchImages();
      });
    }


    /**
     * Defaults page view to transparent image, revealing css background
     * loading image.
     */
    function resetImages(callback) {
      var currentReference;
      for (var i = 0; i < imageDomReferences.length; i++) {
        currentReference = imageDomReferences[i];
        document.getElementById(currentReference.imageId).src = $scope.placeHolderImageUrl;
      }

      callback();
    }


    /**
     * Updates page view to current page's images.
     */
    function updateVisibleImageSet() {
      var startIndex, currentReference, imageIndex, imageObject, pictureNumber;

      // determine first image index
      startIndex = ($scope.currentPage - 1) * $scope.imagesPerPage;
      // determine first image display number
      $scope.visibleImageSetStartingNumber = startIndex + 1;
      // update current page images DOM attributes
      for (var i = 0; i < imageDomReferences.length; i++) {
        imageIndex = startIndex + i;
        imageObject = $scope.imagesData[imageIndex];
        pictureNumber = $scope.visibleImageSetStartingNumber + i;

        // we're on the last page and there are no more images left
        if (!imageObject) {
          break;
        }

        currentReference = imageDomReferences[i];
        document.getElementById(currentReference.imageId).parentElement.setAttribute('image-index', imageIndex);
        document.getElementById(currentReference.imageId).src = imageUrl(imageObject);
        document.getElementById(currentReference.numberingId).innerHTML = pictureNumber;
        document.getElementById(currentReference.headingId).innerHTML = imageObject.title;
      }
    }


    /**
     * Rescricts input to pageInputMaxDigits, resets non-numeric strings to
     * current page number.
     */
    function validatePageInput() {
      var input = $scope.pageInput + '';

      if (input === '') {
        return;
      }

      // reset to current page if input is non numeric
      if (input !== '') {
        if (isNaN(input)) {
          $scope.pageInput = $scope.currentPage;
          return;
        }
      }

      // restrict to 4 characters
      if (input.length > pageInputMaxDigits) {
        $scope.pageInput = input.substring(0, pageInputMaxDigits);
        return $scope.pageInput;
      }
    }


    /**
     * Changes current page page to user input number
     */
    function jumpToPage() {
      var s = $scope.pageInput + '',
        n = parseInt(s);

      if (s !== '') {
        if (!isNaN(n) && n <= $scope.numPages && n >= 1) {
          $scope.currentPage = n;
          changePage();
        }
      }
      $scope.mobileMenuActive = false;
    }


    /**
     * Helper function to change page.
     */
    function nextPage() {
      if ($scope.currentPage === $scope.numPages) {
        return;
      }
      $scope.currentPage++;
      changePage();
    }


    /**
     * Helper function to change page.
     */
    function previousPage() {
      if ($scope.currentPage === 0) {
        return;
      }
      $scope.currentPage--;
      changePage();
    }


    /**
     * To avoid a jarring gallery page re-rendering with ngRepeat, and create 
     * a better experience, we are storing a reference to the DOM element ID 
     * for the current page (i.e. visible DOM image list). We then use vanilla
     * javascript to change element attributes. This works well since we're 
     * preloading the current page set of images with 'angular-preload-image'
     * directive.
     */
    function setImageDomReferences() {
      var imageId, headingId, numberingId, reference;

      imageDomReferences = [];
      for (var i = 1; i < 13; i++) {
        imageId = 'image-' + i + '-image';
        headingId = 'image-' + i + '-heading';
        numberingId = 'image-' + i + '-numbering';
        
        reference = {
          imageId: imageId,
          headingId: headingId,
          numberingId: numberingId
        };

        imageDomReferences.push(reference);
      }
    }


    /**
     * Helper function determines start and end index of images accessible via
     * pagination. These are indicies in $scope.imagesData.
     */
    function determinePageSetIndices() {
      var startIndex, endIndex, numPages, pagesLeft, newImage;

      numPages = parseInt($scope.numImages / $scope.imagesPerPage) +
        (($scope.numImages % $scope.imagesPerPage) ? 1 : 0);
      pagesLeft = numPages - $scope.currentPage;

      // determine starting and ending index for images within visible page ranges
      if ($scope.currentPage >= 1 && $scope.currentPage <= $scope.maxSize - 2) {
        startIndex = 0;
        endIndex = startIndex + $scope.imagesPerPage * $scope.maxSize - 1;
      }
      else if ($scope.currentPage > 3 && pagesLeft > 2) {
        startIndex = ($scope.currentPage - 3) * $scope.imagesPerPage;
        endIndex = startIndex + $scope.imagesPerPage * $scope.maxSize - 1;
      }
      else if ($scope.currentPage > 3 && pagesLeft <= 2) {
        endIndex = $scope.imagesPerPage * numPages - 1;
        startIndex = $scope.imagesPerPage * (numPages - $scope.maxSize);

        // if we have five or less pages
        var resetStartIndex = startIndex < 0 || ($scope.maxSize >= $scope.currentPage);
        startIndex = resetStartIndex ? 0 : startIndex;
      }

      pageSetStartIndex = startIndex;
      pageSetEndIndex = endIndex;
    }


    /**
     * We want to keep the first page in the DOM for seamless UX if the user
     * hits the "first page" button.
     */
    function initializeFirstPage() {
      // determine start and end index of images on first page
      var startIndex = 0,
        endIndex = $scope.imagesPerPage - 1;

      if (endIndex > $scope.numImages) {
        endIndex = $scope.numImages - 1;
      }

      // create data model for view
      $scope.firstPageImageData = $scope.imagesData.slice(startIndex, endIndex + 1);
      for (var i = 0; i < $scope.firstPageImageData.length; i++) {
        $scope.firstPageImageData[i].number = i + 1;
        $scope.firstPageImageData[i].imageIndex = i;
      }
    }


    /**
     * We want to keep the last page in the DOM for seamless UX if the user
     * hits the "last page" button.
     */
    function initializeLastPage() {
      // determine start and end index of images on last page
      var startIndex, endIndex, numPages;

      numPages = parseInt($scope.numImages / $scope.imagesPerPage) +
        (($scope.numImages % $scope.imagesPerPage) ? 1: 0);

      startIndex = (numPages - 1) * $scope.imagesPerPage;
      endIndex = $scope.numImages - 1;

      // create data model for view
      $scope.lastPageImageData = $scope.imagesData.slice(startIndex, endIndex + 1);
      for (var i = 0; i < $scope.lastPageImageData.length; i++) {
        $scope.lastPageImageData[i].number = startIndex + i + 1;
        $scope.lastPageImageData[i].imageIndex = startIndex + i;
      }
      $scope.lastPageStartingImageNumber = startIndex + 1;
      $scope.numPages = numPages;
    }


    function sortImages(order) {
      var sortedByLatest = $scope.sortedBy === consts.LATEST;
      // current sorting is same as order
      if ($scope.sortedBy === order) {
        return;
      }

      // update sorting
      if (order === consts.EARLIEST && sortedByLatest) {
        $scope.imagesData.reverse();
        $scope.sortedBy = consts.EARLIEST;
      }
      else if (order === consts.LATEST && !sortedByLatest) {
        $scope.imagesData.reverse();
        $scope.sortedBy = consts.LATEST;
      }

      // update view
      updateImagesPageView();
    }


    /**
     * Performs search based on title.
     */
    function search() {
      var results = [],
        searchRegex = new RegExp($scope.searchInput, 'i');

      if (!$scope.searchInput) {
        results = $scope.imagesCollection;
      } else {
        for (var i = 0; i < $scope.imagesCollection.length; i++) {
          if (searchRegex.test($scope.imagesCollection[i].title)) {
            results.push($scope.imagesCollection[i]);
          }
        }  
      }

      $scope.imagesData = results;
      $scope.numImages = $scope.imagesData.length;
    }


    /**
     * Refreshes images page view.
     */
    function updateImagesPageView() {
      initializeFirstPage();
      initializeLastPage();
      changePage();
    }


    /**
     * Performs search and updates view, made specifically for binding to UI
     * elements where a view update is desired after the search is perfmoed.
     */
    function searchAndUpdateView() {
      $scope.search();
      if ($scope.searchInput !== '') {
        updateImagesPageView();
        $scope.pageInput = 1;
        $scope.currentPage = $scope.pageInput;
        $scope.searchEmpty = false;
      } else {
        $scope.searchEmpty = true;
        updateImagesPageView();
      }
      
      $scope.mobileMenuActive = false;
    }


    /**
     * Clears search parameters and resets images page view.
     */
    function clearSearch() {
      $scope.searchInput = '';
      searchAndUpdateView();
    }


    /**
     * Displays image when clicked in a modal.
     */
    function viewImage(clickEvent) {
      var imageIndex, clickedImage, defaultImageUrl;

      if (!clickEvent) {
        return;
      } else {
        imageIndex = clickEvent.currentTarget.getAttribute('image-index');
        clickedImage = $scope.imagesData[imageIndex];
        defaultImageUrl = imageUrl(clickedImage);
      }
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'imageViewerModal.html',
        controller: 'ModalInstanceCtrl',
        size: 'lg',
        resolve: {
          modalData: function () {
            var data = {
              currentImage: {
                defaultImageUrl: defaultImageUrl || $scope.placeHolderImageUrl,
                flickData: clickedImage,
                imageIndex: imageIndex
              },
              pageInfo: {
                numImages: $scope.numImages,
                imagesData: $scope.imagesData,
                imagesPerPage: $scope.imagesPerPage
              }
            };

            return data;
          },
          nextPage: function () {
            return $scope.nextPage;
          },
          previousPage: function () {
            return $scope.previousPage;
          },
          imageUrl: function() {
            return $scope.imageUrl;
          }
        }
      });

      modalInstance.result.then(function () {
      }, function () {
        $log.log('Modal closed:', imageIndex, new Date());
      });
    }


    /**
     * Notifies modal controller to close modal.
     */
    function closeImageView() {
      ModalService.broadcastClose();
    }


    /**
     * Returns image url for a given size, defaults to "default" flickr size.
     */
    function imageUrl(imageData, size) {
      var urlSubstring, url;

      urlSubstring = 'http://farm' + imageData.farm + '.staticflickr.com/' +
        imageData.server + '/' + imageData.id + '_' + imageData.secret;

      switch (size) {
        case 'square':
          url = urlSubstring + '_s.jpg';
          break;
        case 'large square':
          url = urlSubstring + '_q.jpg';
          break;
        case 'thumbnail':
          url = urlSubstring + '_t.jpg';
          break;
        case 'small':
          url = urlSubstring + '_m.jpg';
          break;
        case 'small 320':
          url = urlSubstring + '_n.jpg';
          break;
        case 'medium':
          url = urlSubstring + '.jpg';
          break;
        case 'medium 640':
          url = urlSubstring + '_z.jpg';
          break;
        case 'medium 800':
          url = urlSubstring + '_c.jpg';
          break;
        case 'large':
          url = urlSubstring + '_b.jpg';
          break;
        case 'large 1600':
          url = urlSubstring + '_h.jpg';
          break;
        case 'large 2048':
          url = urlSubstring + '_k.jpg';
          break;
        case 'original':
          url = urlSubstring + '_o.jpg';
          break;
        default:
          url = urlSubstring + '.jpg';
          break;
      }

      return url;
    }


    /**
     * Initiates get requests for images accessible via pagination so the
     * browser already has them cached.
     */
    function fetchImages() {
      for (var i = pageSetStartIndex; i <= pageSetEndIndex; i++) {
        fetchImage(i);
      }
    }

    /**
     * Helper function to get a single image, invoked by fetchImages().
     */
    function fetchImage(i) {
      if (i >= 0 && i < $scope.numImages) {
        var url = imageUrl($scope.imagesData[i]);

        if (fetchedImagesIdList.indexOf($scope.imagesData[i].id) !== -1) {
          return;
        }

        $log.log('Fetching imagesData[' + i + '] from' + url + ', object:', $scope.imagesData[i]);

        ($http.get(url)
        .then(function (respose) {
          fetchedImagesIdList.push($scope.imagesData[i].id);

          $log.log('Image',$scope.imagesData[i].id, 'fetched.');
        }))(i, url);
      } else {
        $log.log('fetchImage() > Value of i is out of bound:', i);
      }
    }


    /**
     * Fetches first page of image data.
     */
    function getInitialImageSet(callback) {
      $http.get('/api/images/initial-set').
        success(function(data, status, headers, config) {
          $scope.imagesCollection = data;
          $scope.imagesData = $scope.imagesCollection;
          $scope.numImages = $scope.imagesData.length;

          // trigger view update
          initializeFirstPage();
          initializeLastPage();
          $scope.imagesFetched = true;
          $scope.sortDisabled = false;
          changePage();

          $window.numImages = $scope.numImages;
          $window.imagesData = $scope.imagesData;
          $window.imagesCollection = $scope.imagesCollection;
          callback();
        }).
        error(function(data, status, headers, config) {
          logResponse(false, data, status, headers, config);
          getInitialImageSet();
        });
    }


    /**
     * Fetches all page of image data.
     */
    function getEntireImageSet() {
      $http.get('/api/images/collection').
        success(function(data, status, headers, config) {
          var sortedByLatest = $scope.sortedBy === consts.LATEST;
          $scope.imagesCollection = data;

          // update image data
          $scope.imagesData = data;
          $scope.numImages = $scope.imagesData.length;
          // preserve order and search filter
          if (!sortedByLatest) {
            $scope.imagesData = $scope.imagesData.reverse();
            $scope.numImages = $scope.imagesData.length;
          }
          $scope.search();
          initializeLastPage();

          $window.numImages = $scope.numImages;
          $window.imagesData = $scope.imagesData;
          $window.imagesCollection = $scope.imagesCollection;
        }).
        error(function(data, status, headers, config) {
          logResponse(false, data, status, headers, config);
        });
    }


    /**
     * Helper function for inspecting REST calls.
     */
    function logResponse(success, data, status, headers, config) {
      var statusString;
      if (success) {
        statusString = 'successfull';
      } else {
        statusString = 'failed';
      }

      $log.log('--- API call', status, '---\n');
      $log.log('data:', data);
      $log.log('status:', status);
      $log.log('headers:', headers);
      $log.log('config:', config, '\n\n\n\n');
    }
  }
]);
