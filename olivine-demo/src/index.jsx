import Olivine from 'lib/olivine-std.js'
import DeBread from 'lib/debread.js'

export async function main() {
    await Build.include('src/components.jsx')

    var viewInputButton = Olivine.query('#add-button'),
        paymentInput = Olivine.query('[payment-input]')

    Olivine.listen(viewInputButton, 'click', async () => {
        if (!document.body.contains(paymentInput)) {
            (await Assets.load('enter/fail.mp3')).play()
        }

        Olivine.query('#payment-container').append(paymentInput)
    })

    for (const input in Olivine.query.all('input')) {
        Olivine.listen(input, 'keydown', async () => {
            const sound = String(DeBread.random(0, 2));
            (await Assets.load(`type-success/${sound}.mp3`)).play(.5)
        })
    }

    const submitButton = Olivine.query('[payment-input] button')
    Olivine.listen(submitButton, 'click', async () => {
        (await Assets.load('enter/success.mp3')).play()
    })

    Olivine.query('[payment-input]').remove()

    Olivine.listen(window, 'keydown', async ({ key }) => {
        if (key == 'Delete') {
            (await Assets.load('click-generic.mp3')).play()

            const payments = Olivine.query.all('[payment]')
            payments[payments.length - 1].remove?.()
        }
    })
}


