@module const AssetServer = () => {
    @import(Vif, Client) let
        makeEnum,
        expect,
        make,
        deepFreeze,
        request;

    @export const LoadType = makeEnum (
        'Sync',
        'Async',
    )

    @export const ActorType = makeEnum (
        'Reader',
        'Validator',
    )

    const assetStore = new Map,
          readers = new Map,
          validators = new Map

    const pool = new Map
    function play(path, volume = 1, speed = 1) {
        if (!pool.has(path)) {
            pool.set(path, new Audio(path))
        }

        const audio = pool.get(path)
        audio.volume = volume
        audio.playbackRate = speed

        if (audio.paused) {
            audio.play().catch(err => {
                console.error('Error playing audio:', err)
            })
        } else {
            const audioClone = audio.cloneNode();
            audioClone.volume = volume
            audioClone.playbackRate = speed
            audioClone.play().catch(err => {
                console.error('Error playing audio clone:', err)
            })
        }
    }

    readers.set('txt', (_, asset) => expect(() => asset))
    readers.set('json', (_, asset) => expect(JSON.parse(asset)))
    readers.set('mp3', (path, _) => {
        return {
            play: (vol = 1, speed = 1) => play(__ap__ + path, vol, speed)
        }
    })

    validators.set('txt', (..._) => true)
    validators.set('json', (_, asset) => {
        try {
            JSON.parse(asset)
            return true
        } catch (_) {
            return false
        }
    })

    function makeAssetHandle(path) {
        let expectedFT = path.split('.')
        expectedFT[0] = null
        expectedFT = expectedFT.filter(it => it !== null).join('.')

        return Object.freeze({
            get() {
                return assetStore.get(path)
            },

            validate(validator = expectedFT) {
                if (validators.has(validator)) {
                    return !!((validators.get(validator))(path, assetStore.get(path)))
                } else {
                    console.error('AssetHandle.validate called with invalid validator ' + validator)
                    return null
                }
            },

            read(reader = expectedFT) {
                if (readers.has(reader)) {
                    return (readers.get(reader))(path, assetStore.get(path))
                } else {
                    console.error('AssetHandle.read called with invalid reader')
                    return null
                }
            }
        })
    }

    @export const assets = {}

    @export const actors = {}

    actors.register = function(actorType, fileType, actor) {
        if (actorType === ActorType.Reader) {
            readers.set(fileType, actor)
        } else if (actorType === ActorType.Validator) {
            validators.set(fileType, actor)
        } else {
            throw 'invalid ActorType passed to AssetServer/register([actorType], fileType, actor)'
        }
    }

    actors.has = function(actorType, fileType) {
        if (actorType === ActorType.Reader) {
            return readers.has(fileType)
        } else if (actorType === ActorType.Validator) {
            return validators.has(fileType)
        } else {
            throw 'invalid ActorType passed to AssetServer/has([actorType], fileType)'
        }
    }

    assets.load = function(path, lt = LoadType.Async) {
        if (assetStore.has(path)) {
            if (lt === LoadType.Sync) {
                return makeAssetHandle(path)
            } else {
                return makeAssetHandle(path)
            }
        }

        if (lt === LoadType.Sync) {
            const res = request.sync('GET', __ap__ + path)

            if (res.status === 200) {
                assetStore.set(path, res.responseText);
            } else {
                throw new Error('sync Asset Server req failed:  statusText = [' + res.statusText + ']');
            }
        } else {
            return (async() => {
                const res = await request.async('GET', __ap__ + path)

                if (res.ok) {
                    const data = await res.text()
                    assetStore.set(path, data)
                } else {
                    throw new Error('async Asset Server req failed:  statusText = [' + res.statusText + ']');
                }

                return makeAssetHandle(path)
            })()
        }

        return makeAssetHandle(path)
    }
}
