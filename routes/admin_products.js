var express = require('express');
var router = express.Router();
var mkdir = require('mkdirp');
var fs = require('fs-extra');
var resizeImg = require('resize-img');
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;

// Load Product model
var Product = require('../models/product');

// Load Category model
var Category = require('../models/category');

/* 
* GET product index
*/
router.get('/', isAdmin, (req,res) => {
   var count;

   Product.count((err, c) => {
       count = c;
   });

   Product.find((err, products) => {
       res.render('admin/products', {
           products: products,
           count: count
       });
   });
});

/* 
* GET add product
*/
router.get('/add-product', isAdmin, (req,res) => {
    var title = "";
    var description = "";
    var price = "";

    Category.find((err, categories) => {
        res.render('admin/add_product', {
            title: title,
            description: description,
            categories: categories,
            price: price
         });
    })
});

/* 
* POST add product
*/
router.post('/add-product', (req,res) => {

    var imageFile = typeof req.files.image != "undefined" ? req.files.image.name : "";

    req.checkBody('title','Title must have a value').notEmpty();
    req.checkBody('description','Description must have a value').notEmpty();
    req.checkBody('price','Price must have a value').isDecimal();
    req.checkBody('image', 'You must upload an image').isImage(imageFile);

    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var description = req.body.description;
    var price = req.body.price;
    var category = req.body.category;

    var errors = req.validationErrors();

    if(errors) {
        Category.find((err, categories) => {
            res.render('admin/add_product', {
                errors: errors,
                title: title,
                description: description,
                categories: categories,
                price: price
             });
        });
    } else {
        Product.findOne({slug: slug}, (err, product) => {
            if (product) {
                req.flash('Danger', 'Product title exists, choose another!');
                Category.find((err, categories) => {
                    res.render('admin/add_product', {
                        errors: errors,
                        title: title,
                        description: description,
                        categories: categories,
                        price: price
                     });
                });
            } else {
                var price2 = parseFloat(price).toFixed(2);
                var product = new Product({
                    title: title,
                    slug: slug,
                    description: description,
                    price: price2,
                    category: category,
                    image: imageFile
                });

                product.save((err) => {
                    if (err) return console.log(err);

                    mkdir('public/product_images/' + product._id, (err) => {
                        console.log(err);
                    });

                    mkdir('public/product_images/' + product._id + '/gallery', (err) => {
                        console.log(err);
                    });

                    mkdir('public/product_images/' + product._id + '/gallery/thumbs', (err) => {
                        console.log(err);
                    });

                    if (imageFile != "") {
                        var productImage = req.files.image;
                        var path = 'public/product_images/' + product._id + '/' + imageFile;

                        productImage.mv(path, (err) => {
                            return console.log(err);
                        })
                    }

                    req.flash('Success', 'Product added.');
                    res.redirect('/admin/products');
                });
            }
        });
    }
});

/* 
* GET edit product
*/
router.get('/edit-product/:id', isAdmin, (req,res) => {

    var errors;

    if (req.session.errors) errors = req.session.errors;
    req.session.errors = null;

    Category.find((err, categories) => {

        Product.findById(req.params.id, (err, product) => {
            if (err) {
                console.log(err);
                res.redireact('/admin/products');
            } else {
                var galleryDir = 'public/product_images/' + product._id + '/gallery';
                var galleryImages = null;

                fs.readdir(galleryDir, (err, files) => {
                    if (err) {
                        console.log(err);
                    } else {
                        galleryImages = files;

                        res.render('admin/edit_product', {
                            errors: errors,
                            title: product.title,
                            description: product.description,
                            categories: categories,
                            category: product.category.replace(/\s+/g, '-').toLowerCase(),
                            price: parseFloat(product.price).toFixed(2),
                            image: product.image,
                            galleryImages: galleryImages,
                            id: product._id
                         });
                    }
                });
            }
        });
    });
    
});

/* 
* POST edit product
*/
router.post('/edit-product/:id', (req,res) => {

    var imageFile = typeof req.files.image != "undefined" ? req.files.image.name : "";

    req.checkBody('title','Title must have a value').notEmpty();
    req.checkBody('description','Description must have a value').notEmpty();
    req.checkBody('price','Price must have a value').isDecimal();
    req.checkBody('image', 'You must upload an image').isImage(imageFile);

    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var description = req.body.description;
    var price = req.body.price;
    var category = req.body.category;
    var image = req.body.image;
    var id = req.params.id;

    var errors = req.validationErrors();

    if (errors) {
        req.session.errors = errors;
        res.redirect('/admin/products/edit-product' + id);
    } else {
        Product.findOne({slug: slug, _id: {'$ne':id}}, (err, product) => {
            if (err) {
                console.log(err);
            }
            if (product) {
                req.flash('danger', 'Product title exists, choose another!');
                req.redirect('/admin/products/edit-product/' + id);
            } else {
                Product.findById(id, (err, product) => {
                    if (err) {
                        console.log(err);
                    }

                    product.title = title;
                    product.slug = slug;
                    product.description = description;
                    product.price = parseFloat(price).toFixed(2);
                    product.category = category;
                    if (imageFile != "") {
                        product.image = imageFile;
                    }

                    product.save((err) => {
                        if (err) {
                            console.log(err);
                        }

                        if (imageFile != "") {
                            if (image != "") {
                                fs.remove('public/product_images/' + id + '/' + mage, (err) => {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                            }

                            var productImage = req.files.image;
                            var path = 'public/product_images/' + id + '/' + imageFile;

                            productImage.mv(path, (err) => {
                            return console.log(err);
                            });
                        }

                        req.flash('Success', 'Product edited.');
                        res.redirect('/admin/products/edit-product/' + id);
                    });
                })
            }
        })
    }
});

/* 
* POST product gallery
*/
router.post('/product-gallery/:id', (req,res) => {
    
    var productImage = req.files.file;
    var id = req.params.id;
    var path = 'public/product_images/' + id + '/gallery' + req.files.file.name;
    var thumbsPath = 'public/product_images/' + id + '/gallery/thumbs' + req.files.file.name;

    productImage.mv(path, (err) => {
        if (err) {
            console.log(err);
        }

        resizeImg(fs.readFileSync(path), {width:100, height:100}).then((buf) => {
            fs.writeFileSync(thumbsPath, buf);
        });
    });

    res.sendStatus(200);
});

/* 
* GET delete image
*/
router.get('/delete-image/:image', isAdmin, (req,res) => {
    var originalImage = 'public/product_images/' + req.query.id + '/gallery' + req.params.image;
    var thumbImage = 'public/product_images/' + req.query.id + '/gallery/thumbs/' + req.params.image;

    fs.remove(originalImage, (err) => {
        if (err) {
            console.log(err);
        } else {
            fs.remove(thumbImage, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    req.flash('success', 'Image deleted.');
                    res.redirect('/admin/products/edit-product/' + req.query.id);
                }
            });
        }
    })
});

/* 
* GET delete product
*/
router.get('/delete-product/:id', isAdmin, (req,res) => {
    
    var id = req.params.id;
    var path = 'public/product_images/' + id;

    fs.remove(path, (err) => {
        if (err) {
            console.log(err);
        } else {
            Product.findByIdAndRemove(id, (err) => {
                if (err) {
                    console.log(err);
                }
            });

            req.flash('success', 'Product deleted.');
            res.redirect('/admin/products');
        }
    });
});

// Exports module
module.exports = router;