let socket = new WebSocket("ws://localhost:8888/ws");
const goalSound = new Audio("/assets/goal.mp3");
const fischio_half = new Audio("/assets/fischio_tempo.mp3");
const fischio_finale = new Audio("/assets/fischio_finale.mp3");


Minuti = {};
played = {};
Punti = {};
socket.onopen = () => console.log("WebSocket aperto");

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const match_id = new URLSearchParams(window.location.search).get('match_id');

    let dataset;
    if (mode === "finished")
        dataset = data.future;
    else if(mode === "live")
        dataset = data.live;

    for (const item of dataset) {
        if (item.match_id == match_id) {
            const output = document.getElementById("output");
         
            output.innerHTML = "";

            const detailView = document.createElement("div");
            const liveWrapper = document.createElement("div");
            const liveBadge = document.createElement("span");
            
            liveWrapper.appendChild(liveBadge);
            detailView.appendChild(liveWrapper);

            //PARTE LOGHI + PUNTEGGIO
            const scoreDisplay = document.createElement("div");
            scoreDisplay.className = "score-display";
            scoreDisplay.style.display = "flex";
            scoreDisplay.style.alignItems = "center";
            scoreDisplay.style.gap = "1rem";

            const teamLogos = document.createElement("div");
            teamLogos.className = "team-logos";

            const homeLogo = document.createElement("img");
            if (item.team_home_badge === "")
                homeLogo.src = "/assets/no_logo.png";
            else
                homeLogo.src = item.team_home_badge;

            const awayLogo = document.createElement("img");

            awayLogo.src = item.team_away_badge;
            if (item.team_away_badge === "")
                awayLogo.src = "/assets/no_logo.png";
            else
                awayLogo.src = item.team_away_badge;

            teamLogos.appendChild(homeLogo);

            const score = document.createElement("div");
            score.style.fontSize = "4rem";
            score.textContent = `${item.match_hometeam_score} - ${item.match_awayteam_score}`;

            const homeName = document.createElement("span");
            homeName.textContent = item.match_hometeam_name;

            const awayName = document.createElement("span");
            awayName.textContent = item.match_awayteam_name;

            scoreDisplay.appendChild(homeName);
            scoreDisplay.appendChild(score);
            scoreDisplay.appendChild(awayName);
            teamLogos.appendChild(scoreDisplay);
            teamLogos.appendChild(awayLogo);
            detailView.appendChild(teamLogos);
            // DIV MINUTI
            const minuteDiv = document.createElement("div");
            minuteDiv.style.textAlign = "center";
            minuteDiv.style.margin = "20px 0";
            

            const minuto = item.match_status;
            if (!isNaN(parseInt(minuto)))
                minuteDiv.textContent = `⏱️ Minuto: ${item.match_status}`;
            else if (minuto == "Finished")
                minuteDiv.textContent = `TERMINATA`;
            else
                minuteDiv.textContent = `${item.match_status}`;
            
            const arr = Minuti[item.match_id];
            if (!arr)
                Minuti[item.match_id] = [item.match_status];
            else if ( arr.at(-1) != item.match_status )
                Minuti[item.match_id].push(item.match_status);

            const bPlayed = played[match_id];
            if (!bPlayed)
                played[match_id] = {"Half Time": false, "Finished": false, "Started":false, "Second Half":false};
            


            if (arr && arr.length > 1){
                if (arr.at(-1) === "Half Time" && !bPlayed["Half Time"]) {
                    fischio_half.play();
                    played[match_id]["Half Time"] = true;
                }
                else if(arr.at(-1) === "46" && arr.at(-2) === "Half Time" && !bPlayed["Second Half"]){
                    fischio_half.play();
                    played[match_id]["Second Half"] = true;
                }
                else if(arr.at(-1) === "Not Started" && !bPlayed["Started"]){
                    fischio_half.play();
                    played[match_id]["Started"] = true;}

                else if(arr.at(-1) === "Finished" && !bPlayed["Finished"] ){
                    fischio_finale.play();
                    played[match_id]["Finished"] = true;
            }
            }
            const punteggi = Punti[item.match_id];
            if (!punteggi) {
                Punti[item.match_id] = {
                    "home": item.match_hometeam_score,
                    "away": item.match_awayteam_score
                };
            } else {
                if (punteggi["home"] != item.match_hometeam_score) {
                    goalSound.play();
                    Punti[item.match_id]["home"] = item.match_hometeam_score;
                }
                if (punteggi["away"] != item.match_awayteam_score) {
                    goalSound.play();
                    Punti[item.match_id]["away"] = item.match_awayteam_score;
                }
            }                
            
            detailView.appendChild(minuteDiv);
            aw_subentrati = [],aw_sostituti = [], ho_subentrati = [],ho_sostituti = [];

            for (const sub of item.substitutions.home) {
                const key = sub.substitution_player_id.split("|");
                ho_sostituti.push(key[0].trim());   // USCITO
                ho_subentrati.push(key[1].trim());  // ENTRATO
            }
            for (const sub of item.substitutions.away) {
                const key = sub.substitution_player_id.split("|");
                aw_sostituti.push(key[0].trim());   // USCITO
                aw_subentrati.push(key[1].trim());  // ENTRATO
            }
            
        
            const uscitiDiv = document.createElement("div");
            let home = item.lineup.home.starting_lineups
            let away = item.lineup.away.starting_lineups
            
            if (home.length > 0 && away.length > 0)
            {
                if(aw_sostituti.length > 0 || ho_sostituti.length>0)
                    {const subsTitle = document.createElement("h2");
                    subsTitle.textContent = "🔄 SOSTITUZIONI";
                    uscitiDiv.appendChild(subsTitle)}
            }

            for (const id of ho_subentrati)
                {
                    for (const giocatore of item.lineup.home.substitutes)
                        {
                            if (giocatore.player_key === id)
                                uscitiDiv.innerHTML += `
                                <div style="text-align: left;">
                                    <span style="color: green;"><b>⇄</b></span>
                                    ${giocatore.lineup_player}
                                </div><br>`;
                        }
                }
            for (const id of aw_subentrati)
            {
                for (const giocatore of item.lineup.away.substitutes)
                    {
                        if (giocatore.player_key === id)
                            uscitiDiv.innerHTML += `
                            <div style="text-align: right;">
                                <span style="color: green;"><b>⇄</b></span>
                                ${giocatore.lineup_player}
                            </div><br>`;
                    }
            }


            // FORMAZIONI
            if (item.lineup && item.lineup.home && item.lineup.away) {
                if (item.lineup.home.starting_lineups.length > 0 && item.lineup.away.starting_lineups.length){    
                    const lineupTitle = document.createElement("h2");
                    lineupTitle.textContent = "🏃‍♂️ Formazioni";
                    detailView.appendChild(lineupTitle);
                }
                const lineupContainer = document.createElement("div");
                lineupContainer.style.display = "grid";
                lineupContainer.style.gridTemplateColumns = "1fr 1fr";
                lineupContainer.style.gap = "20px";

                const homeDiv = document.createElement("div");
                const homeTitle = document.createElement("h3");
                homeTitle.textContent = item.match_hometeam_name;
                homeDiv.appendChild(homeTitle);

                const homeCoach = document.createElement("p");
                homeCoach.innerHTML = `<strong>Allenatore:</strong> ${item.lineup.home.coach?.[0]?.lineup_player || 'N/D'}`;
                homeDiv.appendChild(homeCoach);

                const homeList = document.createElement("ul");
                if (item.lineup.home.starting_lineups) {
                    item.lineup.home.starting_lineups.forEach(p => {
                        const li = document.createElement("li");

                        if (ho_sostituti.includes(p.player_key))
                            li.innerHTML = `
                                    <span style="color: red;">
                                    <b>⇄</b>
                                    </span>
                                    ${p.lineup_number} - ${p.lineup_player}
                                </div><br>
                            `;
                        else
                            li.innerHTML = `${p.lineup_number} - ${p.lineup_player}`;

                        homeList.appendChild(li);
                    });
                }
                homeDiv.appendChild(homeList);
                lineupContainer.appendChild(homeDiv);

                const awayDiv = document.createElement("div");
                const awayTitle = document.createElement("h3");
                awayTitle.textContent = item.match_awayteam_name;
                awayDiv.appendChild(awayTitle);

                const awayCoach = document.createElement("p");
                awayCoach.innerHTML = `<strong>Allenatore:</strong> ${item.lineup.away.coach?.[0]?.lineup_player || 'N/D'}`;
                awayDiv.appendChild(awayCoach);

                const awayList = document.createElement("ul");
                if (item.lineup.away.starting_lineups) {
                    item.lineup.away.starting_lineups.forEach(p => {
                        const li = document.createElement("li");
                        if (aw_sostituti.includes(p.player_key))
                            li.innerHTML = `
                                    <span style="color: red;">
                                    <b>⇄</b>
                                    </span>
                                    ${p.lineup_number} - ${p.lineup_player}
                                </div><br>
                            `;
                        else
                            li.textContent = `${p.lineup_number} - ${p.lineup_player}`;
                        awayList.appendChild(li);
                    });
                }

                awayDiv.appendChild(awayList);
                lineupContainer.appendChild(awayDiv);
                detailView.appendChild(lineupContainer);
            }

            detailView.appendChild(uscitiDiv);
            output.appendChild(detailView);

            // MARCATORI
            if (item.goalscorer.length > 0){
                const goalsTitle = document.createElement("h2");
                goalsTitle.textContent = "⚽ Marcatori";
                detailView.appendChild(goalsTitle);

            }

            const goalsWrapper = document.createElement("div");
            goalsWrapper.style.display = "grid";
            goalsWrapper.style.gridTemplateColumns = "1fr 1fr";
            goalsWrapper.style.gap = "20px";

            const homeGoals = document.createElement("div");
            const awayGoals = document.createElement("div");
            if (item.goalscorer && item.goalscorer.length > 0) {
                for (const goal of item.goalscorer) {
                    const goal_div = document.createElement("div");
                    goal_div.style.marginBottom = "10px";

                    let assist = "";
                    if (goal.home_assist)
                        assist = ` (👟Assist: ${goal.home_assist})`;
                    else if (goal.away_assist) 
                        assist = ` (👟Assist: ${goal.away_assist})`;
                    
                //align
                let scorer;

                if (goal.home_scorer) {
                    scorer = "⚽" + goal.home_scorer;
                    homeGoals.appendChild(goal_div);
                } else if(goal.away_scorer){
                    scorer = "⚽" + goal.away_scorer;
                    awayGoals.appendChild(goal_div);
                }
                else if(goal.info === "away"){
                    scorer = "⚽" + goal.away_scorer;
                    awayGoals.appendChild(goal_div);
                }
                else if(goal.info === "home"){
                    scorer = "⚽" + goal.home_scorer;
                    homeGoals.appendChild(goal_div);
                }
                goal_div.textContent = `${goal.time}' ${scorer}${assist} (${goal.score})`;

                }
            }
            goalsWrapper.appendChild(homeGoals);
            goalsWrapper.appendChild(awayGoals);
            detailView.appendChild(goalsWrapper);
            // CARTELLINI
            if (item.cards && item.cards.length > 0) {
                const cardsTitle = document.createElement("h2");
                cardsTitle.textContent = "📋 Cartellini";
                detailView.appendChild(cardsTitle);

                const cards_div = document.createElement("div");

                for (const card of item.cards) {
                    let cardType = "";
                    let player = "";

                    if (card.card === "red card") {
                        cardType = "🟥";
                    } else if (card.card === "yellow card") {
                        cardType = "🟨";
                    }

                    if (card.home_fault) {
                        player = card.home_fault;
                        align = "left";
                    } else {
                        player = card.away_fault;
                        align = "right";
                    }

                    const cardItem = document.createElement("p");
                    cardItem.textContent = `${cardType} ${player} (${card.time + '"' || 'N/D'})`;
                    cardItem.style.textAlign = align;
                    cards_div.appendChild(cardItem);
                }

                detailView.appendChild(cards_div);
            }

            // STATS
            let homePossession = "N/D", awayPossession = "N/D";
            let homeShotsOnGoal = "N/D", awayShotsOnGoal = "N/D";
            let homeShotsOffGoal = "N/D", awayShotsOffGoal = "N/D";
            let homeCorners = "N/D", awayCorners = "N/D";

            if (item.statistics && item.statistics.length > 0) {
                for (const stat of item.statistics) {
                    if (stat.type === "Ball Possession") {
                        homePossession = stat.home;
                        awayPossession = stat.away;
                    }
                    if (stat.type === "On Target") {
                        homeShotsOnGoal = stat.home;
                        awayShotsOnGoal = stat.away;
                    }
                    if (stat.type === "Off Target") {
                        homeShotsOffGoal = stat.home;
                        awayShotsOffGoal = stat.away;
                    }
                    if (stat.type === "Corners") {
                        homeCorners = stat.home;
                        awayCorners = stat.away;
                    }
                }
            }

            const statsTitle = document.createElement("h2");
            statsTitle.textContent = "📊 Statistiche";
            detailView.appendChild(statsTitle);

            const stats_div = document.createElement("div");
            stats_div.style.display = "grid";
            stats_div.style.gridTemplateColumns = "1fr 1fr";
            stats_div.style.gap = "20px";

            const homeCol = document.createElement("div");
            homeCol.innerHTML = `
                <p><strong>Possesso:</strong> ${homePossession}</p>
                <p><strong>Tiri in porta:</strong> ${homeShotsOnGoal}</p>
                <p><strong>Tiri fuori:</strong> ${homeShotsOffGoal}</p>
                <p><strong>Calci d'angolo:</strong> ${homeCorners}</p>
            `;

            const awayCol = document.createElement("div");
            awayCol.innerHTML = `
                <p><strong>Possesso:</strong> ${awayPossession}</p>
                <p><strong>Tiri in porta:</strong> ${awayShotsOnGoal}</p>
                <p><strong>Tiri fuori:</strong> ${awayShotsOffGoal}</p>
                <p><strong>Calci d'angolo:</strong> ${awayCorners}</p>
            `;

            stats_div.appendChild(homeCol);
            stats_div.appendChild(awayCol);
            detailView.appendChild(stats_div);
        }
    }
};
