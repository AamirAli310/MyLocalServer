const Joi = require('joi');
const express = require('express');
const port = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(express.static('AARoot'));
// Add headers before the routes are defined
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

const liveApps = [
    {
        appID:1,
        appName:"TestPluginApp",
        isActive: true,
        versionID: "1.0.3",
        versionName: "1.0.3",
        UAT:{
            versionID: "1.0.3",
            versionName: "V3",
            buildVersion: 1003,
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


app.listen(port,()=>{
    console.log('AA Server is Listening on port ${port}');
});

// app.use(express.static("AARoot"));

app.get('/',(req,res) =>{
    res.send('AA Server World');
})

//AA: END POINTS OF THE IONIC-PLUGIN
//https://api.ionicjs.com/apps/ac50715f/channels/check-device

//AA: UPDATED PLUGIN WEB-CALL METHOD NAME
//https://localhost:3000/apps/check-updates

app.get('/apps', (req, res) => {
    res.send(liveApps);
})

app.get('/apps/:appid', (req, res) => {
    
    const cApp = liveApps.find(item => {
        console.log("item: "+item.appID);        
        return (item.appID === parseInt(req.params.appid));
    });
    console.log("App Info: " + JSON.stringify(cApp));

    const serverResponse = {
        status:200,
        message: "Testing"
    };

    if (!cApp){
      serverResponse.status = 404;
      serverResponse.message = "App ID not found"
    }else{
        const qVC = req.query.version;
        if (cApp.isActive){
            if (cApp.versionID === qVC){
                serverResponse.updates = {
                    version: cApp.versionID,
                    state: 'App is Up to Date'
                };
            }
            else if (cApp.versionID > qVC) {
                serverResponse.updates = {
                    version: cApp.versionID,
                    state: 'New Version Available'
                };
            }else {
                serverResponse.updates = {
                    version: cApp.versionID,
                    state: 'None'
                };
            }
        }else{
            serverResponse.status = 200;
            serverResponse.message = cApp.appName + "is currently Disabled!";
        }
    }

    res.status(serverResponse.status).send(serverResponse);
})

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

    const {error} = schema.validate(req.body);
    // console.log("AA: Result :: ", JSON.stringify(error));
    if(error){
        res.status(400).send(error.details[0].message);
        return;
    }

    const body = req.body;

    const cApp = liveApps.find(item => { //AA: I USED APP-NAME ON SERVER BCZ APP_ID FROM CLIENT IS MOST LIKELY APP-NAME, BUT CAN BE CHANGED
        return (item.appName === body.app_id && item.isActive);
    });

    if (!cApp){
        res.status(400).send(body.app_id + " App doesn't exist, Kindly provide an valid App ID");
        return;        
    }

    console.log("App Info: " + JSON.stringify(cApp));
    const cAppChannel = cApp[body.channel_name];

    console.log("App's Filter Channel: " + JSON.stringify(cAppChannel));

    if (cAppChannel) {

        if (cAppChannel.isActive) {
            body.app_version_id = (body.app_version_id) ? body.app_version_id: "0.0";//AA: To Avoid an undefined Exception 
            
            const shouldSendUpdates = isNewerVersion(body.app_version_id, cAppChannel.versionID);//Flag true/false
            
            if (!shouldSendUpdates) { //AA: AS VERSION IS SAME SO SHOULD BE SEND
                res.status(200).send({ data: response });
            } else if (shouldSendUpdates) {
                //THE URL WILL BE LIKE:  "http://localhost:3000/AATests/apps/TestPluginApp/UAT/V1/manifest.json"
                const hostURL = "http://localhost:3000/";
                response.url = hostURL + "AATests/apps/"+ cApp.appName +"/"+ body.channel_name + "/" + cAppChannel.versionID+"/pro-manifest.json";
                response.snapshot = cAppChannel.versionID;//IT'S ACTUALLY THE VERSION 'FOLDER' THAT SHOULD BE AVAILABLE ON OUR SERVER UNDER THE APPS > CHANNEL DIRECTORY.
                //SO THE DIRECTORY LOOKS LIKE
                //---apps
                //-----TestPluginApp
                //-----------UAT
                //----------------1.0.3
                response.available = response.compatible = true;
                response.build = cAppChannel.buildVersion;
                console.log("URL:"+ response.url);
                res.status(200).send({data:response});
                
            }
        } else {
            //TODO: Here the new key should be added here and also added to client plugin to disable app version.
            res.status(400).send({ data: response });
        }
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
}