#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import subprocess
import time
import json

from flask import Flask, render_template, request, abort
from werkzeug import secure_filename

PROTOCOLS = {'80': 'HTTP',
             '443': 'HTTPS',
             '53': 'DNS'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = '.'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/ajax', methods=['POST'])
def ajax():
    file = request.files['file']
    if file:
        # add timestamp to escaped file name
        pcap_file = str(int(time.time())) + secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], pcap_file))
    else:
        abort(500)

    tshark_output = subprocess.getoutput('tshark -z conv,ip -r {}'.format(pcap_file))
    tshark_lines = [l.strip() for l in tshark_output.split('\n')]
    packets = []
    conversations = []
    # the tshark expected output is lines of packet info, then some lines with headers and whitespace, then lines of conversations, then a footer
    # this algorithm assumes the above structure
    parsing_packets = True
    parsing_convos = False
    for i, line in enumerate(tshark_lines):
        if parsing_packets:
            # parse packet
            p = line.split()
            del p[4:6]
            del p[2]
            packets.append(Packet(*p))
            # check next line to see if we've reached the end of the packets
            try:
                int(tshark_lines[i + 1][0])
            except ValueError:
                parsing_packets = False
        elif parsing_convos:
            # parse conversation
            c = line.split()
            del c[3:9]
            del c[1]
            conversations.append(Conversation((c[0], c[1]), c[2], c[3]))
            # check next line to see if we've reached the end of the conversations
            try:
                int(tshark_lines[i + 1][0])
            except ValueError:
                parsing_convos = False
                break
        else:
            # check next line to see if we've reached the beginning of the conversations
            # IndexError indicates we're finished with all the lines
            try:
                int(tshark_lines[i + 1][0])
                parsing_convos = True
                k = 0
            except ValueError:
                pass
            except IndexError:
                break
    print(conversations)
    response = []
    for c in conversations:
        c_packets = [p for p in packets if (p.src_ip in c.ip_pair) and (p.dst_ip in c.ip_pair)]
        c_packets.sort(key=lambda x: float(x.rel_start))
        c.proto = PROTOCOLS.get(c_packets[0].dst_port, c_packets[0].dst_port)
        c.src_ip = c_packets[0].src_ip
        c.dst_ip = c_packets[0].dst_ip
        data_point =  {'src_ip': c.src_ip,
                       'dst_ip': c.dst_ip,
                       'proto': c.proto,
                       'duration': c.duration,
                       'rel_start': c.rel_start}
        response.append(data_point)
    response.sort(key=lambda x: float(x['rel_start']))
    return json.dumps(response)

class Packet():
    def __init__(self, rel_start, src_ip, dst_ip, src_port, dst_port):
        self.rel_start = rel_start
        self.src_ip = src_ip
        self.dst_ip = dst_ip
        self.src_port = src_port
        self.dst_port = dst_port
    def __repr__(self):
        return '<Packet {}:{} to {}:{}>'.format(self.src_ip, self.src_port, self.dst_ip, self.dst_port)

class Conversation():
    def __init__(self, ip_pair, rel_start, duration, proto='unknown', src_ip='unknown', dst_ip='unknown'):
        self.ip_pair = ip_pair
        self.rel_start = rel_start
        self.duration = duration
        self.proto = proto
        self.src_ip = src_ip
        self.dst_ip = dst_ip
    def __repr__(self):
        return '<Conversation {} <-> {}>'.format(self.ip_pair[0], self.ip_pair[1])



if __name__ == '__main__':
    # app.run()
    app.run(host='0.0.0.0', debug=True)




# sort by time using tshark, read in line by line


# by source address

#  tshark -T fields -e ip.src -r somefile.pcap
# by dest address

#  tshark -T fields -e ip.dst -r somefile.pcap
# pipe either of those to | sort | uniq -c | sort -n | tail -50

# you can get the top src/dst pairs with

# tshark -T fields -e ip.src -e ip.dst -r somefile.pcap
# To get a list of fields you can work with

# tshark -G fields
# (warning, wireshark has an overwhelming list of fields)