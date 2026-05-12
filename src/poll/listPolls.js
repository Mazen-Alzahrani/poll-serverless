const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

const TABLE = process.env.POLLS_TABLE;

exports.handler = async () => {
  try {
    const result = await db.send(
      new ScanCommand({ TableName: TABLE })
    );

    return {
      statusCode: 200,
      body: JSON.stringify(result.Items || []),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "failed to fetch polls" }),
    };
  }
};