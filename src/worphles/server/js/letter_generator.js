var letterDistribution = [0.0806425, 0.0960163, 0.1229086, 0.1661953, 0.2950576, 0.3195423, 0.3391679, 0.4001551, 0.4692106, 0.4703283, 0.4765805, 0.5175973, 0.5426070, 0.6124568, 0.6862399, 0.7032713, 0.7043362, 0.7659019, 0.8297193, 0.9199659, 0.9478228, 0.9580807, 0.9792730, 0.9809672, 0.9990304, 1.0000000];

var letters = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];

function getLetter() {
  var random = Math.random();
  for (i = 0; i < letterDistribution.length; i++) {
    if (random > letterDistribution[i]) {
      return letters[i];
    }
  }
}