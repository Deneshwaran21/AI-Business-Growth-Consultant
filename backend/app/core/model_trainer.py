import joblib
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from xgboost import XGBClassifier, XGBRegressor
from sklearn.metrics import accuracy_score, roc_auc_score, mean_absolute_error, r2_score
from .config import MODELS_DIR, MODEL_FILENAME
from .data_processor import DataProcessor

class ModelTrainer:
    def __init__(self):
        self.processor = DataProcessor()
        self.classifier = None
        self.regressor = None
        self.results = {}

    def train_churn_model(self, df: pd.DataFrame):
        """Train a classifier for churn prediction."""
        X_train, X_val, y_train, y_val = self.processor.prepare_features(df, target='churn')

        models = {
            'LogisticRegression': LogisticRegression(max_iter=1000),
            'RandomForest': RandomForestClassifier(n_estimators=100, random_state=42),
            'XGBoost': XGBClassifier(n_estimators=100, random_state=42, eval_metric='logloss')
        }

        best_model = None
        best_auc = -float('inf')

        for name, model in models.items():
            model.fit(X_train, y_train)
            y_pred = model.predict(X_val)
            y_proba = model.predict_proba(X_val)[:, 1] if hasattr(model, 'predict_proba') else y_pred

            if len(set(y_val)) < 2:
                auc = 0.5
            else:
                auc = roc_auc_score(y_val, y_proba)
                if np.isnan(auc):
                    auc = 0.5

            acc = accuracy_score(y_val, y_pred)
            self.results[f'churn_{name}'] = {'accuracy': acc, 'auc': auc}

            if auc > best_auc:
                best_auc = auc
                best_model = model

        # Safety fallback
        if best_model is None:
            best_model = list(models.values())[0]
            best_auc = 0.5

        self.classifier = best_model
        self.results['churn_best'] = {'auc': best_auc}
        return best_model

    def train_revenue_model(self, df: pd.DataFrame):
        """Train a regressor for monthly revenue prediction."""
        X_train, X_val, y_train, y_val = self.processor.prepare_features(df, target='monthly_revenue')

        models = {
            'LinearRegression': LinearRegression(),
            'RandomForest': RandomForestRegressor(n_estimators=100, random_state=42),
            'XGBoost': XGBRegressor(n_estimators=100, random_state=42)
        }

        best_model = None
        best_r2 = -float('inf')
        for name, model in models.items():
            model.fit(X_train, y_train)
            y_pred = model.predict(X_val)
            r2 = r2_score(y_val, y_pred)
            mae = mean_absolute_error(y_val, y_pred)
            self.results[f'revenue_{name}'] = {'r2': r2, 'mae': mae}
            if r2 > best_r2:
                best_r2 = r2
                best_model = model

        if best_model is None:
            best_model = list(models.values())[0]
            best_r2 = 0.0

        self.regressor = best_model
        self.results['revenue_best'] = {'r2': best_r2}
        return best_model

    def save_models(self):
        """Save both models and the processor (with scaler/encoders)."""
        artifact = {
            'classifier': self.classifier,
            'regressor': self.regressor,
            'processor': self.processor,
            'results': self.results
        }
        path = MODELS_DIR / MODEL_FILENAME
        joblib.dump(artifact, path)
        return path