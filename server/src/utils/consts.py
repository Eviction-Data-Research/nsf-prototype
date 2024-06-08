REQUIRED_COLS = [
    'fileDate',
    'caseID',
    'plaintiff',
    'plaintiffAddress',
    'plaintiffCity',
    'defendantAddress1',
    'defendantCity1',
]

MAX_BATCH_SIZE = 5000

GEOCODING_API_URL = 'https://geocoding.geo.census.gov/geocoder/locations/addressbatch'

PROXIMITY_RADIUS = 160
