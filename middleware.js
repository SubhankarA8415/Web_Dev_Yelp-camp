const ExpressError = require('./utils/ExpressError');
const { campgroundSchema, reviewSchema } = require('./schemas.js');
const Campground = require('./models/campground');
const Review = require('./models/review');

const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl; // returning the url where user was before logging in
        req.flash('error', 'Login required');
        return res.redirect('/login');
    }
    next();
} 
const storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
        //console.log(res.locals.returnTo)
    }
    next();
} // this is a middleware to store the return value to redirect user to where he was on in the website
// isLoggedIn is an inbuilt function of passport to check if the user is logged in or not
// and for this only we need that serialized and deserialized in app.js

const validateCampground = (req, res, next) => {
    // if(!req.body.campground) throw new ExpressError('Invalid Campground Data', 400);
   const {error} = campgroundSchema.validate(req.body);
   if(error){
       const msg = error.details.map(el => el.message).join(',')
       throw new ExpressError(msg, 400)
   } else{
       next();
   }
}

const isAuthor = async(req, res, next) => {  // middleware to verify authorization
    const {id} = req.params;
    const campground = await Campground.findById(id);
    if(!campground.author.equals(req.user._id)){
        req.flash('error', 'You do not have permission to do that');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

const validateReview = (req, res, next) => {
    const {error} = reviewSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else{
        next();
    }

}

const isReviewAuthor = async(req, res, next) => {  // middleware to verify authorization
    const {id, reviewId} = req.params; // this reviewId is written same like this in our review route so we need to write it that way only
    const review = await Review.findById(reviewId);
    if(!review.author.equals(req.user._id)){
        req.flash('error', 'You do not have permission to do that');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

module.exports = {isLoggedIn, storeReturnTo, validateCampground, isAuthor, validateReview, isReviewAuthor};