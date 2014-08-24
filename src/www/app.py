"""

The flask webapp.

"""
import ConfigParser
import itertools
import os
import StringIO
import time

import flask
from flask import Flask
from flask import render_template


app = Flask(__name__)
SYSLOG_FILE = '/var/log/messages'
SYSLOG_FILTER = 'automate-data'
CONFIG_FILE = '../sensors.ini'


def getdata():
    """ Returns all the syslog data.
    """
    with open(SYSLOG_FILE, 'r') as log_f:
        lines = filter(lambda line: len(line) >= 6,
                       map(str.split, log_f.read().split('\n')))

    return filter(lambda line: (line[4] == '{}:'.format(SYSLOG_FILTER) and
                                len(line[5].split(',')) == 3), lines)


@app.route('/')
def home():
    """ The static (for now) homepage.
    """
    return render_template('index.html')


@app.route('/current')
def current():
    """ Returns the current (latest known) value for each sensor.
    """
    data = {}
    for epoch,sensor,value in map(lambda line: line[5].split(','), getdata()):
        data[sensor] = value
    return flask.jsonify(current=data)


@app.route('/history/<sensorid>')
def history(sensorid):
    """ Returns historical data.

        From the syslog file, for a sensor.
    """
    data = []

    for epoch,sensor,value in map(lambda line: line[5].split(','), getdata()):
        if sensor.strip() != sensorid.strip():
            continue
        data.append((int(epoch), float(value)))

    return flask.jsonify(history=data)


@app.route('/sensors')
def sensors():
    """ Returns the info about the sensors.
    """
    data = {}

    with open(CONFIG_FILE, 'r') as f:
        cp = ConfigParser.ConfigParser()
        cp.readfp(StringIO.StringIO(f.read()))
        for sensor in cp.sections():
            data[sensor] = {
                'id': cp.get(sensor, 'Id'),
                'x': cp.getfloat(sensor, 'x'),
                'y': cp.getfloat(sensor, 'y'),
                'z': cp.getfloat(sensor, 'z'),
            }

    return flask.jsonify(sensors=data)


if __name__ == '__main__':
    app.debug = True
    app.run(host='0.0.0.0', port=5002)
