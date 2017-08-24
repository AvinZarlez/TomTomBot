
//Install dependencies 
"use strict";
var builder = require('botbuilder');

var restify = require('restify');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

//Create chat bot 
var connector = new builder.ChatConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword']
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen())


bot.dialog('/', [
    function (session) {
        session.send("Hello! Welcome to the TomTom Online Routing API Bot Framework demo. I can tell you when you need to leave in order to arrive at your destination on time.");

        session.beginDialog("/loop")
    }
]);


bot.dialog('/loop', [
    function (session) {
        session.send("DEBUG: Userdata dump: {startLocation: "+session.userData.startLocation+", destLocation: "+session.userData.destLocation+"}");

    
        session.beginDialog("/getStartLocation",session.userData.startLocation);
    },
    function (session, results) {
        session.send("You are starting your journey from "+session.userData.startLocation);
    
        session.beginDialog("/getDestLocation",session.userData.destLocation);
    },
    function (session, results) {
        session.send("You will be traveling to "+session.userData.startLocation);

        session.beginDialog("/getTime");
    },
    function (session, results) {
        session.send("You want to arrive by "+results.response.time);
        
        //Results prompt
    },
    function (session, results) {
        
        builder.Prompts.choice(session,"Would you like to calculate another route?",["Yes","Yes, but forget everything I told you before","No, not right now"])
        
    },
    function (session, results) {
        if (results.response.entity == "Yes") {
            session.replaceDialog('/loop')
        }
        else if (results.response.entity == "Yes, but forget everything I told you before") {
            session.userData.startLocation = null;
            session.userData.destLocation = null;

            session.replaceDialog('/loop');
        }
        else {
            session.send("No? Ok! If you change your mind, send me another message");
            session.endDialog();
        }
    }
]);

bot.dialog('/getStartLocation', [
    function (session, startLocation, next) {
        session.dialogData.startLocation = startLocation;
        if (session.dialogData.startLocation)
        {
            builder.Prompts.confirm(session, "Are you starting your journey from \""+session.dialogData.startLocation+"\" again?");
        }
        else
        {
            next(); // Skip to asking if we don't have the location
        }
    },
    function (session, results) {
        if (results.response) {
            session.endDialogWithResult({ 
                response: { startLocation: session.dialogData.startLocation } 
            }); 
        }
        else
        {
            builder.Prompts.text(session, "Enter an address you'd like to start from:");
        }
    },
    function (session, results) {
        if (results.response) {
            session.dialogData.startLocation = results.response;
        }
        
        if (session.dialogData.startLocation) {
            session.userData.startLocation = session.dialogData.startLocation; //TODO: Geocash this!!!

            session.endDialogWithResult({ 
                response: { startLocation: session.dialogData.startLocation } 
            }); 
        } else {
            session.endDialogWithResult({
                resumed: builder.ResumeReason.notCompleted
            });
        }
    }
]);

bot.dialog('/getDestLocation', [
    function (session, destLocation, next) {
        session.dialogData.destLocation = destLocation;
        if (session.dialogData.destLocation)
        {
            builder.Prompts.confirm(session, "Are you traveling to \""+session.dialogData.destLocation+"\" again?");
        }
        else
        {
            next(); // Skip to asking if we don't have the location
        }
    },
    function (session, results) {
        if (results.response) {
            session.endDialogWithResult({ 
                response: { destLocation: session.dialogData.destLocation } 
            }); 
        }
        else
        {
            builder.Prompts.text(session, "Enter the address of where you'd like to go:");
        }
    },
    function (session, results) {
        if (results.response) {
            session.dialogData.destLocation = results.response;
        }
        
        if (session.dialogData.destLocation) {
            session.userData.destLocation = session.dialogData.destLocation; //TODO: Geocash this!!!

            session.endDialogWithResult({ 
                response: { destLocation: session.dialogData.destLocation } 
            }); 
        } else {
            session.endDialogWithResult({
                resumed: builder.ResumeReason.notCompleted
            });
        }
    }
]);

bot.dialog('/getTime', [
    function (session) {
        builder.Prompts.time(session, "What time would you like to get there by?");
    },
    function (session, results) {
        if (results.response) {
            var t = builder.EntityRecognizer.resolveTime([results.response]);
            //session.dialogData.time = t.toISOString();
            //var dateObject = new Date(session.userdata.time);
        }

        // Return time  
        if (t) {
            session.endDialogWithResult({ 
                response: { time: t } 
            }); 
        } else {
            session.endDialogWithResult({
                resumed: builder.ResumeReason.notCompleted
            });
        }
    }
]);