const QRCode = require("qrcode");

exports.handler = async (event) => {
  try {
    const pollId = event.pathParameters?.id;

    if (!pollId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "poll id is required" }),
      };
    }

    const FRONTEND_URL =
      process.env.FRONTEND_URL || "http://localhost:5173";

    const url = `${FRONTEND_URL}/poll/${pollId}`;

    const qr = await QRCode.toDataURL(url);

    return {
      statusCode: 200,
      body: JSON.stringify({
        pollId,
        url,
        qr,
      }),
    };
  } catch (err) {
    console.error("QR ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: "qr generation failed" }),
    };
  }
};