import json
import pandas as pd
import os
import argparse
from datetime import datetime

def load_data(file_path):
    data = []
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                data.append(json.loads(line))
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON: {e}")
    return data

def popular_products(data):
    df = pd.DataFrame(data)
    product_counts = df.groupby('product_id').size().reset_index(name='count')
    return product_counts.sort_values(by='count', ascending=False)

def rated_products(data):
    df = pd.DataFrame(data)
    df['weighted_rating'] = df['rating'] * df['weight']
    avg_ratings = df.groupby('product_id')['weighted_rating'].sum() / df.groupby('product_id')['weight'].sum()
    return avg_ratings.reset_index(name='average_rating').sort_values(by='average_rating', ascending=False)

def popular_products_period(data, start_date, end_date):
    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['date'])
    filtered_data = df[(df['date'] >= start_date) & (df['date'] <= end_date)]
    return popular_products(filtered_data)

def search_product(data, search_term):
    df = pd.DataFrame(data)
    return df[df['review_text'].str.contains(search_term, case=False)]

def save_to_csv(data, filename):
    data.to_csv(filename, index=False)

def main(file_path, start_date=None, end_date=None, search_term=None):
    data = load_data(file_path)
    
    # Получаем результаты
    popular = popular_products(data)
    rated = rated_products(data)
    
    if start_date and end_date:
        popular_period = popular_products_period(data, pd.to_datetime(start_date), pd.to_datetime(end_date))
        save_to_csv(popular_period, 'popular_products_period.csv')
    
    if search_term:
        search_results = search_product(data, search_term)
        save_to_csv(search_results, 'search_results.csv')
    
    # Сохраняем популярные и рейтинговые товары
    save_to_csv(popular, 'popular_products.csv')
    save_to_csv(rated, 'rated_products.csv')

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Amazon product review parser.')
    parser.add_argument('file_path', type=str, help='Path to the JSON file')
    parser.add_argument('--start_date', type=str, help='Start date for popularity period (YYYY-MM-DD)')
    parser.add_argument('--end_date', type=str, help='End date for popularity period (YYYY-MM-DD)')
    parser.add_argument('--search_term', type=str, help='Search term for product reviews')
    args = parser.parse_args()
    main(args.file_path, args.start_date, args.end_date, args.search_term)
