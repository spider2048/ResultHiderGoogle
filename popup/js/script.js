const STORAGE_TOKEN = '$URL Hider$'
const linksToFilter = []

const LOG = (...args) => console.log(STORAGE_TOKEN, ...args)

const setStorage = async (obj) => {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.sync.set({ [STORAGE_TOKEN]: obj }, () => {
                resolve()
            })
        } catch (e) {
            reject(e)
        }
    })
}

const getStorage = async () => {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.sync.get([STORAGE_TOKEN], (r) => {
                if (Object.keys(r) == 0)
                    reject('No items to get')
                resolve(r[STORAGE_TOKEN])
            })
        } catch (e) {
            reject(e)
        }
    })
}

const setupButton = () => {
    const hideButton = document.getElementById('url-entry-button')
    const hideInput = document.getElementById('url-entry')
    
    hideButton.onclick = () => {
        try {
            let txt = hideInput.value
            if (!txt) {
                return
            }

            if (!txt.startsWith('http')) {
                txt = 'https://' + txt
            }

            const url = new URL(txt).origin
            if (linksToFilter.indexOf(url) == -1)
                linksToFilter.push(url)
            else
                throw `${url} exists`

            setStorage(linksToFilter)
            updateLinksDisplay()

            addLog(`added ${url}`)
        } catch (err) {
            addError(err)
        }

        hideInput.value = ''
    }
}

const setupStorage = async () => {
    try {
        const r = await getStorage()
        linksToFilter.push(...r)
        updateLinksDisplay()
    } catch (err) {
        addError(err)
    }
}

const updateLinksDisplay = () => {
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

const reloadPage = async () => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tab) => {
        chrome.tabs.sendMessage(tab[0].id, { data: "reload" });
    });
}

const removeLink = async (link) => {
    linksToFilter.splice(linksToFilter.indexOf(link), 1)

    try {
        await setStorage(linksToFilter)
        addLog(`removed ${link}`)

        updateLinksDisplay()
        reloadPage()
    } catch (err) {
        addError(err)
    }
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
    document.querySelector('#logging').append(errmsg)
}

const main = async () => {
    setupButton()
    await setupStorage()
}

main()
