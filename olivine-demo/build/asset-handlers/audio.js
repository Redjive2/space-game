export const handlers = {}
handlers['.mp3'] = handleAudio

let pool = new Map()

function play(fd, volume) {
    let audio = pool.get(fd.full)
    audio.volume = volume

    if (audio.paused) {
        audio.play().catch(err => {
            error('Error playing audio:', err)
        })
    } else {
        let audioClone = audio.cloneNode()
        audioClone.volume = volume
        audioClone.play().catch(err => {
            error('Error playing audio:', err)
        })
    }
}

function handleAudio(fd) {
    if (!pool.has(fd.full)) {
        pool.set(fd.full, new Audio(fd.full))
    }

    return Object.freeze({
        play: (volume = 1) => play(fd, volume),
        node: () => {
            const audio = new Audio()
            audio.src = fd.full
            return audio
        }
    })
}
