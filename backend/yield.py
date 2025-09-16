import numpy as np
import pandas as pd
import warnings
import pickle

import seaborn as sns
import matplotlib.pyplot as plt

from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error
from sklearn.preprocessing import PowerTransformer, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer

warnings.filterwarnings("ignore")
sns.set(style="darkgrid", font_scale=1.5)
pd.set_option("display.max.columns", None)
pd.set_option("display.max.rows", None)

# -----------------------------
# Load and preprocess dataset
# -----------------------------
df = pd.read_csv("yield.csv")

df['Crop'] = df['Crop'].str.title()
df['State'] = df['State'].str.title()
df['Season'] = df['Season'].str.title()

df = df[df['Crop_Year'] != 2020]

df = df.drop(columns=['Area', 'Production', 'Fertilizer'], axis=1)

X = df[['Annual_Rainfall', 'Pesticide', 'Crop', 'Season', 'State']]
y = df['Yield']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

num_features = ['Annual_Rainfall', 'Pesticide']
cat_features = ['Crop', 'Season', 'State']

preprocessor = ColumnTransformer(
    transformers=[
        ('num', PowerTransformer(method='yeo-johnson'), num_features),
        ('cat', OneHotEncoder(drop='first', handle_unknown='ignore'), cat_features)
    ],
    remainder='drop'
)

pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('regressor', XGBRegressor())
])

pipeline.fit(X_train, y_train)

y_train_pred = pipeline.predict(X_train)
y_test_pred = pipeline.predict(X_test)

train_r2 = r2_score(y_train, y_train_pred) * 100
test_r2 = r2_score(y_test, y_test_pred) * 100
train_rmse = np.sqrt(mean_squared_error(y_train, y_train_pred))
test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))

print("XGBRegressor + Pipeline Performance Metrics:")
print(f"Training Data: R² = {train_r2:.2f}%, RMSE = {train_rmse:.4f}")
print(f"Testing Data : R² = {test_r2:.2f}%, RMSE = {test_rmse:.4f}\n")

filename = "model.pkl"
pickle.dump(pipeline, open(filename, "wb"))
print(f"Pipeline saved to {filename}")

# Example random input
sample_data = pd.DataFrame([{
    "Annual_Rainfall": 1200,    
    "Pesticide": 4,             
    "Crop": "Sugarcane",        
    "Season": "Kharif",         
    "State": "Telangana"           
}])

# Predict with pipeline
sample_prediction = pipeline.predict(sample_data)[0]
print(f"Predicted Yield: {sample_prediction:.2f} tons/ha")
