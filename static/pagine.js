let socket = new WebSocket("ws://localhost:8888/ws");
let data_tot = null;
let query_search = "";

function creaBarra() {
    const searchContainer = document.createElement("div");
    searchContainer.classList.add("search-container");

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Cerca squadra o campionato...";
    searchInput.classList.add("search-box");

    const searchIcon = document.createElement("span");
    searchIcon.classList.add("search-icon");
    searchIcon.innerHTML = "🔍";

    searchInput.addEventListener("input", (e) => {
        query_search = e.target.value.toLowerCase();
        if (data_tot) {
            render_pag(data_tot);
        }
    });

    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(searchIcon);

    const container = document.getElementById("output");
    container.parentNode.insertBefore(searchContainer, container);
}

function filtro(dataset) {
    if (!query_search) {
        return dataset;
    }

    const dati = [];
    const query = query_search.toLowerCase();

    for (const item of dataset) {
        if (
            item.match_hometeam_name.toLowerCase().includes(query) ||
            item.match_awayteam_name.toLowerCase().includes(query) ||
            item.league_name.toLowerCase().includes(query) ||
            item.country_name.toLowerCase().includes(query) 
           ) 
            dati.push(item);
    }
    return dati;
}



function render_pag(data) {
    const container = document.getElementById("output");
    container.innerHTML = "";
    
    let dataset;
    if (mode === "finished")
        dataset = data.future;
    else if(mode === "live")
        dataset = data.live;
    
    dataset = filtro(dataset);
    
    if (dataset.length === 0) {
        const noResults = document.createElement("p");
        noResults.textContent = "Nessun risultato trovato";
        noResults.style.cssText = "text-align: center; padding: 40px; color: #666; font-size: 18px;";
        container.appendChild(noResults);
        return;
    }
    
    let grouped = {};
    
    for (const item of dataset) {
        if (!(item.league_id in grouped))
            grouped[item.league_id] = [item];
        else 
            grouped[item.league_id].push(item);
    }
    
    const sortedLeagueIds = Object.keys(grouped).sort((a, b) => {
        return grouped[b].length - grouped[a].length;
    });
    
    for (let index in sortedLeagueIds) {
        const leagueId = sortedLeagueIds[index];
        
        const title = document.createElement("h2");
        let league_name = grouped[leagueId][0].league_name;
        if (grouped[leagueId][0].league_name === "intl") {
            league_name = "Internazionale";
        }
        
        title.innerHTML =
            league_name + " - " +
            grouped[leagueId][0].country_name +
            ` <img src="${grouped[leagueId][0].country_logo}" style="height:20px; vertical-align:middle;">`;
        container.appendChild(title);
        
        const leagueGroup = document.createElement("div");
        leagueGroup.className = "league-group" + (grouped[leagueId].length === 1 ? " single-match" : "");
        
        for (const item of grouped[leagueId]) {
            const matchBox = document.createElement("a");
            matchBox.className = "match";
            
            let state;
            if (item.match_live === "1") {
                state = "live";
            } else if (item.match_status === "Finished") 
                   { state = "finished"; }
                 else{
                     { state = "notlive";}
                }
            matchBox.href = `dettagli?match_id=${item.match_id}&status=${state}`;
            
            const imgHome = document.createElement("img");
            const imgAway = document.createElement("img");
            
            imgHome.src = item.team_home_badge === "" ? "/assets/no_logo.png" : item.team_home_badge;
            imgAway.src = item.team_away_badge === "" ? "/assets/no_logo.png" : item.team_away_badge;
            
            const p = document.createElement("p");
            
            if (mode === "finished") {
                switch (true) {
                    case !isNaN(parseInt(item.match_status)):
                        p.innerHTML = `<span style="color: red;">LIVE: </span>${item.match_hometeam_name} vs ${item.match_awayteam_name}<br>${item.match_hometeam_score} - ${item.match_awayteam_score}<br>⏱️ ${item.match_status}"`;
                        break;
                    
                    case item.match_status === "Penalties":
                    case item.match_status === "Half Time":
                        p.innerHTML = `<span style="color: red;">LIVE: </span> ${item.match_hometeam_name} vs ${item.match_awayteam_name}<br>${item.match_hometeam_score} - ${item.match_awayteam_score}<br>⏱️ ${item.match_status}`;
                        break;
                    
                    case item.match_status === "Finished":
                    case item.match_status === "After Pen.":
                        p.innerHTML = `${item.match_hometeam_name} vs ${item.match_awayteam_name}<br>${item.match_hometeam_score} - ${item.match_awayteam_score}`;
                        break;
                    
                    case item.match_status === "Postponed":
                        p.innerText = `PARTITA RINVIATA`;
                        break;
                    
                    case item.match_status === "Cancelled":
                        p.innerText = `PARTITA CANCELLATA`;
                        break;
                    
                    default:
                        p.innerText = `${item.match_hometeam_name} vs ${item.match_awayteam_name} Orario: ${item.match_time}`;
                        break;
                }
            } else {
                const minuto = parseInt(item.match_status);
                let minuti_text;
                if (!isNaN(minuto)) {
                    minuti_text = `⏱️ ${item.match_status}"`;
                } else {
                    minuti_text = `${item.match_status}`;
                }
                p.innerHTML = `${item.match_hometeam_name} vs ${item.match_awayteam_name}<br>${item.match_hometeam_score} - ${item.match_awayteam_score}<br>${minuti_text}`;
            }
            
            matchBox.append(imgHome, p, imgAway);
            leagueGroup.appendChild(matchBox);
        }
        
        container.appendChild(leagueGroup);
    }
}

socket.onopen = () => {
    console.log("WebSocket aperto");
    creaBarra();
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    data_tot = data;
    render_pag(data);
};
