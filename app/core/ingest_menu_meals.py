""" ingest meal nutrition from national chain restaurants\n
- including Pizza Hut, McDonalds, Dominos, KFC, Starbucks, Chick-fil-A, Subway, Shake Shack\n
- features restaurant, category, product, serving_size, energy_kcal, carbohydrates_g, protein_g, fiber_g, sugar_g, total_fat_g, saturated_fat_g, trans_fat_g, cholesterol_mg, sodium_mg\n
- outputs menu_meals.csv\n
- could still do more cleaning and derive attributes"""

import pandas as pd
import numpy as np

# -----------------------------
# final schema
# -----------------------------
FINAL_COLS = [
    "restaurant",
    "category",
    "product",
    "serving_size",
    "energy_kcal",
    "carbohydrates_g",
    "protein_g",
    "fiber_g",
    "sugar_g",
    "total_fat_g",
    "saturated_fat_g",
    "trans_fat_g",
    "cholesterol_mg",
    "sodium_mg",
]

# -----------------------------
# pizza hut, mcdonalds, dominos, kfc, starbucks schema
# -----------------------------
MAP_TABLE1 = {
    "Company": "restaurant",
    "Category": "category",
    "Product": "product",
    "Per Serve Size": "serving_size",
    "Energy (kCal)": "energy_kcal",
    "Carbohydrates (g)": "carbohydrates_g",
    "Protein (g)": "protein_g",
    "Fiber (g)": "fiber_g",
    "Sugar (g)": "sugar_g",
    "Total Fat (g)": "total_fat_g",
    "Saturated Fat (g)": "saturated_fat_g",
    "Trans Fat (g)": "trans_fat_g",
    "Cholesterol (mg)": "cholesterol_mg",
    "Sodium (mg)": "sodium_mg",
}

# -----------------------------
# chick-fil-a schema
# -----------------------------
MAP_TABLE2 = {
    "Menu": "product",
    "Serving size": "serving_size",
    "Calories": "energy_kcal",
    "Fat (G)": "total_fat_g",
    "Sat. Fat (G)": "saturated_fat_g",
    "Trans Fat (G)": "trans_fat_g",
    "Cholesterol (MG)": "cholesterol_mg",
    "Sodium (MG)": "sodium_mg",
    "Carbohydrates (G)": "carbohydrates_g",
    "Fiber (G)": "fiber_g",
    "Sugar (G)": "sugar_g",
    "Protein (G)": "protein_g",
}

# -----------------------------
# shake shack schema
# -----------------------------
MAP_TABLE3 = {
    "Category": "category",
    "Menu": "product",
    "Calories": "energy_kcal",
    "Total Fat": "total_fat_g",
    "Sat Fat": "saturated_fat_g",
    "Trans Fat": "trans_fat_g",
    "Cholesterol": "cholesterol_mg",
    "Sodium": "sodium_mg",
    "Total Carb": "carbohydrates_g",
    "Fiber": "fiber_g",
    "Sugars": "sugar_g",
    "Protein": "protein_g",
}

# -----------------------------
# Helpers
# -----------------------------
def clean_symbols(series: pd.Series) -> pd.Series:
    """
    Remove ® ™ * symbols and normalize whitespace.
    """
    return (
        series.astype("string")
        .str.replace("®", "", regex=False)
        .str.replace("™", "", regex=False)
        .str.replace("*", "", regex=False)
        .str.replace(r"\s+", " ", regex=True)  # normalize multiple whitespaces to just one
        .str.strip()
    )

def normalize_and_align(df: pd.DataFrame, colmap: dict) -> pd.DataFrame:
    out = df.rename(columns=colmap).copy()

    # check all final columns exist
    for col in FINAL_COLS:
        if col not in out.columns:
            out[col] = np.nan

    # clean text fields
    for col in ["restaurant", "category", "product", "serving_size"]:
        out[col] = out[col].astype("string").str.strip()

    # clean numeric fields
    numeric_cols = [c for c in FINAL_COLS if c not in ["restaurant", "category", "product", "serving_size"]]
    for col in numeric_cols:
        out[col] = pd.to_numeric(out[col], errors="coerce")

    return out[FINAL_COLS]

def clean_chickfila(df2: pd.DataFrame) -> pd.DataFrame:
    """
    - Add restaurant column for Chick-fil-A
    - Remove non-alphanumeric symbols
    - Remove 'Chick-fil-A' anywhere in product
    """
    out = df2.rename(columns=MAP_TABLE2).copy()
    out["restaurant"] = "Chick-fil-A"

    if "product" in out.columns:
        out["product"] = clean_symbols(out["product"])

        out["product"] = (out["product"]
            .str.replace(r"chick-fil-a", "", case=False, regex=True)    # remove Chick-fil-A anywhere anycase
            .str.replace(r"\s+", " ", regex=True)                       # remove leftover whitespace
            .str.strip(" -–—:|")
            .str.strip()
        )

    return out

def clean_shakeshack(df3: pd.DataFrame) -> pd.DataFrame:
    """
    - Add restaurant column for Shake Shack
    - Remove non-alphanumeric symbols
    - Doesn't have serving size, move oz in product to serving_size
    - Remove parantheses from product
    """
    out = df3.rename(columns=MAP_TABLE3).copy()
    out["restaurant"] = "Shake Shack"

    if "product" in out.columns:
        out["product"] = clean_symbols(out["product"])

        out["serving_size"] = (out["product"]
            .str.extract(r"\((.*?)\)", expand=False)     # inside ()
            .str.extract(r"(\d+\.?\d*)", expand=False)   # number only
        )

        out["product"] = (out["product"]
            .str.replace(r"\(.*?\)", "", regex=True)
            .str.replace(r"\s+", " ", regex=True)
            .str.strip()
        )

    return out

def first_non_null(s: pd.Series):
    s2 = s.dropna()
    return s2.iloc[0] if len(s2) else np.nan


# -----------------------------
# combine pizza hut, mcdonalds, dominos, kfc, starbucks, chick-fil-a, shake shack
# -----------------------------
def combine(df1, df2, df3):

    df1_n = normalize_and_align(df1, MAP_TABLE1)

    df2_clean = clean_chickfila(df2)
    df2_n = normalize_and_align(df2_clean, colmap={c: c for c in df2_clean.columns})

    df3_clean = clean_shakeshack(df3)
    df3_n = normalize_and_align(df3_clean, colmap={c: c for c in df3_clean.columns})

    combined = pd.concat([df1_n, df2_n, df3_n], ignore_index=True)

    # Optional: normalize serving_size (your current logic removes units; leaving it as you wrote but safer)
    #combined["serving_size"] = combined["serving_size"].astype("string")

    combined["serving_size"] = combined["serving_size"].str.replace(" ", "", regex=False)
    combined["serving_size"] = combined["serving_size"].str.replace("*", "", regex=False)
    combined["serving_size"] = combined["serving_size"].str.replace("g", "", regex=False)
    combined["serving_size"] = combined["serving_size"].str.replace("ml", "", regex=False)
    combined["serving_size"] = combined["serving_size"].astype("float")

    combined["fiber_g"] = combined["fiber_g"].replace([np.inf, -np.inf], np.nan)

    combined.to_csv("menu_meals.csv", index=False)



def ingest_menu_meals():
    """loads menu_meals.csv into a dictionary for sql db"""
    df = pd.read_csv('./menu_meals.csv')

    df = df.replace([np.inf, -np.inf], np.nan)

    # clean numeric fields
    numeric_cols = ["serving_size", "energy_kcal", "carbohydrates_g", "protein_g", "fiber_g", "sugar_g", "total_fat_g", "saturated_fat_g", "trans_fat_g", "cholesterol_mg", "sodium_mg"]
    for c in numeric_cols:
        df[c] = pd.to_numeric(df[c], errors="coerce")

    # convert NaN --> None for SQL NULL
    df = df.where(pd.notnull(df), None)

    records = df.to_dict(orient="records")
    return records



if __name__ == '__main__':
    df1 = pd.read_csv('app/core/first5.csv', encoding="utf-8")
    df2 = pd.read_csv('app/core/chickfila.csv', encoding="utf-8")
    df3 = pd.read_csv('app/core/shakeshack.csv', encoding="utf-8")

    # combine(df1, df2, df3)

