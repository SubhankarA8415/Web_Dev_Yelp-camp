const mongoose = require('mongoose')
const Review = require('./review')
const Schema = mongoose.Schema;

// defining separate image schema to add thumbnailed images
const ImageSchema = new Schema({
    url: String,
    filename: String
    });

ImageSchema.virtual('thumbnail').get(function() { // w_200 means viewheight of 200 a small image will be displayed
    // reason for using virtual is we are not actually storing it in databas we are just modifying it whenever we will use edit page
    return this.url.replace('/upload', '/upload/w_200');
})

const opts = { toJSON: { virtuals: true } }; // this opts is used just to include the popup as it is not a part of schema it's a virtual

const CampgroundSchema = new Schema({
    title: String,
    // images: [
    //     {
    //         url: String, // stroing path in url and filename in filename
    //         filename: String
    //     }
    // ],
    images: [ImageSchema],
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    price: Number,
    description: String,
    location: String,
    author: { // adding author to campgrounds to edit and do all the stuffs whoever created it
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    // as we are adding author at this time we need to re run seed/index.js as the campgrounds before are not associated with any author
    // so i'll create an account upon my name and i'll add the user id to my seed/index.js so that my user id will be associated with those initial campgrounds
    // hence i'll become the owner of the initial campgrounds uploaded
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
}, opts);
// mongoose middleware for findByIdAndDelete is findOneAndDelete

// setting up a campground virtual to show a popup text on map
CampgroundSchema.virtual('properties.popUpMarkup').get(function () {
    return ` <strong><a href="/campgrounds/${this._id}">${this.title}</a><strong>
    <p>${this.description.substring(0, 20)}...</p>`
});
CampgroundSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Review.deleteMany({ _id: { $in: doc.reviews } });
        }
})
module.exports = mongoose.model('Campground',CampgroundSchema)
