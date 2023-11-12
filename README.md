# pcapview

## Description

**pcapview** is a pcap file uploader, analyzer, and visualizer. You'll need a capture file, a format used by [libpcap](http://www.tcpdump.org/) and network packet analyzers such as [Wireshark](https://www.wireshark.org/) or [tcpdump](http://www.tcpdump.org/). Drag the pcap file to the page, and the file will be timestamped and uploaded to the folder the application is running in. The visualization will appear, showing all IP conversations over time, with packet activity appearing as points on a line. Application protocols are represented by color, and hovering over a conversation reveals the source and destination IP addresses of the first packet sent between them in the capture file. To toggle a permanent display of the IP addresses, click Show/Hide IPs.

## Requirements

* Python 3 on Mac/Linux (untested on Windows)
* Python Packages: Flask and its dependencies
  * `pip install -r requirements.txt`
* Mac/Linux Packages: TShark (Wireshark)
  * `brew install tshark # mac`
  * `apt install tshark # linux`
* PCAPs
  * example pcaps provided in the test folder
  * to create your own, use tshark: `tshark -w out.pcap`
  * download from the web, but be careful; example pcaps are from [here](http://www.malware-traffic-analysis.net/)

## Run

* To start the application listening on port 5000:
  * `python pcapview.py`

## Screenshots

![screenshot](doc/pcapview1.png?raw=true 'Screenshot 1')
![screenshot](doc/pcapview2.png?raw=true 'Screenshot 2')
![screenshot](doc/pcapview3.png?raw=true 'Screenshot 3')
