
function RowStock({ stockName, stockPrice }) {
    return (

        <div className="row-stock">
            <div className="stock-name"> {stockName}</div>
            <div className="stock-price"> ${stockPrice}</div>
        </div>
    );
}

export default RowStock