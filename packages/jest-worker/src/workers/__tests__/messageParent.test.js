/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import {parse} from 'telejson';
import {PARENT_MESSAGE_CUSTOM} from '../../types';

const processSend = process.send;

let messageParent;
let mockWorkerThreads;

beforeEach(() => {
  mockWorkerThreads = {};
  process.send = jest.fn();
  jest.mock('worker_threads', () => mockWorkerThreads);
  messageParent = require('../messageParent').default;
});

afterEach(() => {
  jest.resetModules();
  process.send = processSend;
});

describe('with worker threads', () => {
  beforeEach(() => {
    mockWorkerThreads.parentPort = {
      postMessage: jest.fn(),
    };
  });

  it('can send a message, it will be stringified', () => {
    messageParent('some-message');
    expect(mockWorkerThreads.parentPort.postMessage).toHaveBeenCalledWith([
      PARENT_MESSAGE_CUSTOM,
      '"some-message"',
    ]);
  });

  it('handles circular references from the message being sent using telejson', () => {
    const circular = {ref: null, some: 'thing'};
    circular.ref = circular;
    messageParent(circular);
    expect(mockWorkerThreads.parentPort.postMessage).toHaveBeenCalledWith([
      PARENT_MESSAGE_CUSTOM,
      expect.any(String),
    ]);
    const messageSent =
      mockWorkerThreads.parentPort.postMessage.mock.calls[0][0][1];
    const messageParsed = parse(messageSent);
    expect(messageParsed.some).toEqual('thing');
    expect(messageParsed.ref).toEqual(messageParsed);
  });
});

describe('without worker threads', () => {
  it('can send a message, it will be stringified', () => {
    messageParent('some-message');
    expect(process.send).toHaveBeenCalledWith([
      PARENT_MESSAGE_CUSTOM,
      '"some-message"',
    ]);
  });

  it('handles circular references from the message being sent using telejson', () => {
    const circular = {ref: null, some: 'thing'};
    circular.ref = circular;
    messageParent(circular);
    expect(process.send).toHaveBeenCalledWith([
      PARENT_MESSAGE_CUSTOM,
      expect.any(String),
    ]);
    const messageSent = process.send.mock.calls[0][0][1];
    const messageParsed = parse(messageSent);
    expect(messageParsed.some).toEqual('thing');
    expect(messageParsed.ref).toEqual(messageParsed);
  });
});
