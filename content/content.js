const STORAGE_TOKEN = '$URL Hider$'
const VERSION   = 'v1.0'

const linksToFilter = []

/* May change */
const textLinks = 'yuRUbf'

/* Logging */
const LOG = (...args) => console.log(STORAGE_TOKEN, ...args)

const getLink = (linkbox) => {
    return `${new URL(linkbox?.getElementsByTagName('a')[0].href)?.origin}`
}

const excludeLink = (linkbox) => {
    const link = getLink(linkbox)
    linksToFilter.push(link)

    /* set in extension storage */
    chrome.storage.sync.set({[STORAGE_TOKEN]: linksToFilter}, () => {
        LOG("Links to filter:", linksToFilter)
        filterLink(linkbox)

        /* debug */
        chrome.storage.sync.get([STORAGE_TOKEN], (r) => {
            LOG("sync storage has:", r[STORAGE_TOKEN])
        })
    })
}

const filterLink = (linkbox) => {
    linkbox.parentNode.parentNode.remove()
}

const filterLinkByOrigin = (linkBox) => {
    const link = getLink(linkBox)

    LOG("filter link by origin:", link)
    if (linksToFilter.indexOf(link) > -1) {
        filterLink(linkBox)
    }
}

const addImageToBox = (linkbox) => {
    linkbox.style.display = "flex"

    const crossDiv = document.createElement('div')

    const crossImg = new Image()
    crossImg.src = chrome.runtime.getURL('content/cross.svg')
    crossImg.width = 25
    crossImg.height = 25
    crossImg.style.cursor = 'pointer'

    crossDiv.appendChild(crossImg)
    crossDiv.onclick = () => excludeLink(linkbox)

    linkbox.append(crossDiv)
}

const getLinkBoxes = (results) => [...results.getElementsByClassName(textLinks)]

const hideLinks = () => {
    const searchResults = document.getElementById('search')

    /* Filter links */
    getLinkBoxes(searchResults).map(filterLinkByOrigin)

    /* Add cross marks */
    getLinkBoxes(searchResults).map(addImageToBox)
}

const setupStorage = async () => {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get([STORAGE_TOKEN], r => {
            try {
                if (Object.keys(r) == 0)
                    throw 'no links in storage'

                linksToFilter.push(...r[STORAGE_TOKEN])
                LOG('Loaded from extension storage')
                LOG(linksToFilter)

                resolve()
            } catch (e) {
                chrome.storage.sync.set({[STORAGE_TOKEN]: []}, () => {
                    LOG('Resetting local storage', e)
                })

                reject()
            }
        })
    })
}

const main = async () => {
    LOG(`URL Hider ${VERSION}`)
    if (document.location.href.includes('www.google.com/search')) {
        /* read from local storage */
        await setupStorage()

        /* Setup event listener */
        chrome.runtime.onMessage.addListener((request, sender, sendresponse) => {
            LOG(request, sender, sendresponse)
            if (request.data === 'reload')
                history.go()
        })

        /* Hide links */
        hideLinks()
    }
}

window.onload = main
