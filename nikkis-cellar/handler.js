const AWS = require("aws-sdk");
const express = require("express");
const serverless = require("serverless-http");

const app = express();

const CELLAR_TABLE = process.env.CELLAR_TABLE;
const dynamoDbClient = new AWS.DynamoDB.DocumentClient();

app.use(express.json());

app.get("/cellar", async function (req, res) {
  const params = {
    TableName: CELLAR_TABLE
  };
  const scanResults = [];
  try {
    const items;
    do {
      items = await dynamoDbClient.scan(params).promise();
      items.Items.forEach((item) => scanResults.push(item));
      params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey !== "undefined");
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive cellar" });
  }
  res.status(200).json(scanResults);
}

)
app.get("/cellar/:id", async function (req, res) {
  const params = {
    TableName: CELLAR_TABLE,
    Key: {
      id: req.params.id,
    },
  };

  try {
    const { Item } = await dynamoDbClient.get(params).promise();
    if (Item) {
      const { id, vintage, winery, subblock, varietal, quantity, rating, notes } = Item;
      res.json({ id, vintage, winery, subblock, varietal, quantity, rating, notes });
    } else {
      res
        .status(404)
        .json({ error: 'Could not find bottle with provided "id"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive bottle" });
  }
});

app.post("/cellar", async function (req, res) {
  const { id, vintage, winery, subblock, varietal, quantity, rating, notes } = req.body;
  if (typeof id !== "string") {
    res.status(400).json({ error: '"id" must be a string' });
  } 

  const params = {
    TableName: CELLAR_TABLE,
    Item: {
        id : id,
        vintage  : vintage,
        winery   : winery,
        subblock : subblock,
        varietal : varietal,
        quantity : quantity,
        rating  : rating,
        notes : notes
    },
  };

  try {
    await dynamoDbClient.put(params).promise();
    res.json({ id, vintage, winery, subblock, varietal, quantity, rating, notes  });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create bottle" });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});


module.exports.handler = serverless(app);
