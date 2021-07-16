var express = require('express');
var router = express.Router();
var cart = require('./cart');

// Load Order model
var Order = require('../models/order');


/*
* GET confirm order
*/
router.get('/confirm', (req,res) => {
    res.render('order_info', {
        title: 'Confirm Order',
        cart: req.session.cart
    });
});

/*
* POST confirm order
*/
router.post('/confirm', (req,res) => {

    var name = req.body.name;
    var address = req.body.address;
    var phone = req.body.phone;
    var email = req.body.email;
    var cartData = req.session.cart;

    req.checkBody('name', 'Name is required!').notEmpty();
    req.checkBody('address', 'Address is required!').notEmpty();
    req.checkBody('phone', 'Phone number is required!').notEmpty();
  
    var errors = req.validationErrors();

    if (errors) {
        res.render('order_info', {
            errors: errors,
            cart: cartData
        });
    } else {
        Order.findOne((err,order) => {
            if (err) {
                res.render('order_info', {
                    errors: errors,
                    cart: cartData
                });
            } else {
                //window.alert('Order confirmed');
                var total = 0;
                var orderArray = [];
                cartData.forEach((product) => {
                    var sub = product.qty * product.price;
                    //total += +sub;

                    order = new Order({
                        name: name,
                        address: address,
                        phone: phone,
                        email: email,
                        product: [{
                            image: product.image,
                            title: product.title,
                            price: product.price,
                            qty: product.qty,
                            subtotal: sub,
                        }],
                        //total: total
                    });

                    orderArray.push(order);

                });
        
                console.log(orderArray);

                order.save((err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        //console.log(order);
                        req.flash('success','Order Confirmed.');
                        req.session.cart.length = 0;
                        res.redirect('/products/all')
                    }
                });
            }
        });
    }
});

// Exports module
module.exports = router;