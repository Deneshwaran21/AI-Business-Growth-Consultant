import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split

class DataProcessor:
    def __init__(self):
        self.encoders = {}
        self.scaler = StandardScaler()
        self.feature_columns = None
        self.target_cols = ['churn', 'monthly_revenue']

    def clean(self, df: pd.DataFrame) -> pd.DataFrame:
        """Basic cleaning: drop duplicates, handle missing."""
        df = df.drop_duplicates()
        # Fill numeric missing with median, categorical with mode
        for col in df.columns:
            if df[col].dtype in ['float64', 'int64']:
                df[col].fillna(df[col].median(), inplace=True)
            else:
                df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else 'Unknown', inplace=True)
        return df

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create additional features."""
        df = df.copy()
        # Tenure groups
        df['tenure_group'] = pd.cut(df['tenure'], bins=[0, 12, 24, 48, 72], labels=['new', 'short', 'medium', 'long'])
        # Average charge per month ratio
        df['charge_to_spend_ratio'] = df['monthly_charges'] / (df['avg_monthly_spend'] + 1e-5)
        # Seniority flag
        df['is_senior'] = (df['age'] > 60).astype(int)
        return df

    def encode_categorical(self, df: pd.DataFrame) -> pd.DataFrame:
        """Label encode categorical columns."""
        df = df.copy()
        cat_cols = df.select_dtypes(include=['object', 'category']).columns
        for col in cat_cols:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            self.encoders[col] = le
        return df

    def prepare_features(self, df: pd.DataFrame, target: str = 'churn'):
        """Split features/target, scale, and return train/test sets."""
        df = self.clean(df)
        df = self.engineer_features(df)
        df = self.encode_categorical(df)

        # Separate target
        y = df[target]
        X = df.drop(columns=[target, 'customer_id'], errors='ignore')
        # Drop other target columns if present
        for t in self.target_cols:
            if t != target and t in X.columns:
                X.drop(columns=[t], inplace=True)

        # Store feature names for inference
        self.feature_columns = X.columns.tolist()

        # Scale
        X_scaled = self.scaler.fit_transform(X)
        X_scaled = pd.DataFrame(X_scaled, columns=self.feature_columns)

        # Train/val split
        X_train, X_val, y_train, y_val = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42, stratify=y if target == 'churn' else None
        )
        return X_train, X_val, y_train, y_val

    def transform_inference(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply same preprocessing to new data."""
        df = self.clean(df)
        df = self.engineer_features(df)
        df = self.encode_categorical(df)

        # Ensure all feature columns exist
        for col in self.feature_columns:
            if col not in df.columns:
                df[col] = 0
        X = df[self.feature_columns]
        X_scaled = self.scaler.transform(X)
        return pd.DataFrame(X_scaled, columns=self.feature_columns)