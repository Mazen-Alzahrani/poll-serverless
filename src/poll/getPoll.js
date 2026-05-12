const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

const TABLE = process.env.POLLS_TABLE;

exports.handler = async (event) => {
  try {
    const id = event.pathParameters?.id;

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "poll id is required",
        }),
      };
    }

    const result = await db.send(
      new GetCommand({
        TableName: TABLE,
        Key: { id },
      })
    );

    const poll = result.Item;

    if (!poll) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "poll not found",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(poll),
    };
    
  } catch (err) {
    console.error("GET POLL ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "internal server error",
      }),
    };
  }
};