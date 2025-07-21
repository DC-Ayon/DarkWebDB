import os
import json
import csv
import magic 
import pandas as pd
import tkinter as tk
from tkinter import filedialog
import subprocess
import shutil
import tempfile

SEVEN_ZIP_PATH = r"C:\7-Zip\7z.exe"  # Your 7-Zip path

def extract_archive(archive_path, extract_to):
    try:
        subprocess.run([SEVEN_ZIP_PATH, 'x', archive_path, f'-o{extract_to}', '-y'], check=True)
        print(f"[+] Extracted: {archive_path}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[-] Extraction failed: {archive_path} - {e}")
        return False

def detect_and_extract_text(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    try:
        if ext in ['.txt', '.anom']:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        elif ext == '.csv':
            df = pd.read_csv(file_path)
            return df.to_json(orient="records")
        elif ext in ['.xls', '.xlsx']:
            df = pd.read_excel(file_path)
            return df.to_json(orient="records")
        elif ext == '.json':
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return json.dumps(data, indent=2)
        else:
            return f"[!] Unsupported file: {file_path}"
    except Exception as e:
        return f"[!] Failed to read {file_path}: {str(e)}"

def process_selected_file(file_path):
    extracted = []
    output_dir = tempfile.mkdtemp()
    
    file_type = magic.from_file(file_path, mime=True)
    print(f"[i] Detected MIME type: {file_type}")

    ext = os.path.splitext(file_path)[1].lower()
    
    if ext in ['.rar', '.zip', '.7z', '.001']:
        print("[*] Trying to extract...")
        if extract_archive(file_path, output_dir):
            for root, _, files in os.walk(output_dir):
                for name in files:
                    full_path = os.path.join(root, name)
                    text = detect_and_extract_text(full_path)
                    extracted.append({
                        "source_file": full_path,
                        "content": text
                    })
    else:
        print("[*] Processing directly...")
        text = detect_and_extract_text(file_path)
        extracted.append({
            "source_file": file_path,
            "content": text
        })

    #JSON O/P
    with open("output.json", "w", encoding='utf-8') as f:
        json.dump(extracted, f, indent=2, ensure_ascii=False)
    print(f"[+] Parsed content saved to output.json")

def choose_file():
    root = tk.Tk()
    root.withdraw()
    file_path = filedialog.askopenfilename(title="Choose a file to process")
    return file_path

if __name__ == "__main__":
    print("[*] Select a file to process...")
    selected = choose_file()
    if selected:
        process_selected_file(selected)
    else:
        print("[-] No file selected. Exiting.")
