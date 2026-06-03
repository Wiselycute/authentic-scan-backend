require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connect } = require("./configs/database.config");
const userRoute = require("./routes/user.route");

const run = async () => {
  try {
    const port = process.env.PORT || 4000;
    const app = express();
    await connect();
    app.use(cors());
    app.use(express.json());

    // import routes
    app.use("/users", userRoute);

    app.listen(port, () => {
      console.log(`Application is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.log(error);
  }
};

run();
