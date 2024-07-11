import { randomNum } from 'lib/debread.js'

function simpleType(expr) {
    if (Array.isArray(expr)) {
        return 'array'
    }

    if (expr == null) {
        return 'null'
    }

    return typeof expr
}

var connections = new Map()
var connectionCodes = new Map()
export async function open(path) {
    ///  VALIDATE CONN UNIQUENESS  ///
    if (connections.has(path)) {
        raise(`multiple connections attempted at \`${path}\``)
    }

    ///  FETCH DATA + ESTABLISH CODE-HANDSHAKE  ///
    const connSendCode = randomNum(0, 1000000)

    const text = await fetch(path, {
        method: 'CONNECT',
        body: String(connSendCode)
    }).then(res => res.text())

    const data = mylon.tryParse(text)
    if (data == null) {
        raise('dal creation failed: unable to parse connect response')
        return null
    }

    if (data['send-code-check'] != connSendCode) {
        raise('dal creation failed: unable to verify send-code reception')
    }

    const connRecvCode = data['recv-code']
    const connCode = `${connSendCode}-${connRecvCode}`

    const schema = data['schema']

    ///  EXTRACT DAL FROM SCHEMA  ///
    var dal = {}
    connectionCodes.set(dal, connCode)
    for (const [endpointName, type] in Object.entries(schema)) {
        var isCaps = false
        var name = ''
        for (const char in endpointName) {
            if (char == '-') {
                isCaps = true
            } else if (isCaps) {
                name = name + char.toUpperCase()
                isCaps = false
            } else {
                name = name + char
            }
        }

        const methodSendCode = randomNum(0, 100000)
        const methodRecvCode = await fetch(path + endpointName, {
            method: 'CONNECT',
            body: String(methodSendCode)
        })

        var methodCount = 0
        dal[name] = async function(...args) {
            ///  VALIDATE CONNECTION  ///
            if (!connections.has(path)) {
                raise('attempt to access closed connection')
            }

            if (args.length < type.args.length) {
                raise(`invalid argc \`${args.length}\` passed to \`dal['${name}']\`, expected \`${type.args.length}\``)
            }

            ///  VALIDATE SEND TYPE  ///
            var i = -1
            while (++i < type.args.length) {
                const expected = type.args[i]
                const got = typeof args[i]
                if (expected != '*' & expected != got) {
                    raise(`invalid type \`${got}\` passed to \`dal['${name}']\`, expected \`${expected}\``)
                }
            }

            ///  FETCH DATA  ///
            const methodCode = `${methodSendCode}-${methodRecvCode}-${methodCount}`
            const res = await fetch(path + endpointName, {
                method: 'POST',
                body: `${methodCode}: ${mylon.encodeVal(args)}`
            })

            if (res.ok) {
                methodCount++
            }

            const text = await res.text()

            ///  VALIDATE RETURN  ///
            if (type.returns != 'object') {
                const parsed = mylon.tryParseVal(text)
                if (simpleType(parsed) != type.returns) {
                    raise(`invalid type \`${simpleType(parsed)}\` received from RPC to \`${name}\`, expected \`${type.returns}\``)
                }

                return parsed
            }

            return mylon.tryParse(text)
        }
    }

    return Object.freeze(dal)
}

export async function close(conn) {
    if (!unroll(connections.values()).includes(conn)) {
        raise('invalid connection passed to dal/close')
    }

    const entries = unroll(connections.entries())
    for (const [path, c] in entries) {
        if (conn == c) {
            connections.delete(path)

            const closeRes = await fetch(path, {
                method: 'DELETE',
                body: String(connectionCodes.get(conn))
            })

            connectionCodes.delete(conn)

            if (!closeRes.ok) {
                error(`failed to close connection`)
                return false
            }
        }
    }

    return true
}

function unroll(iter) {
    var res = []
    for (const el in iter) {
        res.push(el)
    }

    return res
}
