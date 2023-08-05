
import RowStock from './RowStock';

function Card({ player }) {
    console.log(player)
    return (
        <div className='card-cont'>
            <div className="card">
                <div className='card-header'>
                    <div className='circle'></div>
                    <div className='player-name'>{player.name}</div>
                </div>
                <hr style={{ "width": '90%' }} />
                {player.stocks.map((stock, index) => {
                    return <RowStock stockName={stock.stockName} stockPrice={stock.stockPrice} key={index} />
                })}

            </div>
        </div>
    );
}

export default Card