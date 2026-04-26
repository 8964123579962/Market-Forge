let mods = [];

exports.handler = async (event) => {

  // ================= GET MODS =================
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      body: JSON.stringify(mods)
    };
  }

  // ================= ADD MOD (BOT) =================
  if (event.httpMethod === "POST") {

    try {
      const data = JSON.parse(event.body || "{}");

      // basic validation (prevents broken entries)
      if (!data.name || typeof data.name !== "string") {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid mod name" })
        };
      }

      const mod = {
        id: data.id || Date.now().toString(),
        name: data.name,
        type: data.type || "Addon",
        by: data.by || "Market Forge",
        image: data.image || null,
        download: data.download || null,
        createdAt: new Date().toISOString()
      };

      // add newest first
      mods.unshift(mod);

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "Mod added",
          mod
        })
      };

    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Server error", details: err.message })
      };
    }
  }

  // ================= INVALID METHOD =================
  return {
    statusCode: 405,
    body: JSON.stringify({ error: "Method not allowed" })
  };
};
