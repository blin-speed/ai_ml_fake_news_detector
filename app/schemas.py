from typing import Literal

from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500, examples=["Senate reaches bipartisan deal on infrastructure"])
    description: str = Field("", max_length=8000, examples=["Lawmakers announced an agreement on Wednesday ..."])


class BatchRequest(BaseModel):
    items: list[PredictRequest] = Field(..., min_length=1)


class ModelScore(BaseModel):
    fake_probability: float
    label: Literal["fake", "real"]


class InputInfo(BaseModel):
    word_count: int
    description_truncated: bool


class PredictResponse(BaseModel):
    verdict: Literal["likely_fake", "uncertain", "likely_real"]
    ensemble_fake_probability: float
    models: dict[str, ModelScore]
    fake_votes: int
    total_models: int
    input: InputInfo
    model_version: str
    disclaimer: str


class BatchResponse(BaseModel):
    results: list[PredictResponse]
