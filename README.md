# MyLocalServer
Node JS Server to run on local machine and communicate with  customize Cordova-Plugin-Ionic calls.

# Execution Steps:
- My Current Environement:
- node -v: v16.0.0 cordova -v: 8.0.0 npm -v: 8.1.2 Ionic: Ionic CLI : 6.18.0
- After download respository: 
-   npm install
- Open Terminal and cd to MyLocalServer directory and run below mentioned command.
- Node index.js


Now server is listening on port 3000.
- Open browser and type url
- http://localhost:3000
- To check URL working fine on machine, Open Postman and add GET request url: http://localhost:3000/apps 
- Response: 
[{"appID":1,"appName":"TestPluginApp","isActive":true,"versionID":"1.0.3","versionName":"1.0.3","UAT":{"versionID":"1.0.3","versionName":"V3","buildVersion":1003,"isActive":true},"Production":{"versionID":"1.0.0","versionName":"V1","buildVersion":1000,"isActive":true}},{"appID":2,"appName":"AATestApp","isActive":true,"versionID":"1.0.0","versionName":"1.0.0","UAT":{"versionID":"1.0.0","versionName":"V1","buildVersion":1000,"isActive":true},"Production":{"versionID":"1.0.0","versionName":"V1","buildVersion":1000,"isActive":true}}]

**- API Calls are :**
- GET- http://localhost:3000/apps
- POST- http://localhost:3000/apps/check-updates
-   - Input Payload:
-   {
        "channel_name": "UAT",
        "app_id": "TestPluginApp",
        "app_version_id": "1.0.0",
        "build": 1000,
        "device": {},
        "manifest": true
    }    
-   - Response Is: 
-   {
    "data": {
              "url": "http://localhost:3000/AATests/apps/TestPluginApp/UAT/1.0.3/pro-manifest.json",
              "incompatibleUpdateAvailable": false,
              "build": 1003,
              "partial": false,
              "snapshot": "1.0.3",
              "compatible": true,
              "available": true
          }
      }
      
- You can copy & paste response URL into your browser and it should load fine.
- Now keep it running and Test your Cordova-Plugin-Ionic app.
