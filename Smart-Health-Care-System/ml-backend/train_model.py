import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from models.random_forest import DiabetesPredictor
import os

def load_diabetes_data(csv_path):
    """Load diabetes data from CSV file"""
    try:
        df = pd.read_csv(csv_path)
        print(f" Loaded CSV data: {len(df)} samples")
        print(f" Columns: {list(df.columns)}")
        print(f" Data shape: {df.shape}")
        return df
    except FileNotFoundError:
        print(f" CSV file not found: {csv_path}")
        print("Please make sure your CSV file is in the correct location.")
        return None
    except Exception as e:
        print(f" Error loading CSV: {e}")
        return None

def preprocess_data(df):
    """Preprocess the diabetes dataset"""
    print("\n Preprocessing data...")
    
    # Display basic info about the dataset
    print(f"Dataset shape: {df.shape}")
    print(f"Missing values:\n{df.isnull().sum()}")
    
    # Common column name mappings (adjust based on your CSV)
    column_mapping = {
        # Map your CSV columns to standard names
        'Pregnancies': 'Pregnancies',
        'Glucose': 'Glucose', 
        'BloodPressure': 'BloodPressure',
        'SkinThickness': 'SkinThickness',
        'Insulin': 'Insulin',
        'BMI': 'BMI',
        'DiabetesPedigreeFunction': 'DiabetesPedigreeFunction',
        'Age': 'Age',
        'Outcome': 'Outcome'
    }
    
    # Check if columns exist and rename if needed
    available_columns = df.columns.tolist()
    print(f"Available columns: {available_columns}")
    
    # Handle missing values
    df = df.fillna(df.median(numeric_only=True))
    
    # Remove any duplicate rows
    df = df.drop_duplicates()
    
    print(f" Preprocessed data shape: {df.shape}")
    return df

def analyze_data(df):
    """Analyze the dataset"""
    print("\n Dataset Analysis:")
    print("-" * 40)
    
    # Basic statistics
    print(f"Total samples: {len(df)}")
    
    if 'Outcome' in df.columns:
        outcome_counts = df['Outcome'].value_counts()
        print(f"Diabetes cases (1): {outcome_counts.get(1, 0)} ({outcome_counts.get(1, 0)/len(df)*100:.1f}%)")
        print(f"Non-diabetes cases (0): {outcome_counts.get(0, 0)} ({outcome_counts.get(0, 0)/len(df)*100:.1f}%)")
    
    # Feature statistics
    print(f"\nFeature ranges:")
    numeric_columns = df.select_dtypes(include=[np.number]).columns
    for col in numeric_columns:
        if col != 'Outcome':
            print(f"  {col}: {df[col].min():.1f} - {df[col].max():.1f} (mean: {df[col].mean():.1f})")

def main():
    print(" Training Diabetes Prediction Model with Real Data")
    print("=" * 60)
    
    # Try to find CSV file in different locations
    possible_paths = [
        'diabetes_data.csv',           # Same directory as script
        'data/diabetes_data.csv',      # In data subfolder
        'diabetes.csv',                # Common name
        'pima-indians-diabetes.csv',   # Pima Indians dataset
        '../diabetes_data.csv'         # Parent directory
    ]
    
    df = None
    csv_path = None
    
    for path in possible_paths:
        if os.path.exists(path):
            df = load_diabetes_data(path)
            csv_path = path
            break
    
    if df is None:
        print("\n No CSV file found!")
        print("Please put your diabetes CSV file in one of these locations:")
        for path in possible_paths:
            print(f"  - {path}")
        print("\nOr specify the exact path to your CSV file.")
        
        # Ask user for custom path
        custom_path = input("\nEnter path to your CSV file (or press Enter to use synthetic data): ").strip()
        if custom_path and os.path.exists(custom_path):
            df = load_diabetes_data(custom_path)
            csv_path = custom_path
    
    # If still no data, generate synthetic data as fallback
    if df is None:
        print("\n Using synthetic data as fallback...")
        df = generate_synthetic_data()
        csv_path = "synthetic_data"
    
    # Preprocess the data
    df = preprocess_data(df)
    
    # Analyze the data
    analyze_data(df)
    
    # Prepare features and target
    feature_columns = [
        'Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness',
        'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age'
    ]
    
    # Check if all required columns exist
    missing_columns = [col for col in feature_columns if col not in df.columns]
    if missing_columns:
        print(f"\n Missing required columns: {missing_columns}")
        print("Please make sure your CSV has these columns:")
        for col in feature_columns:
            print(f"  - {col}")
        return
    
    if 'Outcome' not in df.columns:
        print("\n Missing 'Outcome' column (target variable)")
        print("Please make sure your CSV has an 'Outcome' column with 0/1 values")
        return
    
    # Extract features and target
    X = df[feature_columns].values
    y = df['Outcome'].values
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"\n Training set: {len(X_train)} samples")
    print(f" Test set: {len(X_test)} samples")
    
    # Train model
    print("\n Training Random Forest model...")
    model = DiabetesPredictor()
    model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\nModel Performance:")
    print(f"Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    # Save model
    model_path = 'diabetes_model.joblib'
    model.save_model(model_path)
    print(f"\nModel saved as '{model_path}'")
    print(f" Data source: {csv_path}")
    
    # Test prediction with sample data
    print("\n Testing with sample prediction...")
    sample_features = [[2, 120, 70, 20, 80, 25.0, 0.5, 30]]  # Sample health data
    sample_pred = model.predict(sample_features)[0]
    sample_proba = model.predict_proba(sample_features)[0]
    
    print(f"Sample prediction: {'Diabetic' if sample_pred else 'Non-diabetic'}")
    print(f"Confidence: {max(sample_proba):.3f}")

def generate_synthetic_data(n_samples=2000):
    """Generate synthetic data as fallback"""
    print(" Generating synthetic diabetes data...")
    np.random.seed(42)
    
    data = {
        'Pregnancies': np.random.poisson(3, n_samples),
        'Glucose': np.random.normal(120, 30, n_samples),
        'BloodPressure': np.random.normal(70, 15, n_samples),
        'SkinThickness': np.random.normal(20, 10, n_samples),
        'Insulin': np.random.exponential(80, n_samples),
        'BMI': np.random.normal(32, 8, n_samples),
        'DiabetesPedigreeFunction': np.random.exponential(0.5, n_samples),
        'Age': np.random.normal(33, 12, n_samples)
    }
    
    df = pd.DataFrame(data)
    
    # Clip to realistic ranges
    df['Pregnancies'] = np.clip(df['Pregnancies'], 0, 15)
    df['Glucose'] = np.clip(df['Glucose'], 50, 300)
    df['BloodPressure'] = np.clip(df['BloodPressure'], 40, 150)
    df['SkinThickness'] = np.clip(df['SkinThickness'], 5, 60)
    df['Insulin'] = np.clip(df['Insulin'], 10, 500)
    df['BMI'] = np.clip(df['BMI'], 15, 60)
    df['DiabetesPedigreeFunction'] = np.clip(df['DiabetesPedigreeFunction'], 0.1, 2.5)
    df['Age'] = np.clip(df['Age'], 18, 80)
    
    # Create target based on risk factors
    risk_score = (
        (df['Glucose'] > 140) * 0.4 +
        (df['BMI'] > 30) * 0.3 +
        (df['Age'] > 45) * 0.2 +
        (df['BloodPressure'] > 90) * 0.1 +
        (df['DiabetesPedigreeFunction'] > 0.5) * 0.2 +
        np.random.normal(0, 0.15, n_samples)
    )
    
    df['Outcome'] = (risk_score > 0.5).astype(int)
    
    return df

if __name__ == "__main__":
    main()
