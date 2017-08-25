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

    request("https://api.tomtom.com/search/2/geocode/" + encodeURI(location) + ".json?key=" + process.env['TomTomAPIKey'], function (error, response, body) {
        //console.log('error:', error); // Print the error if one occurred 
        //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
        //console.log('body:', body); // Print what was returned

        // TO DO: Add error checking

        var value = JSON.parse(body);

        console.log("DEBUG INFO: Called Geocode API on " + location + ", returned value:", value)

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
        //console.log("DEBUG INFO: User " + session.message.user.id + " route var dump: " + JSON.stringify(route));

        request("https://api.tomtom.com/routing/1/calculateRoute/" + route.startGeo + ":" + route.destGeo + "/json?key=" + process.env['TomTomAPIKey'] + "&arriveAt=" + route.destTime, function (error, response, body) {
            //console.log('error:', error); // Print the error if one occurred 
            //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
            //console.log('body:', body); // Print what was returned

            // TO DO: Add error checking

            var value = JSON.parse(body);

            console.log("DEBUG INFO: User " + session.message.user.id + " called Routing API, returned value:", value)
            
            if (value) {
                if (value.error) {
                    session.send("ERROR! TomTom API returned: "+value.error.description);
                }
                else
                {
                    var departureTime;
                
                    if (value.routes) {
                        if (value.routes[0]) {
                            if (value.routes[0].summary) {
                                departureTime = value.routes[0].summary.departureTime
                            }
                        }
                    }

                    if (departureTime) {
                        var dateObject = new Date(departureTime);

                        session.send("Thanks to the TomTom Routing API, I know in order to get there on time you should leave by " + dateObject.toString() + "!");
                    }
                    else {
                        session.send("ERROR! For some reason, I could not calculate departure time. Sorry!");
                    }
                }
            }
            else {
                session.send("ERROR! Bot did not get valid JSON back from TomTom API.");
            }

            session.endDialog();
        });

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
        session.send("You are starting your journey from " + session.userData.route.start + ". Thanks to the TomTom Geocoding API, I know that's located at " + session.userData.route.startGeo);

        session.beginDialog("/getDestLocation", session.userData.route.dest);
    },
    function (session, results) {
        session.send("You will be traveling to " + session.userData.route.dest + ". Thanks to the TomTom Geocoding API, I know that's located at " + session.userData.route.destGeo);

        session.beginDialog("/getTime");
    },
    function (session, results) {
        var dateObject = new Date(session.userData.route.destTime);
        session.send("You want to arrive by " + dateObject.toString());

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
            session.dialogData.startLocation = startLocation;

            builder.Prompts.confirm(session, "Are you starting your journey from \"" + session.dialogData.startLocation + "\" again?");
        }
        else {
            next(); // Skip to asking if we don't have the location
        }
    },
    function (session, results) {
        if (results.response) {
            session.endDialogWithResult({
                response: { startLocation: session.dialogData.startLocation }
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
            session.dialogData.destLocation = destLocation;

            builder.Prompts.confirm(session, "Are you traveling to \"" + session.dialogData.destLocation + "\" again?");
        }
        else {
            next(); // Skip to asking if we don't have the location
        }
    },
    function (session, results) {
        if (results.response) {
            session.endDialogWithResult({
                response: { destLocation: session.dialogData.destLocation }
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

            var now = new Date();

            if (t > now) {
                session.dialogData.time = t.toISOString(); //Storing date object as String
                // To get back as Date object: var dateObject = new Date(session.userData.route.time);

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
            else {
                session.send("ERROR! Time must be in the future. (My default timezone is GMT)");
                session.replaceDialog('/getTime');
            }
        }
        else {
            // Possibly redundant?
            session.send("ERROR! Could not understand time.");
            session.replaceDialog('/getTime');
        }
    }
]);

// END Main Microsoft Bot Framework dialogs
