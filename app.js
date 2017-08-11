
//Install dependencies 
"use strict";
var builder = require('botbuilder');

//Create chat bot 
var connector = new builder.ChatConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword']
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen())

bot.dialog('/', [
    function (session) {
        session.dialogData.save = null;
        builder.Prompts.confirm(session, "Would you like to play a game?");
    },
    function (session, results) {
        if (results.response) {
            session.replaceDialog('/loop', session.dialogData.save)
        }
        else {
            session.send("No? Oh well! Ask again later.");
        }
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
    }
]);