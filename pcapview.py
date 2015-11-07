#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import subprocess
import time
from datetime import datetime
import json
from itertools import combinations

from flask import Flask, render_template, request, abort
from werkzeug import secure_filename

PROTOCOLS = {22: 'SSH',
             53: 'DNS',
             80: 'HTTP',
             443: 'HTTPS'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = '.'

@app.route('/')
def index():
    return render_template('index.html')

def get_conversation(p, conversations):
    for c in conversations:
        # if packet ip pair matches conversation ip pair
        if (sorted([p.src_ip, p.dst_ip]) == sorted([c.src_ip, c.dst_ip])
        # and packet protocol matches conversation protocol (either src or dst port)
        and (PROTOCOLS.get(p.src_port, None) == c.proto or PROTOCOLS.get(p.dst_port, None) == c.proto)):
        # but protocol is only significant for the first packet, the dst_port
            return c
    return None

@app.route('/ajax', methods=['POST'])
def ajax():

    # handle file upload
    file = request.files['file']
    if file:
        # add timestamp to escaped file name
        pcap_file = str(int(time.time())) + secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], pcap_file))
    else:
        abort(500)

    # process file with tshark command and parse output into a list of packets
    tshark_output = subprocess.getoutput('tshark -o column.format:"AbsTime","%Yt","Source IP Address","%us","Source Port","%uS","Destination IP Address","%ud","Destination Port","%uD" -r {}'.format(pcap_file))
    tshark_lines = [l.strip() for l in tshark_output.split('\n')]
    packets = []
    for line in tshark_lines:
        p = line.split()
        dt = datetime.strptime(p[0] + p[1].rstrip('0'), '%Y-%m-%d%H:%M:%S.%f')
        del p[:2]
        p.append(dt)
        # if we get a packet line with incomplete data, ignore it
        if len(p) != 5:
            continue
        packets.append(Packet(*p))

    # get a list of conversations
    conversations = []
    conv_ctr = 0

    packets.sort(key=lambda x: x.time)
    for p in packets:
        # going through time
        c = get_conversation(p, conversations)
        if not c:
            # try to recognize protocol from destination port first
            # if unknown, then try to recognize it from source port
            # (e.g. if the capture started in the middle of a conversation)
            # if neither port is recognized, mark protocol as 'unknown'
            protocol = PROTOCOLS.get(p.dst_port, PROTOCOLS.get(p.src_port, 'unknown'))
            c = Conversation(conv_id=conv_ctr, src_ip=p.src_ip, dst_ip=p.dst_ip, proto=protocol)
            conversations.append(c)
            conv_ctr += 1
        c.packets.append(p)

    # prepare data for processing in d3
    data_list = []
    conv_dict = {}
    for c in conversations:
        print(str(c) + ' - ' + str(len(c.packets)))
        for p in c.packets:
            data_list.append((str(p.time), c.conv_id))

        conv_dict.update({c.conv_id: {'src_ip': c.src_ip,
                                      'dst_ip': c.dst_ip,
                                      'proto': c.proto,
                                      'first_point': (str(c.packets[0].time), c.conv_id),
                                      'last_point': (str(c.packets[-1].time), c.conv_id)}})

    return json.dumps([conv_dict, data_list])

class Packet():
    def __init__(self, src_ip, src_port, dst_ip, dst_port, time):
        self.src_ip = src_ip
        self.src_port = int(src_port)
        self.dst_ip = dst_ip
        self.dst_port = int(dst_port)
        self.time = time
    def __repr__(self):
        return '<Packet {}:{} -> {}:{}>'.format(self.src_ip, self.src_port, self.dst_ip, self.dst_port)

class Conversation():
    def __init__(self, conv_id, src_ip, dst_ip, proto):
        self.conv_id = str(conv_id)
        self.src_ip = src_ip
        self.dst_ip = dst_ip
        self.proto = proto
        self.packets = []
    def __repr__(self):
        return '<Conversation {} -> {} ({})>'.format(self.src_ip, self.dst_ip, self.proto)

if __name__ == '__main__':
    # app.run()
    app.run(host='0.0.0.0', debug=True)