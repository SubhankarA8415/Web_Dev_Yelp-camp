const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const {isLoggedIn, isAuthor, validateCampground} = require('../middleware');
const campgrounds = require('../controllers/campgrounds');
const multer = require('multer');
const {storage} = require('../cloudinary');
const upload = multer({storage});


router.route('/')
    .get( catchAsync(campgrounds.index))
    // .post(isLoggedIn, validateCampground, catchAsync(campgrounds.createCampground))
    // upload.array() will take up multiple files and we have to add multiple to image input in ejs file
    // .post(isLoggedIn, validateCampground, upload.array('image'), (req, res) => { // it will allow us to upload a single image file
    //     console.log(req.body, req.files);
    //     res.send('It worked')
    // })
    // to store our images we will use cloudinary a service to store images
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground))
    // multer first uploads things then it validates so we can't validate before uploading

router.get('/new', isLoggedIn, campgrounds.renderNewForm)

router.route('/:id')
    .get(catchAsync(campgrounds.showCampground))
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.updateCampground))
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground))

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm))

module.exports = router;

// so we have made a thing to hide the edit and delete buttons
// but if someone tries to edit or delete using postman or something like that then it will actually happen
// so as to prevent it from happening we will use a middleware to check authorisation
// more fancier way of restructuring routes by using router.route to chain on routes with same path