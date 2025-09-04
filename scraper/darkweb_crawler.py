import os
import hashlib
import json
import requests
from bs4 import BeautifulSoup
from stem import Signal
from stem.control import Controller
import time
import random
from urllib.parse import urljoin, urlparse
from datetime import datetime

TOR_SOCKS_PROXY = 'socks5h://127.0.0.1:9150'
DATA_DIR = 'data'
URLS_DIR = os.path.join(DATA_DIR, 'urls')  # Directory for URL-related files
SEEDS_FILE = os.path.join(DATA_DIR, 'seeds.txt')
URL_QUEUE_FILE = os.path.join(URLS_DIR, 'queue.txt')  # URLs to be crawled
VISITED_URLS_FILE = os.path.join(URLS_DIR, 'visited.txt')  # Already visited URLs
DISCOVERED_LINKS_FILE = os.path.join(URLS_DIR, 'discovered.txt')  # All unique links found
OUTPUT_DIR = 'output'  # Directory for scraped content
TIMEOUT = 30
MAX_URLS_PER_RUN = 1000  # Safety limit
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

def ensure_directories():
    """Ensure all required directories exist"""
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(URLS_DIR, exist_ok=True)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

def save_scraped_data(url, title, content, links=None):
    """Save scraped content in a structured format
    
    Args:
        url: The URL being saved
        title: Page title
        content: Main content text
        links: List of links found on the page (optional)
    """
    ensure_directories()
    
    # Create a filename based on URL hash
    filename = hashlib.sha256(url.encode()).hexdigest()
    output_file = os.path.join(OUTPUT_DIR, f"{filename}.json")
    
    # Prepare data with links if provided
    data = {
        'url': url,
        'title': title,
        'timestamp': datetime.utcnow().isoformat(),
        'content': content[:10000],  # Limit content size
        'links': links or []  # Include links in the JSON
    }
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"[DATA SAVED] {os.path.basename(output_file)} with {len(links or [])} links")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to save scraped data: {e}")
        return False

def save_discovered_links(links):
    """Save discovered links to a file, one per line"""
    if not links:
        return 0
        
    ensure_directories()
    
    try:
        # Read existing links to avoid duplicates
        existing_links = set()
        if os.path.exists(DISCOVERED_LINKS_FILE):
            with open(DISCOVERED_LINKS_FILE, 'r', encoding='utf-8') as f:
                existing_links = set(line.strip() for line in f if line.strip())
        
        # Add new links
        new_links = set(links) - existing_links
        if not new_links:
            return 0
            
        # Save all links (existing + new) in sorted order
        all_links = sorted(existing_links.union(links))
        with open(DISCOVERED_LINKS_FILE, 'w', encoding='utf-8') as f:
            f.write('\n'.join(all_links) + '\n')
            
        print(f"[LINKS] Added {len(new_links)} new links to {os.path.basename(DISCOVERED_LINKS_FILE)}")
        return len(new_links)
        
    except Exception as e:
        print(f"[ERROR] Failed to save discovered links: {e}")
        return 0

def save_urls_to_queue(urls):
    """Save newly discovered URLs to the queue file (one per line)"""
    if not urls:
        return 0
        
    os.makedirs(DATA_DIR, exist_ok=True)
    
    try:
        # Read existing URLs
        existing_urls = set()
        if os.path.exists(URL_QUEUE_FILE):
            with open(URL_QUEUE_FILE, 'r', encoding='utf-8') as f:
                existing_urls = set(line.strip() for line in f if line.strip())
        
        # Find new URLs
        new_urls = set(urls) - existing_links
        if not new_urls:
            return 0
            
        # Append new URLs to the queue file
        with open(URL_QUEUE_FILE, 'a', encoding='utf-8') as f:
            for url in sorted(new_urls):
                f.write(f"{url}\n")
                
        print(f"[QUEUE] Added {len(new_urls)} new URLs to queue")
        return len(new_urls)
        
    except Exception as e:
        print(f"[ERROR] Failed to update URL queue: {e}")
        return 0

def load_visited_urls():
    """Load previously visited URLs (one URL per line)"""
    if os.path.exists(VISITED_URLS_FILE):
        try:
            with open(VISITED_URLS_FILE, 'r', encoding='utf-8') as f:
                return set(line.strip() for line in f if line.strip())
        except Exception as e:
            print(f"[WARNING] Could not load visited URLs: {e}")
    return set()

def save_visited_urls(urls):
    """Save visited URLs to file (one URL per line)"""
    if not urls:
        return
        
    os.makedirs(DATA_DIR, exist_ok=True)
    
    try:
        # Read existing URLs to preserve them
        existing_urls = set()
        if os.path.exists(VISITED_URLS_FILE):
            with open(VISITED_URLS_FILE, 'r', encoding='utf-8') as f:
                existing_urls = set(line.strip() for line in f if line.strip())
        
        # Add new URLs
        all_urls = existing_urls.union(urls)
        
        # Write all URLs back to file
        with open(VISITED_URLS_FILE, 'w', encoding='utf-8') as f:
            for url in sorted(all_urls):
                f.write(f"{url}\n")
                
    except Exception as e:
        print(f"[ERROR] Failed to save visited URLs: {e}")

from urllib.parse import urljoin, urlparse

def extract_links(html, base_url):
    """Extract all unique, clean .onion links from HTML"""
    soup = BeautifulSoup(html, 'html.parser')
    links = set()
    
    # Check all elements with href attributes
    for tag in soup.find_all(['a', 'link', 'script', 'img', 'iframe'], href=True):
        process_url(tag['href'], base_url, links)
    
    # Check src attributes
    for tag in soup.find_all(['script', 'img', 'iframe'], src=True):
        process_url(tag['src'], base_url, links)
    
    return links

def process_url(url, base_url, links_set):
    """Process and clean a single URL"""
    try:
        # Normalize and join relative URLs
        url = urljoin(base_url, url)
        parsed = urlparse(url)
        
        # Only keep http/https .onion URLs
        if parsed.scheme in ('http', 'https') and '.onion' in parsed.netloc:
            # Clean the URL
            clean_url = parsed._replace(
                fragment='',
                query='',
                params='',
                path=parsed.path.rstrip('/')
            ).geturl()
            
            # Basic validation
            if len(clean_url) < 50:  # Too short to be a valid .onion URL
                return
                
            links_set.add(clean_url)
    except Exception as e:
        print(f"[WARNING] Error processing URL {url}: {e}")

def extract_content(html, url):
    """Extract and clean main content from HTML"""
    try:
        soup = BeautifulSoup(html, 'html.parser')
        
        # Get title
        title = soup.title.string.strip() if soup.title and soup.title.string else ''
        
        # Get meta description
        meta_desc = ''
        meta = soup.find('meta', attrs={'name': 'description'}) or \
               soup.find('meta', attrs={'property': 'og:description'})
        if meta and meta.get('content'):
            meta_desc = meta['content'].strip()
        
        # Get main content - try to find the main article content
        main_content = ''
        article = soup.find('article') or soup.find('main') or soup.find('div', class_=lambda c: c and ('content' in c or 'main' in c))
        if article:
            # Remove script and style elements
            for script in article(['script', 'style', 'nav', 'footer', 'header']):
                script.decompose()
            main_content = ' '.join(article.stripped_strings)
        else:
            # Fallback to body text if no main content found
            body = soup.find('body')
            if body:
                for script in body(['script', 'style', 'nav', 'footer', 'header']):
                    script.decompose()
                main_content = ' '.join(body.stripped_strings)
        
        return {
            'title': title,
            'meta_description': meta_desc,
            'content': main_content[:50000],  # Limit content size
            'url': url,
            'timestamp': datetime.utcnow().isoformat()
        }
    except Exception as e:
        print(f"[WARNING] Error extracting content from {url}: {e}")
        return {
            'title': '',
            'meta_description': '',
            'content': '',
            'url': url,
            'timestamp': datetime.utcnow().isoformat()
        }

def log_error(url, error):
    with open('error.log', 'a', encoding='utf-8') as f:
        f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')} | {url} | {error}\n")

def extract_main_content(soup, url):
    """Extract main content from the page, excluding navigation and other noise"""
    # Remove script and style elements
    for element in soup(["script", "style", "nav", "header", "footer", "aside", 
                        ".sidebar", ".nav", ".menu", ".footer", ".header", 
                        "iframe", "form", "button", "input", "select", "textarea"]):
        element.decompose()
    
    # Try to find main content areas
    content_areas = []
    
    # Look for common content containers
    selectors = [
        'main', 'article', 'div.content', 'div#content', 'div.main', 
        'div.container', 'div.wrapper', 'section', 'div.post', 'div.entry',
        'div.text', 'div.body', 'div#main', 'div#article'
    ]
    
    for selector in selectors:
        elements = soup.select(selector)
        for element in elements:
            # Only include elements with substantial text content
            text = element.get_text(strip=True)
            if len(text) > 100:  # Minimum 100 characters
                content_areas.append(text)
    
    # If we found content areas, return them joined
    if content_areas:
        return '\n\n'.join(content_areas)
    
    # Fallback: Get text from all paragraphs and list items
    paragraphs = [p.get_text(strip=True) for p in soup.find_all(['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])]
    meaningful_text = '\n'.join(p for p in paragraphs if len(p) > 20)  # Only include substantial paragraphs
    
    if meaningful_text.strip():
        return meaningful_text
    
    # Last resort: Get all text
    return soup.get_text(separator='\n', strip=True)

def is_onion_url(url):
    """Check if URL is a .onion address"""
    from urllib.parse import urlparse
    try:
        netloc = urlparse(url).netloc
        return netloc.endswith('.onion')
    except:
        return False

def extract_onion_url(url):
    """
    Process URL to get final .onion URL
    - If it's an Ahmia.fi redirect, extract the .onion URL
    - If it's already a .onion URL, return as is
    - Otherwise, return None (invalid for crawling)
    """
    # If it's already a .onion URL, return it
    if is_onion_url(url):
        return url
        
    # Handle Ahmia.fi redirects
    if 'ahmia.fi/search/redirect' in url:
        from urllib.parse import parse_qs, urlparse
        try:
            parsed = urlparse(url)
            params = parse_qs(parsed.query)
            if 'redirect_url' in params:
                redirect_url = params['redirect_url'][0]
                if is_onion_url(redirect_url):
                    return redirect_url
                print(f"[WARN] Redirect URL is not a .onion address: {redirect_url}")
        except Exception as e:
            print(f"[WARN] Failed to parse redirect URL {url}: {e}")
    
    return None  # Not a valid .onion URL

def crawl_url(url, visited, current_depth, max_depth):
    """Crawl a single URL and return new links"""
    if url in visited or current_depth > max_depth:
        return set()
    
    # Process URL to get final .onion URL
    original_url = url
    url = extract_onion_url(url)
    
    # If we couldn't extract a valid .onion URL
    if not url:
        print(f"[SKIP] Not a valid .onion URL: {original_url}")
        return set()
        
    # Log if this was a redirect
    if url != original_url:
        print(f"[REDIRECT] Following redirect to: {url}")
    
    print(f"\n[VISITING] {url}")
    
    # Mark both original and resolved URLs as visited
    visited.add(original_url)
    if url != original_url:
        visited.add(url)
    
    try:
        # Set up Tor proxy
        session = requests.Session()
        session.proxies = {
            'http': TOR_SOCKS_PROXY,
            'https': TOR_SOCKS_PROXY
        }
        
        # Disable SSL verification warnings for .onion sites
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
        # Make the request
        response = session.get(url, headers=HEADERS, timeout=TIMEOUT, verify=False)
        response.raise_for_status()
        
        # Parse the HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract title and content
        title = soup.title.string.strip() if soup.title and soup.title.string else 'No title'
        
        # Extract main content with enhanced extraction
        text = extract_main_content(soup, url)
        
        # Extract all links
        links = set()
        for link in soup.find_all('a', href=True):
            href = urljoin(url, link['href'])
            if href.startswith('http') and '.onion' in href and href not in visited:
                links.add(href)
        
        # Save the scraped data with links
        save_scraped_data(url, title, text, list(links))
        
        # Save discovered links to the global discovered file
        if links:
            save_discovered_links(links)
        
        print(f"[FOUND] {len(links)} new links")
        return links
        
    except requests.RequestException as e:
        print(f"[ERROR] Failed to crawl {url}: {e}")
        log_error(url, str(e))
        return set()
    except Exception as e:
        print(f"[ERROR] Unexpected error processing {url}: {e}")
        log_error(url, str(e))
        return set()

import random

def load_url_queue():
    """Load URLs from the queue file"""
    if os.path.exists(URL_QUEUE_FILE):
        try:
            with open(URL_QUEUE_FILE, 'r', encoding='utf-8') as f:
                return list(set(json.load(f)))  # Deduplicate
        except Exception as e:
            print(f"[ERROR] Could not load URL queue: {e}")
    return []

def update_url_queue(queue, new_urls):
    """Update the URL queue with new URLs"""
    # Add new URLs to the queue
    for url in new_urls:
        if url not in queue and url not in load_visited_urls():
            queue.append(url)
    
    # Save the updated queue
    try:
        with open(URL_QUEUE_FILE, 'w', encoding='utf-8') as f:
            json.dump(queue, f)
    except Exception as e:
        print(f"[ERROR] Could not save URL queue: {e}")

def load_url_queue():
    """Load URLs from the queue file (one URL per line)"""
    if os.path.exists(URL_QUEUE_FILE):
        try:
            with open(URL_QUEUE_FILE, 'r', encoding='utf-8') as f:
                return [line.strip() for line in f if line.strip()]
        except Exception as e:
            print(f"[ERROR] Could not load URL queue: {e}")
    return []

def update_url_queue(queue, new_urls):
    """Update the URL queue with new URLs (one URL per line)"""
    if not new_urls:
        return
        
    os.makedirs(DATA_DIR, exist_ok=True)
    
    try:
        # Add new URLs to the queue
        existing_urls = set(queue)
        new_unique_urls = [url for url in new_urls if url not in existing_urls]
        
        if not new_unique_urls:
            return
            
        # Append new URLs to the queue file
        with open(URL_QUEUE_FILE, 'a', encoding='utf-8') as f:
            for url in sorted(new_unique_urls):
                f.write(f"{url}\n")
                
        print(f"[QUEUE] Added {len(new_unique_urls)} new URLs to queue")
        queue.extend(new_unique_urls)
        
    except Exception as e:
        print(f"[ERROR] Failed to update URL queue: {e}")

def load_urls_from_file(file_path):
    """Load URLs from a file, one per line"""
    if not os.path.exists(file_path):
        return []
    with open(file_path, 'r', encoding='utf-8') as f:
        return [line.strip() for line in f if line.strip()]

def main():
    # Ensure all required directories exist
    ensure_directories()
    
    # Create seeds file if it doesn't exist
    if not os.path.exists(SEEDS_FILE):
        with open(SEEDS_FILE, 'w', encoding='utf-8'):
            pass  # Create empty file
        print(f"[INFO] Created empty {SEEDS_FILE}. Please add seed URLs to this file.")
        return
    
    # Load initial state
    visited = load_visited_urls()
    url_queue = load_url_queue()
    
    # If no URLs in queue, load from seeds and discovered
    if not url_queue:
        # First try to load from seeds
        url_queue = load_urls_from_file(SEEDS_FILE)
        seed_count = len(url_queue)
        
        # If no seeds, try discovered links
        if not url_queue:
            discovered_urls = load_urls_from_file(DISCOVERED_LINKS_FILE)
            # Remove already visited URLs
            url_queue = [u for u in discovered_urls if u not in visited]
            print(f"[INFO] Loaded {len(url_queue)} new URLs from discovered links (skipped {len(discovered_urls) - len(url_queue)} already visited)")
        else:
            print(f"[INFO] Loaded {seed_count} seed URLs from {SEEDS_FILE}")
    
    if not url_queue:
        print(f"[ERROR] No new URLs to crawl. Please add URLs to {SEEDS_FILE} or crawl more pages to discover links.")
        return
    
    print(f"[STARTING] {len(url_queue)} URLs in queue, {len(visited)} already visited")
    print(f"[PATHS] Data: {os.path.abspath(DATA_DIR)}")
    print(f"[PATHS] Output: {os.path.abspath(OUTPUT_DIR)}")
    
    # Main crawling loop
    max_depth = 2  # Maximum link depth to follow
    processed = 0
    
    try:
        while url_queue and processed < MAX_URLS_PER_RUN:
            url = url_queue.pop(0)
            
            # Skip if already visited
            if url in visited:
                print(f"[SKIP] Already visited: {url}")
                continue
            
            print(f"\n{'='*80}")
            print(f"[PROCESSING] ({processed+1}/{len(url_queue)}) {url}")
            print(f"{'='*80}")
            
            # Crawl the URL
            new_links = crawl_url(url, visited, 0, max_depth)
            
            # Add new links to queue and save them
            if new_links:
                update_url_queue(url_queue, new_links)
            
            # Save progress
            save_visited_urls(visited)
            
            # Update queue file
            try:
                with open(URL_QUEUE_FILE, 'w', encoding='utf-8') as f:
                    f.write('\n'.join(url_queue) + '\n')
            except Exception as e:
                print(f"[ERROR] Failed to update queue file: {e}")
            
            # Randomized delay between requests
            delay = random.uniform(5, 15)
            print(f"\n[STATUS] Processed: {processed+1}, Remaining: {len(url_queue)}")
            print(f"[WAIT] Waiting {delay:.1f} seconds...")
            time.sleep(delay)
            
            processed += 1
        
        print("\n" + "="*80)
        print(f"[COMPLETE] Crawled {processed} URLs. Total visited: {len(visited)}")
        print(f"[NEXT] Run the script again to continue crawling from the queue")
        
    except KeyboardInterrupt:
        print("\n\n[INTERRUPT] Crawling stopped by user.")
        print(f"[STATUS] Processed {processed} URLs. Saving progress...")
        save_visited_urls(visited)
        with open(URL_QUEUE_FILE, 'w', encoding='utf-8') as f:
            f.write('\n'.join(url_queue) + '\n')
        print("[DONE] Progress saved. You can resume later.")

if __name__ == '__main__':
    main()
