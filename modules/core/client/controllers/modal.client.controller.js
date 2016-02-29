'use strict';

angular.module('core').controller('ModalInstanceCtrl', ['$scope', '$uibModalInstance', 'previousPage', 'nextPage', 'imageUrl', 'modalData',
  function ($scope, $uibModalInstance, previousPage, nextPage, imageUrl, modalData) {
    /**
     * Controller members (private)
     */
    var footerImagesStartIndex = 0,
      footerImagesEndIndex = 0,
      maxNumFooterImages = 5,
      numImages = modalData.pageInfo.numImages,
      imagesPerPage = modalData.pageInfo.imagesPerPage,
      currentPage = parseInt(parseInt(modalData.currentImage.imageIndex) / imagesPerPage) + 1;


    /**
     * Expose functions
     */
    $scope.nextImage = nextImage;
    $scope.previousImage = previousImage;
    $scope.updateMainImage = updateMainImage;
    $scope.imageUrl = imageUrl;
    $scope.closeModal = closeModal;
    $scope.showModalControls = false;


    /**
     * Expose data models
     */
    $scope.modalData = modalData;
    $scope.imagesData = modalData.pageInfo.imagesData;
    $scope.footerImages = [];
    $scope.selectedImageStyle = { border: '2px solid #ddd' };
    $scope.currentImageIndex = parseInt(modalData.currentImage.imageIndex);


    // initialize modal
    determineFooterImageIndicies();
    updateFooterImages();

    /**
     * Calculates starting and ending index of images in $scope.imagesData
     */
    function determineFooterImageIndicies() {
      var startIndex, endIndex, numImagesPerSide;

      // calculate range based on current image index
      numImagesPerSide = Math.floor(maxNumFooterImages / 2);
      startIndex = $scope.currentImageIndex - numImagesPerSide;
      endIndex = $scope.currentImageIndex + numImagesPerSide;

      // adjust indicies such that we always have maxNumFooterImages in the modal footer
      if (startIndex < 0) {
        startIndex = 0;
        endIndex = numImagesPerSide * 2;
      }
      if (endIndex >= numImages) {
        endIndex = numImages - 1;
        var temp = endIndex - (numImagesPerSide * 2);
        startIndex = (temp > 0) ? temp: 0;
      }

      footerImagesStartIndex = startIndex;
      footerImagesEndIndex = endIndex;
    }


    /**
     * Adds maxNumFooterImages to footer, called once to create DOM placeholders
     * on initial modal trigger.
     */
    function updateFooterImages() {
      var data;
      $scope.footerImages = [];

      for (var i = footerImagesStartIndex; i <= footerImagesEndIndex; i++) {
        data = {
          imageData: $scope.imagesData[i],
          imagesDataIndex: i
        };
        $scope.footerImages.push(data);
      }
    }


    /**
     * Updates image src attribute. Note, the page update logic works given
     * the assumption that maxNumFooterImages in this controller is less than
     * the calling home controllers $scope.imagesPerPage.
     */
    function updateMainImage(url, clickEvent) {
      if (!clickEvent && !url) {
        return;
      }
      var imageNode, page;

      imageNode = document.getElementById('modal-main-image');
      if (clickEvent) {
        imageNode.src = clickEvent.currentTarget.src;
        $scope.currentImageIndex = parseInt(clickEvent.currentTarget.getAttribute('images-data-index'));
      } else {
        imageNode.src = url;
      }

      page = parseInt($scope.currentImageIndex / imagesPerPage) + 1;
      if (page < currentPage) {
        currentPage = page;
        previousPage();
      } else if (page > currentPage) {
        currentPage = page;
        nextPage();
      }

      determineFooterImageIndicies();
      updateFooterImages();
    }


    /**
     * Updates footerImages array to reflect range based on currentImageIndex
     */
    function nextImage() {
      var url, lastIndex;

      lastIndex = $scope.currentImageIndex;
      $scope.currentImageIndex++;
      if ($scope.currentImageIndex >= numImages) {
        $scope.currentImageIndex = numImages - 1;
      }

      if ($scope.currentImageIndex !== lastIndex) {
        url = imageUrl($scope.imagesData[$scope.currentImageIndex]);
        updateMainImage(url);
      }
    }


    /**
     * Updates footerImages array to reflect range based on currentImageIndex
     */
    function previousImage() {
      var url, lastIndex;

      lastIndex = $scope.currentImageIndex;
      $scope.currentImageIndex--;
      if ($scope.currentImageIndex < 0) {
        $scope.currentImageIndex = 0;
      }

      if ($scope.currentImageIndex !== lastIndex) {
        url = imageUrl($scope.imagesData[$scope.currentImageIndex]);
        updateMainImage(url);
      }
    }


    /**
     * Updates footerImages array to reflect range based on currentImageIndex
     */
    function closeModal() {
      $uibModalInstance.close();
    }


    /**
     * Listener to trigger close from the main view when using the mobile menu.
     */
    $scope.$on('closeModal', function (){
      closeModal();
    });
  }
]);
