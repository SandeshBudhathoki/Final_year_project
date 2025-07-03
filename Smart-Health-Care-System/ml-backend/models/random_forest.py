import numpy as np
from collections import Counter
import joblib
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class DecisionTree:
    def __init__(self, max_depth=10, min_samples_split=2, max_features=None):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.max_features = max_features
        self.tree = None

    def _gini_impurity(self, y):
        if len(y) == 0:
            return 0
        proportions = np.bincount(y) / len(y)
        return 1 - np.sum(proportions ** 2)

    def _best_split(self, X, y):
        best_gain = -1
        best_feature = None
        best_threshold = None

        n_features = X.shape[1]
        if self.max_features:
            feature_indices = np.random.choice(n_features, min(self.max_features, n_features), replace=False)
        else:
            feature_indices = range(n_features)

        for feature_idx in feature_indices:
            X_column = X[:, feature_idx]
            thresholds = np.unique(X_column)

            for threshold in thresholds:
                left_mask = X_column <= threshold
                right_mask = ~left_mask

                if np.sum(left_mask) == 0 or np.sum(right_mask) == 0:
                    continue

                parent_gini = self._gini_impurity(y)
                n = len(y)
                n_left, n_right = np.sum(left_mask), np.sum(right_mask)

                left_gini = self._gini_impurity(y[left_mask])
                right_gini = self._gini_impurity(y[right_mask])

                child_gini = (n_left / n) * left_gini + (n_right / n) * right_gini
                gain = parent_gini - child_gini

                if gain > best_gain:
                    best_gain = gain
                    best_feature = feature_idx
                    best_threshold = threshold

        return best_feature, best_threshold, best_gain

    def _build_tree(self, X, y, depth=0):
        n_samples = X.shape[0]
        n_labels = len(np.unique(y))

        if depth >= self.max_depth or n_labels == 1 or n_samples < self.min_samples_split:
            leaf_value = Counter(y).most_common(1)[0][0]
            return {'type': 'leaf', 'value': leaf_value}

        best_feature, best_threshold, best_gain = self._best_split(X, y)

        #  FIXED: Safe check for None or zero gain
        if best_feature is None or best_threshold is None or best_gain == 0:
            leaf_value = Counter(y).most_common(1)[0][0]
            return {'type': 'leaf', 'value': leaf_value}

        left_mask = X[:, best_feature] <= best_threshold
        right_mask = ~left_mask

        left_subtree = self._build_tree(X[left_mask], y[left_mask], depth + 1)
        right_subtree = self._build_tree(X[right_mask], y[right_mask], depth + 1)

        return {
            'type': 'split',
            'feature': best_feature,
            'threshold': best_threshold,
            'left': left_subtree,
            'right': right_subtree
        }

    def fit(self, X, y):
        self.tree = self._build_tree(X, y)
        return self

    def _predict_sample(self, sample, tree):
        if tree['type'] == 'leaf':
            return tree['value']

        if sample[tree['feature']] <= tree['threshold']:
            return self._predict_sample(sample, tree['left'])
        else:
            return self._predict_sample(sample, tree['right'])

    def predict(self, X):
        return np.array([self._predict_sample(sample, self.tree) for sample in X])


class RandomForestClassifier:
    def __init__(self, n_estimators=100, max_depth=10, random_state=42):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.random_state = random_state
        self.trees = []

        if random_state:
            np.random.seed(random_state)

    def fit(self, X, y):
        X = np.array(X)
        y = np.array(y)

        self.trees = []
        max_features = int(np.sqrt(X.shape[1]))

        for i in range(self.n_estimators):
            n_samples = X.shape[0]
            indices = np.random.choice(n_samples, n_samples, replace=True)
            X_sample, y_sample = X[indices], y[indices]

            tree = DecisionTree(max_depth=self.max_depth, max_features=max_features)
            tree.fit(X_sample, y_sample)
            self.trees.append(tree)

        return self

    def predict(self, X):
        X = np.array(X)
        predictions = np.array([tree.predict(X) for tree in self.trees])

        final_predictions = []
        for i in range(X.shape[0]):
            votes = predictions[:, i]
            prediction = Counter(votes).most_common(1)[0][0]
            final_predictions.append(prediction)

        return np.array(final_predictions)

    def predict_proba(self, X):
        X = np.array(X)
        predictions = np.array([tree.predict(X) for tree in self.trees])

        probabilities = []
        for i in range(X.shape[0]):
            votes = predictions[:, i]
            vote_counts = Counter(votes)

            prob_0 = vote_counts.get(0, 0) / len(self.trees)
            prob_1 = vote_counts.get(1, 0) / len(self.trees)

            probabilities.append([prob_0, prob_1])

        return np.array(probabilities)


class DiabetesPredictor:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, max_depth=15, random_state=42)
        self.feature_names = [
            'Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness',
            'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age'
        ]
        self.is_trained = False

    def fit(self, X, y):
        self.model.fit(X, y)
        self.is_trained = True
        return self

    def predict(self, X):
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        return self.model.predict(X)

    def predict_proba(self, X):
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        return self.model.predict_proba(X)

    def get_risk_factors(self, features):
        risk_factors = []
        feature_dict = dict(zip(self.feature_names, features))

        if feature_dict['Glucose'] >= 140:
            risk_factors.append("High glucose levels (≥140 mg/dL)")
        if feature_dict['BMI'] >= 30:
            risk_factors.append("Obesity (BMI ≥30)")
        if feature_dict['Age'] >= 45:
            risk_factors.append("Age factor (≥45 years)")
        if feature_dict['BloodPressure'] >= 90:
            risk_factors.append("High blood pressure (≥90 mmHg)")
        if feature_dict['DiabetesPedigreeFunction'] >= 0.5:
            risk_factors.append("Strong family history of diabetes")

        return risk_factors

    def save_model(self, filepath):
        if not self.is_trained:
            raise ValueError("Cannot save untrained model")

        model_data = {
            'model': self.model,
            'feature_names': self.feature_names,
            'is_trained': self.is_trained,
            'timestamp': datetime.now().isoformat()
        }

        joblib.dump(model_data, filepath)
        logger.info(f"Model saved to {filepath}")

    @classmethod
    def load_model(cls, filepath):
        model_data = joblib.load(filepath)

        instance = cls()
        instance.model = model_data['model']
        instance.feature_names = model_data['feature_names']
        instance.is_trained = model_data['is_trained']

        logger.info(f"Model loaded from {filepath}")
        return instance
