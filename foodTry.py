import os
import requests
import zipfile
import json
from tqdm import tqdm

API_KEY = "your api"

headers = {
    "Authorization": API_KEY
}

with open("ZippyEats.menuitems.json") as f:
    data = json.load(f)

os.makedirs("food_images", exist_ok=True)

def get_image(query):
    url = f"https://api.pexels.com/v1/search?query={query}&per_page=1"
    res = requests.get(url, headers=headers)

    if res.status_code == 200:
        photos = res.json().get("photos")
        if photos:
            return photos[0]["src"]["medium"]
    return None

paths = []

for item in tqdm(data):
    rid = item["restaurant_id"]
    name = item["name"]
    filename = f"{rid}_{name.replace(' ', '_')}.jpg"
    filepath = os.path.join("food_images", filename)

    img_url = get_image(name + " food")

    if img_url:
        img_data = requests.get(img_url).content
        with open(filepath, "wb") as f:
            f.write(img_data)
        paths.append(filepath)
    else:
        print("❌ Failed:", name)

with zipfile.ZipFile("food_images_real.zip", "w") as z:
    for p in paths:
        z.write(p, os.path.basename(p))

print("✅ DONE")