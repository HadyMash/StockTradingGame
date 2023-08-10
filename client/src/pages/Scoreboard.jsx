import Card from '../shared/PlayerCard/Card';
import { useLocation } from 'react-router-dom';


function Scoreboard() {
  const location = useLocation();
  const winner1 = location.state.winner;
  const losers1 = location.state.losers;
  console.log("winner hereeeee, ", winner1);
  console.log("losers hereeeee, ", losers1);
  console.log("stocks hereee hereeeee, ", winner1.stocks);


  const winner = {
    name: 'Emad',
    stocks: [
      { stockName: 'MSFT', stockPrice: 50 },
      { stockName: 'MSFT', stockPrice: 50 },
      { stockName: 'MSFT', stockPrice: 50 },
    ],
  };
  let losers = [
    {
      name: 'Amira',
      stocks: [
        { stockName: 'TSLA', stockPrice: 300 },
        { stockName: 'MSFT', stockPrice: 50 },
        { stockName: 'GOOG', stockPrice: 20 },
      ],
    },
    {
      name: 'Hady',
      stocks: [
        { stockName: 'AAPL', stockPrice: 100 },
        { stockName: 'MSFT', stockPrice: 50 },
        { stockName: 'MSFT', stockPrice: 50 },
      ],
    },
    {
      name: 'Yahia',
      stocks: [
        { stockName: 'MSFT', stockPrice: 100 },
        { stockName: 'AMZN', stockPrice: 45 },
        { stockName: 'GOOG', stockPrice: 50 },
      ],
    },
  ];

  return (
    <div>
      <div className="winner">
        <h2>Winner</h2>
        <div className="winner-cont">
          <Card player={winner1}> </Card>
        </div>
      </div>
      <div className="losers">
        <h4>Losers</h4>
        <div className="losers-cont">
          {losers1.map((loser, index) => {
            return <Card player={loser} key={index} />;
          })}
        </div>
      </div>
    </div>
  );
}

export default Scoreboard;
