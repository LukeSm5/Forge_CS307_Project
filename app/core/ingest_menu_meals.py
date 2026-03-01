""" ingest Pizza Hut, McDonalds, Dominos, KFC, starbucks, chick fil a, subway, shake shack"""

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
def clean_text_basic(series: pd.Series) -> pd.Series:
    """
    Remove ® ™ symbols and normalize whitespace.
    """
    return (
        series.astype("string")
        .str.replace("®", "", regex=False)
        .str.replace("™", "", regex=False)
        .str.replace(r"\s+", " ", regex=True)
        .str.strip()
    )

def normalize_and_align(df: pd.DataFrame, colmap: dict) -> pd.DataFrame:
    out = df.rename(columns=colmap).copy()

    # Ensure all final columns exist
    for col in FINAL_COLS:
        if col not in out.columns:
            out[col] = np.nan

    # Clean text fields
    for col in ["restaurant", "category", "product", "serving_size"]:
        out[col] = out[col].astype("string").str.strip()

    # Convert numeric fields
    numeric_cols = [c for c in FINAL_COLS if c not in ["restaurant", "category", "product", "serving_size"]]
    for col in numeric_cols:
        out[col] = pd.to_numeric(out[col], errors="coerce")

    return out[FINAL_COLS]

def clean_chickfila(df2: pd.DataFrame) -> pd.DataFrame:
    """
    - Add restaurant column for Chick-fil-A
    - Remove 'Chick-fil-A' and 'Chick-fil-A®' anywhere in product
    - Remove all ® symbols
    """
    out = df2.rename(columns=MAP_TABLE2).copy()
    out["restaurant"] = "Chick-fil-A"

    if "product" in out.columns:
        out["product"] = clean_text_basic(out["product"])

        out["product"] = (
            out["product"]
            .str.replace(r"chick-fil-a", "", case=False, regex=True)
            .str.replace(r"\s+", " ", regex=True)
            .str.strip(" -–—:")
            .str.strip()
        )

    return out

def clean_shakeshack(df3: pd.DataFrame) -> pd.DataFrame:
    """
    - Add restaurant column for Shake Shack
    - Remove ® symbols
    - (Optional) remove 'Shake Shack' from product if ever present
    """
    out = df3.rename(columns=MAP_TABLE3).copy()
    out["restaurant"] = "Shake Shack"

    if "product" in out.columns:
        out["product"] = clean_text_basic(out["product"])

        out["product"] = (
            out["product"]
            .str.replace(r"shake shack", "", case=False, regex=True)
            .str.replace(r"\s+", " ", regex=True)
            .str.strip(" -–—:")
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
    df2_n = normalize_and_align(
        df2_clean,
        colmap={c: c for c in df2_clean.columns},
    )

    df3_clean = clean_shakeshack(df3)
    df3_n = normalize_and_align(
        df3_clean,
        colmap={c: c for c in df3_clean.columns},
    )

    # combine with predetermined schema
    combined = pd.concat([df1_n, df2_n, df3_n], ignore_index=True)
    combined.to_csv("menu_meals.csv", index=False)





if __name__ == '__main__':
    df1 = pd.read_csv('app/core/first5.csv')
    df2 = pd.read_csv('app/core/chickfila.csv')
    df3 = pd.read_csv('app/core/shakeshack.csv')

    df = pd.read_csv('menu_meals.csv')
    with pd.option_context("display.max_rows", None):
        print(df)