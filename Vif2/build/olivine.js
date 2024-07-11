// ================================================================================== //
/*

Speedloader.js:
- Speedloader is a runtime web-linker and plugin manager that allows you to dynamically load HTML, CSS, and JS files, making the development process
far simpler at the cost of increased load times. This is NOT a tool for everyone - and especially not for those using other runtime frameworks like React,
since the performance impact will be far too high.

The main way to use Speedloader is as follows:
    - Put olivine.js into a folder of your choice, named 'build' by convention, alongside the contents of Acorn/JSX/Walk in the 'acorn' folder and your plugins
    in the 'plugins' folder. The 'acorn' folder must be named as such, whereas the other two can be edited.
    Next, create a file named 'build.mylon' in the build folder. The syntax is simple:

        - Array = [a, b, c]
        - Object = .{
            a = 1
            b = 2
        }
        - Number = 1
        - Boolean = true, false
        - String = 'hi'
        - None = nil
        - Ident. = each-word-like-this

    - The fields in the build file are also relatively simple. First and foremost, you should have an entry field. It takes the form of a 'program symbol'
    which is a file path followed by an identifier, and separated by a colon. Your entry point may look as follows:

        entry = 'src/index.jsx:main'

    - This is the conventional entry point, in the source folder. There are some other top-level options, namely 'mode' and 'logging'. The mode can be
    either 'standard' or 'debug'. When not included in the file, the default is 'standard'. This option controls global access to internals like the
    Acorn parser, allowing for easier plugin and build debugging. The 'logging' field can either be 'none', 'minimal', 'standard', or 'verbose', and
    controls how much information is logged in the build process. Errors will always log, and the logging field is mandatory.
    An example so far would look like this:

        logging = 'minimal'
        mode = 'standard'

        entry = 'src/index.jsx:main'

    - In addition to the top-level fields, there are the css and plugin fields. They each follow a pattern like this:

        css = .{
            root = 'css/'
            styles = ['main.css']
        }

        plugins = .{
            root = 'build/plugins/'
            load = ['jsx.js:translateJSX']

            allow-secondary-exports = true
        }

    - They each take a root folder, under which all files to load should exist. By convention, the roots are 'css/' and 'build/plugins/' respectively,
    but it defaults to nothing if left unspecified.

    - The 'allow-secondary-exports' field allows plugins to edit the global scope with the 'export' keyword, which is usually just used to expose the
    plugin's entry point to Speedloader. This is used by the jsx and peridot plugins, for example, to inject functionality into the generated code
    without significant overhead, since copy-pasting large expressions would be far too expensive. The default for this flag is false.

    - In totality, a regular build file would look about like this:

        logging = 'minimal'
        mode = 'standard'

        entry = 'src/index.jsx:main'

        css = .{
            root = 'css/'
            styles = ['main.css', 'normalize.css']
        }

        plugins = .{
            root = 'build/plugins/'
            load = ['jsx.js:translateJSX', 'olea.js:peridot']

            allow-secondary-exports = true
        }

    - This is pretty readable and simple, but will likely grow and change in the future as more features are implemented - but not by much. The main
    gaal of Speedloader is to be a tool with a minimal surface area, hence the relative lack of defaults and extreme simplicity in all areas.


Next up are plugins.

    - Speedloader comes prepackaged with two plugins: jsx and peridot. Jsx is a simple plugin which repurposes React's templating syntax for simple
    html interpolation in js. It just uses the DomParser api and tag functions under the hood, so it won't do a whole lot - and you CANNOT nest jsx in interpolations.
    Degrob is a much larger plugin. It fundamentally changes js, massively simplifying the language, reducing the syntax, and making it more semantically
    consistent. You can check the file for a list of changes. The result is something like Lua, with very few keywords and operators, making the language
    far easier to learn and use.

    - The plugin API is very approachable. A plugin file is a simple JS file containing a single exported function (and more, if 'allow-secondary-exports'
    is active.) A simple plugin looks like this:

            ---- build.mylon -----

            plugins = .{
                root = 'build/plugins/'
                load = ['my-plugin.js:logFileLoading']
            }

            ----- my-plugin.js -----

            export function logFileLoading(file, Acorn, Walk) {
                let result = file.text

                result = result + `\n console.log('${file.full} loaded')`

                return { ...file, text: result }
            }

    - This plugin simply appends a console log to each file as it finishes loading. Of course, the built-in linker plugins run first, so this would not be
    the way a real plugin would do it - a real plugin would append it via Acorn/Walk since the linker plugins can interfere with code execution appended
    to the raw string after they run.

    - Each plugin takes in three arguments: a file descriptor, the Acorn parser, and the Acorn walker. By default, the parser can handle jsx, but the
    walker has limited functionality - although it can still work with jsx well enough. The return value of a plugin is a new file descriptor, although
    you can only change the file's type and text content. This is to let plugins change files from, for example, ts -> js. The input file has the fields
    text, path, name, type, and full. 'path' is the path before the file's name, 'name' is the name of the file, 'type' is the extension, and 'full' is
    the complete path used to fetch the file. Example:

        ----- src/index.jsx -----

        console.log('hi')

        ----- FILE -----

        {
            text: "console.log('hi')",
            path: "src",
            name: "index",
            type: "jsx",
            full: "src/index.jsx"
        }

    - This gives the plugin developer access to all relevant metadata without the need to parse the path data yourself.


Project structure conventions:
    - main app code should be conatained in the 'src' folder at the top level, stylesheets in the 'css' folder, and libraries/dependencies/etc in the
    'lib' folder. All assets should go in an 'assets' folder, and the entry point to the website should be the 'index.html' file contained at the top
    level. You should also keep a 'build' folder with a subdirectory named 'plugins' for the plugins. An example structure:

    |- assets: ...
    |- build:
    |  |- acorn: ...
    |  |- plugins: ...
    |  | build.mylon
    |  | olivine.js
    |
    |- css: ...
    |- lib: ...
    |- src:
    |  | index.jsx
    |
    | index.html


 A few globally available helper functions are provided by Speedloader. They are:
    - print(...args)       // just console.log
    - error(err)           // just console.error
    - raise(err)           // just throw new Error(err)
    - timeout(time, cb)    // runs setTimeout(cb, time), and provides a clear function to both the caller and callback, rather than an id to only the caller
    - interval(time, cb)   // runs setInterval(cb, time), and provides a clear function to both the caller and callback, rather than an id to only the caller

 Finally, the mylon file type has an associated parser API exposed to the global scope as 'window.mylon' or just 'mylon'.
 The methods are as follows:

    - parse(text)       // returns the argument data parsed into a js object equivalent (works like JSON.parse(text))
    - parseVal(val)     // returns the argument data as a js value
    - tryParse(text)    // returns null on failure
    - tryParseVal(val)  // returns null on failure
    - canParse(text)    // CALLS mylon.parse(...), this is NOT faster than tryParse, but is only for situations in which you don't need the result
    - canParseVal(val)  // ^  ^  ^
    - fileType          // A string representation of the extension ('mylon') for clarity

You cannot edit the fields of this object.




Future releases will include:

    - Support for the `resolve` element, which allows you to inline the result of a script or html file into your html files
    - Support for an assets folder and asset preloading/caching/handles to improve performance
    - Nested jsx expressions
    - Hopefully not too many bug fixes
    - More logging at higher levels
    - Better transparency in debug mode


*/
// ================================================================================== //


(() => {





    // ======================================================================== //
    //                      mylon stuff - from gpt                              //
    // ======================================================================== //


    function encodeMylon(data) {
        if (data === null || data === undefined) {
            return 'nil'
        }

        switch (typeof data) {
            case 'string':
                return `'${data}'`
            case 'number':
                return data.toString()
            case 'boolean':
                return data
                    ? 'true'
                    : 'false'
            case 'object':
                if (Array.isArray(data)) {
                    return encodeArray(data)
                } else {
                    return encodeObject(data)
                }
            default:
                throw 'Unsupported data type passed to mylon.encode'
        }
    }

    function encodeArray(array) {
        const isHomogeneous = array.every(item => typeof item === typeof array[0])
        const values = array.map(encodeMylon).join(', ')
        if (isHomogeneous) {
            return `[${values}]`
        } else {
            return `[\n    ${values.split(', ').join(',\n    ')}\n]`
        }
    }

    function encodeObject(obj) {
        const keys = Object.keys(obj)
        const values = keys.map(key => `${kebabCase(key)} = ${encodeMylon(obj[key])}`).join('\n    ')
        return `.{\n    ${values}\n}`
    }

    function kebabCase(str) {
        return str.replaceAll(/[A-Z]/g, '-$1')
    }


    const mylon = {
        encode: encodeMylon,
        tryEncode(data) {
            try {
                return mylon.encode(data)
            } catch (_) {
                return null
            }
        },
        canEncode(data) {
            try {
                mylon.encode(data)
                return true
            } catch (_) {
                return false
            }
        },

        parseVal(value_, isMLArrayMember = false) {
            let value = value_
            if (isMLArrayMember && value_.endsWith(',')) {
                value = value_.slice(0, -1)
            }

            if (value === 'nil') {
                return null
            } else if (value === 'true') {
                return true
            } else if (value === 'false') {
                return false
            } else if (parseInt(value)) {
                return parseInt(value)
            } else if (value.startsWith("'") && value.endsWith("'")) {
                return value.slice(1, -1)
            }

            throw 'Unsupported value structure passed to mylon.parseVal'
        },

        parse(content) {
            // parse single-line arrays
            function parseArray(value) {
                const array = []
                value = value.slice(1, -1).trim() // Remove square brackets

                if (value === '') {
                    return []
                }

                let items = value.split(',').map(item => item.trim())
                for (const item of items) {
                    array.push(mylon.parseVal(item))
                }

                return array
            }

            const lines = content.split('\n')
            const data = {}
            const stack = [data]
            const path = []
            let inMultilineArray = false
            let multilineArray = []
            let currentKey = null

            for (let line of lines) {
                line = line.trim()

                // Skip empty lines and comments
                if (line === '' || line.startsWith('#')) {
                    continue
                }

                // Handle multiline comments
                if (line.startsWith('#') && line.endsWith('#')) {
                    continue
                }

                // Handle key-value pairs and nested structures
                const keyValueMatch = line.match(/^(\w[\w-]*)\s*=\s*(.+)$/)
                if (keyValueMatch && !inMultilineArray) {
                    const key = keyValueMatch[1]
                    let value = keyValueMatch[2].trim()

                    // Handle array values
                    if (value.startsWith('[')) {
                        if (value.endsWith(']')) {
                            value = parseArray(value)
                        } else {
                            inMultilineArray = true
                            multilineArray = []
                            currentKey = key
                            continue;
                        }
                    }
                    // Handle object values
                    else if (value.startsWith('.{')) {
                        const obj = {}
                        stack[stack.length - 1][key] = obj
                        stack.push(obj)
                        path.push(key)
                        continue
                    }
                    // Handle primitive values
                    else {
                        value = mylon.parseVal(value)
                    }

                    stack[stack.length - 1][key] = value
                } else if (inMultilineArray) {
                    if (line === ']') {
                        inMultilineArray = false
                        stack[stack.length - 1][currentKey] = multilineArray
                        multilineArray = []
                        currentKey = null
                    } else {
                        multilineArray.push(mylon.parseVal(line, true))
                    }
                }

                // Handle end of nested structures
                if (line === '}') {
                    stack.pop()
                    path.pop()
                }
            }

            return data
        },

        tryParse(text) {
            try {
                return mylon.parse(text)
            } catch (_) {
                return null
            }
        },

        tryParseVal(val) {
            try {
                return mylon.parseVal(val)
            } catch (_) {
                return null
            }
        },

        canParse(text) {
            try {
                mylon.parse(text)
                return true
            } catch (_) {
                return false
            }
        },

        canParseVal(val) {
            try {
                mylon.parseVal(val)
                return true
            } catch (_) {
                return false
            }
        },

        fileType: 'mylon'
    }

    window.mylon = Object.freeze(mylon)









    // ======================================================================== //
    //                          logging utils                                   //
    // ======================================================================== //



    const LT_INFO = 'info',
        LT_WARN = 'warn',
        LT_ERR = 'error',
        LT_LOG = 'log',
        LT_DEBUG = 'debug',
        LT_FAIL = 'failure'

    const LL_AUTO = Symbol(),
        LL_HIGH = 2,
        LL_MED = 1,
        LL_LOW = 0





    ///  log clear  ///

    function logc(level = LL_MED) {
        const levels = {
            verbose: 2,
            standard: 1,
            minimal: 0,
            none: -1,
        }

        if (typeof level !== 'number' || level < 0 || level > 2) {
            return false
        }

        let loggingLevel = 1
        if ('logging' in logc.ml) {
            if (typeof logc.ml.logging !== 'string' || !(logc.ml.logging in levels)) {
                console.error(`> property \`logging\` is of invalid value or type \`${logc.ml.logging}\`: \`${typeof logc.ml.logging}\`; string in 'verbose', 'standard', 'minimal', 'none' expected`)
            } else {
                loggingLevel = levels[logc.ml.logging]
            }
        }

        if (level <= loggingLevel) {
            console.clear()
        }

        return true
    }






    ///  log write  ///

    function logw(type = LT_INFO, message = '(no message provided)', level_ = LL_AUTO) {
        const levels = {
            verbose: 2,
            standard: 1,
            minimal: 0,
            none: 3,
        }

        if (!('info warn error log debug failure'.split(' ').includes(type))) {
            return false
        }

        let level = level_
        if (level_ === LL_AUTO) {
            switch (type) {
                case LT_FAIL: { level = 0; break }
                case LT_ERR: { level = 0; break }
                case LT_WARN: { level = 1; break }
                case LT_INFO: { level = 2; break }
                case LT_DEBUG: { level = 2; break }
                case LT_LOG: { level = 2; break }
            }
        }

        if (typeof level !== 'number' || level < 0 || level > 2) {
            return false
        }

        let loggingLevel = 1
        if ('logging' in logw.ml) {
            if (typeof logw.ml.logging !== 'string' || !(logw.ml.logging in levels)) {
                console.error(`> property \`logging\` is of invalid value or type \`${logw.ml.logging}\`: \`${typeof logw.ml.logging}\`; string in 'verbose', 'standard', 'minimal', 'none' expected`)
            } else {
                loggingLevel = levels[logw.ml.logging]
            }
        }

        if (type === 'failure') {
            throw new Error(message)
        }

        if (level <= loggingLevel) {
            console[type]('> ' + message)
        }

        return true
    }











    // ======================================================================== //
    //                         high-level app code                              //
    // ======================================================================== //



    ///  entry point  ///

    let Acorn, Walk,
        slScriptEl, slPath

    async function main() {
        console.time('| full-build')

        const ml = await readMylonFromBuildFile()
        logw.ml = ml
        logc.ml = ml

        if ('css' in ml) {
            loadCSS(ml.css)
        }

        ///  a loader queue is needed since files load in parallel by default ///
        if ('plugins' in ml) {
            createLoaderQueue(ml)
            $__lqnext__$()
        } else {
            loadAcorn(document.createElement('script'), ml, true)
        }
    } main()


    async function readMylonFromBuildFile() {
        slScriptEl = document.querySelector('script[src$="olivine.js"]')
        slPath = slScriptEl.getAttribute('src').split('/').slice(0, -1).join('') + '/'

        const res = await fetch(slPath + 'build.mylon')
        const text = await res.text()

        try {
            return mylon.parse(text)
        } catch (e) {
            throw new Error('> file `build.mylon` could not be parsed')
        }
    }



    function createLoaderQueue(target) {
        let lq = []
        window.$__lqnext__$ = (() => lq.shift()())

        lq.push(() => {
            const tag = document.createElement('script')
            loadAcorn(tag, target)
        })

        lq.push(async() => {
            if ('assets' in target) {
                window.Assets = await createAssetServer(target.assets)
            }

            $__lqnext__$()
        })

        ///  count number of plugins that have finished loading - once done, move on. $__ploadedc__$ bindings added by translatePluginModules  ///
        let plc = 0
        window.$__ploadedc__$ = function() {
            if (++plc === target.plugins.load.length) {
                $__lqnext__$()
            }
        }

        lq.push(() => {
            for (const plugin of target.plugins.load) {
                const tag = document.createElement('script')
                loadPlugin((target.plugins.root ?? '') + plugin, tag, target.plugins)
            }
        })

        lq.push(() => {
            delete window.$__lqnext__$
            delete window.$__ploadedc__$
            loadEntry(target)
        })

        return lq
    }






    function createPluginPipeline(target) {
        let pluginFuncList = []

        const root = target.plugins.root ?? ''
        for (const i in target.plugins.load) {
            const pluginPath = target.plugins.load[i].split(':')[0]
            const pluginSym = target.plugins.load[i].split(':')[1]

            const rawPluginFunc = window[root + pluginPath][pluginSym]
            const pluginFunction = (...args) => {
                try {
                    return rawPluginFunc(...args)
                } catch (err) {
                    logw(LT_FAIL, `[${root + pluginPath}:${pluginSym}  ==>  ${args[0].full}]  ${err}`)
                }
            }

            if (!('mode' in target) || target.mode !== 'debug') {
                delete window[root + pluginPath][pluginSym]
            }

            pluginFuncList.push(pluginFunction)
        }

        pluginFuncList.push((file, Acorn, Walk) => translateUserModules(file, Acorn, Walk, target))

        return file => {
            let result = structuredClone(file)

            for (const i in pluginFuncList) {
                const pluginFunc = pluginFuncList[i]
                result = structuredClone(pluginFunc(result, Acorn, Walk))
            }

            result.path = file.path
            result.full = `${result.path}/` + result.name + '.' + result.type

            logw(LT_LOG, `file \`${file.full}\` loaded and processed into \`${result.full}\``)

            return result
        }
    }





    function getFileDescriptor(path) {
        const name = path.split('/').slice(-1).join('').split('.')[0]
        const type = path.split('.')[1]
        const loc = path.split('/').slice(0, -1).join('/')

        return Object.freeze({
            full: path, path: loc, name, type
        })
    }

    function getFileData(source, text) {
        const full = source.split(':')[0]
        const path = source.split(':')[0].split('.')[0].split('/').slice(0, -1).join('/')
        const name = source.split(':')[0].split('/')[source.split('/').length - 1].split('.')[0]
        const sym = source.split(':')[1]
        const type = source.split(':')[0].split('.')[1]

        return Object.freeze({
            full, path, name, sym, type, text
        })
    }






    ///  not placed in loaders because its special  ///
    async function loadEntry(target) {
        if (!('entry' in target)) {
            logw(LT_ERR, 'no entry point specified in build.mylon')
        } else {
            const pluginPipeline = createPluginPipeline(target)
            window.__slModuleImport__ = src => externImportSlModule(src, pluginPipeline, target)
            window.__slModuleExport__ = (src, mod) => externExportToSlModule(src, mod, target)
            window.__slMainInit__ = module => externSlMainInit(module, target)

            const entryFile = getFileData(target.entry.split(':')[0], await fetchTextAt(target.entry.split(':')[0]))
            const newEntryFile = pluginPipeline(entryFile)

            let tag = document.createElement('script')
            tag.src = createFileLink(newEntryFile.text)
            document.head.append(tag)
        }
    }






    // ======================================================================== //
    //                           asset server code                              //
    // ======================================================================== //
    let assetHandlers = new Map()

    async function createAssetServer(target) {
        let root = target.handlers.root ?? ''
        for (const handlerScriptPath of target.handlers.load) {
            let file = getFileDescriptor(root + handlerScriptPath)
            file = { ...file, text: await fetchTextAt(root + handlerScriptPath.split(':')[0]) }
            file = { ...file, text: translateLoaderModules(file.text, window._Acorn, file.full, handlerScriptPath.split(':')[1], target.handlers) }

            const url = createFileLink(file.text)
            let host = document.createElement('script')
            host.src = url
            host.addEventListener('load', () => {
                const handlerExports = window[file.full][handlerScriptPath.split(':')[1]]
                delete window[file.full]
                for (const [hk, hv] of Object.entries(handlerExports)) {
                    if (!hk.startsWith('.')) {
                        logw(LT_ERR, `(Asset Server) invalid starting character \`${hk[0]}\` for asset type \`${hk}\`, expected \`.\``)
                    }

                    if (!assetHandlers.has(hk)) {
                        assetHandlers.set(hk.slice(1), hv)
                    } else {
                        logw(LT_WARN, `(Asset Server) attempt by \`${file.full}\` to overwrite asset handler for file type \`${hk}\``)
                    }
                }
            })

            if (handlerScriptPath === target.handlers.load[target.handlers.load.length - 1]) {
                host.addEventListener('load', () => {
                    for (const assetPath of (target.preload ?? [])) {
                        loadAssetAt((target.root ?? '') + (target.root ? '/' : '') + assetPath, true)
                    }
                })
            }

            document.head.append(host)
        }

        return Object.freeze({
            load: path => loadAssetAt((target.root ?? '') + (target.root ? '/' : '') + path),
            ping: async path => (await fetch(path)).ok
        })
    }


    let unknownTypeCache = new Map()
    async function loadAssetAt(path, isPreload = false) {
        logw(LT_LOG, `(Asset Server) ${isPreload ? 'pre' : ''}loading asset at \`${path}\``)

        const handlerResult = await executeHandlers(path)
        if (handlerResult !== undefined) {
            return handlerResult
        }

        if (!unknownTypeCache.has(path)) {
            logw(LT_WARN, `(Asset Server) could not find loader for asset at ${path}, ${isPreload ? 'pre' : ''}loading as text file`)
            unknownTypeCache.set(path, await fetchTextAt(path))
        }


        return unknownTypeCache.get(path)
    }



    async function executeHandlers(path) {
        const fd = getFileDescriptor(path)

        ///  single-type files don't need all the loader resolution rules  ///
        if (fd.type.split('.').length === 1 && assetHandlers.has(fd.type)) {
            return assetHandlers.get(fd.type)(fd)
        } else if (fd.type.split('.').length > 1) {
            let fts = fd.type.split('.')
            ///  should never run more than about three iterations; not worried ab ob1 errs here  ///
            const MAX_ITERATIONS = 50
            let iter = 0
            while (++iter < MAX_ITERATIONS) {
                if (assetHandlers.has(fts.join('.'))) {
                    const res = assetHandlers.get(fts.join('.'))({
                        ...fd,
                        type: fts.join('.')
                    })

                    if (res !== undefined) {
                        return res
                    }
                }

                if (fts.length > 0) {
                    fts.shift()
                } else {
                    break
                }
            }
        }

        return undefined
    }






    // ======================================================================== //
    //                        external module handlers                          //
    // ======================================================================== //


    const modules = new Map()
    const resolvers = []
    window.$__RESOLVE__$ = () => {
        (resolvers.pop())()
    }

    async function externImportSlModule(source, pluginPipeline, target) {
        if (!modules.has(source.split('.')[0])) {
            return new Promise((resolve, reject) => {
                let req = new XMLHttpRequest()
                req.open('GET', source, false)
                req.send(null)

                const resFile = getFileData(source, req.responseText)
                const processedRes = pluginPipeline(resFile)

                const script = document.createElement('script')
                script.src = createFileLink(processedRes.text)

                resolvers.push(() => resolve(modules.get(source.split('.')[0])))
                script.onload = () => {
                    logw(LT_LOG, `module at \`${source}\` loaded`)
                }

                script.onerror = error => {
                    logw(LT_ERR, `module at \`${source}\` failed to load`)
                    reject(error)
                }

                document.head.append(script)
            })
        }

        return Promise.resolve(modules.get(source.split('.')[0]))
    }


    function externExportToSlModule(source, module, target) {
        if (modules.has(source.split('.')[0])) {
            logw(LT_WARN, `module at \`${source}\` being overwritten`)
        } else {
            logw(LT_LOG, `module at \`${source}\` exported to linker`)
        }

        modules.set(source.split('.')[0], module)
    }


    function externSlMainInit(module, target) {
        const { entry } = target

        for (const [k, v] of Object.entries(module)) {
            if (k !== entry.split(':')[1]) {
                window[k] ??= v
            }
        }

        const entryFunc = module[entry.split(':')[1]]

        if (!entryFunc) {
            logw(LT_ERR, `entry point \`${entry.split(':')[1]}\` not found in file \`${entry.split(':')[0]}\``)
        } else {
            logw(LT_LOG, `calling entry point \`${entry}\` -- Build completed in:`)
            console.timeEnd('| full-build')
            entryFunc()
        }
    }



    ///  some utils for file linking  ///

    async function fetchTextAt(path) {
        const file = await fetch(path)
        return await file.text()
    }

    /**
    * @description creates a new URL to the given text as a file and returns it
    */
    function createFileLink(text) {
        return URL.createObjectURL(new File([text], ''))
    }









    // ======================================================================== //
    //                                 loaders                                  //
    // ======================================================================== //

    function loadCSS(target) {
        validateCSSTarget(target)

        for (const i in target.styles) {
            const path = target.styles[i]

            let tag = document.createElement('link')
            tag.rel = 'stylesheet'
            tag.href = (target.root ?? '') + path
            document.head.append(tag)
        }
    }

    function validateCSSTarget(target) {
        if (!('styles' in target)) {
            logw(LT_FAIL, 'required property `styles` not found in field `css`')
        }

        if (typeof (target.root ?? '') !== 'string') {
            logw(LT_WARN, `property \`root\` in field \`css\` is of invalid type \`${typeof target.root}\`; \`string\` expected`)
        }

        const styles = target.styles
        // just some validation to check that styles is string[] because js sucks
        if (!Array.isArray(styles) || !(styles.length > 0 && typeof styles[0] === 'string')) {
            logw(LT_WARN, `property \`styles\` is of invalid type \`${
                Array.isArray(styles) ?
                    styles.length > 0 ?
                        typeof styles[0] + '[]'
                        : '(unknown)[]'
                    : typeof styles
            }\`; \`string[]\` expected`)
        }
    }





    function loadAcorn(receiverTag, target, skipChain = false) {
        window.$__mlt__$ = target
        receiverTag.src = slPath + 'acorn/index.js'
        receiverTag.type = 'module'
        receiverTag.addEventListener('load', async () => {
            window._Acorn = window._Acorn.Parser.extend(window.jsxm.exports())
            Acorn = window._Acorn
            Walk = window._Walk

            if (!('mode' in target) || target.mode !== 'debug') {
                delete window._Acorn
                delete window._Walk
                delete window.jsxm
            }

            ///  in case plugins aren't used  ///
            if (skipChain) {
                loadEntry(target)
            }
        })

        document.head.append(receiverTag)
    }

    async function loadPlugin(qualifiedSym, receiverTag, target) {
        const [fullPath, sym] = qualifiedSym.split(':')
        const fileText = translatePluginModules(await fetchTextAt(fullPath), Acorn, fullPath, sym, target)

        receiverTag.src = createFileLink(fileText)

        document.head.append(receiverTag)
    }







    // ======================================================================== //
    //                              linker plugins                              //
    // ======================================================================== //


    ///  converts the iterator into an array  ///

    function pullTokenList(list) {
        let result = []

        for (const tok of list) {
            result.push(tok)
        }

        return result
    }



    function translatePluginModules(text, Acorn, fullPath, sym, target) {
        let result = '"use strict";\n(() => {\n' + text
        const tokens = pullTokenList(Acorn.tokenizer(result))
        let offset = 0

        function setres(p, s) {
            result = result.split('')

            if (typeof p === 'number') {
                offset = offset + s.length - 1
                result[p] = s
            } else {
                result[p[0] + offset] = s
                for (let i = p[0] + 1; i <= p[1]; i = i + 1) {
                    result[i + offset] = ''
                }

                offset = offset + s.length - (p[1] - p[0] + 1)
            }

            result = result.join('')
        }

        let appendStr = `\n\nwindow['${fullPath}'] = {}\n`
        function appendres(s) {
            appendStr = appendStr + s + '\n'
        }

        let foundSymbol = false
        for (let i = 0; i < tokens.length; i = i + 1) {
            const tok = tokens[i]
            const loc = [tok.start, tok.end]

            if (tok.type.label === 'export') {
                try {
                    setres(loc, '')
                    if (target['allow-secondary-exports']) {
                        let exportedSym
                        if (tokens[i + 1].type.label === 'async') {
                            exportedSym = tokens[i + 3].value  ///  matches `export const|var|function <name>`  ///
                        } else {
                            exportedSym = tokens[i + 2].value
                        }

                        if (exportedSym !== sym) {
                            appendres(`window['${exportedSym}'] = ${exportedSym}`)
                        } else {
                            appendres(`\n\n/* MAIN EXPORT */ window['${fullPath}']['${sym}'] = ${sym}\n\n`)
                            foundSymbol = true
                        }
                    }
                } catch (e) {
                    logw(LT_FAIL, `failed to parse export from plugin at \`${fullPath}\`; expected token at (token-aligned) positions ${i}..${i + 3}, got length ${tokens.length}`)
                }
            }
        }

        if (!foundSymbol) {
            logw(LT_ERR, `required linker symbol \`${sym}\` not found in file \`${fullPath}\`; it may not be exported`)
        }

        return result + appendStr + 'window.$__ploadedc__$()})()'
    }

    function translateLoaderModules(text, Acorn, fullPath, sym, target) {
        let result = '"use strict";\n(() => {\n' + text
        const tokens = pullTokenList(Acorn.tokenizer(result))
        let offset = 0

        function setres(p, s) {
            result = result.split('')

            if (typeof p === 'number') {
                offset = offset + s.length - 1
                result[p] = s
            } else {
                result[p[0] + offset] = s
                for (let i = p[0] + 1; i <= p[1]; i = i + 1) {
                    result[i + offset] = ''
                }

                offset = offset + s.length - (p[1] - p[0] + 1)
            }

            result = result.join('')
        }

        let appendStr = `\n\nwindow['${fullPath}'] = {}\n`

        function appendres(s) {
            appendStr = appendStr + s + '\n'
        }

        let foundSymbol = false
        for (let i = 0; i < tokens.length; i = i + 1) {
            const tok = tokens[i]
            const loc = [tok.start, tok.end]

            if (tok.type.label === 'export') {
                try {
                    setres(loc, '')
                    if (target['allow-secondary-exports']) {
                        let exportedSym
                        if (tokens[i + 1].type.label === 'async') {
                            exportedSym = tokens[i + 3].value  ///  matches `export const|var|function <name>`  ///
                        } else {
                            exportedSym = tokens[i + 2].value
                        }

                        if (exportedSym !== sym) {
                            appendres(`window['${exportedSym}'] = ${exportedSym}`)
                        } else {
                            appendres(`\n\n/* MAIN EXPORT */ window['${fullPath}']['${sym}'] = ${sym}\n\n`)
                            foundSymbol = true
                        }
                    }
                } catch (e) {
                    logw(LT_FAIL, `(Asset Server) failed to parse export from asset loader at \`${fullPath}\`; expected token at (token-aligned) positions ${i}..${i + 3}, got length ${tokens.length}`)
                }
            }
        }

        if (!foundSymbol) {
            logw(LT_FAIL, `(Asset Server) required linker symbol \`${sym}\` not found in file \`${fullPath}\`; it may not be exported`)
        }

        return result + appendStr + '})()'
    }






    // import { symbol, symbol, symbol } from 'PATH'
    function translateUserModules(file, Acorn, Walk, target) {
        let result = structuredClone(file)

        result.text = '"use strict";\n' + result.text

        function setres([start, end], substitute) {
            result.text = result.text.substring(0, start) + substitute + result.text.substring(end);
        }

        ///  this weird loop is really inefficient but it removes the need for offset management in result.text  ///
        {
            let breakWalk = false
            while (true) {
                Walk.simple(Acorn.parse(result.text), {
                    ImportDeclaration: node => {
                        if (!breakWalk) {
                            breakWalk = true


                            if (node.specifiers.length === 1 && node.specifiers[0].type === 'ImportDefaultSpecifier') {
                                setres(
                                    [node.start, node.end],
                                    `const ${
                                        node.specifiers[0].local.name
                                    } = await window.__slModuleImport__('${
                                        node.source.value
                                    }')`
                                )
                            } else {
                                setres(
                                    [node.start, node.end],
                                    `const { ${
                                        node.specifiers.filter(n => n.type === 'ImportSpecifier').map(n => n.imported.name).join(', ')
                                    } } = await window.__slModuleImport__('${
                                        node.source.value
                                    }')`
                                )
                            }
                        }
                    }
                })


                if (!breakWalk) {
                    break
                } else {
                    breakWalk = false
                }
            }
        }

        {
            if (target.plugins.load.some(path => path.split(':')[1] === 'degrob')) {
                result.text = result.text + '\n\n; let __thisModule = {}'
            } else {
                result.text = result.text + '\n\nlet __thisModule = {}'
            }


            Walk.simple(Acorn.parse(result.text), {
                ExportNamedDeclaration: node => {
                    const decl = node.declaration?.id?.name ?? node.declaration.declarations[0].id.name
                    result.text = result.text + `\n__thisModule.${decl} = ${decl}`
                }
            })

            if (file.full !== target.entry.split(':')[0]) {
                result.text = result.text + `\nwindow.__slModuleExport__('${file.full}', Object.freeze(__thisModule));`
            } else {
                result.text = result.text + `\nwindow.__slMainInit__(__thisModule)`
            }



            let breakWalk = false
            while (true) {
                Walk.simple(Acorn.parse(result.text), {
                    ExportNamedDeclaration: node => {
                        if (!breakWalk) {
                            breakWalk = true
                            setres([node.start, node.start + 'export '.length], '')
                        }
                    }
                })


                if (!breakWalk) {
                    break
                } else {
                    breakWalk = false
                }
            }
        }

        result.text = '(async() => {\n' + result.text + (file.full !== target.entry.split(':')[0] ? '\nwindow.$__RESOLVE__$()' : '') + '\n})()'
        return result
    }



})()
