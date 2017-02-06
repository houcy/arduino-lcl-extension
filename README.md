# Arduino 101 extension for Scratch

## Introduction

  The Arduino 101 board is a joint collaboration between [Arduino](https://www.arduino.cc) and [Intel&reg;](http://www.intel.com). It's powered by the [Intel&reg; Curie&trade;](http://www.intel.com/content/www/us/en/wearables/wearable-soc.html) which features an x86 (Quark) and a 32-bit ARC architecture core. Bluetooth LE and a 6-axis accelerometer/gyro are built in. The board operates at 3.3V but the I/O pins are 5V tolerant. There are a total of 6 analog input pins and 14 digital I/O pins of which 4 (3, 5, 6, and 9) provide PWM output.

[Read more about the Arduino 101](https://www.arduino.cc/en/Main/ArduinoBoard101)

## Instructions

The first step is to upload arduino101-firmware.ino to the Arduino 101

###BLE
1. Launch the `Scratch Device Manager` app
2. Create a new project on https://kreg.scratch.ly
3. Go to `More Blocks` and click `Add an Extension`. Add the Arduino 101 Extension
4. Click `Connect` when the Scratch Device Manager pops up
5. When the indicator under `More Blocks` changes from yellow to green the extension is ready to use

###Serial over USB
1. Install the [Scratch Browser Plugin](https://cdn.scratch.mit.edu/scratchr2/static/__c7362f65c857ab381a4bd44e85accc57__/help/en/ext/ext1.html) for other browsers. Serial extensions work best in Firefox at the moment.
2. Open Firefox and navigate to the [extension on ScratchX](http://scratchx.org/?url=http://llk.github.io/arduino-101/arduino101_serial_extension.js)
3. When the indicator under `More Blocks` changes from yellow to green the extension is ready to use

## BLE Characteristics

|Name|Byte Length|Properties|UUID|
|:---|:---|:---|---|
|Service|-|-|a56ada00-ed09-11e5-9c97-0002a5d5c51b|
|TX|20 bytes|Write|a56ada01-ed09-11e5-9c97-0002a5d5c51b|
|Analog Read|6 bytes|Notify|a56ada03-ed09-11e5-9c97-0002a5d5c51b|
|Digital Read|12 bytes|Notify|a56ada04-ed09-11e5-9c97-0002a5d5c51b|
|Pin Mode|12 bytes|Notify|a56ada05-ed09-11e5-9c97-0002a5d5c51b|
|Accelerometer/Gyro Read|4 bytes|Notify|a56ada06-ed09-11e5-9c97-0002a5d5c51b|

### TX

Properties: Read, Write<br />
Byte length: 3

###### Commands:
**Digital Write** = [0x73, pin #, val]<br />
**Analog Write** = [0x74, pin #, val]<br />
**Pin Mode** = [0x75, pin #, mode]<br />
**Calibrate IMU** = [0x76]<br />
**Servo Write** = [0x77, pin #, degrees]

### Analog Read

Properties: Read, Notify<br />
Byte length: 6

Notification is sent when any of the analog input readings change.<br />
Because of floating pins the values are usually constantly changing.

6 bytes that correspond with each analog pin (0-5)<br />
byte[0] = analog pin 0 value , byte[1] = analog pin 1 value, etc...

### Digital Read

Properties: Read, Notify<br />
Byte length: 12

Notification is sent when any of the digital input readings change.<br />
Only digital pins that have been set to input mode are updated.

12 bytes with index+2 corresponding with digital pins 2 through 13<br />
byte[0] = digital pin 2 value, byte[1] = digital pin 3 value, etc...

### Pin Mode

Properties: Read, Write, Notify<br />
Byte length: 12

Notification is sent when the mode of a digital pin is changed.<br />

12 bytes with index+2 corresponding with digital pins 2 through 13<br />
byte[0] = digital pin 2 mode, byte[1] = digital pin 3 mode, etc...

### Accelerometer/Gryo Read

Properties: Read,  Notify<br />
Byte length: 4

X and Y axis are calculated using the Accelerometer and Gryo sensor values and the complementary filter.

|Byte num|Valid values|Description|
|:---|:---|:---|
|0|0,1|X axis sign 0 (+) or 1 (-)|
|1|-180-180|X axis rotation in degrees|
|2|0,1|Y axis sign 0 (+) or 1 (-)|
|3|-180-180|Y axis rotation in degrees|

