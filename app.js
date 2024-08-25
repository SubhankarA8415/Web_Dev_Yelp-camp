// syntax to import env file to get access to the secrets stored inside .env file
// if(process.env.NODE_ENV !== 'production'){
//     require('dotenv').config();
// }
require('dotenv').config(); // if we ignore development mode then we can directly use this and run in production mode
// NODE_ENV=production node app.js, syntax to run for production

// console.log(process.env.SECRET) accessing the content inside env

const express = require('express');
const app = express();
const path = require('path')
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError');
const campgroundRoutes = require('./routes/campgrounds')
const reviewRoutes = require('./routes/reviews.js')
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/users.js');
const userRoutes = require('./routes/users.js')
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp'; 
const MongoStore = require('connect-mongo');


// 'mongodb://localhost:27017/yelp-camp'

mongoose.connect(dbUrl ,{
    //useNewUrlParser: true,
    //useCreateIndex: true,
    //useUnifiedTopology: true

});

/*
The useUnifiedTopology option in Mongoose is used to opt into using the MongoDB driver's new connection management engine, which was introduced in version 3.2.0 of the MongoDB Node.js driver.
The useNewUrlParser option in Mongoose is used to opt into using the new MongoDB connection string parser. This parser was introduced to handle some issues and inconsistencies present in the old parser, providing better support for connection strings.
The useCreateIndex option in Mongoose is used to opt into using the MongoDB driver's createIndex() function instead of the deprecated ensureIndex() function. This option provides several benefits
*/
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Connected");
});

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({extended: true}))

app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')))

// setting up mongo store to store session info

const store = MongoStore.create({
    mongoUrl: dbUrl, // database url
    touchAfter: 24 * 60 * 60, // time in secs, this is just referring to resaving of session data after 24 hours and it won't constantly resaves as user refreshes the page
    // it will resave only if some session data gets updated
    crypto: {
        secret: 'thisshouldbeabettersecret!'
    }
});

// a sessions collection will be created and all session data will get stored in database

store.on('error', function(e) {
    console.log("SESSION STORE ERROR", e.message); // after doing these pass it inside session.config
})
const sessionConfig = {
    store,
    secret: process.env.SECRET || 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        name: 'session',
        httpOnly: true, // means no third party can explore this cookie from client side
        // secure: true, // https
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        // date.now gives it in miliseconds so we are making it to expire after a week
        maxAge: 1000 * 60 * 60 * 24 * 7
        // so after session is expired user will get logged out
    }
}
app.use(session(sessionConfig))
app.use(flash());
// app.use(helmet({contentSecurityPolicy: false})); // without this we can't use any data from api like map and cloudinary etc
app.use(helmet());
// but disabling this would allow any content from any website hence we need to configure it to allow contents onlt from the websites we are implementing 
// like maptiler, unsplash, bootstrap scripts etc

// these are the thing to get bypassed by our content security policy

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    // "https://api.tiles.mapbox.com/",
    // "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.maptiler.com/", // add this
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    // "https://api.mapbox.com/",
    // "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.maptiler.com/", // add this
];
const connectSrcUrls = [
    // "https://api.mapbox.com/",
    // "https://a.tiles.mapbox.com/",
    // "https://b.tiles.mapbox.com/",
    // "https://events.mapbox.com/",
    "https://api.maptiler.com/", // add this
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dzyrln0hj/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
                "https://api.maptiler.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());
// session should be used before passport.session like here
// passport.session is used to keep us logged in
passport.use(new LocalStrategy(User.authenticate()))
// here we are using a local strategy to authenticate passport on user model
passport.serializeUser(User.serializeUser()) // it's just referring to store user data in session
passport.deserializeUser(User.deserializeUser()) 
// is uses pbkdf2 algorithm to hash its password instead of bcrypt
app.use((req, res, next) => {
    //console.log(req.session)
    res.locals.currentUser = req.user; // it will give an object of user if signed in otherwise it will be undefined
    // it is also coming from passport
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})
app.use('/', userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);
app.use(mongoSanitize({
    replaceWith: '_' // $ sign will be replaced in query string if passed in
}))

app.get('/', (req,res) => {
    res.render('home')
})


app.all('*', (req, res, next) => { // it will work for everything hence all and * written
    
    next(new ExpressError('Page Not Found', 404))
})
app.use((err, req, res, next) => {
    const { statusCode = 500, message = 'Something went wrong :('} = err;
    res.status(statusCode).render('error', {err});
})
app.listen(3000, () => {
    console.log('Server is running on port 3000');
})

// nodemon -L app.js

// working with ejs-mate
// npm i ejs-mate

// error handling

// JOI used as js validator tool
// npm i joi
// we are making a campground schema to categorise errors more effectively

// making one public directory for keeping style sheets and js files
// and we need to tell express to serve fro public directory

// using passport a tool for authenticating node apps
// https://www.passportjs.org/
// npm i passport passport-local passport-local-mongoose

// adding star rating using starability css
// https://github.com/LunarLogic/starability

// .env files making to keep hidden things
// npm i dotenv

// to use cloudinary for image upload
// we need 2 packages
// npm i cloudinary
// npm i multer-storage-cloudinary
// if these won't work

// npm install cloudinary@1.41.3
// npm install multer-storage-cloudinary@4.0.0
// npm install multer@1.4.5-lts.1

// using maptiler to add maps as mapbox needing credit card details
// for steps follow this
// https://coursetutorials.notion.site/YelpCamp-Maps-Replacement-MapTiler-819d354aa8a64058939d35b5799665a4
// npm install @maptiler/client@1.8.1
// for map feature refer section 55 and 56

// database injection
// nosql mongo injection
// Injection attacks occur when an attacker exploits insecure code to insert or “inject” malicious code into a program. This can compromise data integrity, leak sensitive information, or grant unauthorized access. In the context of MongoDB, these types of attacks usually involve manipulating queries to the database
// basically we are preventing any sort of nuesense coming through query string
// to prevent these attacks we use express-mongo-sanitize
// npm i express-mongo-sanitize
// cross site scripting to inject some sort of script into query to get something back
// if we enter some html while creating a campground or editing then ejs will not treat it as html
// but on map it will be treated as html
// we will create some methods to use them with joi schema to prevent html and js safe 
// for this we need sanitize-html package
// npm i sanitize-html

// fixing other security issues with helmet
// npm i helmet
// helmet fixes security issues related to clickjacking, cross scripting etc
// Clickjacking, also known as "UI redress attack," is a malicious technique in which an attacker tricks a user into clicking on something different from what the user perceives. This is done by layering or embedding malicious content, like a transparent iframe, over seemingly innocent web pages or buttons. When the user attempts to click on a button or link that appears legitimate, they actually click on the hidden, malicious element, which can result in unintended actions, such as liking a page, downloading malware, or sharing personal information.

// setting up mongo atlas on cloud to store our mongo data on cloud so as to deploy our project

// XFRysCi8jyLhqBDX -> mongo atlas password
// create cluster, set profile, give network access, connect to cluster using node js and copy paste url

// for storing data using connect-mongo
// npm i connect-mongo
// for delpoying project into render as heroku taking money
// we need to setup git and github repository and add git init to this folder
// then we will add git ignore and add node_modules and env file to it so that they won't get shared
// then we need to push our files into github
// then we click on +new and then web service icon on render and add our git info and the repository we want to show
// then we will click on our repository and then connect it and fill out a form
/*After you find and connect your app's GitHub repository when creating a new service on Render, then you will be taken to a form that you need to fill out to continue the deployment process.

You need to fill out these fields there:

Name: select a simple name for your deployed app. Note: the Name value has an influence on the application URL that you will get when the application is deployed.

Region: choose the region where your app is going to be hosted based on your preference.

Branch: choose the Git branch that you want to use for deployment (you set that up when following the Git and GitHub instructions earlier — for example, the main or the master branch, or some other branch that you've set up for deploying).

Environment/Runtime: Node

Build Command: npm install

Start Command: node app.js

Below that, choose the Free plan for your deployed app */

// and we should also set our session secret in .env file