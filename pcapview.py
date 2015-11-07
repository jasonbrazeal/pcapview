#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import subprocess
import time
from datetime import datetime
import json
from socket import getservbyport

from flask import Flask, render_template, request, abort
from werkzeug import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = '.'

@app.route('/')
def index():
    '''
    '''
    return render_template('index.html')

def get_conversation(p, conversations):
    '''
    '''
    for c in conversations:
        # if packet ip pair matches conversation ip pair
        if (sorted([p.src_ip, p.dst_ip]) == sorted([c.src_ip, c.dst_ip])
        # and packet protocol matches conversation protocol
        and p.proto == c.proto):
            return c
    return None

@app.route('/ajax', methods=['POST'])
def ajax():
    '''
    '''
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
    Packet.protocols = {}
    packets = []
    for line in tshark_lines:
        p = line.split()
        dt = datetime.strptime(p[0] + p[1].rstrip('0'), '%Y-%m-%d%H:%M:%S.%f')
        del p[:2]
        p.append(dt)
        # if we get a packet line with an odd amount of data, ignore it
        # this takes care of packets with no source or destination port (e.g. ARP)
        if len(p) != 5:
            continue
        packets.append(Packet(*p))

    # get a list of conversations
    conversations = []

    packets.sort(key=lambda x: x.time)
    for p in packets:
        # going through time
        c = get_conversation(p, conversations)
        if not c:
            c = Conversation(src_ip=p.src_ip, dst_ip=p.dst_ip, proto=p.proto)
            conversations.append(c)
        c.packets.append(p)

    # prepare data for processing in d3
    data_list = []
    conv_dict = {}
    conv_ctr = len(conversations)

    for c in conversations:
        print(str(c) + ' - ' + str(len(c.packets)))
        c.conv_id = str(conv_ctr)
        conv_ctr -= 1
        for p in c.packets:
            data_list.append((str(p.time), c.conv_id))
        conv_dict.update({c.conv_id: {'src_ip': c.src_ip,
                                      'dst_ip': c.dst_ip,
                                      'proto': c.proto,
                                      'first_point': (str(c.packets[0].time), c.conv_id),
                                      'last_point': (str(c.packets[-1].time), c.conv_id)}})

    return json.dumps([conv_dict, data_list])

class Packet():
    '''
        try to recognize protocol from destination port first
        if unknown, then try to recognize it from source port
        (e.g. if the capture started in the middle of a conversation)
        if neither port is recognized, mark protocol as 'unknown'
        and add mapping from lower port (likely the application's port) to 'unknown'
        so packets with unknown protocols on the same ports will be grouped together
    '''

    protocols = {}

    def __init__(self, src_ip, src_port, dst_ip, dst_port, time):
        self.src_ip = src_ip
        self.src_port = int(src_port)
        self.dst_ip = dst_ip
        self.dst_port = int(dst_port)
        self.time = time
        try:
            self.proto = getservbyport(self.dst_port)
            significant_port = self.dst_port
        except OSError:
            try:
                self.proto = getservbyport(self.src_port)
                significant_port = self.src_port
            except OSError:
                self.proto = 'unknown'
                significant_port = min([self.src_port, self.dst_port])
        self.protocols.update({significant_port: self.proto})

    def __repr__(self):
        return '<Packet {}:{} -> {}:{}>'.format(self.src_ip, self.src_port, self.dst_ip, self.dst_port)

class Conversation():
    '''
    '''
    def __init__(self, src_ip, dst_ip, proto, conv_id=None):
        self.conv_id = conv_id
        self.src_ip = src_ip
        self.dst_ip = dst_ip
        self.proto = proto
        self.packets = []

    def __repr__(self):
        return '<Conversation {} -> {} ({})>'.format(self.src_ip, self.dst_ip, self.proto)

if __name__ == '__main__':
    # app.run()
    app.run(host='0.0.0.0', debug=True)