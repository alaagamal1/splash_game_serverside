//THIS FUNCTION GENERATE A RANDOM SIDE
//TO BE SENT AS ENEMY INSTRUCTION
const enemyPositions = ['left', 'center', 'right']
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}
const randomPosition = () => {
    return enemyPositions[randomInt(0, 2)]
}
exports.generate = randomPosition
