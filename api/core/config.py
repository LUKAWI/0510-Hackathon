"""应用配置管理，从环境变量加载。"""

from __future__ import annotations

from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    """应用配置，从 .env 文件或环境变量加载。"""

    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # 通义千问
    DASHSCOPE_API_KEY: str = ""

    # 数据库
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/knowledge_agent"

    # Embedding 模型 (DashScope API)
    EMBEDDING_MODEL_NAME: str = "text-embedding-v4"
    EMBEDDING_DIM: int = 1024

    # RAG 分块参数
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 80

    # LLM 模型
    LLM_MODEL_NAME: str = "qwen3.5-plus"


settings = Settings()
