var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// User Schema
var orderSchema = Schema({
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
    },
    product: [{
        image: String,
        title: String, 
        price: Number,
        qty: Number,
        subtotal: Number
    }],
    total: {
        type: Number,
    }
});

var Order = module.exports = mongoose.model('Order', orderSchema);