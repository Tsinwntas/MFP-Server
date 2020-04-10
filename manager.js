var childProcess = require('child_process');

function runScript(scriptPath, callback) {

    // keep track of whether callback has been invoked to prevent multiple invocations
    var invoked = false;

    var process = childProcess.fork(scriptPath);

    // listen for errors as they may prevent the exit event from firing
    process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        callback(err);
    });

    // execute the callback once the process has finished running
    process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        var err = code === 0 ? null : new Error('exit code ' + code);
        callback(err);
    });

}

var interval = setInterval(function(){
	console.log("updating data");
    runScript('./getData.js', function (err) {
        if (err) throw err;
        console.log('finished running getData.js');
    });
},3600000);

const express = require('express')
const fs = require('fs');
const app = express()
const port = 3000

app.get('/manager', (req, res) => res.send(fs.readFileSync('data.js', 'utf8')))

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))