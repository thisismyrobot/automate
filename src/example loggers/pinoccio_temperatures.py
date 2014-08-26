"""

Pushes all the connected pinoccio (https://pinocc.io/) temperatures to syslog.

You need to call this with the first argument as the API key - eg:

    python pinoccio_temperatures.py asodjiq34jua98wdua9sfdu

This script does require you to have installed Python Requests:
http://docs.python-requests.org/en/latest/

This needs to be called every 5 minutes to stop API abuse errors, and this
allows the scouts to sleep to conserver power.

"""
import requests
import sys
import time

api_key = sys.argv[-1]

# Get all your troups
troups = requests.get(
    'https://api.pinocc.io/v1/troops?token={}'.format(api_key)).json()['data']

# For each troup
for troup in troups:
    # Get all the scouts
    scouts = requests.get(
        'https://api.pinocc.io/v1/{}/scouts?token={}'.format(
            troup['id'], api_key)).json()['data']

    # For each scout
    for scout in scouts:
        # Get the temperature
        temperature = requests.post(
            'https://api.pinocc.io/v1/{}/{}/command?token={}'.format(
                troup['id'], scout['id'], api_key),
                {
                    'command': 'print temperature.c',
                }).json()['data']['reply']

        # Put the scout back to sleep for 5 minutes
        requests.post(
            'https://api.pinocc.io/v1/{}/{}/command?token={}'.format(
                troup['id'], scout['id'], api_key),
                {
                    'command': 'power.sleep(300000)',
                })

        try:
            data = int(time.time()), 'pinoccio-{}-{}-temperature'.format(
                troup['name'].lower(), scout['name'].lower()), int(temperature)
            print ','.join(data)
        except:
            pass
