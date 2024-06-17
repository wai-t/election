import re
import pandas
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

df = pandas.read_csv("constituencies_all.csv")
# print(df["Country name"].value_counts())
# df = df[df["Country name"] == "England"]
# print (df)
# columns = df.columns.difference(['Constituency name', 'Country name', 'Constituency type',
#        'Member first name', 'Member surname', 'Result', 'First party',
#        'Second party', 'Electorate', 'Valid votes', 'Invalid votes',
#        'Majority', 
#        'Of which other winner', 'Unnamed: 26'])

# print(columns)

parties = ["CON", "LAB", "LD", "REF", "GRN", "SNP", "PC", "DUP", "SF", "SDLP", "UUP", "APNI"]
# print("parties")
# df[parties].fillna(0, inplace=True)
df["sum"] = df[parties].sum(axis=1)
pct_columns = [(p+"_pct") for p in parties]
# print(pct_columns)
df[pct_columns] = df[parties].div(df["sum"], axis=0)
parties.append("sum")
# print(df[parties + pct_columns])

for pct_col in pct_columns:
    list = []
    sum = 0
    num = 0
    for val in df[pct_col]:
        if val>0:
            list.append(val)
            sum = sum + val
            num += 1
    # print(pct_col)
    # print(list)
    avg = sum / num
    scale_col = pct_col+"_scaled"
    df[scale_col] = df[pct_col].div(avg, axis=0)
    # print(df[scale_col])
df.round(decimals=4)
df.to_csv("scaled.csv")
df.to_json("../public/scaled.json",orient="records",)

sum_df = df[parties].sum(axis=0)
sum_pct_df = sum_df.div(sum_df["sum"])
sum_df.to_json("last_election_summary.json")
sum_pct_df.to_json("last_election_pct.json")

exit()


crop_df = df[columns].fillna(0)

# filtered_df = df[df["Country name"] == "England"]
# print(filtered_df)

scaler = StandardScaler()
scaled_df = scaler.fit_transform(crop_df[columns])

print(scaled_df[:,:])

pca = PCA(n_components=3)

pcomp = pca.fit_transform(scaled_df)

print( pca.components_)

print( pca.explained_variance_)