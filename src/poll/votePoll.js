const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

const TABLE = process.env.POLLS_TABLE;

exports.handler = async (event) => {
  try {
    const pollId = event.pathParameters?.id;
    const { optionId } = JSON.parse(event.body || "{}");

    if (!pollId || !optionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "pollId and optionId required" }),
      };
    }

    const result = await db.send(
      new GetCommand({
        TableName: TABLE,
        Key: { id: pollId },
      })
    );

    const poll = result.Item;

    if (!poll) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "poll not found" }),
      };
    }

    const updatedOptions = poll.options.map((opt) => {
      if (opt.id === optionId) {
        return { ...opt, votes: (opt.votes || 0) + 1 };
      }
      return opt;
    });

    await db.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { id: pollId },
        UpdateExpression: "set options = :o",
        ExpressionAttributeValues: {
          ":o": updatedOptions,
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "vote recorded" }),
    };
  } catch (err) {
    console.error("VOTE ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: "server error" }),
    };
  }
};