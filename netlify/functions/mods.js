const fs = require("fs");

exports.handler = async () => {

  try {

    const data = fs.readFileSync("/tmp/mods.json", "utf8");

    return {
      statusCode: 200,
      body: data
    };

  } catch(e){

    return {
      statusCode: 200,
      body: "[]"
    };

  }

};
