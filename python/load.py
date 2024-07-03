import re
import pandas
from sklearn.decomposition import PCA
from sklearn.preprocessing import normalize

with open("./polls.html") as file:
    poll = file.read()

parties = ["CON", "LAB", "LD", "SNP", "REF", "PC", "GRN"]

# reg = re.compile(r"<th class=\"table-header__container--row row-header-sticky\" scope=\"row\">", re.DOTALL)

# finds = re.findall(r"(<th class=\"table-header__container--row row-header-sticky\" scope=\"row\">)|(<td class=\"table-body__score \w*\">\s*\d*\s*</td>)", poll, re.DOTALL)
finds = re.findall(r"(<th class=\"table-header__container--row row-header-sticky.*?</th>)"
                   r"|(<td class=\"table-body__score (.*?)\">(.*?)</td>)", poll, re.DOTALL)

with open("output.csv","w") as output:
    pheaders = ",".join(parties)
    output.write("Date,Poll,Sample_size,Funded," + pheaders +"\n")
    started = False
    for find in finds:
        if find[0]:
            if started:
                if len(poll_data) < 5:
                    poll_data.append(("","","","",""))
                output.write(poll_data[1][1]+", " + poll_data[2][2] + "," +  poll_data[3][3].replace(",", "") + ", " + poll_data[4][4].replace(",", ";") + "," + ",".join(counts) + "\n")
            started = True
            poll_data = re.findall(r"(?:<span class=\"off-screen\">(.*?)</span>)"
                                r"|(?:<span class=\"table-header__date\".*?>(.*?)</span>)"
                                r"|(?:<span class=\"table-header__firm\".*?>(.*?)</span>)"
                                r"|(?:<span class=\"table-header__sample\".*?>(.*?)<(?:/|s))"
                                r"|(?:class=\"table-header__client\".*?>(.*?)</span>)",
                                    find[0], re.DOTALL)
            # print(poll_data)
            counts = ["0","0","0","0","0","0","0"]
        else:
            print("=========>",find)
            try:
                index = parties.index(find[2])
                print("party=", find[2],", index=",index)
                try:
                    counts[index] = str(int(find[3])).replace("NaN","0")
                except ValueError as e:
                    print("Value error", find[3])
            except ValueError as e:
                print("Error, party not found ", find[2])

    output.write(poll_data[1][1]+", " + poll_data[2][2] + "," +  poll_data[3][3].replace(",", "") + ", " + poll_data[4][4].replace(",", ";") + "," + ",".join(counts) + "\n")

df = pandas.read_csv("output.csv")

columns = df.columns.difference(['Date', 'Poll', 'Sample_size', 'Funded'])

print(columns)

latest = df[columns].head(15).mean()

latest.to_csv("latest.csv")
latest.to_json("latest.json")

# df_norm = normalize(df[columns], axis=1, norm="l1")

pca = PCA(n_components=3)

pcomp = pca.fit_transform(df[columns])

print( pca.components_)

print( pca.explained_variance_)

pca_output = pandas.DataFrame(data = pca.components_, columns=columns)
pca_output.to_csv("polls_pca.csv")
pca_output.to_json("polls_pca.json", orient="records")

pca_variance = pandas.DataFrame(data = pca.explained_variance_, columns=["variance"])
pca_variance.to_csv("polls_variance.csv",)
pca_variance.to_json("polls_variance.json",)

# pca_output.to_csv("pca.csv")