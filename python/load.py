import re

with open("C:\\Users\\wai\\OneDrive\\Library\\election\\polls.txt") as file:
    poll = file.read()

parties = ["CON", "LAB", "LD", "SNP", "REF", "PC", "GRN"]

# reg = re.compile(r"<th class=\"table-header__container--row row-header-sticky\" scope=\"row\">", re.DOTALL)

# finds = re.findall(r"(<th class=\"table-header__container--row row-header-sticky\" scope=\"row\">)|(<td class=\"table-body__score \w*\">\s*\d*\s*</td>)", poll, re.DOTALL)
finds = re.findall(r"(<th class=\"table-header__container--row row-header-sticky.*?</th>)"
                   r"|(<td class=\"table-body__score (.*?)\">\s*(\d*)\s*?</td>\n)", poll, re.DOTALL)

with open("output.csv","w") as output:
    output.write("")
    for find in finds:
        if find[0]:
            poll_data = re.findall(r"(?:<span class=\"off-screen\">(.*?)</span>)"
                                r"|(?:<span class=\"table-header__date\".*?>(.*?)</span>)"
                                r"|(?:<span class=\"table-header__firm\".*?>(.*?)</span>)"
                                r"|(?:<span class=\"table-header__sample\".*?>([\d,]*).*?</span>)"
                                r"|(?:<span class=\"table-header__client\".*?>(.*?)</span>)",
                                    find[0], re.DOTALL)
            print(poll_data)
            counts = [0,0,0,0,0,0,0]
        else:
            print(find)
            try:
                index = parties.index(find[2])
                counts[index] = int(find[3])
            except ValueError as e:
                print("Error, party not found ", find[2])

