module.exports = function(app, client, generatePokemon) {
    const express = require('express');
    const router = express.Router();

    router.post("/addPokemon", async (request, response) => {
        const variables = {
            addPokemonForm: `<form action="/teambuild/search" method="post">`,
            display: "",
            display1: "",
            val: ""
        }
        response.render("pokemon", variables);
    });
    router.post("/search", async (request, response) => {
        let {search} = request.body;
        const data = await getPokemon(search.toLowerCase().replace('-', '').replace(' ', '').replace('.', ''));
        const pokemon = data == null ? null : data.getPokemon;
        const variables = {
            addPokemonForm: `<form action="/teambuild/search" method="post">`,
            display: pokemon == null ? "No Pokemon Found" : 
                `<table><tr><th></th><th>Pokemon</th><th>Stats</th><th>Other</th></tr>${generatePokemon(pokemon, 1)}</table>`,
            display1: pokemon == null ? "" : `<form action="/teambuild/confirmAdd" method="post"><input type="submit" name="confirm" value="Add ${pokemon.species}"></form>`,
            val: search
        }
        response.render("pokemon", variables);
    });
    router.post("/confirmAdd", async (request, response) => {
        let {confirm} = request.body;
        const search = confirm.slice(4);
        const data = await getPokemon(search.toLowerCase().replace('-', '').replace(' ', '').replace('.', ''));
        const pokemon = data.getPokemon;
        try {
            const database = client.db("CMSC335DB");
            const collection = database.collection("LoginInfo");
            const filter = { username: localStorage.getItem("currUser")};
            let result = await collection.findOne(filter);
            let userTeam = result.team;
            userTeam.push(pokemon);
            const update = { $set: {team : userTeam} };
            let res = await collection.updateOne(filter, update);
            const variables = {
                team: result.team.reduce((a, b) => [`${a[0]}${generatePokemon(b, a[1])}`, a[1] + 1], ["", 1])[0],
                add: result.team.length == 6 ? "" : `<form action="/teambuild/addPokemon" method="post"><input type="submit" value="Add Pokemon"></form>`
            }
            response.render("team", variables);
        } catch (e) {
            console.error(e);
        }
    });
    app.use('/teambuild', router);
};
async function getPokemon(name) {
    const json = fetch('https://graphqlpokemon.favware.tech/v8', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: `
            {
                getPokemon(pokemon: ${name}) {
                    sprite
                    height
                    weight
                    baseStats {
                        attack
                        defense
                        hp
                        specialattack
                        specialdefense
                        speed
                    }
                    species
                }
            }
            `
        })}).then((resp) => resp.json()).then((json) => json.data).catch((e) => console.log(e));
    return json;
}