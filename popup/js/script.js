const STORAGE_TOKEN = '$URL Hider$'
const linksToFilter = []

const LOG = (...args) => console.log(STORAGE_TOKEN, ...args)

const setupDOM = () => {
    // Setup the `Hide` button
}

const setupStorage = async () => {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get([STORAGE_TOKEN], r => {
            if (Object.keys(r) == 0)
                reject()

            try {
                linksToFilter.push(...r[STORAGE_TOKEN])
                updateDisplay()

                resolve()
            } catch (e) {
                LOG('No items to block', e)
                reject()
            }
        })
    })
}

const updateDisplay = () => {
    const blockedURLDisplay = document.getElementById('blocked-urls-display')
    blockedURLDisplay.innerHTML = ''

    const createNode = (link) => {
        const removeButton = document.createElement('button')
        removeButton.className = 'btn btn-danger m-1 w-100 mx-auto'
        removeButton.type = 'button'
        removeButton.textContent = link
        removeButton.onclick = () => removeLink(link)
        return removeButton
    }

    linksToFilter.forEach(link => {
        blockedURLDisplay.append(createNode(link))
    })
}

const removeLink = (link) => {
    linksToFilter.splice(linksToFilter.indexOf(link), 1)

    chrome.storage.sync.set({[STORAGE_TOKEN]: linksToFilter}, () => {
        addLog(`removed: ${link}`)
        updateDisplay()

        /* reload page to display link */
        (async () => {
            const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
            await chrome.tabs.sendMessage(tab.id, {data: "reload"});
        })();
    })
}

const addLog = (log) => {
    const msg = document.createElement('div')
    msg.textContent = log
    msg.className = 'alert alert-info m-1 mx-auto w-100'

    document.querySelector('#logging').append(msg)
}

const addError = (err) => {
    const errmsg = document.createElement('div')
    errmsg.textContent = err
    errmsg.className = 'alert alert-danger m-1 mx-auto w-100'

    document.querySelector('#error').append(errmsg)
}

const main = async () => {
    await setupStorage()
}

main()