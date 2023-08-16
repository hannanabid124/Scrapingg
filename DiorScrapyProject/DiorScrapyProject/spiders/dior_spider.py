import scrapy
import re
import json

class DiorSpider(scrapy.Spider):
    name = 'dior'
    start_urls = ['https://www.dior.com/en_ch']

    def parse(self, response):
        for link in response.css('a::attr(href)'):
            yield response.follow(link, callback=self.parse_category)

    def parse_category(self, response):
        # Parse product details
        for link in response.css('.product-tile a::attr(href)'):
            yield response.follow(link, callback=self.parse_product_details)

        # Extract the JavaScript code containing var dataLayerWithUemail
        data_layer = response.css('script:contains("var dataLayerWithUemail")::text').get()
        if data_layer:
            data_layer_text = re.search(r'var dataLayerWithUemail = (.*?);', data_layer)
            if data_layer_text:
                data_layer = json.loads(data_layer_text.group(1))
                product_info = data_layer.get('ecommerce', {}).get('detail', {}).get('products', [{}])[0]
                if product_info:
                    product_name = product_info.get('name')
                    product_id = product_info.get('id')
                    product_price = product_info.get('price')
                    
                    yield {
                        'URL': response.url,
                        'Product Name': product_name,
                        'Product ID': product_id,
                        'Product Price': product_price,
                    }

        # Follow links to other categories
        for link in response.css('a::attr(href)'):
            yield response.follow(link, callback=self.parse_category)
            
    def parse_product_details(self, response):
                
     product_name = response.css('.products::text').extract_first()
     product_id = response.css('.id::text').extract_first()
                
     title_match = re.search(r'<title>(.*?)</title>', response.body.decode('utf-8'))
     image_url_match = re.search(r'<meta property="og:image" content="(.*?\.jpg)"', response.body.decode('utf-8'))

     title = title_match.group(1) if title_match else 'Other Versions Available'
     image_url = image_url_match.group(1) if image_url_match else None

     yield {
        #'Product Name': product_name,
        #'Product ID': product_id,
        #'URL': response.url,
        'Title': title,
        'Image URL': image_url,
          }