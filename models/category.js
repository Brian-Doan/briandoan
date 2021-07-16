var mongoose = require('mongoose');

// Category Schema
var categorySchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true
    },
    
});

var Category = module.exports = mongoose.model('Category', categorySchema);