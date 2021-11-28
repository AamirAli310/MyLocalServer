const Joi = require('joi');
const express = require('express');
const fs = require('fs');
const port = process.env.PORT || 3000;
const app = express();
app.use(express.json());
app.use(express.static('AARoot')); //Public folder
// Add headers before the routes are defined

//AA: COMMAND TO INSTALL PLUGIN: CUSTOM CORDOVA-PLUGIN-IONIC
//ionic cordova plugin add https://github.com/AamirAli310/cordova-plugin-ionic.git --variable APP_ID="SurveyApp5.0" --variable CHANNEL_NAME="UAT" --variable UPDATE_API="http://localhost:3000" UPDATE_METHOD="auto"
let baseURL = "http://localhost:3000/";//AA: WORKS FOR IOS PLATFORM
const IPBaseURL = "http://10.40.69.131:3000/";//AA: WORKS FOR ANDROID PLATFORM //To Make Manifiest Webcall, http://10.40.69.131:3000/apps/SurveyApp5.0/UAT/1.1.0/get-manifest"

app.use(function (req, res, next) {
    // console.log('**AA: In App.Use Function');    
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');//AA: WORKS FOR ANDROID PLATFORM    
    res.setHeader('Access-Control-Allow-Origin', 'ionic://localhost');//AA: WORKS FOR IOS PLATFORM
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost');//AA: WORKS FOR IOS PLATFORM


    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST, OPTIONS, PUT, PATCH, DELETE');

    res.setHeader('Access-Control-Max-Age', '1002');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, origin, accept');

    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

const liveApps = [
    {
        appID: 1,
        appName: "TestPluginApp",
        isActive: true,
        versionID: "1.0.3",
        versionName: "1.0.3",
        UAT: {
            versionID: "1.0.3",
            versionName: "V3",
            buildVersion: 1000,
            isActive: true
        },
        Production: {
            versionID: "1.0.0",
            versionName: "V1",
            buildVersion: 1000,
            isActive: true
        }
    },
    {
        appID: 2,
        appName: "AATestApp",
        isActive: true,
        versionID: "1.0.0",
        versionName: "1.0.0",
        UAT: {
            versionID: "1.0.0",
            versionName: "V1",
            buildVersion: 1000,
            isActive: true
        },
        Production: {
            versionID: "1.0.0",
            versionName: "V1",
            buildVersion: 1000,
            isActive: true
        }
    }   
];

app.listen(port, () => {
    console.log('AA Server is Listening on port ${port}');
});

// app.use(express.static("AARoot"));

app.get('/', (req, res) => {
    res.send('AA Server World');
});

//AA: TO MANAGE OPTION CALLS & MAKE THEM SUCCESS TO BE WORKABLE ON OUR LOCAL-HOST
app.options('*', (req, res) => {
    console.log("Option Method: URL:" + req.url);
    res.status(200, { 'content-type': 'application/json' }).send([{}]);
});

//AA: END POINTS OF THE IONIC-PLUGIN
//https://api.ionicjs.com/apps/ac50715f/channels/check-device

//AA: UPDATED PLUGIN WEB-CALL METHOD NAME
//https://localhost:3000/apps/check-updates

app.get('/apps', (req, res) => {
    res.send(liveApps);
});

app.post('/apps/check-updates', (req, res) => {


    /* //INPUT-PAYLOAD, DEVICE SENT VERY FIRST TIME.
    {
        "channel_name": "Production", "app_id": "ac50715f",
        "device": {
            "binary_version": "1.0", "device_id": "84CC9C3D-853C-409A-A610-91EE67406CE5", "platform": "ios",
            "platform_version": "15.0";
        },
        "plugin_version": "5.5.1",
        "manifest": true;
    }
    
    [Log] IONIC-SERVER SENT RESPONSE AA: checkForUpdateResp: 
        {
            "url": "https://api.ionicjs.com/apps/ac50715f/snapshots/021a2953-ab07-4604-8b02-2c601ab3f798/manifest",
            "incompatibleUpdateAvailable": false, "build": 7661934, "partial": false,
            "snapshot": "021a2953-ab07-4604-8b02-2c601ab3f798", "compatible": true, "available": true;
        }
    */
    //AA: Our Default Response.
    const response = {
        "url": "",
        "incompatibleUpdateAvailable": false,
        "build": null,
        "partial": false,
        "snapshot": null,
        "compatible": false,
        "available": false
    };

    //AA: Inputs that must be required to proceed the call.
    const schema = Joi.object({
        channel_name: Joi.string().min(3).required(),
        app_id: Joi.string().min(5).required(),
        app_version_id: Joi.string().min(2).optional(),
        build: Joi.number().min(5).optional(),
        device: Joi.object().optional(),
        plugin_version: Joi.string().optional(),
        manifest: Joi.boolean().required()
    });

    console.log("Req Body: ", req.body);

    const { error } = schema.validate(req.body);
    // console.log("AA: Result :: ", JSON.stringify(error));
    if (error) {
        res.status(400).send(error.details[0].message);
        return;
    }

    const body = req.body;

    const cApp = liveApps.find(item => { //AA: I USED APP-NAME ON SERVER BCZ APP_ID FROM CLIENT IS MOST LIKELY APP-NAME, BUT CAN BE CHANGED
        return (item.appName === body.app_id && item.isActive);
    });

    if (!cApp) {
        res.status(400).send(body.app_id + " App doesn't exist, Kindly provide an valid App ID");
        return;
    }

    console.log("App Info: " + JSON.stringify(cApp));
    const cAppChannel = cApp[body.channel_name];

    console.log("App's Filter Channel: " + JSON.stringify(cAppChannel));
    const platform = (body.device) ? body.device.platform : 'ios';//default behave like as iOS

    if (cAppChannel) {

        if (cAppChannel.isActive) {
            body.app_version_id = (body.app_version_id) ? body.app_version_id : "0.0";//AA: To Avoid an undefined Exception 

            const shouldSendUpdates = isNewerVersion(body.app_version_id, cAppChannel.versionID);//Flag true/false

            if (!shouldSendUpdates) { //AA: AS VERSION IS SAME SO SHOULD BE SEND
                res.status(200).send({ data: response });
            } else if (shouldSendUpdates) {

                //THE URL WILL BE LIKE:  "http://localhost:3000/AATests/apps/TestPluginApp/UAT/V1/manifest.json"
                const hostURL = (platform.toLowerCase() == 'android') ? IPBaseURL : baseURL; //AA: ON ANDROID LOCAL-HOST DOESN'T WORK SO USE MACHINE IP AS HOST-URL
                // response.url = hostURL + "apps/TestPluginApp/UAT/1.0.1/pro-manifest";

                response.url = hostURL + "apps/" + cApp.appName + "/" + body.channel_name + "/" + cAppChannel.versionID + "/get-manifest";
                // response.url = hostURL + "apps/"+ TestPluginApp +"/"+ UAT + "/" + 1.0.0+"/WebFunction";                
                
                response.snapshot = cAppChannel.versionID;//IT'S ACTUALLY THE VERSION 'FOLDER' THAT SHOULD BE AVAILABLE ON OUR SERVER UNDER THE APPS > CHANNEL DIRECTORY.
                //SO THE DIRECTORY LOOKS LIKE
                //---apps
                //-----TestPluginApp
                //-----------UAT
                //----------------1.0.3
                response.available = response.compatible = true;
                response.build = cAppChannel.buildVersion;
                console.log("URL:" + response.url);
                res.status(200, { 'Content-Type': 'application/json' }).send({ data: response });

            }
        } else {
            //TODO: Here the new key should be added here and also added to client plugin to disable app version.
            res.status(400).send({ data: response });
        }
    }
});

//AA: TO LISTEN THE SUB-CALL OF PLUGIN TO FETCH PRO-MANIFEST.JSON
app.get('*', (req, res) => { 

    //AA: TEST-CASE TO LOAD JSON FROM LOCAL DIRECTORY & SEND TO CLIENT (PLUGIN) AS RESPONSE.
    console.log("AA: Control inside * Get call: URL:" + req.url);
    console.log("URL Params:" + req.query + " , URL Body:" + req.body);
    if (req.url.includes('get-manifest')) {
        //URL WILL BE LIKE THIS SO IT HAS COMPLETE ADDRESS, JUST NEED TO CHANGE LAST PART 'get-manifest'
        //http://localhost:3000/apps/TestPluginApp/UAT/1.0.1/get-manifest

        //DYNAMIC LOADING MANIFEST.JSON FILE HANDLING
        let rootURL = "./AARoot" + req.url;//MY PUBLIC DIRECTORY
        console.log('Working: ' + './AARoot/apps/TestPluginApp/UAT/1.0.1/pro-manifest.json');
        console.log('New URL: ' + rootURL);
        //'./AARoot/apps/TestPluginApp/UAT/1.0.1/pro-manifest.json'
        rootURL = rootURL.replace('get-manifest', 'pro-manifest.json');
        console.log('Finall URL: ' + rootURL);
        const manifestJSON = require(rootURL);
        res.status(200, { 'content-type': 'application/json' }).send(manifestJSON);

        //AA: TO TEST WITH STATIC FILE PATH & IT WORKS WITH OUR PLUGIN
        // const manifestJSON = require('./AARoot/apps/TestPluginApp/UAT/1.0.1/pro-manifest.json');
        // res.status(200, { 'content-type': 'application/json' }).send(manifestJSON);

    } else {
        res.status(200, { 'content-type': 'application/json' }).send([{}]);
    }
});

isNewerVersion = (oldVer, newVer) => {
    const oldParts = oldVer.split('.');
    const newParts = newVer.split('.');
    for (var i = 0; i < newParts.length; i++) {
        const a = ~~newParts[i]; // parse int
        const b = ~~oldParts[i]; // parse int
        if (a > b) return true;
        if (a < b) return false;
    }
    return false;
};