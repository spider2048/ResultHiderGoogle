class _hideResults {
    constructor() {
        this.LINK_ID = 'MjjYud'
        this.VIDEO_CLASS = 'ULSxyf'

        /* bind all functions */
        Object.getOwnPropertyNames(Object.getPrototypeOf(this))
              .filter(key => key != 'constructor' && typeof this[key] == 'function').forEach(key => {
                this[key] = this[key].bind(this)
              })
    }

    async run() {
        if (new URL(document.location.href).pathname.startsWith('/search')) {
            await storage.setup()

            /* Setup event listener */
            chrome.runtime.onMessage.addListener((request, sender, sendresponse) => {
                if (request.data === 'reload')
                    history.go() // reload
                return true
            })

            logging.log("hiding #search")
            this.hideLinks(document.getElementById('search'))

            logging.log("hiding #botstuff")
            const botStuff = document.getElementById('botstuff')
            this.hideLinks(botStuff)

            /* only observe bottom stuff */
            logging.log("observing #botstuff")
            this.observe(botStuff)
        }
    }

    observe(searchObj) {
        const observer = new MutationObserver((mutations, observer) => {
            mutations.forEach(m => {
                const n = m.target
                if (n['id'].startsWith('arc-srp'))
                    this.hideLinks(n)
            })
        })

        observer.observe(
            searchObj,
            { childList: true, subtree: true }
        )
    }

    /* Links */
    filterLinkByOrigin(linkBox) {
        const link = this.getLink(linkBox)
        if (linksToFilter.indexOf(link) > -1) {
            this.hideLinkBox(linkBox)
            return true
        }
        return false
    }

    filterLinkBox(linkbox) {
        logging.log("filtering link by origin")
        /* Kept for implementing other filter methods */
        return this.filterLinkByOrigin(linkbox)
    }

    getLink(linkbox) {
        const href = linkbox?.getElementsByTagName('a')[0]?.href
        if (href) return `${new URL(href).origin}`
        return null
    }

    hideLinks(searchResults) {
        /* Filter links */
        logging.log("filtering links")
        this.getLinkBoxes(searchResults).map(this.filterLinkBox)

        /* Add cross marks */
        logging.log("adding `x` marks")
        this.getLinkBoxes(searchResults).map(this.addImageToBox)
    }

    /* Link boxes */
    getLinkBoxes(results) {
        return Array.from(results?.getElementsByClassName(this.LINK_ID))
    }

    async excludeLink(linkbox) {
        const link = this.getLink(linkbox)
        if (link == null) return
        linksToFilter.push(link)
        logging.log("Links to filter:", linksToFilter)

        /* set in extension storage */
        try {
            this.hideLinkBox(linkbox)
            await storage.set(linksToFilter)
        } catch (e) {
            logging.log("failed to set to extension storage", e)
        }
    }

    getLink(linkbox) {
        const href = linkbox?.getElementsByTagName('a')[0]?.href
        if (href)
            return new URL(href).origin
        return null
    }

    hideLinkBox(linkbox) {
        // linkbox.style.visibility = 'hidden'
        linkbox.remove()
    }

    /* cross image */
    newCrossImg(linkBox) {
        linkBox.style.display = "flex"

        logging.log("getting new cross img")
        const ret = document.createElement('div')
        let crossImg = new Image()
        crossImg.src = chrome.runtime.getURL('content/img/cross.png')
        crossImg.width = 25
        crossImg.height = 25
        crossImg.style.cursor = 'pointer'
        crossImg.style.marginRight = '0px'
        ret.appendChild(crossImg)
        ret.onclick = () => this.excludeLink(linkBox)
        return ret
    }

    dontAddImageToBox(linkbox) {
        try {
            /* "Videos" section, "Related Searches" section */
            if (linkbox.parentNode.className == this.VIDEO_CLASS) {
                return true
            }

            /* "People also ask" section */
            if (linkbox.getElementsByClassName('Wt5Tfe')?.length) {
                return true
            }
            
            /* "Images" section */
            if (linkbox.getElementsByClassName('EyBRub')?.length) {
                return true
            }

        } catch (e) {
            return false
        }
    }

    addImageToBox(linkbox) {
        logging.log("adding image to box")
        /* added image already | link doesn't exist */
        if (linkbox.style.display == 'flex' || this.getLink(linkbox) == null)
            return

        if (this.dontAddImageToBox(linkbox))
            return

        /* Append cross image */
        linkbox.append(this.newCrossImg(linkbox))
    }

    removeImages (root) {
        return [...root.getElementsByClassName(CROSS_DIV_CLASSNAME)]
                .forEach(m => m.remove())
    }
}

const hideResults = new _hideResults()
