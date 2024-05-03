const express = require('express')
const router = express.Router()
const methodOverride = require('method-override')
const User = require('../models/user.js')

router.use(methodOverride('_method'))


// =============== FUNCTIONS ================ //
// Updates sub-docs based on passed parent model
const updateChild = async (parent, child, updatedChild) => {
    // Obtains keys for updated values    
    const childKeys = Object.keys(updatedChild)

    // Loops through keys and updates sub-doc's values
    childKeys.forEach( (key) => {
        child[key] = updatedChild[key]
    })

    // Saves changes at the parent level
    await parent.save()
}

// Updates all planned and total values for a budget
const updateBudget = async (userId, budgetId) => {
    const user = await User.findById(userId)
    const foundBudget = user.budgets.id(budgetId)
    let newIncomePlanned = 0
    let newIncomeTotal = 0
    let newExpensesPlanned = 0
    let newExpensesTotal = 0

    foundBudget.categories.forEach( (category) => {
        let total = 0
        
        // Adds each entry amount to a total for
        // that category
        category.entries.forEach( (entry) => {
            total += entry.amount
        })
        
        // Saves total value for category
        category.total = total

        // Adds to the planned and total values
        // based on income/expense
        if (category.isIncome) {
            newIncomePlanned += category.planned
            newIncomeTotal += category.total
        } else {
            newExpensesPlanned += category.planned
            newExpensesTotal += category.total
        }
    })

    // Updates all new values and saves
    foundBudget.incomePlanned = newIncomePlanned
    foundBudget.incomeTotal = newIncomeTotal
    foundBudget.expensesPlanned = newExpensesPlanned
    foundBudget.expensesTotal = newExpensesTotal
    await user.save()
}


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

    res.redirect(`/user-budgets/${newBudget._id}`)
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
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    res.render('budget/edit.ejs', {
        budget: foundBudget
    })
})

router.put('/:budgetId', async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
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

    // Updates values of budget and saves
    updateChild(user, foundBudget, updatedBudget)

    res.redirect('/user-budgets')
})

router.delete('/:budgetId', async (req, res) => {
    const user = await User.findById(req.session.user._id)
    
    user.budgets.pull(req.params.budgetId)
    user.save()
    
    res.redirect('/user-budgets')
})

// ---------------- CATEGORIES -------------- //
router.get('/categories', async (req, res) => {
    const allCategories = await Category.find()
    
    // Define arrays for income and expense based on
    // isIncome
    let incomeCategories = []
    let expenseCategories = []
    
    // Loop through allCategories and push accordingly
    // to sort by isIncome
    allCategories.forEach( (category) => {
        if(category.isIncome) {
            incomeCategories.push(category)
        } else {
            expenseCategories.push(category)
        }
    })
    
    res.render('./category/index.ejs', {
        incomeCategories: incomeCategories,
        expenseCategories: expenseCategories
    })
})

router.get('/:budgetId/categories/new', async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    res.render('category/new.ejs', {
        budget: foundBudget
    })
})

router.post('/:budgetId/categories', async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    let newCategory = req.body
    
    // Changes isIncome type to boolean
    if(newCategory.isIncome === 'true') {
        newCategory.isIncome = true
    } else if(newCategory.isIncome === 'false') {
        newCategory.isIncome = false
    }
    
    // Changes String input to Number and inits total
    newCategory.planned = parseFloat(newCategory.planned)
    newCategory.total = 0

    // Creates new category and updates the newCategory obj (for ref
    // in redirect), then pushes it to category array and saves the
    // category changes
    newCategory = foundBudget.categories.create(newCategory)
    foundBudget.categories.push(newCategory)
    await user.save()

    // Updates planned and total values on budget with
    // new planned amounts added by the user
    await updateBudget(user._id, foundBudget._id)
    
    res.redirect(`/user-budgets/${req.params.budgetId}/categories/${newCategory._id}`)
})

router.get('/:budgetId/categories/:categoryId', async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    const foundCategory = foundBudget.categories.id(req.params.categoryId)

    res.render('category/show.ejs', {
        budget: foundBudget,
        category: foundCategory
    })
})

router.get('/:budgetId/categories/:categoryId/edit', async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    const foundCategory = foundBudget.categories.id(req.params.categoryId)
    
    res.render('category/edit.ejs', {
        budget: foundBudget,
        category: foundCategory
    })
})

router.put('/:budgetId/categories/:categoryId', async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    const foundCategory = foundBudget.categories.id(req.params.categoryId)
    const updatedCategory = req.body
    
    // Changes isIncome type to boolean
    if(updatedCategory.isIncome === 'true') {
        updatedCategory.isIncome = true
    } else if(updatedCategory.isIncome === 'false') {
        updatedCategory.isIncome = false
    }

    // Changes String input to Number
    updatedCategory.planned = parseFloat(updatedCategory.planned)

    // Updates budget with new values added by user
    updateChild(user, foundCategory, updatedCategory)

    // Updates planned and total values on budget with
    // new planned amounts added by the user
    await updateBudget(user._id, foundBudget._id)

    res.redirect(`/user-budgets/${req.params.budgetId}/categories/${req.params.categoryId}`)
})

router.delete('/:budgetId/categories/:categoryId', async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    
    foundBudget.categories.pull(req.params.categoryId)
    await user.save()

    // Updates planned and total values after category
    // deleted by user
    await updateBudget(user._id, foundBudget._id)
    
    res.redirect(`/user-budgets/${req.params.budgetId}`)
})


module.exports = router
