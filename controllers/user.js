const express = require('express')
const router = express.Router()
const methodOverride = require('method-override')
const isSignedIn = require('../middleware/is-signed-in.js')
const User = require('../models/user.js')

router.use(express.urlencoded({ extended: false }))
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

    let categoryNames = ['income', 'savings', 'expenses']
    categoryNames.forEach( (category) => {
        let planned = 0
        let current = 0

        foundBudget[category].groups.forEach( (group) => {
            planned += group.planned
            group.entries.forEach( (entry) => {
                current += entry.amount
            })
        })

        foundBudget[category].planned = planned
        foundBudget[category].current = current
    })

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

// ---------------- BUDGETS --------------- //
router.get('/budgets', isSignedIn, async (req, res) => {
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

router.post('/budgets', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    
    // Uses same post route with query params for making a budget
    // the user's current budget. If the query params are not there,
    // posts a new budget
    if (req.query.current === 'true') {
        user.currentBudgetId = req.query.id
        await user.save()
        res.redirect('/user/dashboard')
    } else  {
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
        await user.save()
    
        if (user.budgets.length === 1) {
            // The budget just created is the only one,
            // redirect to dashboard
            res.redirect(`/user/dashboard`)
        } else {
            // User already has at least 1 budget, redirect
            // to show page for new budget
            res.redirect(`/user/budgets/${newBudget._id}`)
        }
    }
})

router.get('/budgets/:budgetId', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)

    // If the user clicked on their current budget, redirects
    // to the dashboard, else show page for individual budget
    if (foundBudget._id === user.currentBudgetId) {
        res.redirect('/user/dashboard')
    } else {
        res.render('budget/show.ejs', {
            budget: foundBudget,
            currentBudgetId: user.currentBudgetId
        })
    }    
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

    res.redirect('/user/budgets')
})

router.delete('/budgets/:budgetId', isSignedIn, async (req, res) => {
    console.log('delete route...')
    
    const user = await User.findById(req.session.user._id)
    user.budgets.pull(req.params.budgetId)
    await user.save()

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

    await user.save()
    
    res.redirect('/user/budgets')
})

// ------------------- Groups ----------------- //
router.get('/budgets/:budgetId/:type/groups/new', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    res.render('group/new.ejs', {
        budget: foundBudget,
        type: req.params.type
    })
})

router.post('/budgets/:budgetId/:type/groups', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    
    let newGroup = req.body
    let type = newGroup.type
    delete newGroup.type
    newGroup.current = 0

    // Creates new group and updates the newGroup obj (for ref
    // in redirect), then pushes it to group array and saves the
    // user changes
    newGroup = foundBudget[type].groups.create(newGroup)
    foundBudget[type].groups.push(newGroup)
    await user.save()

    // Updates planned and total values on budget with
    // new planned amounts added by the user
    await updateBudget(user._id, foundBudget._id)
    
    if (foundBudget._id == user.currentBudgetId) {
        res.redirect('/user/dashboard')
    } else {
        res.redirect(`/user/budgets/${foundBudget._id}`)
    }
})

router.get('/budgets/:budgetId/:type/groups/:groupId', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    const foundGroup = foundBudget[req.params.type].groups.id(req.params.groupId)

    res.render('group/show.ejs', {
        budget: foundBudget,
        type: req.params.type,
        group: foundGroup
    })
})

router.get('/budgets/:budgetId/:type/groups/:groupId/edit', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    const foundGroup = foundBudget[req.params.type].groups.id(req.params.groupId)
    
    res.render('group/edit.ejs', {
        budget: foundBudget,
        type: req.params.type,
        group: foundGroup
    })
})

router.put('/budgets/:budgetId/:type/groups/:groupId', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    const foundGroup = foundBudget[req.params.type].groups.id(req.params.groupId)
    
    const updatedGroup = req.body
    delete updatedGroup.type
    
    // Updates budget with new values added by user
    updateChild(user, foundGroup, updatedGroup)
    
    // Updates planned and total values on budget with
    // new planned amounts added by the user
    await updateBudget(user._id, foundBudget._id)
    
    res.redirect(`/user/budgets/${req.params.budgetId}/${req.params.type}/groups/${req.params.groupId}`)
})

router.delete('/budgets/:budgetId/:type/groups/:groupId', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    
    foundBudget[req.params.type].groups.pull(req.params.groupId)
    await user.save()

    // Updates planned and total values after category
    // deleted by user
    await updateBudget(user._id, foundBudget._id)
    
    res.redirect(`/user/budgets/${req.params.budgetId}`)
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

router.get('/budgets/:budgetId/:type/groups/:groupId/entries/new', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    const foundGroup = foundBudget[req.params.type].groups.id(req.params.groupId)
    res.render('entry/new.ejs', {
        budget: foundBudget,
        type: req.params.type,
        group: foundGroup
    })
})

router.post('/budgets/:budgetId/:type/groups/:groupId/entries', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    const foundGroup = foundBudget[req.params.type].groups.id(req.params.groupId)
    const newEntry = req.body

    // Format date into desired output
    let dateArr = newEntry.postedDate.split('-')
    newEntry.postedDate = dateArr[1] + '/' + dateArr[2] + '/' + dateArr[0]
    
    // Pushes new entry to entry array and saves the category
    // changes
    foundGroup.entries.push(newEntry)
    await user.save()

    // Updates budget planned and total values with entry added
    // by user
    await updateBudget(user._id, foundBudget._id)
    
    res.redirect(`/user/budgets/${req.params.budgetId}/${req.params.type}/groups/${req.params.groupId}`)
})

router.get('/budgets/:budgetId/:type/groups/:groupId/entries/:entryId', isSignedIn, async (req, res) => {
    const user = await User.findById(req.session.user._id)
    const foundBudget = user.budgets.id(req.params.budgetId)
    const foundGroup = foundBudget[req.params.type].groups.id(req.params.groupId)
    const foundEntry = foundGroup.entries.id(req.params.entryId)

    res.render('entry/show.ejs', {
        budget: foundBudget,
        type: req.params.type,
        group: foundGroup,
        entry: foundEntry
    })
})

router.get('/budgets/:budgetId/:type/groups/:groupId/entries/:entryId/edit', isSignedIn, async (req, res) => {
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

router.put('/budgets/:budgetId/:type/groups/:groupId/entries/:entryId', isSignedIn, async (req, res) => {
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

router.delete('/budgets/:budgetId/:type/groups/:groupId/entries/:entryId', isSignedIn, async (req, res) => {
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
