import joblib
import pandas as pd
import numpy as np

# predictions = laoded.predict(obj)
laoded = joblib.load("BOT_Model.joblib")

# predictions = laoded.predict(np.array([[179.8, 139.94, 131.84,326.05, 294.7]]))


# print(predictions)





def make_decisions(predictions, current_prices, balance):
    decisions = {}
    price_changes = {}

    expected_changes = {
        stock: predicted - current_prices[stock] 
        for stock, predicted in predictions.items()
    }

    sorted_stocks = sorted(
        expected_changes.keys(), 
        key=lambda stock: expected_changes[stock], 
        reverse=True
    )

    for stock in sorted_stocks:
        predicted_price = predictions[stock]
        current_price = current_prices[stock]

        if predicted_price > current_price and balance > current_price:
            decisions[stock] = "Buy"
           
        elif predicted_price < current_price:
            decisions[stock] = "Sell"
            balance += current_price
        else:
            decisions[stock] = "Hold"

        price_changes[stock] = abs(predicted_price - current_price)
        if price_changes[stock] < 0.4:
            decision[stock] = "Hold"

    return decisions, price_changes
stock_symbols = ["MSFT", "AAPL", "GOOG", "AMZN", "TSLA"]

prediction_prices = {'MSFT': 326, 'AAPL': 179, 'GOOG': 131, 'AMZN': 139, 'TSLA': 294}
# predicted_prices = dict(zip(stock_symbols, predictions))
# print(predicted_prices)
# print(predictions)

current_prices_array = np.array([343.36244564, 190.83887423, 123.8258488, 133.39324854, 278.66027579])




# symbols, handling NaN values
current_prices_dict = {}
for stock, price in zip(stock_symbols, current_prices_array):
    if not np.isnan(price):
        current_prices_dict[stock] = price

print("Transformed dictionary:")
print(current_prices_dict) 

balance = 10000.0

decisions, price_changes = make_decisions(prediction_prices, current_prices_dict, balance)
# decisions, price_changes = make_decisions_with_changes(predicted_prices, current_prices, balance)
for stock, decision in decisions.items():
    print(f"Decision for {stock}: {decision}, Price Change: {price_changes[stock]}") 
# def loadModel(obj):
#     laoded = joblib.load("BOT_Model.joblib")

#     predictions = laoded.predict(obj)
#     print(predictions)
def finalize_decisions(decisions, price_changes, balance ,current_price):
    budget = 0.5 * balance
    sum = 0
    for stock, decision in decisions.items():
        if decision == "Buy":
            sum += price_changes[stock]
    for stock, decision in decisions.items():
        if decision == "Buy":
            price_changes[stock] = price_changes[stock]/sum
    for stock, decision in decisions.items():
        if decision == "Buy":
            price_changes[stock] = (price_changes[stock] * budget) / current_price[stock]

    return decisions, price_changes
decisions , price_changes = finalize_decisions(decisions , price_changes , balance , current_prices_dict)

for stock, decision in decisions.items():
    print(f"Decision for {stock}: {decision}, Price Change: {price_changes[stock]}")
