const mongoose = require('mongoose')

const entrySchema = new mongoose.Schema({
    name: String,
    postedDay: Number,
    amount: Number
})

const groupSchema = new mongoose.Schema({
    name: String,
    plannedTotal: Number,
    CurrentTotal: Number,
    entries: [entrySchema]
})

const categorySchema = new mongoose.Schema({
    name: String,
    planned: Number,
    current: Number,
    groups: [groupSchema]
})

const budgetSchema = new mongoose.Schema({
    year: Number,
    month: String,
    monthNumStr: String,
    name: String,
    income: categorySchema,
    savings: categorySchema,
    expenses: categorySchema
})

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    budgets: [budgetSchema],
    currentBudgetId: String
})

const User = mongoose.model('User', userSchema)
module.exports = User
