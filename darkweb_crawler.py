import os
import hashlib
import requests
from bs4 import BeautifulSoup
from stem import Signal
from stem.control import Controller
import time

TOR_SOCKS_PROXY = 'socks5h://127.0.0.1:9150'
SEEDS_FILE = 'seeds.txt'
OUTPUT_DIR = 'html_pages'
TIMEOUT = 30
HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; DarkWebCrawler/1.0)'}


def renew_tor_ip():
    try:
        with Controller.from_port(port=9051) as controller:
            controller.authenticate()  # Add password if set
            controller.signal(Signal.NEWNYM)
    except Exception as e:
        print(f"[WARN] Could not renew Tor IP: {e}")

def get_filename_from_url(url):
    return hashlib.sha256(url.encode()).hexdigest() + '.html'

def save_html(url, html):
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    filename = get_filename_from_url(url)
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"[SAVED] {url} -> {path}")

from urllib.parse import urljoin, urlparse

def extract_links(html, base_url):
    soup = BeautifulSoup(html, 'html.parser')
    links = set()
    for tag in soup.find_all('a', href=True):
        href = tag['href']
        # Normalize and join relative URLs
        href = urljoin(base_url, href)
        # Only keep .onion links with http/https
        parsed = urlparse(href)
        if parsed.scheme in ('http', 'https') and '.onion' in parsed.netloc:
            # Remove fragments and query params for deduplication
            clean_url = parsed._replace(fragment='', query='').geturl()
            links.add(clean_url)
    return links

def extract_metadata(html):
    soup = BeautifulSoup(html, 'html.parser')
    title = soup.title.string.strip() if soup.title and soup.title.string else ''
    meta_desc = ''
    meta = soup.find('meta', attrs={'name': 'description'})
    if meta and meta.get('content'):
        meta_desc = meta['content'].strip()
    return title, meta_desc

def log_error(url, error):
    with open('error.log', 'a', encoding='utf-8') as f:
        f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')} | {url} | {error}\n")

def crawl_url(url, visited, depth, max_depth, retries=2):
    if url in visited or depth > max_depth:
        return set()
    visited.add(url)
    try:
        print(f"[CRAWL:d{depth}] {url}")
        session = requests.Session()
        session.proxies = {'http': TOR_SOCKS_PROXY, 'https': TOR_SOCKS_PROXY}
        resp = session.get(url, headers=HEADERS, timeout=TIMEOUT)
        if resp.status_code == 200:
            title, meta_desc = extract_metadata(resp.text)
            save_html(url, resp.text)
            # Save metadata
            with open(os.path.join(OUTPUT_DIR, get_filename_from_url(url)+'.meta'), 'w', encoding='utf-8') as f:
                f.write(f"Title: {title}\nDescription: {meta_desc}\nTimestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}\nURL: {url}\n")
            links = extract_links(resp.text, url)
            print(f"[FOUND] {len(links)} links on {url}")
            return links
        else:
            err = f"Status {resp.status_code}"
            print(f"[ERROR] {url} returned {err}")
            log_error(url, err)
    except Exception as e:
        if retries > 0:
            print(f"[RETRY] {url} ({retries} left)")
            time.sleep(3)
            return crawl_url(url, visited, depth, max_depth, retries-1)
        else:
            print(f"[FAIL] {url}: {e}")
            log_error(url, str(e))
    return set()

import random

def main():
    max_depth = 2  # You can make this configurable
    visited = set()
    if not os.path.exists(SEEDS_FILE):
        print(f"[ERROR] Seeds file '{SEEDS_FILE}' not found.")
        return
    with open(SEEDS_FILE, 'r') as f:
        seeds = [line.strip() for line in f if line.strip()]
    queue = [(url, 0) for url in seeds]
    while queue:
        url, depth = queue.pop(0)
        if url in visited or depth > max_depth:
            continue
        links = crawl_url(url, visited, depth, max_depth)
        delay = random.uniform(4, 8)  # Randomized politeness
        time.sleep(delay)
        # Add new links to queue for next depth
        if depth < max_depth:
            for link in links:
                if link not in visited:
                    queue.append((link, depth + 1))

if __name__ == '__main__':
    main()
