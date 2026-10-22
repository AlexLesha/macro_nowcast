from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import List
import os


class Settings(BaseSettings):
    """MacroPulse Alpha backend configuration settings."""

    # API Keys
    FRED_API_KEY: str = Field(default="", description="Federal Reserve Economic Data API Key")
    TIINGO_API_KEY: str = Field(default="", description="Tiingo Financial Data API Key")
    YOUTUBE_API_KEY: str = Field(default="", description="YouTube Data API Key")
    OPENAI_OR_GEMINI_API_KEY: str = Field(default="", description="OpenAI or Gemini API Key for intelligence extraction")

    # Database & Cache
    DATABASE_URL: str = Field(
        default="sqlite:///./macro_pulse.db",
        description="Database connection URL (PostgreSQL or SQLite fallback)",
    )
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL for caching and queues",
    )

    # API Server Settings
    APP_NAME: str = "MacroPulse Alpha Engine"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://macro-nowcast.pages.dev",
        "https://macro-nowcast-wdw2.onrender.com",
    ]

    # FRED Series definitions (Section 4 specs)
    FRED_SERIES: List[str] = [
        "GDPC1",                 # Real GDP (Quarterly)
        "GDP",                   # Nominal GDP
        "PCEC96",                # Real Personal Consumption Expenditures
        "CPIAUCSL",              # Consumer Price Index for All Urban Consumers: All Items
        "CPILFESL",              # Core CPI (Ex Food & Energy)
        "CUSR0000SAH1",          # CPI Shelter
        "CORESTICKM159SFRBATL",  # Atlanta Fed Sticky CPI
        "CES2023610001",         # Average Hourly Earnings (Total Private)
        "UNDCONTSA",             # Housing Starts Under Construction
        "ICSA",                  # Initial Jobless Claims (Weekly)
        "JTSJOL",                # JOLTS Job Openings
        "WALCL",                 # Fed Total Assets (Total Balance Sheet)
        "WTREGEN",               # Treasury General Account (TGA) Weekly
        "RRPONTSYD",             # Overnight Reverse Repo Facility (ON RRP)
        "WRESBAL",               # Reserve Balances with Federal Reserve Banks
        "M2SL",                  # M2 Money Stock
        "GFDEBTN",               # Total Public Debt
        "IIPUSNETIQ",            # Net International Investment Position
        "DGS2",                  # 2-Year Treasury Constant Maturity Rate
        "DGS10",                 # 10-Year Treasury Constant Maturity Rate
        "DFII10",                # 10-Year TIPS Real Yield
        "BAMLC0A0CM",            # ICE BofA US Corporate Index OAS (Investment Grade)
        "BAMLH0A0HYM2",          # ICE BofA US High Yield Index OAS
        "BAMLH0A3HYC",           # ICE BofA CCC & Lower High Yield OAS
        "DCOILBRENTEU",          # Crude Oil Prices: Brent
    ]

    # Key tickers for Market & Options Ingestion
    CORE_TICKERS: List[str] = [
        "SPY", "QQQ", "IWM", "TLT", "IEF", "SHY", "HYG", "LQD",
        "GLD", "SLV", "USO", "UUP", "FXE", "VIXY", "XLE", "XLF",
        "XLK", "XLV", "XLI", "XLP", "XLU", "XLY", "XLC", "XLB", "VNQ"
    ]

    OPTIONS_TICKERS: List[str] = ["SPY", "QQQ", "IWM", "AAPL", "NVDA", "MSFT", "TSLA"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
