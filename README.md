# TomTomBot

Quickly check the delay on your journey by asking this bot to plan a route. 

This bot uses the Microsoft Bot framework: https://docs.microsoft.com/en-us/bot-framework  
To communicate with the TomTom Maps APIs: https://developer.tomtom.com/tomtommaps

*Online Search*  
Fuzzy free text search to find any street address or POI in the world. Besides free text search, the API provides structured geocoding, reverse geocoding and many filters to tweak the returned results. 

*Online Routing*  
The most advanced routing engine integrating real-time and historical traffic information. Simply plan a route from A to B, or completely edit your trip with way-points and departure time. It allows for optimizing complex logistical problems using matrix routing functionality and if needed it even takes restrictions for heavy vehicles into account. For the most adventurous trips it allows you to set some cool features like 'hilliness' and 'windiness' of the road. 


## Installation
### Software Requirements
NodeJS: https://nodejs.org/en/

Visual Studio Code: https://code.visualstudio.com/Download

Bot Framework Emulator: http://emulator.botframework.com/

Git: https://git-scm.com/ (Nice-To-Have)

### Instructions for Local Setup: 

1. Download project code into a folder
2. Open folder in Visual Studio Code
3. Open “.vscode/launch.json” and edit the “TomTomAPIKey” value to a valid TomTom API Key. Register at https://developer.tomtom.com/user/register for a free evaluation key. 
4. Open terminal (either within VSCode or external in project folder) and run “npm install” to get dependencies
5. Go to the “Debug” tab and hit play/launch project. Confirm node server launch in debug console
6. Launch Bot Framework Emulator, connect to default URL (“http://localhost:3978/api/messages”)
 
Done! You can now chat with the bot in the emulator. No Microsoft App ID/Password required for local debugging.

### Instructions for web hosted setup

1. In your Azure Portal, create an Azure App Service for the bot/project. Note the URL
2. Deploy code from https://github.com/TobiahZ/TomTomBot 
3. Create account on https://dev.botframework.com/
4. Create bot on https://dev.botframework.com/ , follow step by step instruction. 
	1. NOTE: Enter the URL of your Azure App Service, plus “/api/messages” Example: https://<URL>/api/messages (That is the version I am currently hosting on my own Azure).
	2. NOTE: Make sure to write down both the Microsoft App ID AND generated Password! Password will only ever display once!
5. Set up environmental variables on Azure App Service under “Application Settings”. 
	1. Three values. “MicrosoftAppId” given during bot creation, “MicrosoftAppPassword” generated during bot creation, and “TomTomAPIKey” a valid TomTom API key.
	2. NOTE: May need to restart service after entering these variables.

Done! You should be able to test the bot from the web chat on https://dev.botframework.com/ , and from there set up username / tokens / etc. for all other platforms.
 
