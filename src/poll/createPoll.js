const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const { randomUUID } = require("crypto");

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

const TABLE = process.env.POLLS_TABLE;

// handler is guide that connects API Gateway to our Lambda function, it receives events and returns responses, determining which code to execute based on the incoming request and its parameters
exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");

    const { question, options } = body;

    // validation
    if (!question || !Array.isArray(options) || options.length < 2) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "question and at least 2 options required",
        }),
      };
    }

    // build poll object
    const poll = {
      id: randomUUID(),
      question,
      options: options.map((text) => ({
        id: randomUUID(),
        text,
        votes: 0,
      })),
      createdAt: new Date().toISOString(),
    };

    // save to DynamoDB
    await db.send(
      new PutCommand({
        TableName: TABLE,
        Item: poll,
      }),
    );

    return {
      statusCode: 201,
      body: JSON.stringify(poll),
    };
  } catch (err) {
    console.error("CREATE POLL ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: "internal server error" }),
    };
  }
};
