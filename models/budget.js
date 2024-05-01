const mongoose = require('mongoose')

const entrySchema = new mongoose.Schema({
    name: String,
    postedDay: Number,
    amount: Number
})

const categorySchema = new mongoose.Schema({
    name: String,
    isExpense: Boolean,
    entries: [entrySchema]
})

const budgetSchema = new mongoose.Schema({
    year: Number,
    monthName: String,
    incomePlanned: Number,
    incomeTotal: Number,
    expensesPlanned: Number,
    expensesTotal: Number,
    categories: [categorySchema]
})

const userSchema = new mongoose.Schema({
    name: String,
    budgets: [budgetSchema]
})

const User = mongoose.model('User', userSchema)
module.exports = User
