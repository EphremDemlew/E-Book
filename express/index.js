const express = require("express");
const bcrypt = require("bcryptjs");
const helmet = require("helmet");
require("dotenv").config();

const app = express();

app.use(express.json());
// app.use(helmet());

app.get("/", (req, res) => {
  res.send("Server running ... ");
});

const HASURA_OPERATION = `
mutation sign_up($email: String = "ephy@gmail.com", $first_name: String = "", $last_name: String = "", $password: String = "") {
  insert_users_one(object: {email: $email, first_name: $first_name, last_name: $last_name, password: $password}) {
    email
    first_name
    last_name
  }
}
`;

// execute the parent operation in Hasura
const execute = async (variables) => {
  const fetchResponse = await fetch(
    "https://book-sales.hasura.app/v1/graphql",
    {
      method: "POST",
      headers: {
        "x-hasura-admin-secret": `${process.env.HASURA_GRAPHQL_ADMIN_SECRET}`,
      },
      body: JSON.stringify({
        query: HASURA_OPERATION,
        variables,
      }),
    }
  );
  const data = await fetchResponse.json();
  console.log("DEBUG: ", data);
  return data;
};

// Request Handler
app.post("/signup", async (req, res) => {
  // get request input
  const { email, first_name, last_name } = req.body.input;

  // run some business logic
  const password = await bcrypt.hash(req.body.input.password, 10);
  // execute the Hasura operation
  const { data, errors } = await execute({
    email,
    first_name,
    last_name,
    password,
  });

  // if Hasura operation errors, then throw error
  if (errors) {
    return res.status(400).json(errors[0]);
  }

  console.log(data);
  // success
  return res.json({
    ...data.insert_users_one,
  });
});

const port = process.env.PORT || 5050;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
