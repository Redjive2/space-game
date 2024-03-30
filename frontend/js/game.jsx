@module const Game = () => {
    @import(Vif) let
        interval,
        query;

    const data = {
        ships: [
            {
                pos: [500, 300],
                size: 10,
                col: 'orange',
                velocity: [0, 0],
            }
        ]
    }

    @export function pass() {
         for(const key in data.ships) {
             const shipDiv = <>
                 <div class='ship'></div>
             </>
             const ship = query(shipDiv, '.ship')
             const shipData = data.ships[key]

             //Ship data :D

             ship.velocity = shipData.velocity
             ship.pos = shipData.pos

             ship.style.width = shipData.size * 10 + 'px'
             ship.style.height = shipData.size * 10 + 'px'
             ship.style.backgroundColor = shipData.col ?? 'white'
             ship.style.translate = `${ship.pos[0]}px ${ship.pos[1]}px`
             document.body.append(shipDiv)
         }

         interval(100, () => {
             query.all('.ship').forEach(ship => {
                 if(ship.pos[0] < window.innerWidth && ship.pos[1] < window.innerHeight) {
                     ship.pos[0] += ship.velocity[0]
                     ship.pos[1] += ship.velocity[1]

                     ship.style.translate = `${ship.pos[0]}px ${ship.pos[1]}px`
                 }
             })
         })
    }
}
