/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

//const {onRequest} = require("firebase-functions/v2/https");
//const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
const functions = require("firebase-functions");

const scraper = require("./scraper");

const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const getData = ()  =>
{
    const today = new Date();
    return `${today.getDate()}${today.getMonth()}${today.getFullYear()}`;
};
exports.pubsub = functions.region("asia-southeast1")
    .runWith({memory: '128MB'})
    .pubsub.schedule("").timeZone("")
    .onRun(async () => {
        try {
            const data = await scraper.scrapeData();
        } catch (error) {
            throw Error(error);
        }
    })
