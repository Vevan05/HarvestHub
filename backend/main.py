from flask import Flask, request, jsonify
import pandas as pd
from flask_cors import CORS
import pickle

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Load pipeline instead of raw model
model = pickle.load(open('model.pkl', 'rb'))

@app.route('/', methods=['GET'])
def get_data():
    return jsonify({"message": "API is Running"})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()

        query_df = pd.DataFrame([data])

        prediction = model.predict(query_df)
        final_pred = max(0, float(prediction[0]))  
        return jsonify({'Prediction': final_pred})
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
