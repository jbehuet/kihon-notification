import axios from "axios";
import Datastore from "nedb";
import config from "./config";

const STAGE_API = "https://api.stages-aikido.fr";
const FCM_API = "https://utils.jbehuet.fr/messaging";

const SUBSCRIPTIONS_DS = new Datastore({
  filename: config.SUBSCRIPTIONS_DB_PATH
});

async function main() {
  SUBSCRIPTIONS_DS.loadDatabase();
  const REGIONS = await getAllRegions();

  if (REGIONS.length === 0) return;

  const TRAININGSHIPS = await Object.keys(REGIONS).reduce(
    async (prev, region) => {
      prev[region] = await getTrainingships(region);
      return prev;
    },
    {}
  );

  if (TRAININGSHIPS.length === 0) return;

  // Find all subscription for application === 'kihon'
  SUBSCRIPTIONS_DS.find({ application: "kihon" }, (err, subscriptions) => {
    Promise.all(
      subscriptions.map(subscription => {
        axios.post(
          `${FCM_API}/${subscription.application}/${subscription.token}`,
          {
            title: "Aikido - Stages",
            body: `Cette semaine il y a ${
              TRAININGSHIPS[subscription.data.region].length
            } stages ${REGIONS[subscription.data.region]}`
          }
        );
      })
    )
      .then(() => {
        console.log(`${subscriptions} subscriptions sent`);
      })
      .catch(err => {
        console.err(err);
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
    const res = await axios.get(`${STAGE_API}/stages?region=${region}`);
    return res.data.stages;
  } catch (err) {
    console.error(err);
    return [];
  }
}

// Call main function
main();
