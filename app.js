// ------------------------ Include NPM ---------------------------
// Include Express
var express = require('express');
// Using Express
var app = express();

// Include Passport
var passport = require('passport');

// Include Connect-flash
var flash = require('connect-flash');
// Include Session
var session = require('express-session');
var cookieParser = require('cookie-parser');
// Using Connect-flash
app.use(cookieParser('keyboard cat'));
app.use(session({cookie: { maxAge: 60000}}));
app.use(flash());

// Include Mongoose - connect to MongoDB
var mongoose = require('mongoose');
var config = require('./config/database');
mongoose.connect(config.database, {useNewUrlParser: true, useUnifiedTopology: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected DB successfully!');
});


// Using Session middleware
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}));

// Include Express-Validator
const ExpressValidator = require('express-validator');
// Using Express Validatior
app.use(ExpressValidator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.')
        , root = namespace.shift()
        , formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    },
    customValidators: {
        isImage: function (value, filename) {
            var extension = (path.extname(filename)).toLowerCase();
            switch(extension) {
                case '.jpg':
                    return '.jpg';
                case '.jpeg':
                    return '.jpeg';
                case '.png':
                    return '.png';
                case '':
                    return '.jpg';
                default:
                    return false;
            }
        }
    }
}));

// Include Express - Fileupload
var fileUpload = require('express-fileupload');
// Using Express - Fileupload
app.use(fileUpload());

// Include Body-parser
app.use(express.urlencoded({ extended: false }));
// parse application/json
app.use(express.json());

// Using Express-Messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});

// Using Path
var path = require('path');

//Setup view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Setup Public folder
var publicDir = require('path').join(__dirname, '/public');
app.use(express.static(publicDir));

// Set global errors variable
app.locals.errors = null;

// Load Page model
var Page = require('./models/page');

// Get all pages and add to header.ejs
Page.find({}).sort({sorting: 1}).exec((err, pages) => {
    if (err) {
        console.log(err);
    } else {
        app.locals.pages = pages;
    }
});

// Load Category model
var Category = require('./models/category');

// Get all categories and add to header.ejs
Category.find((err, categories) => {
    if (err) {
        console.log(err);
    } else {
        app.locals.categories = categories;
    }
});

// Passport config
require('./config/passport')(passport);
// Using Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', (req,res,next) => {
    res.locals.cart = req.session.cart;
    res.locals.user = req.user || null;
    next(); 
})

// ------------------------------------------ Set routes ------------------------------------- //
var pages = require('./routes/pages');
var products = require('./routes/products');
var cart = require('./routes/cart');
var users = require('./routes/users');
var orders = require('./routes/orders');
var adminPages = require('./routes/admin_pages');
var adminCategories = require('./routes/admin_categories');
var adminProducts = require('./routes/admin_products');

// Routing
app.use('/', pages);
app.use('/products', products);
app.use('/cart', cart);
app.use('/users', users);
app.use('/orders', orders);
app.use('/admin/pages', adminPages);
app.use('/admin/categories', adminCategories);
app.use('/admin/products', adminProducts);


// Start the server
const port = 9696;
app.listen(port, function() {
    console.log('This App is running on port ' + port);
})
