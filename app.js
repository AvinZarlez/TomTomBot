
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
        //session.dialogData.save = null;
        session.send(session.dialogData.time+"Hello! Welcome to the TomTom Online Routing API Bot Framework demo. I can tell you when you need to leave in order to arrive at your destination on time.");
        session.beginDialog("/getTime");
    },
    function (session, results) {
        session.send(session.dialogData.time+" is what the dialog data is and you entered "+results.response.time);
        
        /*if (results.response) {
            session.replaceDialog('/loop', session.dialogData.save)
        }
        else {
            session.send("No? Oh well! Ask again later.");
        }*/
    }
]);

bot.dialog('/loop', [
    function (session, args) {
        session.dialogData.save = args || null;

        if (session.dialogData.save != null) {
        }
        else {
            session.send("NEW GAME");
        }

        session.send("GAME OVER");

        session.dialogData.save = null;

        session.endDialog();
    }
]);

bot.dialog('/getTime', [
    function (session) {
        builder.Prompts.time(session, "What time would you like to set an alarm for?");
    },
    function (session, results) {
        if (results.response) {
            session.dialogData.time = builder.EntityRecognizer.resolveTime([results.response]);
        }

        // Return time  
        if (session.dialogData.time) {
            session.endDialogWithResult({ 
                response: { time: session.dialogData.time } 
            }); 
        } else {
            session.endDialogWithResult({
                resumed: builder.ResumeReason.notCompleted
            });
        }
    }
]);