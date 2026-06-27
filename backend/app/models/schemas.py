from pydantic import BaseModel
from typing import List, Optional

class TrainRequest(BaseModel):
    file_path: str
    target: str = "churn"

class TrainResponse(BaseModel):
    status: str
    results: dict

class PredictRequest(BaseModel):
    data: List[dict]

class PredictResponse(BaseModel):
    predictions: List
    probabilities: Optional[List[float]] = None   # ← make optional