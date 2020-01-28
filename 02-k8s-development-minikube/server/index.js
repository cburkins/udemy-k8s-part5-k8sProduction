const keys = require("./keys");

// Express App Setup
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

// ------------------------------------------------------------------------------------------------

// This is a neat function that can repeatedly call user's async function until it succeeds
// e.g. checking to see if database connection is functional
// fn = function to be called, times = number of attempt, delay = interval in milliseconds
PromiseRetry = function(fn, times, delay) {
    // Send a Promise back to caller
    return new Promise(function(resolve, reject) {
        var error;
        // Closure will also remember fn, times, and delay

        // Create attempt() function
        var attempt = function() {
            if (times == 0) {
                reject(error);
            } else {
                // Call the function provided by the user/caller
                fn()
                    .then(resolve)
                    .catch(function(e) {
                        console.log(`== Postgres Connect Failure (${times} attempts remaining, interval is ${delay / 1000}s)`);

                        // Decrement "times", remember "error" received, and after a delay, call attempt() again
                        times--;
                        error = e;
                        setTimeout(function() {
                            attempt();
                        }, delay);
                    });
            }
        };

        // Call the function we created
        attempt();
    });
};

// ------------------------------------------------------------------------------------------------

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require("pg");
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
});
pgClient.on("error", () => console.log("Lost PG connection"));

// Redis Client Setup
const redis = require("redis");
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();

// Express: create a route
app.get("/", (req, res) => {
    res.send("Hi");
});

// Express: create a route
app.get("/values/all", async (req, res) => {
    const values = await pgClient.query("SELECT * from values");

    res.send(values.rows);
});

// Express: create a route
app.get("/values/current", async (req, res) => {
    redisClient.hgetall("values", (err, values) => {
        res.send(values);
    });
});

// Express: create a route
app.post("/values", async (req, res) => {
    const index = req.body.index;

    if (parseInt(index) > 40) {
        return res.status(422).send("Index too high");
    }

    redisClient.hset("values", index, "Nothing yet!");
    redisPublisher.publish("insert", index);
    pgClient.query("INSERT INTO values(number) VALUES($1)", [index]);

    res.send({ working: true });
});

// Create a Promise that attempts to repeatedly run an async command until it succeeds
// Args: async fn to run, number of retries, delay in ms between attempts
mypromise = PromiseRetry(
    () => {
        return pgClient.query("SELECT 1");
    },
    10,
    5000
);

// if promise resolves, then Postgres is up, and we can start listening
// if promise rejects (err), then print an error, and forcibly exit
mypromise.then(
    function(result) {
        console.log("\n>>Postgres UP"); // "Stuff worked!"

        // Create our desired table
        pgClient.query("CREATE TABLE IF NOT EXISTS values (number INT)").catch(err => console.log(err));

        // Now that we know Postgres is working, we can start receiving inbound API calls
        app.listen(5000, err => {
            console.log("\nNode Express now listening on port 5000 for inbound API calls...\n");
        });
    },
    function(err) {
        console.log("\n>>Posgres DOWN\n\n", "Error received:\n------------------\n", err); // Error: "It broke"
        console.log();
        process.exit(1);
    }
);
