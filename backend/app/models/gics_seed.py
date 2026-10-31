"""
backend/app/models/gics_seed.py
Seeds all 77 GICS industries and benchmark sector ETFs into the database.
"""
from typing import List, Tuple
from sqlalchemy.orm import Session

try:
    from app.models.db_models import GicsIndustry
except ImportError:
    from backend.app.models.db_models import GicsIndustry

GICS_77_DATA: List[Tuple[str, str, str, str, str, str]] = [
    # Energy (Sector 10)
    ("101010", "Energy", "Energy", "Energy Equipment & Services", "XLE", "1381,1389"),
    ("101020", "Energy", "Energy", "Oil, Gas & Consumable Fuels", "XLE", "1311,2911,1221"),
    # Materials (Sector 15)
    ("151010", "Materials", "Materials", "Chemicals", "XLB", "2800,2810,2820"),
    ("151020", "Materials", "Materials", "Construction Materials", "XLB", "3241,3270"),
    ("151030", "Materials", "Materials", "Containers & Packaging", "XLB", "2650,3411"),
    ("151040", "Materials", "Materials", "Metals & Mining", "XLB", "1000,1040,3312"),
    ("151050", "Materials", "Materials", "Paper & Forest Products", "XLB", "2400,2600"),
    # Industrials (Sector 20)
    ("201010", "Industrials", "Capital Goods", "Aerospace & Defense", "XLI", "3720,3760"),
    ("201020", "Industrials", "Capital Goods", "Building Products", "XLI", "3200,3442"),
    ("201030", "Industrials", "Capital Goods", "Construction & Engineering", "XLI", "1500,1600"),
    ("201040", "Industrials", "Capital Goods", "Electrical Equipment", "XLI", "3612,3620"),
    ("201050", "Industrials", "Capital Goods", "Industrial Conglomerates", "XLI", "9997"),
    ("201060", "Industrials", "Capital Goods", "Machinery", "XLI", "3523,3531"),
    ("201070", "Industrials", "Capital Goods", "Trading Companies & Distributors", "XLI", "5000,5080"),
    ("202010", "Industrials", "Commercial & Professional Services", "Commercial Services & Supplies", "XLI", "7300,7340"),
    ("202020", "Industrials", "Commercial & Professional Services", "Professional Services", "XLI", "7361,7380"),
    ("203010", "Industrials", "Transportation", "Air Freight & Logistics", "XLI", "4513,4700"),
    ("203020", "Industrials", "Transportation", "Passenger Airlines", "XLI", "4512"),
    ("203030", "Industrials", "Transportation", "Marine Transportation", "XLI", "4400"),
    ("203040", "Industrials", "Transportation", "Ground Transportation", "XLI", "4011,4210"),
    ("203050", "Industrials", "Transportation", "Transportation Infrastructure", "XLI", "4724,4785"),
    # Consumer Discretionary (Sector 25)
    ("251010", "Consumer Discretionary", "Automobiles & Components", "Automobile Components", "XLY", "3714"),
    ("251020", "Consumer Discretionary", "Automobiles & Components", "Automobiles", "XLY", "3711"),
    ("252010", "Consumer Discretionary", "Consumer Durables & Apparel", "Household Durables", "XLY", "3630,3651"),
    ("252020", "Consumer Discretionary", "Consumer Durables & Apparel", "Leisure Products", "XLY", "3944,3949"),
    ("252030", "Consumer Discretionary", "Consumer Durables & Apparel", "Textiles, Apparel & Luxury Goods", "XLY", "2300,3100"),
    ("253010", "Consumer Discretionary", "Consumer Services", "Hotels, Restaurants & Leisure", "XLY", "7011,5812"),
    ("253020", "Consumer Discretionary", "Consumer Services", "Diversified Consumer Services", "XLY", "7200,8200"),
    ("255010", "Consumer Discretionary", "Consumer Discretionary Distribution & Retail", "Distributors", "XLY", "5010"),
    ("255020", "Consumer Discretionary", "Consumer Discretionary Distribution & Retail", "Broadline Retail", "XLY", "5311,5961"),
    ("255030", "Consumer Discretionary", "Consumer Discretionary Distribution & Retail", "Specialty Retail", "XLY", "5600,5700"),
    # Consumer Staples (Sector 30)
    ("301010", "Consumer Staples", "Consumer Staples Distribution & Retail", "Consumer Staples Distribution & Retail", "XLP", "5411,5140"),
    ("302010", "Consumer Staples", "Food, Beverage & Tobacco", "Beverages", "XLP", "2080,2086"),
    ("302020", "Consumer Staples", "Food, Beverage & Tobacco", "Food Products", "XLP", "2000,2020"),
    ("302030", "Consumer Staples", "Food, Beverage & Tobacco", "Tobacco", "XLP", "2111"),
    ("303010", "Consumer Staples", "Household & Personal Products", "Household Products", "XLP", "2840,2844"),
    ("303020", "Consumer Staples", "Household & Personal Products", "Personal Care Products", "XLP", "2844"),
    # Health Care (Sector 35)
    ("351010", "Health Care", "Health Care Equipment & Services", "Health Care Equipment & Supplies", "XLV", "3841,3842"),
    ("351020", "Health Care", "Health Care Equipment & Services", "Health Care Providers & Services", "XLV", "8000,8062"),
    ("351030", "Health Care", "Health Care Equipment & Services", "Health Care Technology", "XLV", "7373"),
    ("352010", "Health Care", "Pharmaceuticals, Biotechnology & Life Sciences", "Biotechnology", "XLV", "2836"),
    ("352020", "Health Care", "Pharmaceuticals, Biotechnology & Life Sciences", "Pharmaceuticals", "XLV", "2834"),
    ("352030", "Health Care", "Pharmaceuticals, Biotechnology & Life Sciences", "Life Sciences Tools & Services", "XLV", "3826"),
    # Financials (Sector 40)
    ("401010", "Financials", "Banks", "Banks", "XLF", "6020,6021,6022"),
    ("402010", "Financials", "Financial Services", "Financial Services", "XLF", "6199,6200"),
    ("402020", "Financials", "Financial Services", "Consumer Finance", "XLF", "6141"),
    ("402030", "Financials", "Financial Services", "Capital Markets", "XLF", "6211,6282"),
    ("402040", "Financials", "Financial Services", "Mortgage Real Estate Investment Trusts (REITs)", "XLF", "6798"),
    ("403010", "Financials", "Insurance", "Insurance", "XLF", "6311,6321,6331"),
    # Information Technology (Sector 45)
    ("451020", "Information Technology", "Software & Services", "IT Services", "XLK", "7370,7371"),
    ("451030", "Information Technology", "Software & Services", "Software", "XLK", "7372"),
    ("452010", "Information Technology", "Technology Hardware & Equipment", "Communications Equipment", "XLK", "3661,3663"),
    ("452020", "Information Technology", "Technology Hardware & Equipment", "Technology Hardware, Storage & Peripherals", "XLK", "3571,3572"),
    ("452030", "Information Technology", "Technology Hardware & Equipment", "Electronic Equipment, Instruments & Components", "XLK", "3670,3825"),
    ("453010", "Information Technology", "Semiconductors & Semiconductor Equipment", "Semiconductors", "XLK", "3674"),
    # Communication Services (Sector 50)
    ("501010", "Communication Services", "Telecommunication Services", "Diversified Telecommunication Services", "XLC", "4813"),
    ("501020", "Communication Services", "Telecommunication Services", "Wireless Telecommunication Services", "XLC", "4812"),
    ("502010", "Communication Services", "Media & Entertainment", "Media", "XLC", "2711,4832"),
    ("502020", "Communication Services", "Media & Entertainment", "Entertainment", "XLC", "7812,7900"),
    ("502030", "Communication Services", "Media & Entertainment", "Interactive Media & Services", "XLC", "7370,7374"),
    # Utilities (Sector 55)
    ("551010", "Utilities", "Utilities", "Electric Utilities", "XLU", "4911"),
    ("551020", "Utilities", "Utilities", "Gas Utilities", "XLU", "4922,4923"),
    ("551030", "Utilities", "Utilities", "Multi-Utilities", "XLU", "4931"),
    ("551040", "Utilities", "Utilities", "Water Utilities", "XLU", "4941"),
    ("551050", "Utilities", "Utilities", "Independent Power and Renewable Electricity Producers", "XLU", "4911,4991"),
    # Real Estate (Sector 60)
    ("601010", "Real Estate", "Equity Real Estate Investment Trusts (REITs)", "Diversified REITs", "XLRE", "6798"),
    ("601025", "Real Estate", "Equity Real Estate Investment Trusts (REITs)", "Industrial REITs", "XLRE", "6798"),
    ("601030", "Real Estate", "Equity Real Estate Investment Trusts (REITs)", "Hotel & Resort REITs", "XLRE", "6798"),
    ("601040", "Real Estate", "Equity Real Estate Investment Trusts (REITs)", "Office REITs", "XLRE", "6798"),
    ("601050", "Real Estate", "Equity Real Estate Investment Trusts (REITs)", "Health Care REITs", "XLRE", "6798"),
    ("601060", "Real Estate", "Equity Real Estate Investment Trusts (REITs)", "Residential REITs", "XLRE", "6798"),
    ("601070", "Real Estate", "Equity Real Estate Investment Trusts (REITs)", "Retail REITs", "XLRE", "6798"),
    ("601080", "Real Estate", "Equity Real Estate Investment Trusts (REITs)", "Specialized REITs", "XLRE", "6798"),  # Covers Agricultural/Farmland REITs (e.g. LAND)
    ("602010", "Real Estate", "Real Estate Management & Development", "Real Estate Management & Development", "XLRE", "6500,6512"),
]


def seed_gics_industries(db: Session):
    """Inserts the official GICS taxonomy into the database if not present."""
    count = db.query(GicsIndustry).count()
    if count >= 70:
        return
    for code, sec, grp, ind, etf, sic in GICS_77_DATA:
        existing = db.query(GicsIndustry).filter_by(industry_code=code).first()
        if not existing:
            db.add(
                GicsIndustry(
                    industry_code=code,
                    sector_name=sec,
                    industry_group_name=grp,
                    industry_name=ind,
                    benchmark_etf=etf,
                    sic_prefixes=sic,
                )
            )
    db.commit()

