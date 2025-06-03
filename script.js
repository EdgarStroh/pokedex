let allPokemon = [];
let amountLoadPokemon = 30;

function init() {
    render();
}

function loadMorePokemon(){
    amountLoadPokemon += 15;
    render();
}

function loadingSpinner(){
    
    let pokemonContainerSpinner = document.getElementById("pokemonContainerSpinner");
    pokemonContainerSpinner.innerHTML = "";

    pokemonContainerSpinner.innerHTML = `
    <div class="wrapper">
        <div class="pokeball"></div>
    </div>  
    `; 
}
function disableLoadingSpinner(){
    let pokemonContainerSpinner = document.getElementById("pokemonContainerSpinner");
    pokemonContainerSpinner.innerHTML = "";
}

async function render() {
    try {
        loadingSpinner();

        let pokemonContainer = document.getElementById("pokemonContainer");
        pokemonContainer.innerHTML = "";

        await fetchAndDisplayPokemon();
        showAndScrollPokemon();
    } catch (error) {
        console.error("Fetch error: ", error);
    }
}

function showAndScrollPokemon() {
    displayPokemon(allPokemon.slice(0, amountLoadPokemon)); 
    if (amountLoadPokemon > 40) {
        document.getElementById("scrollAnchor").scrollIntoView({ behavior: "smooth" });
    }
}

async function fetchAndDisplayPokemon() {
    try {
        for (let index = allPokemon.length + 1; index <= amountLoadPokemon; index++) {
            let pokemon = await fetch(`https://pokeapi.co/api/v2/pokemon/${index}`);

            if (!pokemon.ok) {
                throw new Error("Network response was not ok");
            }
            let pokemonAsJson = await pokemon.json();
            processPokemonData(index, pokemonAsJson);
        }
    } catch (error) {
        console.error("Fetch error in fetchAndDisplayPokemon: ", error);
    }
}

function processPokemonData(index, pokemonAsJson) {
    let pokemonName = pokemonAsJson.forms[0].name;
    let pokemonType = pokemonAsJson.types.map(typeInfo => typeInfo.type.name);
    let pokemonImage = pokemonAsJson.sprites.other['dream_world'].front_default;
    let backgroundColor;
    if (pokemonType.length > 1) {
        backgroundColor = `linear-gradient(to right, ${typeColors[pokemonType[0]]}, ${typeColors[pokemonType[1]]})`;
    } else {
        backgroundColor = typeColors[pokemonType[0]];
    }
    pokemonPushIntoAllPokemon(index, pokemonName, pokemonImage, pokemonType, backgroundColor);
}

function pokemonPushIntoAllPokemon(index, name, image, types, backgroundColor) {
    allPokemon.push({
        index,
        name,
        image,
        types,
        backgroundColor
    });
}

function displayPokemon(pokemonList) {
    let pokemonContainer = document.getElementById("pokemonContainer");
    pokemonContainer.innerHTML = "";
    pokemonList.forEach(pokemon => {
        pokemonContainer.innerHTML += htmlDisplayPokemon(pokemon);
    });
    disableLoadingSpinner();
}

function htmlDisplayPokemon(pokemon) {
    return `
        <div class="pokemonContent" onclick="popup(${pokemon.index}, '${pokemon.name}', '${pokemon.image}', '${pokemon.types.join(', ')}', '${pokemon.backgroundColor}')">
            <div class="nameAndID">
                <h1 class="pokemonName">${pokemon.name}</h1>
            </div>
            <div class="pokemonImg" style="background: ${pokemon.backgroundColor}">
                <img class="pokemonImage" src="${pokemon.image}" />
            </div>
            <div class="pokemonTypes">
                ${pokemon.types.map(type => `<span class="${type}">${type}</span>`).join(' ')}
            </div>
        </div>
    `;
}

function searchPokemon() {
    let searchBar = document.getElementById("searchBar");
    let searchTerm = searchBar.value.toLowerCase();

    if (searchTerm.length >= 3) {
        let filteredPokemon = allPokemon.filter(pokemon => pokemon.name.includes(searchTerm));
        displayPokemon(filteredPokemon.slice(0, 10)); 
    } else {
        displayPokemon(allPokemon.slice(0, amountLoadPokemon)); 
    }
}

async function popup(index) {
    try {
        let popup = document.getElementById("popup-content");
        popup.innerHTML = ""; 

        let pokemonDescription = await fetchPokemonDescription(index);
        pokemonDescription = cleanFlavorText(pokemonDescription);

        let pokemonDataAsJson = await fetchPokemonData(index);
        let { pokemonName, pokemonID, pokemonImage, height, weight, pokemonType, backgroundColor, stats } = processPokemonDetails(pokemonDataAsJson);

        let prevButtonVisibility = index > 1 ? "visible" : "hidden";
        let pokemonStats = generatePokemonStats(stats);
        let pokemonAbilities = pokemonDataAsJson.abilities.map(abilityInfo => abilityInfo.ability.name);

        popup.innerHTML = htmlTemplatePopup(pokemonName, backgroundColor, pokemonImage, pokemonType, prevButtonVisibility, index, pokemonDescription, pokemonStats, pokemonAbilities, weight, height, pokemonID);

    } catch (error) {
        console.error("Error in popup:", error);
    }
    openPopup();
}

async function fetchPokemonDescription(index) {
    let pokemonText = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${index}`);
    if (!pokemonText.ok) {
        throw new Error("Failed to fetch Pokemon description");
    }
    let pokemonTextAsJson = await pokemonText.json();
    return pokemonTextAsJson.flavor_text_entries.find(entry => entry.language.name === "en").flavor_text;
}

async function fetchPokemonData(index) {
    let pokemonData = await fetch(`https://pokeapi.co/api/v2/pokemon/${index}`);
    if (!pokemonData.ok) {
        throw new Error("Failed to fetch Pokemon data");
    }
    return await pokemonData.json();
}

function processPokemonDetails(pokemonDataAsJson) {
    let pokemonName = pokemonDataAsJson.forms[0].name;
    let pokemonID = pokemonDataAsJson.id;
    let pokemonImage = pokemonDataAsJson.sprites.other['dream_world'].front_default;
    let height = pokemonDataAsJson.height / 10;
    let weight = pokemonDataAsJson.weight / 10;
    let pokemonType = pokemonDataAsJson.types.map(typeInfo => typeInfo.type.name);
    let backgroundColor = pokemonType.length > 1 
        ? `linear-gradient(to right, ${typeColors[pokemonType[0]]}, ${typeColors[pokemonType[1]]})`
        : typeColors[pokemonType[0]];
    let stats = extractPokemonStats(pokemonDataAsJson);
    ;
    return { pokemonName, pokemonID, pokemonImage, height, weight, pokemonType, backgroundColor, stats };
}

function extractPokemonStats(pokemonDataAsJson) {
    return pokemonDataAsJson.stats.map(statInfo => {
        let name = statInfo.stat.name;
        let capitalized_name = name.charAt(0).toUpperCase() + name.slice(1);
        let formatted_name = `<strong>${capitalized_name.split(' ')[0]}</strong>`;
        return { name: formatted_name, base_stat: statInfo.base_stat };
    });
}

function generatePokemonStats(stats) {
    return stats.map(stat => `<div>${stat.name}: ${stat.base_stat}</div>`).join('');
}

function htmlTemplatePopup(pokemonName, backgroundColor, pokemonImage, pokemonType, prevButtonVisibility, index, pokemonDescription, pokemonStats, pokemonAbilities, weight, height, pokemonID) {
    return `
        <div class="card"> 
            <div class="popupNameAndID">
                <h1 class="card-title"><u>${pokemonName}</u></h1>
            </div>
            <div class="pokemonImgPopup" style="background: ${backgroundColor}">   
                <img src="${pokemonImage}">
            </div>
            <div class="pokemonTypesPopup">
                ${pokemonType.map(type => `<span class="${type}">${type}</span>`).join(' ')}
            </div>
            <div class="popupButtons">
                <button class="prevPokemon" style="visibility: ${prevButtonVisibility}" onclick="prevPokemon(${index})">
                    <div class="fas fa-arrow-left"></div>
                </button>
                <button class="nextPokemon" onclick="nextPokemon(${index})">
                    <div class="fas fa-arrow-right"></div>
                </button>
            </div>
            <div id="popupPokemonInfoBox" class="card-text">
                ${pokemonDescription}      
            </div>
            <div class="card-body">
                <div class="btn-group" role="group" aria-label="Basic radio toggle button group">
                    <input type="radio" class="btn-check" name="btnradio" id="btnradio1" autocomplete="off" checked>
                    <label class="btn btn-outline-primary" for="btnradio1" onclick="showDescription('${pokemonDescription}')">Description</label>
                    <input type="radio" class="btn-check" name="btnradio" id="btnradio2" autocomplete="off">
                    <label class="btn btn-outline-primary" for="btnradio2" onclick='showStats("${pokemonStats}")'>Stats</label>
                    <input type="radio" class="btn-check" name="btnradio" id="btnradio3" autocomplete="off">
                    <label class="btn btn-outline-primary" for="btnradio3" onclick='showAttributes(${JSON.stringify(pokemonAbilities)}, ${weight}, ${height}, ${pokemonID})'>Attributes</label>
                </div>
            </div>
        </div>
    `;
}

function showAttributes(pokemonAbilities, weight, height, id) {
    let abilitysBox = document.getElementById("popupPokemonInfoBox");
    abilitysBox.innerHTML = ""; 
    abilitysBox.innerHTML = htmlTemplateShowAttributes(id,pokemonAbilities, weight,height);
}

function htmlTemplateShowAttributes(id,pokemonAbilities, weight,height){
    return `
        <strong>Nationaldex:</strong> #${id}<br>
        <strong>Abilities:</strong> ${pokemonAbilities}<br>
        <strong>Bodyweight:</strong> ${weight} Kg<br>
        <strong>Height:</strong> ${height} Meter
    `;
}

function prevPokemon(index) {
    if (index > 1) {
        index--;
        popup(index);
    } 
}

function nextPokemon(index) {
    index++;
    popup(index);
}

function showStats(PokemonStats) {
    let statsBox = document.getElementById("popupPokemonInfoBox");
    statsBox.innerHTML = ""; 
    statsBox.innerHTML = PokemonStats; 
}

function showDescription(pokemonDescription) {
    let descriptionBox = document.getElementById("popupPokemonInfoBox");
    descriptionBox.innerHTML = "";
    descriptionBox.innerHTML = pokemonDescription; 
}

function openPopup() {
    document.getElementById("popup").style.display = "flex"; 
    document.body.style.overflow = "hidden";
    // document.body.style.marginRight = "12px";
}

function closePopup() {
    document.getElementById("popup").style.display = "none"; 
    document.body.style.overflow = ""; 

    // Reset margin-right of body
    document.body.style.marginRight = "";
}

function cleanFlavorText(text) {
    return text.replace(/\n|\f/g, ' ');
}

