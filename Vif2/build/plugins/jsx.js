export function translateJSX(file, Acorn, Walk) {
    if (file.type !== 'jsx') {
        return file
    }

    let result = file.text
    let replacements = []
    replace(file.text, Acorn, Walk, replacements)
    // Sort replacements in reverse order to avoid messing up indices
    replacements.sort((a, b) => b.start - a.start)

    // Apply replacements
    for (const { start, end, replacement } of replacements) {
        result = result.slice(0, start) + replacement + result.slice(end)
    }


    return { ...file, type: 'js', text: result }
}

function replace(result, Acorn, Walk, replacements) {
    const ast = Acorn.parse(result)
    Walk.ancestor(ast, {
        JSXElement(node, _, ancestors) {
            ///  parent type  ///
            const pt = ancestors[ancestors.length - 2]?.type
            if (pt !== 'JSXElement' && pt !== 'JSXFragment') {
                replacements.push({
                    start: node.start,
                    end: node.start,
                    replacement: '$__HTML_FROM_JSX__$`'
                })

                replacements.push({
                    start: node.end,
                    end: node.end,
                    replacement: '`'
                })
            }
        },

        JSXFragment(node, _, ancestors) {
            ///  parent type  ///
            const pt = ancestors[ancestors.length - 2]?.type
            if (pt !== 'JSXElement' && pt !== 'JSXFragment') {
                replacements.push({
                    start: node.start,
                    end: node.start,
                    replacement: '$__FRAG_FROM_JSX__$`'
                })

                replacements.push({
                    start: node.end,
                    end: node.end,
                    replacement: '`'
                })
            }
        },

        JSXExpressionContainer(node) {
            replacements.push({
                start: node.start,
                end: node.end,
                replacement: '$' + result.slice(node.start, node.end)
            })
        }
    })
}




const dp = new DOMParser()
export function $__HTML_FROM_JSX__$(sts, ...interpolations) {
    const rand = String(Math.random())
    const strings = sts.map(st => st.replaceAll('<>', '<__FRAGMENT__>').replaceAll('</>', '</__FRAGMENT__>'))

    let htmlString = ''
    for (const i in strings) {
        if (i in interpolations) {
            if (typeof(interpolations[i]) === 'function' &&
                strings[i].endsWith('=') &&
                strings[i].slice(strings[i].lastIndexOf(' ') + 1).startsWith('on:') &&
                strings[i].slice(strings[i].lastIndexOf(' ') + 1).endsWith('=') &&
                strings[i].slice(strings[i].lastIndexOf(' ') + 1).length < 32
            ) {
                htmlString += strings[i]
                htmlString += '"#_' + rand + '--' + i + '"'
            } else if (typeof(interpolations[i]) === 'function' &&
                strings[i].endsWith(':') &&
                strings[i].slice(strings[i].lastIndexOf(' ') + 1).startsWith('use:')
            ) {
                htmlString += strings[i].slice(0, strings[i].length - 4) + 'on:' + interpolations[i].name + '='
                htmlString += '"#_' + rand + '--' + i + '"'
            } else if (strings[i].endsWith('=')) {
                htmlString += strings[i] + '"'
                htmlString += interpolations[i] + '"'
            } else {
                htmlString += strings[i]
                htmlString += interpolations[i]
            }
        } else {
            htmlString += strings[i]
        }
    }

    const html = dp.parseFromString(htmlString, 'text/html')

    html.querySelectorAll('__FRAGMENT__').forEach(frag => {
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

                ///  for compatibility with Olivine-Std/listen(node, signal, cb)  ///
                ///  will be replaced once Build Artifacts are implemented        ///
                '__osl_listen' in window
                    ? window.__osl_listen(el, attr.name.slice(3), interpolations[index])
                    : el.addEventListener(attr.name.slice(3), interpolations[index])
            }
        }

        for (const child of el.children) {
            patch(child)
        }
    }

    for (const child of html.body.children) {
        patch(child)
    }

    for (const [ce, cm] of Object.entries(ElementDefinitionRegistry)) {
        html.querySelectorAll(ce).forEach(found => found.replaceWith(cm(found)))
    }

    return html.body.children.item(0)
}

export function $__FRAG_FROM_JSX__$(sts, ...interpolations) {
    const rand = String(Math.random())
    const strings = sts.map(st => st.replaceAll('<>', '<__FRAGMENT__>').replaceAll('</>', '</__FRAGMENT__>'))

    let htmlString = ''
    for (const i in strings) {
        if (i in interpolations) {
            if (typeof(interpolations[i]) === 'function' &&
                strings[i].endsWith('=') &&
                strings[i].slice(strings[i].lastIndexOf(' ') + 1).startsWith('on:') &&
                strings[i].slice(strings[i].lastIndexOf(' ') + 1).endsWith('=') &&
                strings[i].slice(strings[i].lastIndexOf(' ') + 1).length < 32
            ) {
                htmlString += strings[i]
                htmlString += '"#_' + rand + '--' + i + '"'
            } else if (typeof(interpolations[i]) === 'function' &&
                strings[i].endsWith(':') &&
                strings[i].slice(strings[i].lastIndexOf(' ') + 1).startsWith('use:')
            ) {
                htmlString += strings[i].slice(0, strings[i].length - 4) + 'on:' + interpolations[i].name + '='
                htmlString += '"#_' + rand + '--' + i + '"'
            } else if (strings[i].endsWith('=')) {
                htmlString += strings[i] + '"'
                htmlString += interpolations[i] + '"'
            } else {
                htmlString += strings[i]
                htmlString += interpolations[i]
            }
        } else {
            htmlString += strings[i]
        }
    }

    const html = dp.parseFromString(htmlString, 'text/html')

    html.querySelectorAll('__FRAGMENT__').forEach(frag => {
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

                el.addEventListener(attr.name.slice(3), interpolations[index])
            }
        }

        for (const child of el.children) {
            patch(child)
        }
    }

    for (const child of html.body.children) {
        patch(child)
    }

    for (const [ce, cm] of Object.entries(ElementDefinitionRegistry)) {
        html.querySelectorAll(ce).forEach(found => found.replaceWith(cm(found)))
    }

    const frag = document.createDocumentFragment()
    for (const child of html.body.children) {
        frag.append(child.cloneNode(true))
    }

    return frag
}

