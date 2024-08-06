from flask import Flask, request, send_file
from flask_cors import CORS
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from bs4 import BeautifulSoup
import re
import time
import os

app = Flask(__name__)
CORS(app)  # Allows Cross-Origin requests

# Configure Selenium WebDriver (ensure chromedriver is in your PATH or provide path)
chrome_options = Options()
chrome_options.add_argument("--headless")  # Run headless Chrome
service = Service('D:\hostup\email_scrapper\email_digger\chromedriver.exe')  # Update with your path to chromedriver

driver = webdriver.Chrome(service=service, options=chrome_options)

# Function to extract emails using a regex pattern
def extract_emails(text):
    email_regex = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    return re.findall(email_regex, text)

# Function to scrape emails from a given URL
def scrape_website(url):
    emails = set()
    driver.get(url)
    time.sleep(5)  # Wait for the page to load (adjust as necessary)

    # Scrape emails from multiple pages
    for _ in range(5):  # Adjust the number of pages as needed
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        emails.update(extract_emails(soup.get_text()))
        
        # Find and click the "Next" button
        try:
            next_button = driver.find_element(By.XPATH, "//a[@id='pnnext']")
            next_button.click()
            time.sleep(5)  # Wait for the next page to load
        except Exception:
            break  # Exit if there's no next page or another issue

    return list(emails)

@app.route('/extract-emails', methods=['POST'])
def extract_emails_route():
    if 'file' not in request.files:
        return 'No file part', 400
    
    file = request.files['file']
    if file.filename == '':
        return 'No selected file', 400
    
    if file:
        file.save('companies_domains.xlsx')
        
        # Read the list of companies and domains from the Excel file
        df = pd.read_excel('companies_domains.xlsx')

        # Define search queries
        search_queries = [
            "{company} contact email",
            "{company} support email",
            "{company} info email",
            "{company} site:{domain}"
        ]

        extracted_emails = []

        # Loop through each company/domain and fetch emails
        for index, row in df.iterrows():
            company = row['Company']
            domain = row['Domain']
            
            all_emails = set()
            for query in search_queries:
                search_url = f"https://www.google.com/search?q={query.format(company=company, domain=domain)}"
                try:
                    emails = scrape_website(search_url)
                    all_emails.update(emails)
                except Exception as e:
                    print(f"Error extracting emails for {company} with query '{query}': {e}")

            extracted_emails.append({'Company': company, 'Domain': domain, 'Emails': list(all_emails)})

        results_df = pd.DataFrame(extracted_emails)
        results_df.to_excel('extracted_emails.xlsx', index=False)
        
        # Clean up
        driver.quit()
        
        return send_file('extracted_emails.xlsx', as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
