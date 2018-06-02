# janus-method-rtc
Adds 'rtc' command to server.  Implements real-time voice and video chat functionality.

Installation
============
To activate this plugin, add the following to your config.js:
```
    methodPlugins: {
        rtc: { plugin: "janus-method-rtc" }
    }
```
If the methodPlugins section already exist, append the rtc line to the existing list of plugins.


Command:

```json
{ "method": "rtc", "data": ... }
```

