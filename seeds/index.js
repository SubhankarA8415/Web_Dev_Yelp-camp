if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
}
const mongoose = require('mongoose');
const cities = require('./cities');
const {places, descriptors} = require('./seedHelpers');
const Campground = require('../models/campground');
const DB_URL = process.env.DB_URL;
mongoose.connect(DB_URL,{
    //useNewUrlParser: true,
    //useCreateIndex: true,
    //useUnifiedTopology: true

});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Connected");
});

const sample = (array) => {
    return array[Math.floor(Math.random() * array.length)];
}
const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i< 300; i++){
        const random = Math.floor(Math.random()*cities.length);
        const price = Math.floor(Math.random() * 20) + 10
        const camp = new Campground({
            author: '66c34f5f6ef35490923d9c65',
            location: `${cities[random].city}, ${cities[random].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            // image: `https://picsum.photos/400?random=${Math.random()}`,
            description: `Lorem ipsum dolor, sit amet consectetur adipisicing elit. Veritatis possimus unde labore ex? Officiis optio vitae magni consequuntur! Obcaecati perspiciatis deleniti, dolorem omnis earum quia nam totam adipisci quaerat qui.`,
            price,
            geometry: {
                type: 'Point',
                coordinates: [cities[random].longitude,
                cities[random].latitude
            ]
            },
            images:  [
                {
                url: 'https://res.cloudinary.com/dzyrln0hj/image/upload/v1724339013/YelpCamp/ivov6u7bgjbkameqturm.jpg',
                filename: 'YelpCamp/ivov6u7bgjbkameqturm'
                },
                {
                url: 'https://res.cloudinary.com/dzyrln0hj/image/upload/v1724339014/YelpCamp/rhu9rjxtyvkyzfgwzf6f.jpg',
                filename: 'YelpCamp/rhu9rjxtyvkyzfgwzf6f',
                },
                {
                 url: 'https://res.cloudinary.com/dzyrln0hj/image/upload/v1724339016/YelpCamp/wkokzik6q0y7a8xwnope.jpg',
                filename: 'YelpCamp/wkokzik6q0y7a8xwnope'
            }
        ]
    })
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})
console.log('done');