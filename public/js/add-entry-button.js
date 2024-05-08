// Obtains the budgetId from the form params (to be changed to correct route later)
let tempActionArr = ((document.querySelector('#add-income-form')).getAttribute('action')).split('/')
const budgetId = tempActionArr[0]

class Categories {
    // Obtains the correct route string using the given type (income/savings/expenses) and
    // groupId that the user wishes to add the entry to
    getActionString(type, groupId) {
        return `/user/budgets/${budgetId}/${type}/groups/${groupId}/entries/new`
    }
    
    // Obtains the names and ids of each group the user has created and
    // returns them in an object with name/id pairs
    getGroupsObj(formEl) {
        // Puts the names and ids (from form action params) into an array,
        // removing the first (budgetId) param
        let paramsArr = (formEl.getAttribute('action')).split('/')
        paramsArr = paramsArr.slice(1)

        // If there are groups and ids, return obj, else null
        if (paramsArr.length !== 0) {
            let groups = {}
            let isName = true
            let key
            let value

            // Loop through the array, using key and value variables
            // to temp store the pair before adding them to the obj
            for (let i = 0; i < paramsArr.length; i++) {
                if (isName) {
                    key = paramsArr[i]
                    isName = false
                } else {
                    value = paramsArr[i]
                    groups[key] = value
                    isName = true
                }
            }
    
            return groups
        } else return null
    }

    // Handles when the temp button is pushed. Displays the group drop-down
    // and returns the original "submit" button
    newButtonHandler(name) {
        if (this[name].groups !== null){
            this[name].newButtonEl.insertAdjacentElement('beforebegin', this[name].groupsSelectEl)
            this[name].newButtonEl.remove()
            this[name].groupsSelectEl.insertAdjacentElement('afterend', this[name].formEl)
        }
    }

    // Creates a new "add" button, that appears like the form button, but
    // does not submit the form
    getNewButton(name) {
        let newButton = document.createElement('button')
        
        // Removes 's' at the end of expenses and savings
        let newName = name
        if (name[name.length - 1] === 's') {
            newName = name.slice(0, -1)
        }
        
        // Capitalizes first char of 'name' and changes new button name
        newName = newName.charAt(0).toUpperCase() + newName.slice(1)
        newButton.innerHTML = 'Add ' + newName

        // Adds listener with above handler for when button is pushed
        newButton.addEventListener('click', () => {
            this.newButtonHandler(name)
        })

        // returns new el
        return newButton
    }

    // Creates and returns a new div with a select element for allowing the
    // user to choose which group they would like to add to
    getGroupsSelect(groupKeysArr, name) {
        let divEl = document.createElement('div')
        divEl.setAttribute('class', `group-div`)
        divEl.setAttribute('id', `${name}-group-div`)

        let labelEl = document.createElement('label')
        labelEl.setAttribute('for', 'group')
        labelEl.innerHTML = 'Which group do you want to add this to?'

        let selectEl = document.createElement('select')
        selectEl.setAttribute('name', 'group')

        // Loops through arr of groups keys (the group names) to
        // dynamically show the group options
        groupKeysArr.forEach( (groupName) => {
            let optionEl = document.createElement('option')
            optionEl.setAttribute('value', groupName)
            optionEl.innerHTML = groupName
            selectEl.appendChild(optionEl)
        })

        // Adds listener for when the option selected changes, updates
        // the action for the form based on user group selection
        selectEl.addEventListener('change', () => {
            let selectedOptionName = selectEl.options[selectEl.options.selectedIndex].innerHTML
            let groupId = this[name].groups[selectedOptionName]
            this[name].formEl.setAttribute('action', this.getActionString(name, groupId))
        })

        divEl.appendChild(labelEl)
        divEl.appendChild(selectEl)
        return divEl
    }

    // Removes "submit" button and form on page load, comes back when new button pushed
    initButtons(name) {
        this[name].formEl.remove()
        this[name].boxEl.appendChild(this[name].newButtonEl)
    }
    
    // Constructs new objects of elements and user data, with their name/type being how the
    // object is referenced
    constructor(names) {
        names.forEach( (name) => {
            this[name] = {
                boxEl: document.querySelector(`#${name}-entries-box`),
                formEl: document.querySelector(`#add-${name}-form`),
                buttonEl: document.querySelector(`#add-${name}-button`),
                newButtonEl: this.getNewButton(name),
                groups: this.getGroupsObj(document.querySelector(`#add-${name}-form`))
            }
            
            this.initButtons(name)

            let groupsKeys = []
            // If there are groups, obtains an array of keys (names) that will be used
            // in obtaining the select el with dynamic options
            if (this[name].groups !== null) {
                groupsKeys = Object.keys(this[name].groups)
                this[name].groupsSelectEl = this.getGroupsSelect(groupsKeys, name)

                // Updates the form's action route when the user first pushes 'add' with the
                // default value of the first group
                let groupId = this[name].groups[groupsKeys[0]]
                this[name].formEl.setAttribute('action', this.getActionString(name, groupId))
            } else {
                this[name].newButtonEl.setAttribute('disabled', 'true')
            }

        })
    }
}


const categories = new Categories( ['income', 'savings', 'expenses'] )
