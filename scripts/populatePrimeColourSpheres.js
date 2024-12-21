// scripts/populatePrimeColourSpheres.js
const { PrimeColourSphere } = require('../models');

async function populatePrimeColourSpheres() {
    function listPrimeColours() {
        var cardsArray = [[1,0,0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0,1]];
    
        const PrimeColours = [2, 3, 5, 7, 11, 13, 17, 19, 23];
    
        for (var i = 2; i <= 100 ; i++) {
            var temp = i;
            cardsArray[i] = [0,0,0,0,0,0,0,0,0,0,0];
            // console.log(cardsArray[i], i);
            for (var j = 0; j < PrimeColours.length; j++) {
            
                while (temp % PrimeColours[j] === 0) {
                    var pcIndex = j+1;
                    var primecount = cardsArray[i][pcIndex];
                    cardsArray[i][pcIndex] = primecount + 1;
                    // console.log({primecount, i, pcIndex, temp});
                    temp = temp / PrimeColours[j];
                    
                }
                
            }   
            cardsArray[i][cardsArray[i].length-1] = temp; 
        }
        return cardsArray;
    }
    

  const cardsArray = listPrimeColours();

  for (let i = 0; i < cardsArray.length; i++) {
    await PrimeColourSphere.create({
      number: i,
      black: cardsArray[i][0],
      red: cardsArray[i][1],
      blue: cardsArray[i][2],
      green: cardsArray[i][3],
      purple: cardsArray[i][4],
      yellow: cardsArray[i][5],
      pink: cardsArray[i][6],
      brown: cardsArray[i][7],
      orange: cardsArray[i][8],
      gold: cardsArray[i][9]
    });
  }

  console.log('PrimeColourSpheres populated successfully');
}

module.exports = populatePrimeColourSpheres;