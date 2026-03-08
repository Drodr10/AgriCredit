import numpy as np
import pandas as pd
import numpy as np
import joblib
from xgboost import XGBClassifier
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.metrics import roc_auc_score
import os

def generate_robust_data(n_samples=5000):
    """
    Generate synthetic data with more noise and samples for robust training.
    """
    print(f"Generating {n_samples} samples of synthetic data (NASA/ICRISAT pattern)...")
    np.random.seed(42)
    
    data = {
        'yield_avg': np.random.normal(4.2, 0.8, n_samples),
        'yield_volatility': np.random.uniform(0.1, 0.4, n_samples),
        'spei_drought': np.random.normal(-0.2, 1.2, n_samples),
        'rainfall_pct': np.random.normal(95, 25, n_samples),
        'price_volatility': np.random.uniform(10, 30, n_samples),
        'irrigation_factor': np.random.choice([0.8, 1.0, 1.2], n_samples),
        'farm_size_factor': np.random.uniform(0.5, 2.5, n_samples),
        'experience_factor': np.random.uniform(0.7, 1.3, n_samples)
    }
    
    df = pd.DataFrame(data)
    
    # Target logic: higher risk if drought is bad, rainfall is low, and yield is low
    # Adding noise to simulate real-world uncertainty
    logit = (
        0.5 
        - (df['yield_avg'] - 4.0) * 0.8
        + df['spei_drought'] * 1.5
        + (100 - df['rainfall_pct']) * 0.05
        + np.random.normal(0, 0.5, n_samples) # Random noise
    )
    
    df['risk_label'] = (logit > logit.median()).astype(int)
    return df

def train_robust_model():
    df = generate_robust_data()
    
    X = df.drop('risk_label', axis=1)
    y = df['risk_label']
    
    # 1. Stratified K-Fold Cross-Validation
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = []
    
    print("\n--- Starting 5-Fold Cross-Validation ---")
    
    # Regularized XGB Parameters
    xgb_params = {
        'n_estimators': 100,
        'max_depth': 4,           # Smaller depth to prevent overfitting
        'learning_rate': 0.1,     # Controlled learning
        'subsample': 0.8,         # Use 80% of data per tree
        'colsample_bytree': 0.8,  # Use 80% of features per tree
        'random_state': 42,
        'eval_metric': 'auc'
    }
    
    for fold, (train_idx, val_idx) in enumerate(skf.split(X, y), 1):
        X_train_fold, X_val_fold = X.iloc[train_idx], X.iloc[val_idx]
        y_train_fold, y_val_fold = y.iloc[train_idx], y.iloc[val_idx]
        
        model = XGBClassifier(**xgb_params)
        model.fit(X_train_fold, y_train_fold)
        
        y_pred = model.predict_proba(X_val_fold)[:, 1]
        auc = roc_auc_score(y_val_fold, y_pred)
        cv_scores.append(auc)
        print(f"Fold {fold} Validation AUC: {auc:.4f}")
        
    print(f"\nAverage CV AUC: {np.mean(cv_scores):.4f} (+/- {np.std(cv_scores):.4f})")
    
    # 2. Final Training with Train/Test Split to show Gap
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    final_model = XGBClassifier(**xgb_params)
    final_model.fit(X_train, y_train)
    
    train_auc = roc_auc_score(y_train, final_model.predict_proba(X_train)[:, 1])
    test_auc = roc_auc_score(y_test, final_model.predict_proba(X_test)[:, 1])
    
    print("\n--- Final Model Evaluation ---")
    print(f"Training AUC:   {train_auc:.4f}")
    print(f"Validation AUC: {test_auc:.4f}")
    print(f"Gap (Overfit):  {(train_auc - test_auc)*100:.2f}%")
    
    # 3. Save Model
    os.makedirs('models', exist_ok=True)
    joblib.dump(final_model, 'models/xgb_agricredit.pkl')
    print("\n✅ Robust Model saved to models/xgb_agricredit.pkl")

if __name__ == "__main__":
    train_robust_model()
