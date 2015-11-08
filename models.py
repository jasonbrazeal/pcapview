#!/usr/bin/env python
# -*- coding: utf-8 -*-

from socket import getservbyport

class Packet():
    '''Represents an IP network packet
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
    '''Represents a conversation between two IP addresses on a network
       with a given application protocol. conv_id is a unique identifier
       to make handling this information in d3.js easier.
    '''
    def __init__(self, src_ip, dst_ip, proto, conv_id=None):
        self.conv_id = conv_id
        self.src_ip = src_ip
        self.dst_ip = dst_ip
        self.proto = proto
        self.packets = []

    def __repr__(self):
        return '<Conversation {} -> {} ({})>'.format(self.src_ip, self.dst_ip, self.proto)