# space-game

- Each game takes place in a star system
  - The system has 12 planets
  - Each planet has between 15..80 moons
  - each player will start with 4 frigates on the on one of the inner planets' moons
     - they each also get control of 2 moons
- The goal of the game is to eliminate the enemy factions
- Each timestep (`step`) occurs on 3 second intervals 
- A player can take the following actions on any ship between steps:
     - select a position to move to 
     - select a speed to move at
         - max speed = MAX_SPD * 5 tiles per step
	 - accel = THRUST tps per step
	 - momentum is applied based on each ship's class from 1..6
     - select a direction to fire in
     - IF in range of a moon or planet POI:
        - select an activity: Orbital Assault, Terraform, Colonize
     - scan an area on wide-band channel
     - scan an area on narrow-band channel
- If your ship is fired at:
     - From a ship with Projectiles/Damage/Range stats at Dist distance,
       you will take Projectiles*Damage*((Range*100)/Dist) damage.
     - Projectiles move at a rate of ((Range*5)+20)-{((Dist-100)/10) if Dist > 100 else 0} tiles per second
     - If a projectile moves past (Range*50)+100
- SHIP STATS 
  - Build Cost [12..115]
    - Stealth [0..3, stealth]
    - Armor [20..200, health]
    - Wide-Band Radar [1..5, long-range radar range + accuracy]
    - Narrow-Band Radar [1..5, close-range radar accuracy + width]
    - Thrust [1..5, ability to accelerate/decelerate]
    - Max Speed [1..5, top speed]
    - Weapons [1..3/1..3, FireRate/Damage]
	- Weapon Type [Cannon/Coilgun/Railgun, Range]
    - Foundries [1..3, Ability to develop planets/moons]
    - Terraformers [1..3, Ability to develop inhospitable planets/moons]
    - Orbital Weapons [1..3, Ability to supplant enemy control]
      
## ship types
### [type] >> [cost]
### - [value] [stat-name]
- Corvette >> 12
      3 Stealth
      20 Armor
      2 WBR
      2 NBR
      5 Thrust
      3 MS
      3/1 Weapons
          Cannons
      1 Foundry
      0 Terraformers
      1 Orbital Weapon
- Frigate >> 15
      2 Stealth
      20 Armor
      3 WBR
      3 NBR
      3 Thrust
      3 MS
      1/2 Weapons
          Cannons
      2 Foundries
      1 Terraformers
      1 Orbital Weapon
- Destroyer >> 25
      1 Stealth
      35 Armor
      2 WBR
      4 NBR
      3 Thrust
      4 MS
      2/2 Weapons
          Coilguns
      1 Foundry
      0 Terraformers
      2 Orbital Weapons
- Cruiser >> 45
      0 Stealth
      55 Armor
      4 WBR
      5 NBR
      2 Thrust
      5 MS
      2/2 Weapons
          Railguns
      3 Foundries
      2 Terraformers
      2 Orbital Weapons
- Support Ship >> 50
      1 Stealth
      45 Armor
      5 WBR
      4 NBR
      2 Thrust
      5 MS
      2/2 Weapons
          Cannons
      3 Foundries
      3 Terraformers
      3 Orbital Weapons
- Battleship >> 115
      0 Stealth
      85 Armor
      5 WBR
      5 NBR
      1 Thrust
      5 MS
      3/3 Weapons
          Railguns
      2 Foundries
      1 Terraformer
      3 Orbital Weapons
