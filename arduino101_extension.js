 /*This program is free software: you can redistribute it and/or modify
 *it under the terms of the GNU General Public License as published by
 *the Free Software Foundation, either version 3 of the License, or
 *(at your option) any later version.
 *
 *This program is distributed in the hope that it will be useful,
 *but WITHOUT ANY WARRANTY; without even the implied warranty of
 *MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *GNU General Public License for more details.
 *
 *You should have received a copy of the GNU General Public License
 *along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function(ext) {

  var UUID = "a56ada00ed0911e59c970002a5d5c51b",
    TX_CHAR = "a56ada01ed0911e59c970002a5d5c51b",
    ANALOG_READ_CHAR = "a56ada02ed0911e59c970002a5d5c51b",
    DIGITAL_READ_CHAR = "a56ada03ed0911e59c970002a5d5c51b",
    PIN_MODE_CHAR = "a56ada04ed0911e59c970002a5d5c51b",
    IMU_TILT_CHAR = "a56ada05ed0911e59c970002a5d5c51b",
    IMU_EVENT_CHAR = "a56ada06ed0911e59c970002a5d5c51b";

  var rx = {};
  rx[ANALOG_READ_CHAR] = {notify: true};
  rx[DIGITAL_READ_CHAR] = {notify: true};
  rx[PIN_MODE_CHAR] = {notify: true};
  rx[IMU_TILT_CHAR] = {notify: true};
  rx[IMU_EVENT_CHAR] = {notify: true};

  var tx = {};
  tx[TX_CHAR] = {};
  tx[PIN_MODE_CHAR] = {};
  tx[IMU_EVENT_CHAR] = {};

  var device_info = {uuid: [UUID]};
  device_info["read_characteristics"] = rx;
  device_info["write_characteristics"] = tx;

  var CMD_DIGITAL_WRITE = 0x73,
    CMD_ANALOG_WRITE = 0x74,
    CMD_PIN_MODE = 0x75,
    CMD_CALIBRATE_IMU = 0x76,
    CMD_SERVO_WRITE = 0x77;

  var IMU_EVENT_TAP = 0x00,
    IMU_EVENT_DOUBLE_TAP = 0x01,
    IMU_EVENT_SHAKE = 0x02;

  var PWM_PINS = [3, 5, 6, 9];
    DIGITAL_PINS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    ANALOG_PINS = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'];

  var LOW = 0,
    HIGH = 1;

  var INPUT = 0,
    OUTPUT = 1;

  var digitalPinVals = new Uint8Array(12),
    pinModes = new Uint8Array(12),
    analogInputData = new Uint8Array(6),
    accelInputData = [0,0],
    imuEventData = new Uint8Array(2),
    servoVals = new Uint8Array(12);

  var device = null;

  function listen() {
    device.on(ANALOG_READ_CHAR, function(bytes){
      analogInputData = new Uint8Array(bytes.data);
    });
    device.on(DIGITAL_READ_CHAR, function(bytes){
      digitalPinVals = new Uint8Array(bytes.data);
    });
    device.on(PIN_MODE_CHAR, function(bytes){
      pinModes = new Uint8Array(bytes.data);
    });
    device.on(IMU_TILT_CHAR, function(bytes){
      if (bytes.data.length > 0){
        for (var i=0; i<accelInputData.length; i++) {
          accelInputData[i] = bytes.data[(i*2)+1];
          if (bytes.data[(i*2)]) accelInputData[i] *= -1;
        }
      }
    });
    device.on(IMU_EVENT_CHAR, function(bytes) {
      imuEventData = new Uint8Array(bytes.data);
    });
  }

  function analogRead(pin) {
    if (ANALOG_PINS.indexOf(pin) === -1) return;
    return Math.round(map(analogInputData[ANALOG_PINS.indexOf(pin)], 0, 255, 0, 100));
  }

  function digitalRead(pin) {
    if (DIGITAL_PINS.indexOf(pin) === -1) return;
    if (pinModes[pin-2] != INPUT)
      pinMode(pin, INPUT);
    return digitalPinVals[pin-2];
  }

  function analogWrite(pin, val) {
    if (PWM_PINS.indexOf(pin) === -1) return;
    if (val < 0) val = 0;
    else if (val > 100) val = 100;
    val = Math.round((val / 100) * 255);
    device.emit('write', {uuid: TX_CHAR, bytes: [CMD_ANALOG_WRITE, pin, val]});
  }

  function digitalWrite(pin, val) {
    if (DIGITAL_PINS.indexOf(pin) === -1) return;
    device.emit('write', {uuid: TX_CHAR, bytes: [CMD_DIGITAL_WRITE, pin, val]});
  }

  function pinMode(pin, mode) {
    device.emit('write', {uuid: TX_CHAR, bytes: [CMD_PIN_MODE, pin, mode]});
  }

  function rotateServo(pin, deg) {
    device.emit('write', {uuid: TX_CHAR, bytes: [CMD_SERVO_WRITE, pin, deg]});
    servoVals[pin] = deg;
  }

  function map(val, aMin, aMax, bMin, bMax) {
    if (val > aMax) val = aMax;
    else if (val < aMin) val = aMin;
    return (((bMax - bMin) * (val - aMin)) / (aMax - aMin)) + bMin;
  }

  ext.analogWrite = function(pin, val) {
    analogWrite(pin, val);
  };

  ext.digitalWrite = function(pin, val) {
    if (val == 'on')
      digitalWrite(pin, HIGH);
    else if (val == 'off')
      digitalWrite(pin, LOW);
  };

  ext.analogRead = function(pin) {
    return analogRead(pin);
  };

  ext.digitalRead = function(pin) {
    return digitalRead(pin);
  };

  ext.whenAnalogRead = function(pin, op, val) {
    if (ANALOG_PINS.indexOf(pin) === -1) return
    if (op == '>')
      return analogRead(pin) > val;
    else if (op == '<')
      return analogRead(pin) < val;
    else if (op == '=')
      return analogRead(pin) == val;
    else
      return false;
  };

  ext.whenDigitalRead = function(pin, val) {
    if (val == 'on')
      return digitalRead(pin);
    else if (val == 'off') {
      return digitalRead(pin) == 0;
    }
  };

  ext.rotateServo = function(pin, deg) {
    if (deg < 0) deg = 0;
    else if (deg > 180) deg = 180;
    rotateServo(pin, deg);
  };

  ext.servoPosition = function(pin) {
    return servoVals[pin];
  };

  ext.getTilt = function(coord) {
    switch (coord) {
    case 'up':
      return accelInputData[0];
    case 'down':
      return -accelInputData[0];
    case 'left':
      return -accelInputData[1];
    case 'right':
      return accelInputData[1];
    }
  };

  ext.whenIMUEvent = function(imuEvent) {
    return imuEventData[IMU_EVENT_SHAKE];
  };

  ext._getStatus = function() {
    if (device) {
      if (device.is_open()) {
        return {status: 2, msg: 'Arduino connected'};
      } else {
        return {status: 1, msg: 'Arduino connecting...'};
      }
    } else {
      return {status: 1, msg: 'Arduino disconnected'};
    }
  };

  ext._deviceConnected = function(dev) {
    if (device) return;
    device = dev;
    device.open(function(d) {
      if (device == d) {
        listen();
      } else if (d) {
        console.log('Received open callback for wrong device');
      } else {
        console.log('Opening device failed');
        device = null;
      }
    });
  };

  ext._deviceRemoved = function(dev) {
    console.log('device removed');
    pinModes = new Uint8Array(12);
    if (device != dev) return;
    device = null;
  };

  ext._shutdown = function() {
    // TODO: Bring all pins down
    if (device) device.close();
    device = null;
  };

  var blocks = [
    [' ', 'set pin %d.digitalOutputs %m.outputs', 'digitalWrite', 13, 'on'],
    [' ', 'set pin %d.analogOutputs to %n%', 'analogWrite', 9, 100],
    ['h', 'when pin %d.digitalInputs is %m.outputs', 'whenDigitalRead', 9, 'on'],
    ['b', 'pin %d.digitalInputs on?', 'digitalRead', 9],
    ['-'],
    ['h', 'when analog pin %d.analogInputs %m.ops %n%', 'whenAnalogRead', 'A0', '>', 50],
    ['r', 'read analog pin %d.analogInputs', 'analogRead', 'A0'],
    ['-'],
    ['h', 'when shaken', 'whenIMUEvent'],
    ['r', 'tilt angle %m.tiltDir', 'getTilt', 'up'],
    ['-'],
    [' ', 'set pin %d.digitalOutputs servo to %n degrees', 'rotateServo', 7, 90],
    ['r', 'pin %d.digitalOutputs servo position', 'servoPosition', 7]
  ];

  var menus = {
    digitalOutputs: DIGITAL_PINS,
    analogOutputs: PWM_PINS,
    digitalInputs: DIGITAL_PINS,
    analogInputs: ANALOG_PINS,
    outputs: ['on', 'off'],
    ops: ['>', '=', '<'],
    tiltDir: ['up', 'down', 'left', 'right']
  };

  var descriptor = {
    blocks: blocks,
    menus: menus,
    url: 'http://khanning.github.io/scratch-arduino-extension'
  };

  ScratchExtensions.register('Arduino 101', descriptor, ext, {info: device_info, type: 'ble'});
})({});
