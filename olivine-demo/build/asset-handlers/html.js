export const handlers = {}
handlers['.html'] = handleHTML
handlers['.htm'] = handleHTML
handlers['.xhtml'] = handleHTML

const reg = new Map()
export const ElementDefinitionRegistry = {}
const dp = new DOMParser()

async function handleHTML(fd) {
    if (reg.has(fd.full)) {
        return reg.get(fd.full).cloneNode(true)
    }

    const text = await fetch(fd.full).then(res => res.text())
    const parsed = dp.parseFromString(text, 'text/html')
    const container = document.createDocumentFragment()
    container.append(...parsed.body.children)

    reg.set(fd.full, container)

    for (const [ce, cm] of Object.entries(ElementDefinitionRegistry)) {
        container.querySelectorAll(ce).forEach(found => found.replaceWith(cm(found)))
    }

    return container.cloneNode(true)
}

export function define(element, markup) {
    ElementDefinitionRegistry[element] = markup
    document.querySelectorAll(element).forEach(found => found.replaceWith(markup(found)))
}
