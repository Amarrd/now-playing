# now-playing

A visualiser that adds profiles and control functionality to a range of JS canvas-based animations. It can optionally provide song information via an integration with ACRCloud.

Visualiser types can be cycled through using the arrows on the top left and right of the window.

Profiles can be edited and saved, with an option to restore to the default. 

Controls can be toggled by clicking anywhere on the screen. If a song has been detected, details can be toggled by pressing 'S'.

An access key & access secret will be required to use the identification functionality. Accounts with a free trial, plus a limited number of free requests, can be created at [ACR's website](https://www.acrcloud.com/). Keys should be created for an 'Audio & Video Recognition' project.

Access credentials and saved profiles are stored in your browser's local storage.

In order to build and run, browserify is required, e.g: 'browserify --s myBundle script.js -o bundle.js'
