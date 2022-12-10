const {Schema, model} = require('mongoose')


const Desk = new Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    ownership: {type: String, required: true}
})

module.exports = model('Desk', Desk)