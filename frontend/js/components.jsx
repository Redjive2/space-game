@module(global) const Components = () => {
    @import(Vif) let
        query;

    @import(AssetServer) let
        assets,
        LoadType;

    @component class NumericInput {
        @$ count = 0

        @watch(this.count) update() {
            const audio = assets
                .load('click-generic.mp3', LoadType.Sync)
                .read()
            audio.play()

            if (this.count >= 0 && this.count <= 9) {
                this.merge('count')
                this.query('[view]').textContent = this.count
            } else if (this.count < 0) {
                this.count++
            } else {
                this.count--
            }
        }

        @listen click() {
            const view = this.query('[view]')

            view.style.animation = 'none'
            requestAnimationFrame(() => {
                view.style.animation = 'numericButtonPop 0.25s forwards'
            })
        }

        @listen wheel({ deltaY }) {
            const view = this.query('[view]')

            if (deltaY < 0) {
                this.count++

                view.style.animation = 'none'
                requestAnimationFrame(() => {
                    view.style.animation = 'numericButtonUp 0.25s forwards'
                })
            } else {
                this.count--

                view.style.animation = 'none'
                requestAnimationFrame(() => {
                    view.style.animation = 'numericButtonDown 0.25s forwards'
                })
            }
        }

        @handle setup() {
            this.merge('count')

            this.create(<>
                <button up>&#9651;</button>
                <span view>${this.count}</span>
                <button down>&#9661;</button>
            </>)
        }

        @handle init() {
            this.query('[up]').onclick = () => {
                this.count++
            }

            this.query('[down]').onclick = () => {
                this.count--
            }
        }
    }
}
