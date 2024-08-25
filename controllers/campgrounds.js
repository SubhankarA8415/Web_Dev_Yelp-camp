// just to make things more clear and shorter

const Campground = require('../models/campground');
const {cloudinary} = require("../cloudinary");
const maptilerClient = require("@maptiler/client");
maptilerClient.config.apiKey = process.env.MAPTILER_API_KEY;

module.exports.index = async (req, res, next) => {
    const campgrounds = await Campground.find();
    res.render('campgrounds/index', { campgrounds })
}

module.exports.renderNewForm = (req,res) => {
    res.render('campgrounds/new')
}

module.exports.createCampground = async(req, res, next) => {
    const geoData = await maptilerClient.geocoding.forward(req.body.campground.location, { limit: 1 });
    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.features[0].geometry;
    //const campground = new Campground(req.body.campground);
    campground.images = req.files.map(f => ({url: f.path, filename: f.filename})) // this is a syntax of implicit return
    campground.author = req.user._id;
    await campground.save();
    // console.log(campground)
    req.flash('success', 'Successfully made a new campground!')
    res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.showCampground = async (req, res, next) => {
    const campground = await Campground.findById(req.params.id).populate({path:'reviews', populate: {path:'author'}}).populate('author');
    // populating author of review model above
    if(!campground){
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground })
}

module.exports.renderEditForm = async (req, res, next) => {
    const campground = await Campground.findById(req.params.id)
    if(!campground){
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render("campgrounds/edit", { campground });
}

module.exports.updateCampground = async (req, res, next) => {
    const { id } = req.params;
    //console.log(req.body)
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground}, {new : true});
    const geoData = await maptilerClient.geocoding.forward(req.body.campground.location, { limit: 1 });
    campground.geometry = geoData.features[0].geometry;
    const images = req.files.map(f => ({url: f.path, filename: f.filename}));
    campground.images.push(...images);
    await campground.save();

    // deleting images from cloudinary and mongo
    if(req.body.deleteImages){
        for (let filename of req.body.deleteImages){
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({$pull: {images: {filename: {$in: req.body.deleteImages}}}})
    }
    req.flash('success', 'Successfully updated campground!')
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.deleteCampground = async (req, res, next) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted campground!')
    res.redirect('/campgrounds');
}