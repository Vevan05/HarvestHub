import numpy as np
import pandas as pd

df = pd.read_csv('yield.csv')

dict = {}

for i in df['Crop']:
    dict[i] = 0

arr = []
for i in dict:
    arr.append(i)

print(arr)