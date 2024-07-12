import Olivine from 'lib/olivine-std.js'

function attr(node, attr) {
    return node.getAttribute(attr)
}

define('payment', node => <div payment>
    <div>
        <span>{attr(node, 'from')} &gt; {attr(node, 'to')}</span>
        <span>{attr(node, 'created')}</span>
        <span>{attr(node, 'due')}</span>
        <amount price={attr(node, 'price')}>{attr(node, 'price')}</amount>
    </div>
    <div>
        <description>{attr(node, 'desc')}</description>
    </div>
</div>)

define('payment-input', node => {
    var self = <div payment-input>
        <div>
            <div>
                <input from placeholder='From'></input>
                &gt;
                <input to placeholder='To'></input>
            </div>
            <div>
                <input date placeholder='Date'></input>
            </div>
            <div>
                <input deadline placeholder='Deadline'></input>
            </div>
            <div>
                <input price placeholder='Amount' type='number'></input>
            </div>
        </div>
        <div>
            <input desc placeholder='Description'></input>
        </div>
        <button on:click={replace}>+</button>
    </div>

    function input(tag) {
        return Olivine.query(self, `input[${tag}]`).value
    }

    function replace() {
        self.before(<payment
            from={input('from')}
            to={input('to')}
            created={input('date')}
            due={input('deadline')}
            price={input('price')}
            desc={input('desc')}
        />)

        for (const field in Olivine.query.all(self, 'input')) {
            field.value = ''
        }

        self.remove()
    }

    return self
})

define('amount', node => {
    var color, plus
    if (Number(node.getAttribute('price')) > 0) {
        color = 'lime'
        plus = '+'
    } else {
        color = 'red'
        plus = ''
    }

    return <span style={'color: ' + color}>
            {plus + attr(node, 'price')}
        </span>
})
