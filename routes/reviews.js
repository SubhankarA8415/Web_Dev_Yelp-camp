const express = require('express');
const router = express.Router({mergeParams: true});
const catchAsync = require('../utils/catchAsync.js');
const {validateReview, isLoggedIn, isReviewAuthor} = require('../middleware.js');
const reviews = require('../controllers/reviews.js');

router.post('/', isLoggedIn, validateReview, catchAsync(reviews.createReview));

router.delete('/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(reviews.deleteReview));

module.exports = router;

// one problem now as routes are separated hence params are also separated
// hence we need to write mergeParams : true in router