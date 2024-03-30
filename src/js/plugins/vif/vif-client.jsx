@module const Client = () => {
    @import(Vif) let
        expect,
        type,
        run;

    @export const request = {}

    request.sync = function(method, route, headers = {}, body = null) {
        const xhr = new XMLHttpRequest()
        xhr.open(method, route, false)

        for (const key in headers) {
            xhr.setRequestHeader(key, String(headers[key]))
        }

        xhr.send(body)

        return xhr
    }

    request.async = async function(method, route, headers = {}, body = null) {
        return fetch(route, {
            method: method,
            headers: new Headers(headers),
            body: body
        })
    }

    @export const client = run(() => {
        const res = request.sync('GET', __br__ + 'index/')

        const c = generateMethods(res.responseText)
        delete c.index

        return c
    })

    function generateMethods(spec) {
        return expect(() => JSON.parse(spec))
            .map(json => {
                let res = {}
                for (const { header, route, schema } of json) {
                    let cur = res
                    if (header !== '') {
                        res[header] ??= {}
                        cur = res[header]
                    }

                    const args = schema.split('-')[0].split('.')
                    const ret = schema.split('-')[1]

                    cur[route] = (...a) => {
                        for (const i in a) {
                            if (type(a[i]) !== args[i]) {
                                throw 'invalid data [' + a[i] + '] passed at position [' + i + '] to client method [' + route + ']'
                            }
                        }

                        const namespace = header === ''
                            ? ''
                            : header + '/'

                        return expect(() =>
                            JSON.parse(
                                request.sync('POST', __br__ + namespace + route + '/', {
                                    'content-type': 'application/json',
                                }, '{"args":' + JSON.stringify(a) + '}')
                                    .responseText
                            )
                        )
                            .map(data => {
                                if (type(data) !== ret && data !== null) {
                                    throw 'invalid return type from client method [' + route + ']'
                                }

                                return data
                            }).ok()
                    }
                }

                return res
            })
            .ok()
    }
}
