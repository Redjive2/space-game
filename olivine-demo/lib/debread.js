/**
 * Rounds a number to the specified decimal place.
 * @param num The number to round.
 * @param decimalPlaces The decimal place to round to.
 */
export function round(num, decimalPlaces = 0) {
    return Math.round(num * (Math.pow(10, decimalPlaces))) / (Math.pow(10, decimalPlaces))
}

/**
 * Returns a random color.
 */
export function randomColor() {
    return `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`
}

/**
 * Returns a random number.
 * @param min The minimum amount the number can be.
 * @param max The maximum amount the number can be.
 * @param decimalPlaces The amount of decimal places.
 */
export function random(min = 0, max = 1, decimalPlaces = 0) {
    return round((Math.random() * (max - min)) + min, decimalPlaces)
}
