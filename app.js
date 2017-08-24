// START Microsoft Bot Framework setup

//Install dependencies 
"use strict";
var builder = require('botbuilder');
var restify = require('restify');
var request = require('request');

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

// END Microsoft Bot Framework setup


// START TomTom API related Functions


// Convert String Address to Geo Location
var getGeo = function (location, func) {
    // Return into func the actual Geo value of the string address.

    request("https://api.tomtom.com/search/2/geocode/" + encodeURI(location) + ".json?key="+apiKey, function (error, response, body) {
        //console.log('error:', error); // Print the error if one occurred 
        //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
        //console.log('body:', body); // Print what was returned

        var value = JSON.parse(body);

        var position;

        if (value) {
            if (value.results) {
                if (value.results[0]) {
                    if (value.results[0].position) {
                        position = value.results[0].position.lat + "," + value.results[0].position.lon
                    }
                }
            }
        }

        if (position)
            func(position);
        else
            func("ERROR"); // TO DO: Add better error messaging
    });

}

// Bot dialog to display results
bot.dialog('/results', [
    function (session, route) {
        console.log("DEBUG INFO: User " + session.message.user.id + " route var dump: " + JSON.stringify(route));

        var dateObject = new Date(route.time);

        session.endDialog();
    }
]);

// END TomTom API related functions


// START Main Microsoft Bot Framework dialogs

// Initial dialog
bot.dialog('/', [
    function (session) {
        session.send("Hello! Welcome to the TomTom Online Routing API Bot Framework demo. I can tell you when you need to leave in order to arrive at your destination on time.");

        if (session.userData.route == null) {
            session.userData.route = {}
        }
        session.beginDialog("/demo")
    }
]);

// Demo dialog
bot.dialog('/demo', [
    function (session) {
        //console.log("DEBUG INFO: User "+session.message.user.id+" Userdata dump: "+JSON.stringify(session.userData.route));

        session.beginDialog("/getStartLocation", session.userData.route.start);
    },
    function (session, results) {
        session.send("You are starting your journey from " + session.userData.route.start);

        session.beginDialog("/getDestLocation", session.userData.route.dest);
    },
    function (session, results) {
        session.send("You will be traveling to " + session.userData.route.dest);

        session.beginDialog("/getTime");
    },
    function (session, results) {
        session.send("You want to arrive by " + session.userData.route.destTime);

        session.beginDialog("/results", session.userData.route);
    },
    function (session, results) {

        builder.Prompts.choice(session, "Would you like to calculate another route?", ["Yes", "Yes, but forget everything I told you before", "No, not right now"])

    },
    function (session, results) {
        if (results.response.entity == "Yes") {
            session.replaceDialog('/demo')
        }
        else if (results.response.entity == "Yes, but forget everything I told you before") {
            session.userData.route = {};

            session.replaceDialog('/demo');
        }
        else {
            session.send("No? Ok! If you change your mind, send me another message");
            session.endDialog();
        }
    }
]);

// A dialog to get a starting location
bot.dialog('/getStartLocation', [
    function (session, startLocation, next) {
        if (startLocation) {
            builder.Prompts.confirm(session, "Are you starting your journey from \"" + startLocation + "\" again?");
        }
        else {
            next(); // Skip to asking if we don't have the location
        }
    },
    function (session, results) {
        if (results.response) {
            session.endDialogWithResult({
                response: { startLocation: startLocation }
            });
        }
        else {
            builder.Prompts.text(session, "Enter an address you'd like to start from:");
        }
    },
    function (session, results) {
        if (results.response) {
            getGeo(results.response, function (startGeo) {
                if (startGeo == "ERROR") {
                    session.send("ERROR! Could not validate address.")
                    session.replaceDialog('/getStartLocation');
                }
                else {
                    session.userData.route.start = results.response;
                    session.userData.route.startGeo = startGeo;

                    session.endDialogWithResult({
                        response: { startLocation: results.response }
                    });
                }
            });
        } else {
            session.endDialogWithResult({
                resumed: builder.ResumeReason.notCompleted
            });
        }
    }
]);

// A dialog to get a destination
bot.dialog('/getDestLocation', [
    function (session, destLocation, next) {
        if (destLocation) {
            builder.Prompts.confirm(session, "Are you traveling to \"" + destLocation + "\" again?");
        }
        else {
            next(); // Skip to asking if we don't have the location
        }
    },
    function (session, results) {
        if (results.response) {
            session.endDialogWithResult({
                response: { destLocation: destLocation }
            });
        }
        else {
            builder.Prompts.text(session, "Enter the address of where you'd like to go:");
        }
    },
    function (session, results) {
        if (results.response) {
            getGeo(results.response, function (destGeo) {
                if (destGeo == "ERROR") {
                    session.send("ERROR! Could not validate address.")
                    session.replaceDialog('/getDestLocation');
                }
                else {
                    session.userData.route.dest = results.response;
                    session.userData.route.destGeo = destGeo;

                    session.endDialogWithResult({
                        response: { destLocation: results.response }
                    });
                }
            });
        } else {
            session.endDialogWithResult({
                resumed: builder.ResumeReason.notCompleted
            });
        }
    }
]);

// A dialog to get the desired arrive by time
bot.dialog('/getTime', [
    function (session) {
        builder.Prompts.time(session, "What time would you like to get there by?");
    },
    function (session, results) {
        if (results.response) {
            var t = builder.EntityRecognizer.resolveTime([results.response]);
            if (t)
                session.dialogData.time = t.toISOString(); //Storing date object as String
            // To get back as Date object: var dateObject = new Date(session.userData.route.time);
        }

        // Return time  
        if (session.dialogData.time) {
            session.userData.route.destTime = session.dialogData.time;

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

// END Main Microsoft Bot Framework dialogs