"""

1-Wire Maxim temperature logger.

Hat-tip to https://learn.adafruit.com/adafruits-raspberry-pi-lesson-11-ds18b20
-temperature-sensing?view=all for some basic direction here.

This will only work on a Raspberry Pi with one or more Maxim 1-Wire
temperature sensors installed as shown above.

"""
import glob
import itertools
import os
import syslog
import time


SYSLOG_IDENT = 'automate-data'
SYSLOG_FMT = '{},{},{}'


def temperature(w1_slave_path):
    """ Returns the temperature from a w1_slave file path, None otherwise.
    """
    try:
        with open(w1_slave_path, 'r') as w1_f:
            sum, temp = w1_f.read().split(os.linesep)[:2]
        if not sum.endswith('YES'):
            return
        return float(temp.split('=')[1]) / 1000
    except:
        pass


def cmdline():
    """ Logs all the temperature readings.
    """
    # Detect the sensors
    sensors = glob.glob('/sys/bus/w1/devices/*/w1_slave')

    # Create an iterator of (epoch, serial, temperature) tuples
    data = filter(lambda item: item[2] is not None,
                  itertools.izip(
                      [int(time.time())] * len(sensors),
                      map(lambda path: path.split('/')[-2], sensors),
                      map(temperature, sensors)
                  )
    )

    # Log the temperatures to syslog
    syslog.openlog(SYSLOG_IDENT)
    map(lambda item: syslog.syslog(SYSLOG_FMT.format(*item)), data)


if __name__ == '__main__':
    cmdline()
