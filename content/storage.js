const storage = {
    set: async (obj) => {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.set({ [STORAGE_TOKEN]: obj }, () => resolve())
            } catch (e) { reject(e) }
        })
    },
    get: async () => {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.get([STORAGE_TOKEN], (r) => {
                    if (Object.keys(r) == 0)
                        reject('No items to get')
                    resolve(r[STORAGE_TOKEN])
                })
            } catch (e) { reject(e) }
        })
    },
    setup: async () => {
        try {
            const r = await storage.get()
            linksToFilter.push(...r)
            logging.log('Loaded from extension storage', linksToFilter)
        } catch (err) {
            await storage.set([])
            logging.log('Reset extension storage', err)
        }
    }
}
