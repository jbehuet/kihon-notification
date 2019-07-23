import axios from "axios";
import Datastore from "nedb";
import { isBefore } from "date-fns";
import config from "./config";

const PREFIX = "REGION_";
const STAGE_API = "https://api.stages-aikido.fr";
const FCM_API = "https://utils.jbehuet.fr/messaging/notify";

const SUBSCRIPTIONS_DS = new Datastore({
  filename: config.SUBSCRIPTIONS_DB_PATH
});

async function main() {
  SUBSCRIPTIONS_DS.loadDatabase();
  const REGIONS = await getAllRegions();

  if (REGIONS.length === 0) return;

  const TRAININGSHIPS = (await Promise.all(
    Object.keys(REGIONS).map(region => getTrainingships(region))
  )).reduce((prev, curr) => {
    const key = Object.keys(curr)[0];
    prev[key] = curr[key];
    return prev;
  }, {});

  if (Object.keys(TRAININGSHIPS).length === 0) return;

  // Find all subscription for application === 'kihon'
  SUBSCRIPTIONS_DS.find({ application: "kihon" }, (err, subscriptions) => {
    if (err) {
      console.error(err);
      return;
    }

    // Filter empty traininship in region
    subscriptions = subscriptions.filter(
      subscription =>
        TRAININGSHIPS[`${PREFIX}${subscription.data.region}`].length > 0
    );

    Promise.all(
      subscriptions
        .map(subscription => {
          axios.post(
            `${FCM_API}/${subscription.application}/${subscription.token}`,
            {
              title: "Aikido - Stages",
              body: `Cette semaine il y a ${
                TRAININGSHIPS[`${PREFIX}${subscription.data.region}`].length
              } stages en ${REGIONS[subscription.data.region]}`
            }
          );
        })
    )
      .then(() => {
        console.log(`${subscriptions.length} subscriptions sent`);
      })
      .catch(err => {
        console.error(err);
      });
  });
}

// Get all regions
async function getAllRegions() {
  try {
    const res = await axios.get(`${STAGE_API}/regions`);
    return res.data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

// Get trainingships by region
async function getTrainingships(region) {
  try {
    const dateEndOfWeek = new Date();
    dateEndOfWeek.setDate(dateEndOfWeek.getDate() + 8);

    const res = await axios.get(`${STAGE_API}/stages?region=${region}`);
    const trainingships = {};
    trainingships[`${PREFIX}${region}`] = res.data.stages.filter(s => {
      const [day, month, year] = s.dateFin.split("/");
      return isBefore(new Date(year, month - 1, day), dateEndOfWeek);
    });
    return trainingships;
  } catch (err) {
    console.error(err);
    return [];
  }
}

// Call main function
main();
