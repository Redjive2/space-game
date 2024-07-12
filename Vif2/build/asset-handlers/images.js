export const handlers = {}
handlers['.jpg'] = handleStandardImage
handlers['.jpeg'] = handleStandardImage
handlers['.png'] = handleStandardImage
handlers['.svg'] = handleStandardImage
handlers['.webp'] = handleStandardImage

// reg: { has, get, set }
const imageCache = new Map()

// fd: { path, full, type, name }
async function handleStandardImage(fd) {
    if(imageCache.has(fd.full)) {
        return imageCache.get(fd.full).cloneNode()
    }

    const img = new Image()
    img.src = fd.full

    img.addEventListener('load', () => {
        imageCache.set(fd.full, img)
    })

    return img.cloneNode()
}
