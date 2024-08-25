const User = require('../models/users');

module.exports.renderRegister = (req, res) => {
    res.render('users/register')
}

module.exports.register = async(req, res) => {
    try{
    const { email, username, password } = req.body;
    const user = new User({ email, username });
    const registeredUser = await User.register(user, password); // this is an inbuilt register function and it automatically hashes password
    // below code is to keep user loggedIn after registering
    req.login(registeredUser, err => {
        if (err) return next(err);
        req.flash('success', 'Welcome to Yelp Camp!');
        res.redirect('/campgrounds'); 
    })
    // console.log(registeredUser);   
    } catch(e){
        req.flash('error', e.message)
        res.redirect('/register')
    }  
}

module.exports.renderLogin = (req, res) => {
    res.render('users/login')
}

module.exports.login = (req, res) => {
    req.flash('success', 'Welcome back to Yelp Camp!');
    const redirectUrl = res.locals.returnTo || '/campgrounds'
    //console.log(redirectUrl)
    //delete req.locals.returnTo;
    res.redirect(redirectUrl);
}

module.exports.logout = (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Successfully Logged Out!');
        res.redirect('/campgrounds');
    });
}