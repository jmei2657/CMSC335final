const path = require("path");
const bodyParser = require("body-parser");
const express = require("express");
require("dotenv").config({
   path: path.resolve(__dirname, ".env"),
});
const LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./scratch');
const { MongoClient, ServerApiVersion } = require("mongodb");
// const router = express.Router();

const app = express();
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "templates"));
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static('public'));
const portNumber = 5000;
const httpSuccessStatus = 200;
const url = "http://localhost:";
// console.log(process.argv);
app.listen(portNumber); 

console.log(`Web server is running at ${url}${portNumber}`);

app.get("/", (request, response) => {
    const variables = {
        loginForm: `<form action="${url}${portNumber}/login" method="post">`,
        createUserForm: `<form action="${url}${portNumber}/createUser" method="post">`,
        display: "",
        display1: ""
    }
    response.render("index", variables);
});
const databaseName = "CMSC335DB";
const uri = process.env.MONGO_CONNECTION_STRING;
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
(async () => {
    try {
        await client.connect();
    } catch (e) {
        console.error(e);
    }
});
const teambuilder = require("./routes/teambuild");
teambuilder(app, client, generatePokemon);

app.post("/login", async (request, response) => {
    let {name, password} = request.body;    
    try {
        const database = client.db(databaseName);
        const collection = database.collection("LoginInfo");
        const filter = { username: name, password: password};
        let result = await collection.findOne(filter);
        if (result === null) {
            const variables = {
                loginForm: `<form action="${url}${portNumber}/login" method="post">`,
                createUserForm: `<form action="${url}${portNumber}/createUser" method="post">`,
                display: "Invalid username or password.<br>",
                display1: ""
            }
            response.render("index", variables);
        } else {
            localStorage.setItem("currUser", name);
            const variables = {
                team: result.team.reduce((a, b) => [`${a[0]}${generatePokemon(b, a[1])}`, a[1] + 1], ["", 1])[0],
                add: result.team.length == 6 ? "" : `<form action="/teambuild/addPokemon" method="post"><input type="submit" value="Add Pokemon"></form>`
            }
            response.render("team", variables);
        }
    } catch (e) {
        console.error(e);
    }
});
app.post("/createUser", async (request, response) => {
    let {name1, password1, confirmPassword1} = request.body;    
    try {
        let create = "";
        if (password1 !== confirmPassword1) {
            create = "Password does not match.<br>";
        }
        const database = client.db(databaseName);
        const collection = database.collection("LoginInfo");
        const filter = {username: name1};
        let result = await collection.findOne(filter);
        if (result !== null && create === "") {
            create = "Username already exists.<br>";
        }
        if (create === "") {
            const newUser = { username: name1, password: password1, team: new Array()};
            let result = await collection.insertOne(newUser);
            localStorage.setItem("currUser", name1);
            let i = 1;
            const variables = {
                team: newUser.team.reduce((a, b) => [`${a[0]}${generatePokemon(b, a[1])}`, a[1] + 1], ["", 1])[0],
                add: newUser.team.length == 6 ? "" : `<form action="${url}${portNumber}/teambuild/addPokemon" method="post"><input type="submit" value="Add Pokemon"></form>`
            }
            response.render("team", variables);
        } else {
            const variables = {
                loginForm: `<form action="${url}${portNumber}/login" method="post">`,
                createUserForm: `<form action="${url}${portNumber}/createUser" method="post">`,
                display: "",
                display1: `${create}<br>`
            }
            response.render("index", variables);
        }
    } catch (e) {
        console.error(e);
    }
});
// app.post("/addPokemon", async (request, response) => {
//     const variables = {
//         addPokemonForm: `<form action="${url}${portNumber}/search" method="post">`,
//         display: "",
//         display1: "",
//         val: ""
//     }
//     response.render("pokemon", variables);
// });
// app.post("/search", async (request, response) => {
//     let {search} = request.body;
//     const data = await getPokemon(search.toLowerCase());
//     const pokemon = data == null ? null : data.getPokemon;
//     const variables = {
//         addPokemonForm: `<form action="${url}${portNumber}/search" method="post">`,
//         display: pokemon == null ? "No Pokemon Found" : 
//             `<table><tr><th>Pokemon</th><th>Stats</th><th>Other</th></tr>${generatePokemon(pokemon)}</table>`,
//         display1: `<form action="${url}${portNumber}/confirmAdd" method="post"><input type="submit" name="confirm" value="Add ${pokemon.species}"></form>`,
//         val: search
//     }
//     response.render("pokemon", variables);
// });
// app.post("/confirmAdd", async (request, response) => {
//     let {confirm} = request.body;
//     const search = confirm.slice(4);
//     const data = await getPokemon(search.toLowerCase());
//     const pokemon = data.getPokemon;
//     try {
//         const database = client.db(databaseName);
//         const collection = database.collection("LoginInfo");
//         const filter = { username: localStorage.getItem("currUser")};
//         let result = await collection.findOne(filter);
//         let userTeam = result.team;
//         userTeam.push(pokemon);
//         const update = { $set: {team : userTeam} };
//         let res = await collection.updateOne(filter, update);
//         const variables = {
//             team: result.team.reduce((a, b) => `${a}${generatePokemon(b)}`, ""),
//             add: result.team.length == 6 ? "" : `<form action="${url}${portNumber}/addPokemon" method="post"><input type="submit" value="Add Pokemon"></form>`
//         }
//         response.render("team", variables);
//     } catch (e) {
//         console.error(e);
//     }
// });

function generatePokemon(poke, i) {
    return `<tr><td rowspan="6">${i}</td><td>${poke.species}</td><td>HP: ${poke.baseStats.hp}</td><td>Height: ${poke.height}</td></tr>
            <tr><td rowspan="5"><img id="images" alt="animationImg" src="${poke.sprite}"></td>
                <td>Attack: ${poke.baseStats.attack}</td><td>Weight: ${poke.weight}</td></tr>
            <tr><td>Defense: ${poke.baseStats.defense}</td></tr>
            <tr><td>Special Attack: ${poke.baseStats.specialattack}</td></tr>
            <tr><td>Special Defense: ${poke.baseStats.specialdefense}</td></tr>
            <tr><td>Speed: ${poke.baseStats.speed}</td></tr>
            `;
}
// async function main() {
//     const data = await getPokemon("dragonite");
//     const pokemon = data.getPokemon;
//     console.log(pokemon);
//     const poke = new Pokemon(pokemon.species, pokemon.sprite, pokemon.baseStats, pokemon.height, pokemon.weight);

// }
// main();