const express = require('express')
const router = express.Router()
const methodOverride = require('method-override')
const isSignedIn = require('../middleware/is-signed-in.js')
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
    let newIncomeReal = 0
    let newExpensesPlanned = 0
    let newExpensesReal = 0

    foundBudget.categories.forEach( (category) => {
        let total = 0
        
        // Adds each entry amount to a total for
        // that category
        category.entries.forEach( (entry) => {
            total += entry.amount
        })
        
        // Saves real total value for category
        category.total = total

        // Adds to the planned and total values
        // based on income/expense
        if (category.isIncome) {
            newIncomePlanned += category.planned
            newIncomeReal += category.total
        } else {
            newExpensesPlanned += category.planned
            newExpensesReal += category.total
        }
    })

    // Updates all new values and saves
    foundBudget.incomePlanned = newIncomePlanned
    foundBudget.incomeReal = newIncomeReal
    foundBudget.expensesPlanned = newExpensesPlanned
    foundBudget.expensesReal = newExpensesReal
    await user.save()
}


// ================= ROUTES ================ //
router.get('/dashboard', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    
    // Sets the current budget for display, if available
    let hasCurrent = false
    let currentBudget = {}
    if (user.currentBudgetId !== 'empty') {
        hasCurrent = true
        currentBudget = user.budgets.id(user.currentBudgetId)
    }
    
    // If user has a current budget, send to dash,
    // else, only sends that user doesn't have one
    if (hasCurrent) {
        res.render('./dashboard/index.ejs', {
            hasCurrent: hasCurrent,
            currentBudget: currentBudget
        })
    } else {
        res.render('./dashboard/index.ejs', {
            hasCurrent: hasCurrent
        })
    }
})

router.get('/budgets/', isSignedIn, async (req, res) => {
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

router.get('/budgets/new', isSignedIn, (req, res) => {
    res.render('budget/new.ejs')
})

router.post('/budgets/', isSignedIn, async (req, res) => {
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
    
    // Creates the new budget and sets it as the
    // current budget if the user has no others
    newBudget = user.budgets.create(newBudget)
    if (user.budgets.length === 0) {
        user.currentBudgetId = newBudget._id
    }

    // Sets three empty "category" models when the budget is created
    let budgetCategoryNames = ['income', 'savings', 'expenses']
    budgetCategoryNames.forEach( (category) => {
        newBudget[category] = {
            name: category,
            planned: 0,
            current: 0
        }
    })

    user.budgets.push(newBudget)
    user.save()

    res.redirect(`/user/dashboard`)
})

router.get('/budgets/:budgetId', isSignedIn, async (req, res) => {
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

router.get('/budgets/:budgetId/edit', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    res.render('budget/edit.ejs', {
        budget: foundBudget
    })
})

router.put('/budgets/:budgetId', isSignedIn, async (req, res) => {
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

router.delete('/budgets/:budgetId', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    user.budgets.pull(req.params.budgetId)
    user.save()

    // If no other budgets, sets currentBudgetId to "empty",
    // else sets to newest dated budget
    if (user.budgets.length === 0) {
        user.budgets.currentBudgetId = 'empty'
    } else {
        let newestBudget = user.budgets[0]

        user.budgets.forEach( (budget) => {
            if (budget.year > newestBudget.year || parseInt(budget.monthNumStr) > parseInt(newestBudget.monthNumStr)) {
                newestBudget = budget
            }
        })

        user.currentBudgetId = newestBudget._id
    }

    user.save()
    
    res.redirect('/user/dashboard')
})

// ---------------- CATEGORIES -------------- //
router.get('/budgets/categories', isSignedIn, async (req, res) => {
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

router.get('/budgets/:budgetId/categories/new', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    res.render('category/new.ejs', {
        budget: foundBudget
    })
})

router.post('/budgets/:budgetId/categories', isSignedIn, async (req, res) => {
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

router.get('/budgets/:budgetId/categories/:categoryId', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    const foundCategory = foundBudget.categories.id(req.params.categoryId)

    res.render('category/show.ejs', {
        budget: foundBudget,
        category: foundCategory
    })
})

router.get('/budgets/:budgetId/categories/:categoryId/edit', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    const foundCategory = foundBudget.categories.id(req.params.categoryId)
    
    res.render('category/edit.ejs', {
        budget: foundBudget,
        category: foundCategory
    })
})

router.put('/budgets/:budgetId/categories/:categoryId', isSignedIn, async (req, res) => {
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

router.delete('/budgets/:budgetId/categories/:categoryId', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    
    foundBudget.categories.pull(req.params.categoryId)
    await user.save()

    // Updates planned and total values after category
    // deleted by user
    await updateBudget(user._id, foundBudget._id)
    
    res.redirect(`/user-budgets/${req.params.budgetId}`)
})

// ---------------- ENTRIES ----------------- //
router.get('/budgets/entries', isSignedIn, async (req, res) => {
    const allEntries = await Entry.find()

    // Sorts all entries into arrays by each postedDay value
    let entriesByDay = {}
    allEntries.forEach( (entry) => {
        // Creates array if there isn't one for that postedDay
        if (entriesByDay[entry.postedDay] === undefined) {
            entriesByDay[entry.postedDay] = []
        }

        // Adds entry to array with key value of postedDay
        entriesByDay[entry.postedDay].push(entry)
    })
    
    res.render('entry/index.ejs', {
        entries: entriesByDay,
        entriesKeys: Object.keys(entriesByDay)
    })
})

router.get('/budgets/:budgetId/categories/:categoryId/entries/new', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    const foundCategory = foundBudget.categories.id(req.params.categoryId)
    res.render('entry/new.ejs', {
        budget: foundBudget,
        category: foundCategory
    })
})

router.post('/budgets/:budgetId/categories/:categoryId/entries', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    const foundCategory = foundBudget.categories.id(req.params.categoryId)
    const newEntry = req.body
    
    // Change input strings to Nums
    newEntry.postedDay = parseInt(newEntry.postedDay)
    newEntry.amount = parseInt(newEntry.amount)
    
    // Pushes new entry to entry array and saves the category
    // changes
    foundCategory.entries.push(newEntry)
    await user.save()

    // Updates budget planned and total values with entry added
    // by user
    await updateBudget(user._id, foundBudget._id)
    
    res.redirect(`/user-budgets/${req.params.budgetId}/categories/${req.params.categoryId}`)
})

router.get('/budgets/:budgetId/categories/:categoryId/entries/:entryId', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    const foundCategory = foundBudget.categories.id(req.params.categoryId)
    const foundEntry = foundCategory.entries.id(req.params.entryId)

    res.render('entry/show.ejs', {
        budget: foundBudget,
        category: foundCategory,
        entry: foundEntry
    })
})

router.get('/budgets/:budgetId/categories/:categoryId/entries/:entryId/edit', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    const foundCategory = foundBudget.categories.id(req.params.categoryId)
    const foundEntry = foundCategory.entries.id(req.params.entryId)

    res.render('entry/edit.ejs', {
        budget: foundBudget,
        category: foundCategory,
        entry: foundEntry
    })
})

router.put('/budgets/:budgetId/categories/:categoryId/entries/:entryId', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    const foundCategory = foundBudget.categories.id(req.params.categoryId)
    const foundEntry = foundCategory.entries.id(req.params.entryId)
    const updatedEntry = req.body
    
    // Change input strings to Nums
    updatedEntry.postedDay = parseInt(updatedEntry.postedDay)
    updatedEntry.amount = parseInt(updatedEntry.amount)
    
    // Updates budget with changes made to entry
    await updateChild(user, foundEntry, updatedEntry)

    // Updates budget planned and total values with entry
    // updated by user
    updateBudget(user._id, foundBudget._id)

    res.redirect(`/user-budgets/${foundBudget._id}/categories/${foundCategory._id}/entries/${foundEntry._id}`)
})

router.delete('/budgets/:budgetId/categories/:categoryId/entries/:entryId', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    const foundCategory = foundBudget.categories.id(req.params.categoryId)
    
    foundCategory.entries.pull(req.params.entryId)
    await user.save()

    // Updates budget planned and total values with entry
    // deleted by user
    await updateBudget(user._id, foundBudget._id)
    
    res.redirect(`/user-budgets/${foundBudget._id}/categories/${foundCategory._id}`)
})


module.exports = router
