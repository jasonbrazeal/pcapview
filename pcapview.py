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

from models import Conversation, Packet

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = '.'

@app.route('/', methods=['GET'])
def index():
    '''Home page view.
    '''
    return render_template('index.html')

@app.route('/ajax', methods=['POST'])
def ajax():
    '''Handler for ajax call that accepts a pcap file upload and returns JSON data
       with all conversations and packets in pcap file.
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
        try:
            dt = datetime.strptime(p[0] + p[1].rstrip('0'), '%Y-%m-%d%H:%M:%S.%f')
        except ValueError:
            abort(500)
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

def get_conversation(p, conversations):
    '''Helper function that takes a packet and a list of conversations
       and returns the conversation to which the packet belongs.
    '''
    for c in conversations:
        # if packet ip pair matches conversation ip pair
        if (sorted([p.src_ip, p.dst_ip]) == sorted([c.src_ip, c.dst_ip])
        # and packet protocol matches conversation protocol
        and p.proto == c.proto):
            return c
    return None

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)