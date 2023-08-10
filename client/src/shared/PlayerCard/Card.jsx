import PlayerAvatar from '../PlayerAvatar';
import RowStock from './RowStock';

function Card({ player }) {
  console.log('card hereeeee');
  console.log('player,,,,', player);
  console.log('player stocks,,,,', player.stocks);
  const stocks = Object.keys(player.stocks);
  return (
    <div className="card-cont">
      <div className="card">
        <div className="card-header">
          <PlayerAvatar playerName={player.name} />
          <div className="player-name-scoreboard">{player.name}</div>
        </div>
        <hr style={{ width: '90%' }} />
        <RowStock
          stockName={'Net Worth'}
          stockPrice={player.netWorth.toLocaleString(undefined, {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
          })}
        />
        {stocks.map((stock, index) => {
          return (
            <RowStock
              stockName={stock}
              stockPrice={player.stocks[stock]}
              key={index}
            />
          );
        })}
      </div>
    </div>
  );
}

export default Card;
