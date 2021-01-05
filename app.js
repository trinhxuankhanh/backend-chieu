const express = require("express");
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const cors = require("cors");
const ObjectId = require("mongodb").ObjectID;
const captureWebsite = require("capture-website");
const BookMark = require("./models/bookmark").BookMark;
const bcypt = require("bcrypt-nodejs");
const fs = require("fs");
const connectionString =
  "mongodb+srv://user:khanhPRO123@cluster0.4wmgd.mongodb.net/start-wars?retryWrites=true&w=majority";
const PORT = 7000;

const app = express();

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

MongoClient.connect(
  connectionString,
  { useUnifiedTopology: true },
  (err, client) => {
    if (err) return console.error(err);
    console.log("Connected to Database");
    const db = client.db("bookmarksuppervip");
    const bookMarksCollection = db.collection("bookmarks");

    app.get("/", (req, res) => {
      res.send("Hello");
    });

    app.post("/bookmark", (req, res) => {
      const options = {
        width: 400,
        height: 300,
      };

      (async () => {
        await captureWebsite.file(
          req.body.url,
          `./images/${req.body.title}.png`,
          options
        );
      })()
        .then((result) => {
          const newBookMark = new BookMark();
          (newBookMark.title = req.body.title),
            (newBookMark.url = req.body.url),
            (newBookMark.user = req.body.id),
            (newBookMark.img.data = fs.readFileSync(
              `./images/${req.body.title}.png`
            ));
          newBookMark.img.contentType = "image/png";

          return newBookMark;
        })
        .then((newBookMark) => {
          bookMarksCollection
            .insertOne(newBookMark)
            .then((result) => {
              res.status(201).json({ some: "response" });
            })
            .catch((err) => {
              console.log(err);
            });
        });
    });

    app.post("/bookmarks/", (req, res) => {
      db.collection("bookmarks")
        .find({
          user: req.body.id,
        })
        .toArray()
        .then((result) => {
          res.send(result);
        })
        .catch((err) => console.log(err));
    });

    app.delete("/deletebookmark/:id", (req, res) => {
      const id = req.params.id.slice(8, req.params.id.length - 2);

      bookMarksCollection
        .findOne({
          _id: ObjectId(id),
        })
        .then((result) => {
          fs.unlinkSync(`./images/${result.title}.png`);
        })
        .catch((err) => console.log(err));

      bookMarksCollection
        .deleteOne({
          _id: ObjectId(id),
        })
        .then((result) => {
          if (result.deletedCount === 0) {
            return res.json("No quote to delete");
          }
          res.status(201).json({ some: "response" });
        })
        .catch((error) => console.error(error));
    });

    app.put("/updatebookmark/", (req, res) => {
      bookMarksCollection
        .findOne({
          _id: ObjectId(req.body.id),
        })
        .then((result) => {
          fs.unlinkSync(`./images/${result.title}.png`);
        })
        .catch((err) => console.log(err));

      const options = {
        width: 400,
        height: 300,
      };

      (async () => {
        await captureWebsite.file(
          req.body.url,
          `./images/${req.body.title}.png`,
          options
        );
      })().then((result) => {
        bookMarksCollection
          .updateOne(
            {
              _id: ObjectId(req.body.id),
            },
            {
              $set: {
                title: req.body.title,
                url: req.body.url,
                img: {
                  data: fs.readFileSync(`./images/${req.body.title}.png`),
                },
              },
            }
          )
          .then((result) => {
            res.status(201).json({ some: "response" });
          })
          .catch((err) => console.log(err));
      });
    });

    app.post("/register", (req, res) => {
      const newUser = {
        email: req.body.email,
        password: bcypt.hashSync(req.body.password, bcypt.genSaltSync(8), null),
      };

      bookMarksCollection
        .insertOne(newUser)
        .then((result) => {
          res.status(201).json({ some: "response" });
        })
        .catch((err) => {
          console.log(err);
        });
    });

    app.post("/login", (req, res) => {
      bookMarksCollection
        .findOne({
          email: req.body.email,
        })
        .then((result) => {
          const pass = bcypt.compareSync(req.body.password, result.password);
          pass
            ? res.status(201).json({ isAuth: true, userId: result._id })
            : res.status(201).json({ isAuth: false });
        })
        .catch((err) => res.status(201).json({ isAuth: false }));
    });
  }
);
