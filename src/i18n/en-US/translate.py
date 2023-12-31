import os
import json
from googletrans import Translator

def translate_json_values(json_data, translator, target_language='ru'):
    translated_json = json_data.copy()

    for key, value in json_data.items():
        if isinstance(value, str):
            translation = translator.translate(value, dest=target_language)
            translated_json[key] = translation.text
        elif isinstance(value, dict):
            translated_json[key] = translate_json_values(value, translator, target_language)

    return translated_json

def translate_json_file(input_file, output_file, target_language='ru'):
    # Load JSON from input file
    with open(input_file, 'r', encoding='utf-8') as file:
        json_data = json.load(file)

    # Initialize translator
    translator = Translator()

    # Translate JSON values
    translated_json = translate_json_values(json_data, translator, target_language)

    # Write translated JSON to output file
    with open(output_file, 'w', encoding='utf-8') as file:
        json.dump(translated_json, file, indent=2, ensure_ascii=False)

# Replace 'input.json' and 'output_ru.json' with your file names

path = os.path.join('../', 'ru')
os.mkdir(path)

translate_json_file('localization.json', '../ru/localization.json')
translate_json_file('categories.json', '../ru/categories.json')
