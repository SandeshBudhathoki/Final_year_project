from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import os
import sys
import logging
from datetime import datetime

# Add models directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'models'))

from models.random_forest import DiabetesPredictor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global model instance
model = None

def load_model():
    """Load the trained diabetes model"""
    global model
    
    model_path = 'diabetes_model.joblib'
    
    if os.path.exists(model_path):
        try:
            model = DiabetesPredictor.load_model(model_path)
            logger.info(f"Model loaded successfully from {model_path}")
            return True
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            return False
    else:
        logger.warning(f"Model file not found: {model_path}")
        logger.info("Please train the model first by running: python train_model.py")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'timestamp': datetime.now().isoformat(),
        'model_type': 'CustomRandomForestClassifier'
    })

@app.route('/predict', methods=['POST'])
def predict_diabetes():
    """Diabetes prediction endpoint"""
    try:
        if model is None:
            return jsonify({
                'error': 'Model not loaded. Please train the model first.'
            }), 500
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = [
            'pregnancies', 'glucose', 'bloodPressure', 'skinThickness',
            'insulin', 'bmi', 'diabetesPedigree', 'age'
        ]
        
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Extract features
        features = [
            float(data['pregnancies']),
            float(data['glucose']),
            float(data['bloodPressure']),
            float(data['skinThickness']),
            float(data['insulin']),
            float(data['bmi']),
            float(data['diabetesPedigree']),
            float(data['age'])
        ]
        
        # Validate feature ranges
        validations = {
            0: (0, 20, 'pregnancies'),
            1: (50, 400, 'glucose'),
            2: (40, 200, 'bloodPressure'),
            3: (0, 100, 'skinThickness'),
            4: (0, 1000, 'insulin'),
            5: (10, 70, 'bmi'),
            6: (0, 3, 'diabetesPedigree'),
            7: (18, 120, 'age')
        }
        
        for idx, (min_val, max_val, field_name) in validations.items():
            if not (min_val <= features[idx] <= max_val):
                return jsonify({
                    'error': f'{field_name} must be between {min_val} and {max_val}'
                }), 400
        
        # Make prediction
        features_array = np.array([features])
        prediction = model.predict(features_array)[0]
        probabilities = model.predict_proba(features_array)[0]
        
        # Get risk factors
        risk_factors = model.get_risk_factors(features)
        
        # Prepare response
        result = {
            'prediction': bool(prediction),
            'confidence': float(probabilities[1] if prediction else probabilities[0]),
            'probability': float(probabilities[1]),
            'probability_diabetic': float(probabilities[1]),
            'probability_non_diabetic': float(probabilities[0]),
            'risk_factors': risk_factors,
            'model_version': '1.0',
            'model_type': 'CustomRandomForestClassifier',
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"Prediction made: {result['prediction']} (confidence: {result['confidence']:.3f})")
        
        return jsonify(result)
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return jsonify({'error': f'Invalid input: {str(e)}'}), 400
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Load model on startup
    load_model()
    
    # Start Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)
