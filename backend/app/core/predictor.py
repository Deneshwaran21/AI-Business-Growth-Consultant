import joblib
import pandas as pd
import shap
from .config import MODELS_DIR, MODEL_FILENAME

class Predictor:
    def __init__(self):
        self.artifact = None
        self.load()

    def load(self):
        path = MODELS_DIR / MODEL_FILENAME
        if path.exists():
            self.artifact = joblib.load(path)
        else:
            raise FileNotFoundError("Model not found. Train first!")

    def predict_churn(self, df: pd.DataFrame):
        """Return churn probability and class."""
        proc = self.artifact['processor']
        X = proc.transform_inference(df)
        model = self.artifact['classifier']
        proba = model.predict_proba(X)[:, 1]
        pred = (proba > 0.5).astype(int)
        return {
            'predictions': pred.tolist(),
            'probabilities': proba.tolist()
        }

    def predict_revenue(self, df: pd.DataFrame):
        """Return predicted monthly revenue."""
        proc = self.artifact['processor']
        X = proc.transform_inference(df)
        model = self.artifact['regressor']
        preds = model.predict(X)
        return preds.tolist()
    
    def explain_churn(self, df: pd.DataFrame, top_n: int = 5):
    
        proc = self.artifact['processor']
        X = proc.transform_inference(df)
        model = self.artifact['classifier']
        feature_names = proc.feature_columns
        explanations = []
        
        try:
            # Check model type
            model_type = type(model).__name__
            
            if 'XGB' in model_type or 'RandomForest' in model_type or 'LGBM' in model_type:
                # --- TREE MODEL: Use TreeExplainer ---
                explainer = shap.TreeExplainer(model)
                shap_values = explainer.shap_values(X)
                
                # For binary classification, shap_values is a list of [negative, positive]
                if isinstance(shap_values, list):
                    shap_values = shap_values[1]
                    
                for i in range(len(X)):
                    feat_contrib = []
                    for j, feat in enumerate(feature_names):
                        val = float(shap_values[i][j])
                        feat_contrib.append({'feature': feat, 'contribution': val})
                    feat_contrib.sort(key=lambda x: abs(x['contribution']), reverse=True)
                    explanations.append(feat_contrib[:top_n])
                    
            elif 'LogisticRegression' in model_type or 'Linear' in model_type:
                # --- LINEAR MODEL: Use LinearExplainer or coefficients ---
                # Try using LinearExplainer (requires background data)
                try:
                    # Use a small sample as background (first 100 rows or all)
                    background = X[:min(100, len(X))]
                    explainer = shap.LinearExplainer(model, background, feature_dependence="independent")
                    shap_values = explainer.shap_values(X)
                    
                    # shap_values shape: (n_samples, n_features)
                    for i in range(len(X)):
                        feat_contrib = []
                        for j, feat in enumerate(feature_names):
                            val = float(shap_values[i][j])
                            feat_contrib.append({'feature': feat, 'contribution': val})
                        feat_contrib.sort(key=lambda x: abs(x['contribution']), reverse=True)
                        explanations.append(feat_contrib[:top_n])
                        
                except Exception as e:
                    # Fallback: use model coefficients (global importance per feature)
                    print(f"LinearExplainer failed, using coefficients: {e}")
                    coeffs = model.coef_[0] if hasattr(model, 'coef_') and model.coef_.ndim > 1 else model.coef_
                    # For each instance, the contribution is feature_value * coefficient
                    for i in range(len(X)):
                        feat_contrib = []
                        for j, feat in enumerate(feature_names):
                            val = float(X.iloc[i, j] * coeffs[j])
                            feat_contrib.append({'feature': feat, 'contribution': val})
                        feat_contrib.sort(key=lambda x: abs(x['contribution']), reverse=True)
                        explanations.append(feat_contrib[:top_n])
            else:
                # --- UNKNOWN MODEL: Skip SHAP, return empty explanations ---
                for i in range(len(X)):
                    explanations.append([])
                    
        except Exception as e:
            # If SHAP entirely fails, return empty explanations
            print(f"SHAP explanation failed: {e}")
            for i in range(len(X)):
                explanations.append([])
        
        return explanations