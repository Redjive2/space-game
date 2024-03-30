@module(entry) const MainMenu = () => {
    @import(Vif, AssetServer) let
        query,
        assets,
        LoadType,
        matches,
        timeout,
        actors;

    @import(Game) let
        pass;

    @import(Client) let
        client;

    const { auth: { checkCode, checkName } } = client

    function round(num, decimalPlaces = 0) {
        return Math.round(num * (Math.pow(10, decimalPlaces))) / (Math.pow(10, decimalPlaces))
    }

    function randomNum(min = 0, max = 1, decimalPlaces = 0) {
        return round((Math.random() * (max - min)) + min, decimalPlaces)
    }

    const enterFail = assets
        .load(`enter/fail.mp3`, LoadType.Sync)
        .read()

    const enterSuccess = assets
        .load(`enter/success.mp3`, LoadType.Sync)
        .read()

    function exitMenu() {
        const menuContainer = query('#menuContainer')


        // do cool stuff

        query('#menuContainer').style.animation = 'darken linear 750ms forwards'

        timeout(1000, () => {
            document.body.removeChild(menuContainer)
            pass()
        })
    }

    @export function main() {
        const menu = <>
            <div id='menuContainer'>
                <div class='genericMenu'>
                    <span id='mainMenuTitle'>Space Game</span>
                    <input class='genericMenuInput' type='text' placeholder='Name'></input>
                    <div id='roomCodeContainer'>
                        <numeric-input ind={0}></numeric-input>
                        <numeric-input ind={1}></numeric-input>
                        <numeric-input ind={2}></numeric-input>
                        <numeric-input ind={3}></numeric-input>
                        <numeric-input ind={4}></numeric-input>
                    </div>
                    <button id='enterCodeButton' class='genericMenuButton' on:click={() => {
                        const btn = query('#enterCodeButton'),
                              code = []

                        query.all('numeric-input').forEach(input => code.push(input.count))
                        const userName = query('input[type="text"]').value
                        println('name', userName)

                        btn.style.animation = 'none'
                        requestAnimationFrame(() => {
                            if (checkCode(...code) && checkName(userName)) {
                                enterSuccess.play()
                                btn.style.animation = 'codeButtonFlashGreen 0.5s forwards'

                                exitMenu()
                            } else {
                                enterFail.play()
                                btn.style.animation = 'codeButtonFlashRed 0.25s forwards'
                            }
                        })
                    }
                    }>Enter Code</button>
                </div>
            </div>
        </>

        pass()
        //document.body.append(menu)

        query.all('input[type="text"]').forEach(input => {
            input.onkeydown = ev => {
                if (matches(ev.key, 'ArrowRight', 'ArrowLeft', 'Tab', 'CapsLock')) {
                    return
                }

                input.style.animation = 'none'
                if(
                    (
                        !/[a-z\-0-9]/.test(ev.key)
                        || input.value.length >= 16
                    )
                    && ev.key !== 'Backspace'
                ) {
                    println(ev.key)
                    ev.preventDefault()

                    const audio = assets
                        .load(`type-fail/${randomNum(0, 2)}.mp3`, LoadType.Sync)
                        .read()
                    audio.play(0.6)

                    requestAnimationFrame(() => {
                        input.style.animation = 'inputTypePulseWrong ease-out 250ms'
                    })
                } else {
                    const audio = assets
                        .load(`type-success/${randomNum(0, 2)}.mp3`, LoadType.Sync)
                        .read()
                    audio.play(0.8)

                    requestAnimationFrame(() => {
                        input.style.animation = 'inputTypePulse ease-out 250ms'
                    })
                }
            }
        })
    }
}
