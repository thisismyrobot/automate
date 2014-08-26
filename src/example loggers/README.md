# Example loggers

Files in here are examples of ways to grab data from the real world and push
it into Linux's Syslog so automate can display it.

Each of these files is generally standalone, will have some comments in the
header, is Linux-only and can be ran via:

    python [filename]

My current implementation simply adds calls like the above to crontab.

Each file will add "automate-data" entries to the Linux Syslog, in the
following format:

    [epoc seconds],[sensor unique id],[sensor value]
