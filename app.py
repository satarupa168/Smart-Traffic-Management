from flask import Flask, jsonify, request
import requests

app = Flask(__name__)

# Overpass API endpoint
OVERPASS_API_URL = "http://overpass-api.de/api/interpreter"


@app.route('/parking', methods=['GET'])
def get_nearby_parking():
    # Get latitude and longitude from query parameters
    latitude = request.args.get('lat')
    longitude = request.args.get('lon')

    if not latitude or not longitude:
        return jsonify({"error": "Please provide both latitude and longitude."}), 400

    # Overpass QL query to find parking areas within 1 km radius
    overpass_query = f"""
    [out:json];
    (
      node["amenity"="parking"](around:1000,{latitude},{longitude});
      way["amenity"="parking"](around:1000,{latitude},{longitude});
      relation["amenity"="parking"](around:1000,{latitude},{longitude});
    );
    out body;
    """

    response = requests.post(OVERPASS_API_URL, data=overpass_query)

    if response.status_code != 200:
        return jsonify({"error": "Error querying Overpass API."}), 500

    data = response.json()

    # Extract relevant information from the response
    parking_slots = []
    for element in data['elements']:
        if 'tags' in element:
            parking_info = {
                "id": element['id'],
                "type": element['type'],
                "lat": element.get('lat', None),
                "lon": element.get('lon', None),
                "name": element['tags'].get('name', 'Unnamed Parking')
            }
            parking_slots.append(parking_info)

    return jsonify(parking_slots)


if __name__ == '__main__':
    app.run(debug=True)
#http://127.0.0.1:5000/find-parking?latitude=51.5074&longitude=-0.1278&radius=1000#
