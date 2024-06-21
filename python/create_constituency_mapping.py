import csv
import json

def csv_to_json(csvFilePath, jsonFilePath):
    jsonObject = {}  # Initialize an empty dictionary

    # Read CSV file
    with open(csvFilePath, encoding='utf-8-sig') as csvf:
        csvReader = csv.DictReader(csvf)  # Load CSV file data using DictReader
        for row in csvReader:
            key = row.pop('new')  # Extract the key (first column)
            if (key not in jsonObject):
                jsonObject[key] = {}
            jsonObject[key][row.pop('old')] = float(row.pop('weight'))

    # Write the dictionary to a JSON file
    with open(jsonFilePath, 'w', encoding='utf-8') as jsonf:
        jsonString = json.dumps(jsonObject, indent=4)
        jsonf.write(jsonString)

# Example usage
csvFilePath = './python/New_constituency_mapping.csv'  # Path to your CSV file
jsonFilePath = 'new_constituency_mapping.json'  # Path where you want to save the JSON file
csv_to_json(csvFilePath, jsonFilePath)

print(f"Conversion completed successfully. JSON file saved at {jsonFilePath}")