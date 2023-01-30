#!/usr/bin/env python3
# ---
# Copyright 2020 glowinthedark
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
#
# You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#
# See the License for the specific language governing permissions and limitations under the License.
# ---
#
# Generate index.html files for
# all subdirectories in a directory tree.

# handle symlinked files and folders: displayed with custom icons

# By default only the current folder is processed and hidden files (starting with a dot) are skipped.
# To force inclusion of hidden files pas --include-hidden.

# Use -r or --recursive to process nested folders.

import argparse
import datetime
import os
import sys
from pathlib import Path
from urllib.parse import quote

DEFAULT_OUTPUT_FILE = 'index.html'


def process_dir(top_dir, opts):
    glob_patt = opts.filter or '*'

    path_top_dir: Path
    path_top_dir = Path(top_dir)
    index_file = None

    index_path = Path(path_top_dir, opts.output_file)

    if opts.verbose:
        print(f'Traversing dir {path_top_dir.absolute()}')

    try:
        index_file = open(index_path, 'w')
    except Exception as e:
        print('cannot create file %s %s' % (index_path, e))
        return

    index_file.write("""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="Pragma" content="no-cache">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
    * { padding: 0; margin: 0; }
    body {
        font-family: sans-serif;
        text-rendering: optimizespeed;
        background-color: #ffffff;
    }
    a {
        color: #006ed3;
        text-decoration: none;
    }
    a:hover,
    h1 a:hover {
        color: #319cff;
    }
    header,
    #summary {
        padding-left: 5%;
        padding-right: 5%;
    }
    th:first-child,
    td:first-child {
        width: 5%;
    }
    th:last-child,
    td:last-child {
        width: 5%;
    }
    header {
        padding-top: 25px;
        padding-bottom: 15px;
        background-color: #f2f2f2;
    }
    h1 {
        font-size: 20px;
        font-weight: normal;
        white-space: nowrap;
        overflow-x: hidden;
        text-overflow: ellipsis;
        color: #999;
    }
    h1 a {
        color: #000;
        margin: 0 4px;
    }
    h1 a:hover {
        text-decoration: underline;
    }
    h1 a:first-child {
        margin: 0;
    }
    main {
        display: block;
    }
    .meta {
        font-size: 12px;
        font-family: Verdana, sans-serif;
        border-bottom: 1px solid #9C9C9C;
        padding-top: 10px;
        padding-bottom: 10px;
    }
    .meta-item {
        margin-right: 1em;
    }
    #filter {
        padding: 4px;
        border: 1px solid #CCC;
    }
    table {
        width: 100%;
        border-collapse: collapse;
    }
    tr {
        border-bottom: 1px dashed #dadada;
    }
    tbody tr:hover {
        background-color: #ffffec;
    }
    th,
    td {
        text-align: left;
        padding: 10px 0;
    }
    th {
        padding-top: 15px;
        padding-bottom: 15px;
        font-size: 16px;
        white-space: nowrap;
    }
    th a {
        color: black;
    }
    th svg {
        vertical-align: middle;
    }
    td {
        white-space: nowrap;
        font-size: 14px;
    }
    td:nth-child(2) {
        width: 80%;
    }
    td:nth-child(3) {
        padding: 0 20px 0 20px;
    }
    th:nth-child(4),
    td:nth-child(4) {
        text-align: right;
    }
    td:nth-child(2) svg {
        position: absolute;
    }
    td .name {
        margin-left: 1.75em;
        word-break: break-all;
        overflow-wrap: break-word;
        white-space: pre-wrap;
    }
    td .goup {
        margin-left: 1.75em;
        padding: 0;
        word-break: break-all;
        overflow-wrap: break-word;
        white-space: pre-wrap;
    }
    .icon {
        margin-right: 5px;
    }
    tr.clickable {
        cursor: pointer;
    }
