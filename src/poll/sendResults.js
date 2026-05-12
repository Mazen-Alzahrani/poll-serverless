const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});

const db = DynamoDBDocumentClient.from(client);

const TABLE = process.env.POLLS_TABLE;

const CLICKUP_TOKEN = process.env.CLICKUP_TOKEN;

const CLICKUP_WORKSPACE_ID = process.env.CLICKUP_WORKSPACE_ID;

const CLICKUP_CHANNEL_ID = process.env.CLICKUP_CHANNEL_ID;

exports.handler = async (event) => {
  try {
    const pollId = event.pathParameters?.id;

    if (!pollId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "poll id required",
        }),
      };
    }

    // get poll
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

    // calculate results
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

    const resultsText = poll.options
      .map((opt) => {
        const percent =
          totalVotes === 0 ? 0 : ((opt.votes / totalVotes) * 100).toFixed(2);

        return `- ${opt.text}: ${opt.votes} votes (${percent}%)`;
      })
      .join("\n");

    const messageText = `
Poll Results

Question:
${poll.question}

Total Votes:
${totalVotes}

Results:
${resultsText}
`;

    // send message to clickup chat
    const response = await fetch(
      `https://api.clickup.com/api/v3/workspaces/${CLICKUP_WORKSPACE_ID}/chat/channels/${CLICKUP_CHANNEL_ID}/messages`,
      {
        method: "POST",

        headers: {
          Authorization: CLICKUP_TOKEN,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          content: messageText,
        }),
      },
    );

    if (!response.ok) {
      const err = await response.text();

      console.error(err);

      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "failed to send to clickup",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "results sent successfully",
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
// send poll results to clickup channel for the given poll id