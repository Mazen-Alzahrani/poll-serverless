const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});

const db = DynamoDBDocumentClient.from(client);

const TABLE = process.env.POLLS_TABLE;

exports.handler = async (event) => {
  try {
    const pollId = event.pathParameters?.id;

    if (!pollId) {
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
        Key: { id: pollId },
      }),
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

    const totalVotes = poll.options.reduce(
      (sum, opt) => sum + (opt.votes || 0),
      0,
    );

    const optionsWithStats = poll.options.map((opt) => {
      const percentage = totalVotes === 0 ? 0 : (opt.votes / totalVotes) * 100;

      return {
        id: opt.id,
        text: opt.text,
        votes: opt.votes,
        percentage: Number(percentage.toFixed(2)),
      };
    });

    return {
      statusCode: 200,

      body: JSON.stringify({
        pollId: poll.id,
        question: poll.question,
        totalVotes,
        results: optionsWithStats,
      }),
    };
  } catch (err) {
    console.error(err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "server error",
      }),
    };
  }
};
