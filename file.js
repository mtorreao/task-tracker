const fs = require('fs')

function fsAccessPromise(path) {
    return new Promise((resolve, reject) => {
        fs.access(path, fs.constants.F_OK, (err) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

function fsWriteFilePromise(path, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, data, (err) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

function createFileIfNotExists(path) {
    return fsAccessPromise(path).catch(() => fsWriteFilePromise(path, '[]'))
}

module.exports = {
    /**
     * Loads a file and returns an object with a data method.
     * The data method takes a callback and will be called with each chunk of data.
     * @param {string} fileName The name of the file to load.
     * @returns {object} An object with a data method.
     * @example
     * const fileReturn = await file.readFile('file.json')
     * fileReturn.data((data) => {
     *     console.log('data', data)
     * })
     * fileReturn.end(() => {
     *     console.log('end')
     * })
     * fileReturn.error((err) => {
     *     console.log('error', err)
     * })
     */
    readFile: async (fileName) => {
        await createFileIfNotExists(fileName)
        const fileStream = fs.createReadStream(fileName, { encoding: 'utf8' })
        return {
            data: (callback) => fileStream.on('data', callback),
            error: (callback) => fileStream.on('error', callback),
            end: (callback) => fileStream.on('end', callback),
        }
    },

    /**
     * Writes data to a file.
     * @param {string} fileName The name of the file to write to.
     * @param {any} data The data to write to the file.
     */
    writeFile: async (fileName, data) => {
        await createFileIfNotExists(fileName)
        return fsWriteFilePromise(fileName, JSON.stringify(data, null, 4), 'utf8')
    }
}