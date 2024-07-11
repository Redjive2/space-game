export const handlers = {}
handlers['.mylon'] = handleMylon

const reg = new Map()

async function handleMylon(fd) {
    if (reg.has(fd.full)) {
        return reg.get(fd.full)
    }

    const text = await fetch(fd.full).then(res => res.text())
    const result = Object.freeze(mylon.tryParse(text))

    reg.set(fd.full, result)
    return result
}
