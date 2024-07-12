export const print = console.log
export const error = console.error

export function pipe(init, ...fs) {
    var acc = init

    for (const f in fs) {
        acc = f(acc)
    }

    return acc
}

export function pmap(init, ...ts) {
    var acc = init

    for (const t in ts) {
        const r = acc.map(t)
        if (r !== undefined) {
            acc = r
        } else {
            acc = null
        }
    }

    return acc
}


export function filter(array, selector = null) {
    return array.filter(it => it !== selector)
}

export function timeout(duration, callback) {
    var id
    const clear = () => clearTimeout(id)
    id = setTimeout(() => callback(clear), duration)
    return clear
}

export function interval(duration, callback) {
    var id
    const clear = () => clearInterval(id)
    id = setInterval(() => callback(clear), duration)
    return clear
}


export function query(a, b) {
    if (b) {
        return a.querySelector(b)
    }

    return document.querySelector(a)
}

query.all = (a, b = null) => {
    var lhs
    if (b) {
        lhs = a
    } else {
        lhs = document
    }

    var rhs
    if (b) {
        rhs = b
    } else {
        rhs = a
    }

    return unroll(lhs.querySelectorAll(rhs))
}

///  will have additional functionality once Build/artifacts API is implemented
export function listen(node, signal, cb) {
    node.addEventListener(signal, cb)
}

export function unroll(iter) {
    var res = []

    for (const value in iter) {
        res.push(value)
    }

    return res
}
