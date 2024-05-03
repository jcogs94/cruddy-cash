const express = require('express')
const router = express.Router()
const methodOverride = require('method-override')
const User = require('../models/user.js')

router.use(methodOverride('_method'))


// ================= ROUTES ================ //
router.get('/', async (req, res) => {
    const user = await User.findById(req.session.user._id)
    let budgetsByYear = {}
    
    // Loop through allCategories and push accordingly
    // to sort by isIncome
    user.budgets.forEach( (budget) => {
        if(budgetsByYear[budget.year] === undefined) {
            budgetsByYear[budget.year] = []
        }
        
        budgetsByYear[budget.year].push(budget)
    })
    
    const budgetYears = Object.keys(budgetsByYear)

    res.render('./budget/index.ejs', {
        budgets: budgetsByYear,
        years: budgetYears
    })
})

router.get('/new', (req, res) => {
    res.render('budget/new.ejs')
})

router.post('/', async (req, res) => {
    const user = await User.findById(req.session.user._id)
    let newBudget = req.body
    
    // Splits the "month" input type into month and year
    let monthInput = newBudget.month.split('-')
    let monthNumStr = monthInput.pop()
    let month = parseInt(monthNumStr)
    newBudget.year = parseInt(monthInput.pop())
    
    // Changes the month Number to a String
    switch (month) {
        case 1:
            month = 'January'
            break;
        case 2:
            month = 'February'
            break;
        case 3:
            month = 'March'
            break;
        case 4:
            month = 'April'
            break;
        case 5:
            month = 'May'
            break;
        case 6:
            month = 'June'
            break;
        case 7:
            month = 'July'
            break;
        case 8:
            month = 'August'
            break;
        case 9:
            month = 'September'
            break;
        case 10:
            month = 'October'
            break;
        case 11:
            month = 'November'
            break;
        case 12:
            month = 'December'
            break;
    }
    
    // Adds String month to newBudget and creates a 
    // name for the budget based on year and month
    newBudget.month = month
    newBudget.monthNumStr = monthNumStr
    newBudget.name = newBudget.month + ', ' + newBudget.year

    // Declarations for model compliance, sets init
    // values all to 0, to be updated as user inputs
    // categories and entries
    newBudget.incomePlanned = 0
    newBudget.expensesPlanned = 0
    newBudget.incomeTotal = 0
    newBudget.expensesTotal = 0
    
    newBudget = user.budgets.create(newBudget)
    user.budgets.push(newBudget)
    user.save()

    res.redirect(`/dashboard`)
    // res.redirect(`/budgets/${newBudget._id}`)
})

router.get('/:budgetId', async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)

    const budgetCategories = foundBudget.categories
    let incomeCategories = []
    let expenseCategories = []

    // Loop through budgetCategories and push accordingly
    // to sort by isIncome
    budgetCategories.forEach( (category) => {
        if(category.isIncome) {
            incomeCategories.push(category)
        } else {
            expenseCategories.push(category)
        }
    })

    res.render('budget/show.ejs', {
        budget: foundBudget,
        incomeCategories: incomeCategories,
        expenseCategories: expenseCategories
    })
})

router.get('/:budgetId/edit', async (req, res) => {
    const foundBudget = await Budget.findById(req.params.budgetId)
    res.render('budget/edit.ejs', {
        budget: foundBudget
    })
})

router.put('/:budgetId', async (req, res) => {
    const updatedBudget = req.body
    
    // Splits the "month" input type into month and year
    let monthInput = updatedBudget.month.split('-')
    let monthNumStr = monthInput.pop()
    let month = parseInt(monthNumStr)
    updatedBudget.year = parseInt(monthInput.pop())
    
    // Changes the month Number to a String
    switch (month) {
        case 1:
            month = 'January'
            break;
        case 2:
            month = 'February'
            break;
        case 3:
            month = 'March'
            break;
        case 4:
            month = 'April'
            break;
        case 5:
            month = 'May'
            break;
        case 6:
            month = 'June'
            break;
        case 7:
            month = 'July'
            break;
        case 8:
            month = 'August'
            break;
        case 9:
            month = 'September'
            break;
        case 10:
            month = 'October'
            break;
        case 11:
            month = 'November'
            break;
        case 12:
            month = 'December'
            break;
    }
    
    // Adds String month to newBudget and creates a 
    // name for the budget based on year and month
    updatedBudget.month = month
    updatedBudget.monthNumStr = monthNumStr
    updatedBudget.name = updatedBudget.month + ', ' + updatedBudget.year
    
    await Budget.findByIdAndUpdate(req.params.budgetId, updatedBudget)
    res.redirect('/budgets')
})

router.delete('/:budgetId', async (req, res) => {
    const user = await User.findById(req.session.user._id)
    
    user.budgets.pull(req.params.budgetId)
    user.save()
    
    res.redirect('/user-budgets')
})


module.exports = router
