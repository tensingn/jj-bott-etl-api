import {
    NFLTeamNamesArray,
    PlayerGameModel,
    PlayerModel,
    StatsRankingModel,
} from '@tensingn/jj-bott-models';

export const arrangePlayerGamesByWeek = (
    playerGames: Array<PlayerGameModel>,
): Map<string, Array<PlayerGameModel>> => {
    const map = new Map<string, Array<PlayerGameModel>>();

    playerGames.forEach((game) => {
        const weekNum = parseInt(game.week);
        if (isNaN(weekNum) || weekNum > 18 || weekNum < 1) {
            throw new Error('invalid week');
        }

        if (map.has(game.week)) {
            map.get(game.week)?.push(game);
        } else {
            map.set(game.week, [game]);
        }
    });

    return map;
};

export const addingWeeklyRankingsToPlayerGames = (
    playerGames: Array<PlayerGameModel>,
    players: Array<PlayerModel>,
): Array<PlayerGameModel> => {
    const gamesWithRankings = new Array<PlayerGameModel>();

    const rankedPlayers = rankPlayers(
        players.filter(
            (p) => !p.positions.includes('DEF') && !p.positions.includes('K'),
        ),
    );
    const rankedKickers = rankKickers(
        players.filter((p) => !p.positions.includes('K')),
    );
    const rankedDefenses = rankDefenses(
        players.filter((p) => !p.positions.includes('DEF')),
    );

    playerGames.forEach((game, i, arr) => {
        const rankings = new StatsRankingModel();
        const player = players.find((p) => p.id === game.playerID);
        if (!player) {
            console.error('could not find player with id of ' + game.playerID);
            return;
        }

        if (!isDefensePlayerGame(game)) {
            if (!player.positions.includes('K')) {
                // rushing
                const carriesIndex = rankedPlayers.carries.indexOf(player);
                const rushYdsIndex = rankedPlayers.rushYds.indexOf(player);
                const rushTDsIndex = rankedPlayers.rushTD.indexOf(player);
                rankings.Rushing = {
                    carries:
                        carriesIndex >= 0
                            ? carriesIndex + 1
                            : game.week === '1'
                              ? -1
                              : rankedPlayers.carries.length + 1,
                    rushYds:
                        rushYdsIndex >= 0
                            ? rushYdsIndex + 1
                            : game.week === '1'
                              ? -1
                              : rankedPlayers.rushYds.length + 1,
                    rushTD:
                        rushTDsIndex >= 0
                            ? rushTDsIndex + 1
                            : game.week === '1'
                              ? -1
                              : rankedPlayers.rushTD.length + 1,
                };

                // passing
                const passAttemptsIndex =
                    rankedPlayers.passAttempts.indexOf(player);
                const passYdsIndex = rankedPlayers.passYds.indexOf(player);
                const passTDsIndex = rankedPlayers.passTD.indexOf(player);
                const intsIndex = rankedPlayers.ints.indexOf(player);
                rankings.Passing = {
                    passAttempts:
                        passAttemptsIndex >= 0
                            ? passAttemptsIndex + 1
                            : game.week === '1'
                              ? -1
                              : rankedPlayers.passAttempts.length + 1,
                    passYds:
                        passYdsIndex >= 0
                            ? passYdsIndex + 1
                            : game.week === '1'
                              ? -1
                              : rankedPlayers.passYds.length + 1,
                    passTD:
                        passTDsIndex >= 0
                            ? passTDsIndex + 1
                            : game.week === '1'
                              ? -1
                              : rankedPlayers.passTD.length + 1,
                    int:
                        intsIndex >= 0
                            ? intsIndex + 1
                            : game.week === '1'
                              ? -1
                              : rankedPlayers.ints.length + 1,
                };

                // receiving
                const receptionsIndex =
                    rankedPlayers.receptions.indexOf(player);
                const recYdsIndex = rankedPlayers.recYds.indexOf(player);
                const recTDsIndex = rankedPlayers.recTD.indexOf(player);
                const targetsIndex = rankedPlayers.targets.indexOf(player);
                rankings.Receiving = {
                    receptions:
                        receptionsIndex >= 0
                            ? receptionsIndex + 1
                            : game.week === '1'
                              ? -1
                              : rankedPlayers.receptions.length + 1,
                    recYds:
                        recYdsIndex >= 0
                            ? recYdsIndex + 1
                            : game.week === '1'
                              ? -1
                              : rankedPlayers.recYds.length + 1,
                    recTD:
                        recTDsIndex >= 0
                            ? recTDsIndex + 1
                            : game.week === '1'
                              ? -1
                              : rankedPlayers.recTD.length + 1,
                    targets:
                        targetsIndex >= 0
                            ? targetsIndex + 1
                            : game.week === '1'
                              ? -1
                              : rankedPlayers.targets.length + 1,
                };
            }

            // kicking
            else {
                const fgMadeIndex = rankedKickers.fgMade.indexOf(player);
                const xpMadeIndex = rankedKickers.xpMade.indexOf(player);
                rankings.Kicking = {
                    fgMade:
                        fgMadeIndex >= 0
                            ? fgMadeIndex + 1
                            : game.week === '1'
                              ? -1
                              : rankedKickers.fgMade.length + 1,
                    xpMade:
                        xpMadeIndex >= 0
                            ? xpMadeIndex + 1
                            : game.week === '1'
                              ? -1
                              : rankedKickers.xpMade.length + 1,
                };
            }
        } else {
            const ydsAllowedIndex = rankedDefenses.ydsAllowed.indexOf(player);
            const ptsAllowedIndex = rankedDefenses.ptsAllowed.indexOf(player);
            const takeawaysIndex = rankedDefenses.takeaways.indexOf(player);
            const passYdsAllowedIndex =
                rankedDefenses.passYdsAllowed.indexOf(player);
            const passTDsAllowedIndex =
                rankedDefenses.passTDsAllowed.indexOf(player);
            const rushYdsAllowedIndex =
                rankedDefenses.rushYdsAllowed.indexOf(player);
            const rushTDsAllowedIndex =
                rankedDefenses.rushTDsAllowed.indexOf(player);
            const fgAllowedIndex = rankedDefenses.fgAllowed.indexOf(player);
            const xpAllowedIndex = rankedDefenses.xpAllowed.indexOf(player);
            rankings.Defense = {
                ydsAllowed:
                    ydsAllowedIndex >= 0
                        ? ydsAllowedIndex + 1
                        : game.week === '1'
                          ? -1
                          : rankedDefenses.ydsAllowed.length + 1,
                ptsAllowed:
                    ptsAllowedIndex >= 0
                        ? ptsAllowedIndex + 1
                        : game.week === '1'
                          ? -1
                          : rankedDefenses.ptsAllowed.length + 1,
                takeaways:
                    takeawaysIndex >= 0
                        ? takeawaysIndex + 1
                        : game.week === '1'
                          ? -1
                          : rankedDefenses.takeaways.length + 1,
                passYdsAllowed:
                    passYdsAllowedIndex >= 0
                        ? passYdsAllowedIndex + 1
                        : game.week === '1'
                          ? -1
                          : rankedDefenses.passYdsAllowed.length + 1,
                passTDsAllowed:
                    passTDsAllowedIndex >= 0
                        ? passTDsAllowedIndex + 1
                        : game.week === '1'
                          ? -1
                          : rankedDefenses.passTDsAllowed.length + 1,
                rushYdsAllowed:
                    rushYdsAllowedIndex >= 0
                        ? rushYdsAllowedIndex + 1
                        : game.week === '1'
                          ? -1
                          : rankedDefenses.rushYdsAllowed.length + 1,
                rushTDsAllowed:
                    rushTDsAllowedIndex >= 0
                        ? rushTDsAllowedIndex + 1
                        : game.week === '1'
                          ? -1
                          : rankedDefenses.rushTDsAllowed.length + 1,
                fgAllowed:
                    fgAllowedIndex >= 0
                        ? fgAllowedIndex + 1
                        : game.week === '1'
                          ? -1
                          : rankedDefenses.fgAllowed.length + 1,
                xpAllowed:
                    xpAllowedIndex >= 0
                        ? xpAllowedIndex + 1
                        : game.week === '1'
                          ? -1
                          : rankedDefenses.xpAllowed.length + 1,
            };
        }

        arr[i].statRankings = rankings;
        gamesWithRankings.push(arr[i]);
    });

    return gamesWithRankings;
};

export const isDefensePlayerGame = (playerGame: PlayerGameModel) => {
    return [...NFLTeamNamesArray]
        .map((n) => n.toString())
        .includes(playerGame.playerID);
};

function rankPlayers(players: Array<PlayerModel>) {
    return {
        // rushing
        rushTD: players.sort(
            (p1, p2) =>
                parseInt(p2.seasonStats.Rushing?.rushTD ?? '0') -
                parseInt(p1.seasonStats.Rushing?.rushTD ?? '0'),
        ),
        rushYds: players.sort(
            (p1, p2) =>
                parseInt(p2.seasonStats.Rushing?.rushYds ?? '0') -
                parseInt(p1.seasonStats.Rushing?.rushYds ?? '0'),
        ),
        carries: players.sort(
            (p1, p2) =>
                parseInt(p2.seasonStats.Rushing?.carries ?? '0') -
                parseInt(p1.seasonStats.Rushing?.carries ?? '0'),
        ),

        // passing
        passTD: players.sort(
            (p1, p2) =>
                parseInt(p2.seasonStats.Passing?.passTD ?? '0') -
                parseInt(p1.seasonStats.Passing?.passTD ?? '0'),
        ),
        passYds: players.sort(
            (p1, p2) =>
                parseInt(p2.seasonStats.Passing?.passYds ?? '0') -
                parseInt(p1.seasonStats.Passing?.passYds ?? '0'),
        ),
        passAttempts: players.sort(
            (p1, p2) =>
                parseInt(p2.seasonStats.Passing?.passAttempts ?? '0') -
                parseInt(p1.seasonStats.Passing?.passAttempts ?? '0'),
        ),
        ints: players.sort(
            (p1, p2) =>
                parseInt(p1.seasonStats.Passing?.int ?? '0') -
                parseInt(p2.seasonStats.Passing?.int ?? '0'),
        ),

        // receiving
        receptions: players.sort(
            (p1, p2) =>
                parseInt(p2.seasonStats.Receiving?.receptions ?? '0') -
                parseInt(p1.seasonStats.Receiving?.receptions ?? '0'),
        ),
        recTD: players.sort(
            (p1, p2) =>
                parseInt(p2.seasonStats.Receiving?.recTD ?? '0') -
                parseInt(p1.seasonStats.Receiving?.recTD ?? '0'),
        ),
        targets: players.sort(
            (p1, p2) =>
                parseInt(p2.seasonStats.Receiving?.targets ?? '0') -
                parseInt(p1.seasonStats.Receiving?.targets ?? '0'),
        ),
        recYds: players.sort(
            (p1, p2) =>
                parseInt(p2.seasonStats.Receiving?.recYds ?? '0') -
                parseInt(p1.seasonStats.Receiving?.recYds ?? '0'),
        ),
    };
}

function rankDefenses(defenses: Array<PlayerModel>) {
    return {
        takeaways: defenses.sort(
            (d1, d2) =>
                parseInt(
                    d2.seasonStats.Defense?.defensiveInterceptions ?? '0',
                ) +
                parseInt(d2.seasonStats.Defense?.fumblesRecovered ?? '0') -
                (parseInt(
                    d1.seasonStats.Defense?.defensiveInterceptions ?? '0',
                ) +
                    parseInt(d1.seasonStats.Defense?.fumblesRecovered ?? '0')),
        ),
        ydsAllowed: defenses.sort(
            (d1, d2) =>
                parseInt(d1.seasonStats.Defense?.ydsAllowed ?? '0') -
                parseInt(d2.seasonStats.Defense?.ydsAllowed ?? '0'),
        ),
        ptsAllowed: defenses.sort(
            (d1, d2) =>
                parseInt(d1.seasonStats.Defense?.ptsAllowed ?? '0') -
                parseInt(d2.seasonStats.Defense?.ptsAllowed ?? '0'),
        ),
        passYdsAllowed: defenses.sort(
            (d1, d2) =>
                parseInt(d1.seasonStats.Defense?.passYdsAllowed ?? '0') -
                parseInt(d2.seasonStats.Defense?.passYdsAllowed ?? '0'),
        ),
        rushYdsAllowed: defenses.sort(
            (d1, d2) =>
                parseInt(d1.seasonStats.Defense?.rushYdsAllowed ?? '0') -
                parseInt(d2.seasonStats.Defense?.rushYdsAllowed ?? '0'),
        ),
        passTDsAllowed: defenses.sort(
            (d1, d2) =>
                parseInt(d1.seasonStats.Defense?.passTDsAllowed ?? '0') -
                parseInt(d2.seasonStats.Defense?.passTDsAllowed ?? '0'),
        ),
        rushTDsAllowed: defenses.sort(
            (d1, d2) =>
                parseInt(d1.seasonStats.Defense?.rushTDsAllowed ?? '0') -
                parseInt(d2.seasonStats.Defense?.rushTDsAllowed ?? '0'),
        ),
        fgAllowed: defenses.sort(
            (d1, d2) =>
                parseInt(d1.seasonStats.Defense?.fgAllowed ?? '0') -
                parseInt(d2.seasonStats.Defense?.fgAllowed ?? '0'),
        ),
        xpAllowed: defenses.sort(
            (d1, d2) =>
                parseInt(d1.seasonStats.Defense?.xpAllowed ?? '0') -
                parseInt(d2.seasonStats.Defense?.xpAllowed ?? '0'),
        ),
    };
}

function rankKickers(kickers: Array<PlayerModel>) {
    return {
        fgMade: kickers.sort(
            (k1, k2) =>
                parseInt(k2.seasonStats.Kicking?.fgMade ?? '0') -
                parseInt(k1.seasonStats.Kicking?.fgMade ?? '0'),
        ),
        xpMade: kickers.sort(
            (k1, k2) =>
                parseInt(k2.seasonStats.Kicking?.xpMade ?? '0') -
                parseInt(k1.seasonStats.Kicking?.xpMade ?? '0'),
        ),
    };
}
