const STORAGE_TOKEN = '$URL Hider$'
const VERSION = 'v1.0'

const linksToFilter = []

/* May change */
// const textLinks = 'yuRUbf'
const textLinks = 'MjjYud'

/* Logging */
const LOG = (...args) => console.log(STORAGE_TOKEN, ...args)

const getLink = (linkbox) => {
    const href = linkbox?.getElementsByTagName('a')[0]?.href
    if (href)
        return `${new URL(href).origin}`
    return null
}

const setStorage = async (obj) => {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.sync.set({ [STORAGE_TOKEN]: obj }, () => {
                resolve()
            })
        } catch (e) { reject(e) }
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
        } catch (e) { reject(e) }
    })
}

const excludeLink = async (linkbox) => {
    const link = getLink(linkbox)
    if (link == null)
        return
    linksToFilter.push(link)
    LOG("Links to filter:", linksToFilter)

    /* set in extension storage */
    try {
        await setStorage(linksToFilter)
        filterLinkBox(linkbox)
    } catch (e) {
        LOG("failed to set to extension storage", e)
    }
}

const filterLinkBox = (linkbox) => {
    linkbox.remove()
}

const filterLinkByOrigin = (linkBox) => {
    const link = getLink(linkBox)
    if (linksToFilter.indexOf(link) > -1) {
        filterLinkBox(linkBox)
        return true
    }
    return false
}

const addImageToBox = (linkbox) => {
    if (linkbox.style.display == 'flex' || getLink(linkbox) == null) {
        /* added image already | link doesn't exist */
        return
    }

    linkbox.style.display = "flex"

    const crossDiv = document.createElement('div')

    const crossImg = new Image()
    crossImg.src = chrome.runtime.getURL('content/cross.png')
    crossImg.width = 25
    crossImg.height = 25
    crossImg.style.cursor = 'pointer'
    crossImg.style.marginRight = '0px'

    crossDiv.appendChild(crossImg)
    crossDiv.onclick = () => excludeLink(linkbox)

    linkbox.append(crossDiv)
}

const removeImages = (root) => {
    [...root.getElementsByClassName(CROSS_DIV_CLASSNAME)].forEach(m => m.remove())
}

const getLinkBoxes = (results) => [...results.getElementsByClassName(textLinks)]

const hideLinks = (searchResults) => {
    LOG("Hiding links ...")
    /* Filter links */
    getLinkBoxes(searchResults).map(filterLinkByOrigin)

    /* Add cross marks */
    getLinkBoxes(searchResults).map(addImageToBox)
}

const setupStorage = async () => {
    try {
        const r = await getStorage()
        linksToFilter.push(...r)
        LOG('Loaded from extension storage', linksToFilter)
    } catch (err) {
        await setStorage([])
        LOG('Reset extension storage', err)
    }
}

const setupObserver = async (searchObj) => {
    /* only need to filter new links */

    const observer = new MutationObserver((mutations, observer) => {
        mutations.forEach(m => {
            const n = m.target
            if (n['id'].startsWith('arc-srp'))
                hideLinks(n)
        })
    })

    observer.observe(
        searchObj,
        { childList: true, subtree: true }
    )

    LOG("Observing ...")
}

const main = async () => {
    LOG(`URL Hider ${VERSION}`)
    const current = new URL(document.location.href)
    if (current.pathname.startsWith('/search')) {
        /* read from local storage */
        await setupStorage()

        /* Setup event listener */
        chrome.runtime.onMessage.addListener((request, sender, sendresponse) => {
            if (request.data === 'reload')
                /* reload the page */
                history.go()
            return true
        })

        const search = document.getElementById('search')
        hideLinks(search)

        const botStuff = document.getElementById('botstuff')
        hideLinks(botStuff)
        setupObserver(botStuff)
    }
}

window.onload = main
