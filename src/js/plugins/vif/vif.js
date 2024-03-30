let __br__, __ap__

const global = null    // preprocessor directive for @module
const entry = null     // preprocessor directive for @module

function handle() {    /* ... preprocessor code ... */ }
function watch(prop) { /* ... preprocessor code ... */ }
function $() {         /* ... preprocessor code ... */ }
function component() { /* ... preprocessor code ... */ }


/*

GLOBAL EXPORTS:

    module((exports) => void) => Module
    require(Module) => readonly Object
    main(() => void) => void
    println(...any) => void
    dbg(...any) => void

IN VIF:
    makeEnum(...string) => Enum                                           // enum decl

    wrap(T) => Result<T>                                                  // wraps a value in a result based on if it is false, nil/undef, or a failed result
    expect(() => T) => Result<T>                                          // converts a fallible function to a result value
    suppress(() => T) => T?                                               // converts a fallible function to an optional value

    query(string|Node, ...string) => Node                                 // just querySelector

    run(() => T) => T                                                     // runs a function and returns its output

    timeout(number, () => void) => Timeout                                // setTimeout but better
    interval(number, () => void) => Interval                              // setInterval but better

    make(int) => int[]                                                    // make array of given size
    aggregate(T[], ...(any) => any) => any[]                              // list pipe
    pipe(T, ...(any) => any) => any                                       // pipes a value through a series of transformations
        pipe.safe(...) => ...                                             // pipe, but early returns on failure
        pipe.opt(...) => ...                                              // pipe, but early returns on null/undefined

    info(any) => Object                                                   // gives all the following three
        type(any) => string                                               // typeof, but has special cases for  null, array, and dom nodes
        exists(any) => boolean                                            // checks if a value is not null and not undefined
        iterable(any) => boolean                                          // checks if a value is not null and is an object | array

    html `string` => Document.Fragment                                    // returns an html element parsed from html-jsx as a string template
    html.el `string` => Document.Element                                  // same as html, but only returns first element of the frag

    keyof(Object) => string[]                                             // literally Object.keys(Object)

    deepFreeze(T) => readonly T                                           // literally Object.freeze(Object) but deep

    equivalent(any, any) => boolean                                       // structurally compares two values
    matches(any, ...any) => boolean                                       // checks if the first value matches any of the following using ===
        matches.equivalent(any, ...any) => boolean                        // same as matches, but using structural equality

*/


function remote(el, key, ...args) {
    window[el.getAttribute('instanceId') + key] = args
    el.setAttribute('s__' + key, '1')
    window[el.getAttribute('instanceId') + key] = null
}


function $VC__kebabCase(str) {
    let s = ""
    for (const i in str) {
        const c = str[i]
        if (/[A-Z]/.test(c)) {
            s += ((i > 0 ? '-' : '') + c.toLowerCase())
        } else {
            s += c
        }
    }

    return s
}


function a__mod(f) {
    const exports = {}
    f(exports)

    for (const key in exports) {
        if (!(key in window)) {
            window[key] = exports[key]
            if (exports[key].prototype instanceof HTMLElement) {
                customElements.define($VC__kebabCase(key), exports[key])
            }
        }
    }

    return exports
}

const { Vif, module, require, println, dbg } = (() => {
    const o = {},
        auth = Symbol(),
        backAuth = Symbol(),
        modAuth = Symbol();

    (exports => {
        (() => {
            const modReg = new Map()

            exports.module = module
            function module(f) {
                const modID = Symbol()

                const load = function() {
                    if (modReg.has(modID)) {
                        return modReg.get(modID)
                    }

                    const t = {}
                    f(t)

                    for (const key in t) {
                        if (t[key].prototype instanceof HTMLElement) {
                            customElements.define($VC__kebabCase(key), t[key])
                        }
                    }

                    modReg.set(modID, t)
                    return Object.freeze(t)
                }

                return Object.freeze({
                    '#__unpack'(a) {
                        if (a === auth) {
                            return [modAuth, load()]
                        } else {
                            throw 'Unauthorized attempt to unpack module'
                        }
                    }
                })
            }

            exports.makeEnum = function(...entries) {
                const res = {}

                for (const entry of entries) {
                    res[entry] = Symbol(entry)
                }

                return Object.freeze(res)
            }

            exports.suppress = function(f) {
                try {
                    return f()
                } catch (_) {
                    return null
                }
            }

            exports.wrap = function(v) {
                if (v !== null && v !== undefined && !(v instanceof Error) && v !== false && ('#__VF__RESULT' in v ? v.success() : true)) {
                    return exports.expect(() => v)
                } else {
                    return exports.expect(() => { throw '' })
                }
            }

            exports.expect = function(f) {
                function wrap(val, success) {
                    return success
                        ? {
                            '#__VF__RESULT': true,
                            unwrap: () => val,
                            map: f => exports.expect(() => f(val)),
                            success: () => true,
                            ok: () => val
                        }
                        : {
                            '#__VF__RESULT': true,
                            unwrap: () => { throw 'unwrap failed' },
                            map: f => exports.expect(() => { throw '' }),
                            success: () => false,
                            ok: () => null
                        }
                }

                try {
                    return wrap(f(), true)
                } catch (_) {
                    return wrap(null, false)
                }
            }

            const nil = Symbol()
            exports.query = function(first, sec = nil) {
                if (sec !== nil) {
                    return first.querySelector(sec)
                } else {
                    return document.querySelector(first)
                }
            }

            exports.query.all = function(first, sec = nil) {
                if (sec !== nil) {
                    return first.querySelectorAll(sec)
                } else {
                    return document.querySelectorAll(first)
                }
            }

            exports.run = function run(f) {
                return f()
            }

            exports.timeout = function timeout(delay, callback) {
                const id = setTimeout(callback, delay)

                return Object.freeze({
                    clear: () => clearTimeout(id)
                })
            }

            exports.interval = function(delay, callback) {
                let i = 0
                const id = setInterval(() => {
                    callback(i)
                    i++
                }, delay)

                return Object.freeze({
                    clear: () => clearInterval(id)
                })
            }

            // make array of size
            exports.make = function(size) {
                let a = []
                for (let i = 0; i < size; i++) {
                    a.push(i)
                }

                return a
            }

            // list pipe
            exports.aggregate = function(startList, ...mutators) {
                let list = []

                for (const start of startList) {
                    if (mutators.length === 0 || mutators.some(it => typeof it !== 'function')) {
                        throw 'unsupported data passed to Vif.aggregate(startList, ...mutations)'
                    }

                    let acc = start
                    for (const mut of mutators) {
                        acc = mut(acc)
                    }

                    list.push(acc)
                }

                return list
            }

            // applies a series of mutator functions onto the result of the previous version, then returns the result
            exports.pipe = function(start, ...mutators) {
                if (mutators.length === 0 || mutators.some(it => typeof it !== 'function')) {
                    throw 'unsupported data passed to Vif.pipe(start, ...mutations)'
                }

                let acc = start
                for (const mut of mutators) {
                    acc = mut(acc)
                }

                return acc
            }

            // early returns on null | undefined
            exports.pipe.opt = function(start, ...mutators) {
                if (mutators.length === 0 || mutators.some(it => typeof it !== 'function')) {
                    throw 'unsupported data passed to Vif.pipe.opt(start, ...mutations)'
                }

                let acc = start
                for (const mut of mutators) {
                    const res = mut(acc)
                    if (res === null || res === undefined) {
                        return acc
                    }

                    acc = res
                }

                return acc
            }

            // early returns on err
            exports.pipe.safe = function(start, ...mutators) {
                if (mutators.length === 0 || mutators.some(it => typeof it !== 'function')) {
                    throw 'unsupported data passed to Vif.pipe.safe(start, ...mutations)'
                }

                let acc = start
                for (const mut of mutators) {
                    let res
                    try {
                        res = mut(acc)
                    } catch (_) {
                        return acc
                    }

                    acc = res
                }

                return acc
            }


            exports.info = function(val) {
                return Object.freeze({
                    type: type(val),
                    exists: val !== null && val !== undefined,
                    iterable: typeof val === 'object' && val !== null
                })
            }


            exports.type = type
            function type(val) {
                if (val === null) {
                    return 'null';
                }

                if (Array.isArray(val)) {
                    return 'array';
                }

                if (val instanceof Node) {
                    return 'node';
                }

                if (val instanceof Error) {
                    return 'error';
                }

                if (typeof val === 'object' && '#__VF__RESULT' in val) {
                    return 'result'
                }

                return typeof val;
            }

            const domParser = new DOMParser()
            exports.html = function(sts, ...interps) {
                const rand = String(Math.random())
                const strings = sts

                let htmlString = ''
                for (const i in strings) {
                    if (i in interps) {
                        if (type(interps[i]) === 'function' &&
                            strings[i].endsWith('=') &&
                            strings[i].slice(strings[i].lastIndexOf(' ') + 1).startsWith('on:') &&
                            strings[i].slice(strings[i].lastIndexOf(' ') + 1).endsWith('=') &&
                            strings[i].slice(strings[i].lastIndexOf(' ') + 1).length < 32
                        ) {
                            htmlString += strings[i]
                            htmlString += '"#_' + rand + '--' + i + '"'
                        } else if (type(interps[i]) === 'function' &&
                            strings[i].endsWith(':') &&
                            strings[i].slice(strings[i].lastIndexOf(' ') + 1).startsWith('use:')
                        ) {
                            htmlString += strings[i].slice(0, strings[i].length - 4) + 'on:' + interps[i].name + '='
                            htmlString += '"#_' + rand + '--' + i + '"'
                        } else if (strings[i].endsWith('=')) {
                            htmlString += strings[i] + '"'
                            htmlString += interps[i] + '"'
                        } else {
                            htmlString += strings[i]
                            htmlString += interps[i]
                        }
                    } else {
                        htmlString += strings[i]
                    }
                }

                const html = domParser.parseFromString(htmlString, 'text/html')

                html.querySelectorAll('fragment').forEach(frag => {
                    const docFrag = html.createDocumentFragment()

                    const localToAppend = []
                    for (const node of frag.childNodes) {
                        localToAppend.push(node)
                    }

                    for (const node of localToAppend) {
                        docFrag.append(node)
                    }

                    frag.parentNode.insertBefore(docFrag, frag)
                    frag.remove()
                })

                function patch(el) {
                    for (const attr of el.attributes) {
                        if (attr.name.startsWith('on:') && attr.value.startsWith(`#_${rand}--`)) {
                            const index = parseInt(attr.value.slice(attr.value.lastIndexOf('-') + 1))

                            el.removeAttribute(attr.name)
                            el.addEventListener(attr.name.slice(3), interps[index])
                        }
                    }

                    for (const child of el.children) {
                        patch(child)
                    }
                }

                const frag = html.createDocumentFragment()

                for (let i = html.body.childNodes.length - 1; i >= 0; i--) {
                    frag.prepend(html.body.childNodes[i])
                }

                for (const child of frag.children) {
                    patch(child)
                }

                return frag
            }



            exports.html.el = function(string, ...interps) {
                const html = exports.html(string, ...interps)

                if (html.children.length !== 1) {
                    throw 'template string passed to Vif.html.el must generate 1 element'
                }

                return html.firstChild
            }


            function unpack(box) {
                if (!(
                    type(box) === 'object' &&
                    '#__unpack' in box
                )) {
                    throw 'Unsupported box type passed to (private) Vif.unpack(box)'
                }

                const [ba, res] = box['#__unpack'](auth)

                if (ba === backAuth) {
                    return res
                } else {
                    throw 'Invalid credentials in box passed to (private) Vif.unpack(box)'
                }
            }

            exports.unpackModule = unpackModule
            function unpackModule(box) {
                if (!(
                    type(box) === 'object' &&
                    '#__unpack' in box
                )) {
                    throw 'Unsupported box type passed to (private) Vif.unpackModule(box)'
                }

                const [ma, res] = box['#__unpack'](auth)

                if (ma === modAuth) {
                    return res
                } else {
                    throw 'Invalid credentials in box passed to (private) Vif.unpackModule(box)'
                }
            }


            exports.exists = function(val) {
                return val !== null && val !== undefined
            }

            const iterable = val => ((typeof val === 'object') && (!!val))
            exports.iterable = iterable

            exports.keyof = function(o) {
                if (typeof o !== 'object') {
                    throw 'invalid type `' + type(o) + '` provided to Vif.keyof(o)'
                }

                return Object.keys(o)
            }

            exports.deepFreeze = function(val) {
                function constify(v) {
                    if (type(v) === 'object' || type(v) === 'array') {
                        for (const k in v) {
                            constify(v[k])
                        }
                    }

                    Object.freeze(v)
                }

                constify(val)
                return val
            }


            exports.equivalent = equivalent
            function equivalent(left, right) {
                function eq(a, b) {
                    if (type(a) !== type(b)) {
                        return false
                    }

                    const compType = type(a)

                    if (compType === 'function') {
                        const sa = String(a).replace(/\s+/, '')
                        const sb = String(b).replace(/\s+/, '')
                        return (
                            /* same signature */ sa.slice(0, sa.indexOf('{')) === sb.slice(0, sb.indexOf('{')) &&
                            sa === sb
                        )
                    } else if (compType !== 'object' && compType !== 'array') {
                        return a === b
                    }

                    for (const key in a) {
                        if (
                            !(key in b) ||
                            !eq(a[key], b[key])
                        ) {
                            return false
                        }
                    }

                    for (const key in b) {
                        if (!(key in a)) {
                            return false
                        }
                    }

                    return true
                }

                return eq(left, right)
            }


            exports.matches = matches
            function matches(left, ...right) {
                return right.includes(left)
            }

            matches.equivalent = function(left, ...right) {
                return right.some(it => equivalent(left, it))
            }
        })()

        return exports
    })(o)

    Object.freeze(o)

    const r = {}
    for (const key in o) {
        if (key !== 'module' && key !== 'unpackModule') {
            r[key] = o[key]
        }
    }

    return {
        Vif: {
            '#__unpack'(a) {
                if (a === auth) {
                    return [modAuth, r]
                } else {
                    throw 'Unauthorized attempt to unpack module'
                }
            }
        },

        module: o.module,

        require(...modules) {
            if (modules.length === 0) {
                return {}
            }

            let r = {}
            for (const module of modules) {
                r = {
                    ...r,
                    ...o.unpackModule(module)
                }
            }

            return r
        },

        println(...values) {
            console.log(...values)
        },

        dbg(...values) {
            console.info(values)
            debugger
        }
    }
})();

(() => {
    async function run(f) {
        await f()
    }

    run(async() => {
        const thisPath = document
            .querySelector('script[src$="vif.js"]')
            .getAttribute('src')

        const slPath = thisPath.slice(0, thisPath.lastIndexOf('/') + 1) + 'path.sl'

        const resp = await fetch(slPath)
        const slText = await resp.text()
        const files = parseSl(slText)

        function parseSl(sl) {
            const lines = sl.split('\n').map(it => it.trim()).filter(it => it.trim() !== '')
            __br__ = 'http://' + lines.shift().split(" = ")[1] + '/'
            __ap__ = lines.shift().split(" = ")[1] + '/'

            const full = []
            const paths = []
            for (const line of lines) {
                if (line === '[-]') {
                    paths.pop()
                } else if (line.startsWith('[') && line.endsWith(']') && /[a-zA-Z\-0-9]+/.test(line.slice(1, -1))) {
                    paths.push(line.slice(1, -1))
                } else {
                    let path = ''

                    if (paths.length !== 0) {
                        path += paths.join('/') + '/'
                    }

                    path += line

                    let res = {
                        type: path.slice(path.lastIndexOf('.') + 1),
                        full: path,
                        name: path.slice(path.lastIndexOf('/') + 1).slice (
                            0,
                            path.slice(path.lastIndexOf('/') + 1).indexOf('.')
                        )
                    }

                    full.push(res)
                }
            }

            return full
        }


        for (const file of files.filter(it => it.type === 'jsx')) {
            const host = document.createElement('script')
            host.setAttribute('type', 'text/javascript')

            let processed = await fetch(file.full)
            processed = await processed.text()

            let out = ''

            function translateJSX(jsx) {
                let final = jsx
                    .replaceAll(/@module\s*\(\s*global\s*\)\s*const\s+([a-zA-Z_$]+)\s*=\s*\(\s*\)\s*=>\s*\{/g, 'const $1 = a__mod(__$1); function __$1(exports) { const $__VIF = require(Vif);')
                    .replaceAll(/@module\s*\(\s*entry\s*\)\s*const\s+([a-zA-Z_$]+)\s*=\s*\(\s*\)\s*=>\s*\{/g, 'const $1 = m__mod(__$1); function __$1(exports) { const $__VIF = require(Vif);')
                    .replaceAll('module(() => {', 'module(exports => {')
                    .replaceAll('<>', '$__VIF.html`')
                    .replaceAll('</>', '`')
                    .replaceAll(/([A-Za-z\-]+)=\{/g, `$1=\${`)
                    .replaceAll(
                        /@export\s+(const|let|var)\s+([a-zA-Z_$]+)/g,
                        'let $2;exports.$2 = $2'
                    )
                    .replaceAll(
                        /@export\s+(function|class)\s+([a-zA-Z_$]+)/g,
                        'exports.$2 = $2;$1 $2'
                    )
                    .replaceAll(
                        /@listen\s+([a-zA-Z_$]+)\s*\(/g, (_, name) => {
                            return `$l__${name}(`
                    })
                    .replaceAll(
                        /@import\(((?:[a-zA-Z_$]+)(?:,\s*[a-zA-Z_$]+\s*)*)\)\s*let\s*((?:[a-zA-Z_$]+)(?:,\s*[a-zA-Z_$]+\s*)*);/g,
                        (_a, namespaces, names, _b, _c) => {
                            return `const {${names}} = require(${namespaces});`
                        }
                    )
                    .replaceAll(
                        /@module\s+const\s+([a-zA-Z_$]+)\s*=\s*\(\s*\)\s*=>\s*\{/g,
                        'const $1 = module(__$1); function __$1(exports) { const $__VIF = require(Vif); '
                    )
                    .replaceAll(/@handle\s+setup\s*\(\s*\)\s*\{/g, '__vifSetup() {')
                    .replaceAll(/@handle\s+init\s*\(\s*\)\s*\{/g, '__vifInit() {')
                    .replaceAll(/@handle\s+([a-zA-Z_$]+)/g, '$1Callback')

                let names = []

                final = final.replaceAll(/@component\s+class\s+([A-Z][a-zA-Z_$]*)\s*\{/g, (_, name) => {
                    const elName = name.replaceAll(/([A-Z])/g, it => '-' + it.toLowerCase()).slice(1)
                    names.push([name, elName])
                    return `const ${name} = exports.${name} = class ${name} extends HTMLElement {\nstatic instanceIdBuf = 0; constructor() {
        super();
        this.internals = this.attachInternals();
        this.query = (...queries) => $__VIF.query(this, ...queries);
        this.create = (htm_) => this.replaceChildren(htm_);
        this.prop = (o) => (typeof o === 'function' ? o.bind(this) : o);
        this.merge = prop => {this.setAttribute(prop, this[prop]); return this[prop]};
        this.instanceId = ${name}.instanceIdBuf++;
        for (const key of Object.getOwnPropertyNames(this.__proto__)) {
            if (key.startsWith('w__')) {
                this[key]();
            }

            if (key.startsWith('$l__')) {
                this.addEventListener(key.slice(4), this[key])
            }

            if (key.startsWith('s__')) {
                this.merge(key);
                this.merge('instanceId');
                window[this.getAttribute('instanceId') + key.slice(3)] = null
            }
        }
        if ("__vifSetup" in this) this.__vifSetup();
        if ("__vifInit" in this) this.__vifInit();
    }`
                })

                final = final.replaceAll(/@\$\s+([a-zA-Z_$]+)/g, 'cs__$1 = true; __$1_l=[];get $1(){return this.__$1};set $1(v){this.__$1=v;if (this.cs__$1) for(const l of this.__$1_l){l.call(this)}}\n__$1')
                    .replaceAll(/@watch\s*\(\s*this.([a-zA-Z_$]+)\)\s*([a-zA-Z_$]+)\s*\(\s*\)\s*\{/g, 'w__$2() { if(!(this.__$1_l.includes(this.w__$2))) {this.__$1_l.push(this.w__$2); return}')
                return final //+ `;(() => { ` + (names.length > 0 ? `const {${names.map(it => it[0]).join(', ')}} = require(Components); ` : '') + `${names.map(([name, elName]) => 'customElements.define("' + elName + '", ' + name + ');').join(' ')} })();`
            }

            if (processed.length > 5000) {
                const lines = processed.split('\n')

                let buffers = [[]]
                let j = 0
                let count = 0

                for (const i in lines) {
                    buffers[j].push(lines[i])
                    count++

                    if (count === 25) {
                        count = 0
                        j++
                        buffers.push([])
                    }
                }

                buffers = buffers.filter(it => it.length > 0).map(it => it.join('\n'))

                for (const buffer of buffers) {
                    out += translateJSX(buffer)
                }
            } else {
                out = translateJSX(processed)
            }

            const temp = new File([`// compiled by SL from source: ${file.full} \n'use strict';\n\n` + out], file.name, {
                type: 'text/javascript'
            })

            host.setAttribute('sl-from', file.full)
            host.src = URL.createObjectURL(temp)

            document.body.append(host)
        }


        for (const file of files.filter(it => it.type === 'js' && it.name !== 'vif')) {
            const host = document.createElement('script')
            host.setAttribute('type', 'text/javascript')
            host.setAttribute('src', file.full)

            document.body.append(host)
        }

        for (const file of files.filter(it => it.type === 'css')) {
            const host = document.createElement('link')
            host.setAttribute('type', 'text/css')
            host.setAttribute('rel', 'stylesheet')
            host.setAttribute('href', file.full)

            document.head.append(host)
        }


    })
})();


function m__mod(f) {
    const main = module(f)
    const exports = require(main)

    if (!('main' in exports)) {
        throw 'main function not found in entry point ' + f.name
    }

    exports.main()

    for (const key in exports) {
        if (exports[key].prototype instanceof HTMLElement) {
            customElements.define($VC__kebabCase(key), exports[key])
        }
    }

    return main
}

document.body.click()
