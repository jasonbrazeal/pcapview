# pcapview

## Description

**pcapview** is a pcap file uploader, analyzer, and visualizer. You'll need a capture file, a format used by [libpcap](http://www.tcpdump.org/) and network packet analyzers such as [Wireshark](https://www.wireshark.org/) or [tcpdump](http://www.tcpdump.org/). Drag the pcap file to the page, and the file will be timestamped and uploaded to the folder the application is running in. The visualization will appear, showing all IP conversations over time, with packet activity appearing as points on a line. Application protocols are represented by color, and hovering over a conversation reveals the source and destination IP addresses of the first packet sent between them in the capture file.

## Requirements

* Python 3 on Linux
  * tested with Python 3.4.3 on Ubuntu 14.04.3
* Python Packages: flask (0.10.1) and its dependencies
    * `pip install -r requirements.txt`

## Run

* `python pcapview.py`