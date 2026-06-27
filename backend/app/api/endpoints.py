from fastapi import APIRouter, UploadFile, File, HTTPException, Query
import pandas as pd
import numpy as np
import shutil
from pathlib import Path
from pydantic import BaseModel
from app.core.data_processor import DataProcessor
from app.core.model_trainer import ModelTrainer
from app.core.predictor import Predictor
from app.core.config import UPLOAD_DIR, MODELS_DIR
from app.models.schemas import TrainResponse, PredictResponse

router = APIRouter()

class TrainRequest(BaseModel):
    file_path: str
    target: str = "churn"

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename, "path": str(file_path)}

@router.post("/train")
async def train_model(request: TrainRequest):
    try:
        df = pd.read_csv(request.file_path)
        trainer = ModelTrainer()
        if request.target == "churn":
            trainer.train_churn_model(df)
        elif request.target == "monthly_revenue":
            trainer.train_revenue_model(df)
        else:
            raise HTTPException(400, "Target must be 'churn' or 'monthly_revenue'")
        trainer.save_models()
        return TrainResponse(status="success", results=trainer.results)
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/predict", response_model=PredictResponse)
async def predict(
    data: list[dict],
    model_type: str = Query("churn", description="'churn' or 'monthly_revenue'")
):
    try:
        df = pd.DataFrame(data)
        predictor = Predictor()
        
        if model_type == "churn":
            if predictor.artifact['classifier'] is None:
                raise HTTPException(400, "Churn model is not trained. Please train it first.")
            result = predictor.predict_churn(df)
            return PredictResponse(
                predictions=result['predictions'],
                probabilities=result['probabilities']
            )
        elif model_type == "monthly_revenue":
            if predictor.artifact['regressor'] is None:
                raise HTTPException(400, "Revenue model is not trained. Please train it first.")
            result = predictor.predict_revenue(df)
            return PredictResponse(
                predictions=result,
                probabilities=None
            )
        else:
            raise HTTPException(400, "model_type must be 'churn' or 'monthly_revenue'")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/explain")
async def explain(
    data: list[dict],
    top_n: int = Query(5, ge=1, le=20)
):
    try:
        df = pd.DataFrame(data)
        predictor = Predictor()
        
        if predictor.artifact['classifier'] is None:
            raise HTTPException(400, "Churn model is not trained. Please train the churn model first.")
        
        explanations = predictor.explain_churn(df, top_n=top_n)
        return {"explanations": explanations}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/strategy")
async def generate_strategy(data: list[dict]):
    try:
        df = pd.DataFrame(data)
        predictor = Predictor()
        
        # Check if churn model exists
        if predictor.artifact['classifier'] is None:
            raise HTTPException(400, "Churn model is not trained. Please train the churn model first.")
        
        # Get churn predictions
        churn_result = predictor.predict_churn(df)
        probs = churn_result['probabilities']
        
        # Try to get revenue predictions (optional – if missing, set to None)
        revs = None
        if predictor.artifact['regressor'] is not None:
            revs = predictor.predict_revenue(df)
        
        # Get SHAP explanations (optional – if SHAP fails, skip it)
        try:
            explanations = predictor.explain_churn(df, top_n=3)
        except Exception:
            explanations = [[] for _ in range(len(df))]
        
        strategies = []
        for i in range(len(df)):
            prob = probs[i]
            rev = revs[i] if revs is not None else 0.0
            
            # Determine risk level
            if prob > 0.6:
                risk = "HIGH"
                advice = "🚨 Immediate action required. Send a retention offer (discount, free upgrade, or personal call)."
            elif prob > 0.3:
                risk = "MODERATE"
                advice = "📧 Re-engage via email campaign with educational content or a small incentive."
            else:
                risk = "LOW"
                advice = "✅ Maintain regular communication. Upsell opportunities exist."
            
            # Add revenue context
            if revs is not None:
                if rev > 250:
                    rev_tier = "High-Value"
                    if risk == "HIGH":
                        advice += " This is a high-value customer – prioritize retention."
                elif rev > 150:
                    rev_tier = "Medium-Value"
                else:
                    rev_tier = "Low-Value"
            else:
                rev_tier = "Unknown (revenue model not trained)"
            
            top_factors = []
            if i < len(explanations) and explanations[i]:
                top_factors = [f"{f['feature']}: {f['contribution']:.3f}" for f in explanations[i][:3]]
            
            strategies.append({
                "customer": i + 1,
                "churn_probability": prob,
                "predicted_revenue": rev if revs is not None else None,
                "risk_level": risk,
                "customer_tier": rev_tier,
                "top_factors": top_factors,
                "advice": advice
            })
        
        return {"strategies": strategies}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/insights")
async def get_insights(data: list[dict]):
    try:
        df = pd.DataFrame(data)
        predictor = Predictor()
        
        if predictor.artifact['classifier'] is None:
            raise HTTPException(400, "Churn model is not trained. Please train it first.")
        
        churn_result = predictor.predict_churn(df)
        probs = churn_result['probabilities']
        
        # Revenue is optional
        revs = None
        if predictor.artifact['regressor'] is not None:
            revs = predictor.predict_revenue(df)
        
        insights = {
            "total_customers": len(probs),
            "avg_churn_probability": float(np.mean(probs)) if probs else 0.0,
            "max_churn_probability": float(np.max(probs)) if probs else 0.0,
            "min_churn_probability": float(np.min(probs)) if probs else 0.0,
            "high_risk_count": sum(1 for p in probs if p > 0.6),
            "moderate_risk_count": sum(1 for p in probs if 0.3 < p <= 0.6),
            "low_risk_count": sum(1 for p in probs if p <= 0.3),
        }
        
        if revs is not None:
            insights.update({
                "avg_predicted_revenue": float(np.mean(revs)) if revs else 0.0,
                "total_predicted_revenue": float(np.sum(revs)) if revs else 0.0,
                "max_revenue": float(np.max(revs)) if revs else 0.0,
                "min_revenue": float(np.min(revs)) if revs else 0.0,
            })
        else:
            insights.update({
                "avg_predicted_revenue": None,
                "total_predicted_revenue": None,
                "max_revenue": None,
                "min_revenue": None,
                "note": "Revenue model not trained. Insights based only on churn."
            })
        
        return insights
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/models")
async def list_models():
    path = MODELS_DIR / "business_growth_model.pkl"
    return {"exists": path.exists(), "path": str(path) if path.exists() else None}