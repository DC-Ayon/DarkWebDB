import os
import re
import json
import csv
import zipfile
import tarfile
import tempfile
import shutil
import subprocess
import sys

# Automatically install missing dependencies
def safe_import(package_name, import_name=None):
    import_name = import_name or package_name
    try:
        return __import__(import_name)
    except ImportError:
        print(f"[!] Installing missing package: {package_name}")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package_name])
        return __import__(import_name)

# Import external modules
pd = safe_import("pandas")
patoolib = safe_import("patoolib")

from typing import List, Dict, Any


class UniversalDataParser:
    def __init__(self) -> None:
        self.results: List[Dict[str, Any]] = []

    def is_supported_file(self, file_path: str) -> bool:
        supported_extensions = [".csv", ".xlsx", ".xls", ".json", ".txt"]
        return any(file_path.lower().endswith(ext) for ext in supported_extensions)

    def is_archive(self, file_path: str) -> bool:
        archive_exts = [".zip", ".tar", ".tar.gz", ".tgz", ".rar", ".7z"]
        return any(file_path.lower().endswith(ext) for ext in archive_exts)

    def extract_archive(self, file_path: str) -> str:
        temp_dir = tempfile.mkdtemp()
        try:
            if file_path.lower().endswith(".zip"):
                with zipfile.ZipFile(file_path, 'r') as zip_ref:
                    zip_ref.extractall(temp_dir)
            elif file_path.lower().endswith(('.tar', '.tar.gz', '.tgz')):
                with tarfile.open(file_path, 'r:*') as tar_ref:
                    tar_ref.extractall(temp_dir)
            else:
                patoolib.extract_archive(file_path, outdir=temp_dir, verbosity=-1)
        except Exception as e:
            print(f"[✗] Failed to extract archive {file_path}: {e}")
            shutil.rmtree(temp_dir)
            return None
        return temp_dir

    def try_encodings(self, file_path, encodings=["utf-8", "latin1", "windows-1252", "ISO-8859-1"]) -> str:
        for enc in encodings:
            try:
                with open(file_path, "r", encoding=enc, errors='strict') as f:
                    return f.read()
            except UnicodeDecodeError:
                continue
        print(f"[✗] Could not decode {file_path} with known encodings.")
        return None

    def parse_text(self, content: str) -> List[Dict[str, Any]]:
        matches = re.findall(r'{[^}]*}', content, re.DOTALL)
        data = []
        for match in matches:
            try:
                json_str = '{' + match.strip().strip('{}') + '}'
                obj = json.loads(json_str)
                data.append(obj)
            except Exception:
                continue
        return data

    def parse_file(self, file_path: str) -> List[Dict[str, Any]]:
        try:
            if file_path.lower().endswith(".csv"):
                return pd.read_csv(file_path, encoding='utf-8', errors='ignore').to_dict(orient="records")
            elif file_path.lower().endswith((".xlsx", ".xls")):
                df = pd.read_excel(file_path)
                return df.to_dict(orient="records")
            elif file_path.lower().endswith(".json"):
                with open(file_path, "r", encoding='utf-8', errors='ignore') as f:
                    return json.load(f)
            elif file_path.lower().endswith(".txt"):
                content = self.try_encodings(file_path)
                return self.parse_text(content) if content else []
        except Exception as e:
            print(f"[✗] Failed to parse {file_path}: {e}")
            return []

        return []

    def _parse_entry(self, file_path: str) -> None:
        if self.is_archive(file_path):
            extracted_path = self.extract_archive(file_path)
            if extracted_path:
                self.parse_directory(extracted_path)
                shutil.rmtree(extracted_path)
        elif self.is_supported_file(file_path):
            parsed = self.parse_file(file_path)
            if parsed:
                self.results.append({
                    "filename": os.path.basename(file_path),
                    "parsed": parsed
                })

    def parse_directory(self, path: str) -> None:
        for root, _, files in os.walk(path):
            for file in files:
                full_path = os.path.join(root, file)
                self._parse_entry(full_path)

    def parse(self, paths: List[str]) -> None:
        for path in paths:
            if os.path.isdir(path):
                self.parse_directory(path)
            elif os.path.isfile(path):
                self._parse_entry(path)

    def export_to_json(self, output_path: str) -> None:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python advanced_data_parser.py <directory_path>")
        sys.exit(1)

    target_path = sys.argv[1]
    parser = UniversalDataParser()
    print(f"[...] Scanning: {target_path}")
    parser.parse([target_path])
    parser.export_to_json("parsed_output.json")
    print("[✓] Parsing complete. Output saved to parsed_output.json")
