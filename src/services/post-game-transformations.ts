import {
    NFLTeamModel,
    PlayerGameModel,
    PlayerModel,
    ScoringSettings,
} from '@tensingn/jj-bott-models';
import { GameTankModel, PlayerGameTankModel } from '@tensingn/jj-bott-services';

export const playersAndTankGamesToPlayerGameModels = (
    tankGames: Array<GameTankModel>,
    playerModels: Array<PlayerModel>,
    nflTeams: Array<NFLTeamModel>,
    season: string,
    week: string,
): Array<PlayerGameModel> => {
    // get rid of duplicates
    const gamesNoDuplicates = new Array<GameTankModel>();
    tankGames.forEach((game) => {
        if (!gamesNoDuplicates.find((g) => g.gameID === game.gameID)) {
            gamesNoDuplicates.push(game);
        }
    });

    const playerGameModels = new Array<PlayerGameModel>();
    gamesNoDuplicates.forEach((game) => {
        const playerGames: Array<PlayerGameTankModel> = Object.values(
            game.playerStats,
        );

        for (let playerGame of playerGames) {
            const player = playerModels.find(
                (p) => p.tankID === playerGame.playerID,
            );
            if (!player) {
                continue;
            }

            const playerGameModel = new PlayerGameModel();
            playerGameModel.playerID = player.id;
            playerGameModel.gameID = game.gameID;
            playerGameModel.isHome = game.teamIDHome === playerGame.teamID;
            playerGameModel.opponent = playerGameModel.isHome
                ? nflTeams.find((t) => t.id === game.teamIDAway)!.teamName
                : nflTeams.find((t) => t.id === game.teamIDHome)!.teamName;
            playerGameModel.team = player.team;
            playerGameModel.season = season;
            playerGameModel.week = week;

            playerGameModels.push(playerGameModel);
        }
    });

    return playerGameModels;
};

export const addScoreToPlayerGameModels = (
    tankGames: Array<GameTankModel>,
    playerGameModels: Array<PlayerGameModel>,
    playerModels: Array<PlayerModel>,
    nflTeams: Array<NFLTeamModel>,
): Array<PlayerGameModel> => {
    // get rid of duplicates
    const gamesNoDuplicates = new Array<GameTankModel>();
    tankGames.forEach((game) => {
        if (!gamesNoDuplicates.find((g) => g.gameID === game.gameID)) {
            gamesNoDuplicates.push(game);
        }
    });

    playerGameModels.forEach((pg, index, arr) => {
        const player = playerModels.find((p) => p.id === pg.playerID);
        if (!player) {
            console.error(
                `could not find player for pg with and playerID ${pg.playerID}`,
            );
            return;
        }

        const tankGame = tankGames.find((tg) => tg.gameID === pg.gameID);
        if (!tankGame) {
            console.error(
                `could not find tank game for pg with gameID ${pg.gameID} and playerID ${pg.playerID}`,
            );
            return;
        }

        if (!player.positions.includes('DEF')) {
            const playerStats: Map<string, PlayerGameTankModel> = new Map(
                Object.entries(tankGame.playerStats),
            );
            const playerTankGame = playerStats.get(player.tankID);
            if (!playerTankGame) {
                console.error(
                    `could not find player tank game for pg with gameID ${pg.gameID} and playerID ${pg.playerID} and tankID ${player.tankID}`,
                );
                return;
            }

            arr[index].points =
                playerTankGame.fantasyPointsDefault?.halfPPR ?? '0';
        } else {
            const team = nflTeams.find((t) => t.teamName === player.team);
            if (!team) {
                console.error(
                    `could not find team for pg with gameID ${pg.gameID} and playerID ${pg.playerID}`,
                );
                return;
            }
            arr[index].points = calculateDSTPoints(tankGame, team.id);
        }
    });

    return playerGameModels;
};

function calculateDSTPoints(game: GameTankModel, teamID: string): string {
    const dst = game.DST.home.teamID === teamID ? game.DST.home : game.DST.away;

    let points = 0;

    // yards allowed
    const ydsAllowedParsed = parseInt(dst.ydsAllowed ?? 0);
    if (ydsAllowedParsed < 100) {
        points += ScoringSettings.yds_allow_0_100;
    } else if (ydsAllowedParsed < 200) {
        points += ScoringSettings.yds_allow_100_199;
    } else if (ydsAllowedParsed < 300) {
        points += ScoringSettings.yds_allow_200_299;
    } else if (ydsAllowedParsed < 350) {
        points += ScoringSettings.yds_allow_300_349;
    } else if (ydsAllowedParsed < 400) {
        points -= ScoringSettings.yds_allow_350_399;
    } else if (ydsAllowedParsed < 450) {
        points -= ScoringSettings.yds_allow_400_449;
    } else if (ydsAllowedParsed < 500) {
        points -= ScoringSettings.yds_allow_450_499;
    } else if (ydsAllowedParsed < 550) {
        points -= ScoringSettings.yds_allow_500_549;
    } else {
        points -= ScoringSettings.yds_allow_550p;
    }

    // points allowed
    const ptsAllowedParsed = parseInt(dst.ptsAllowed ?? 0);
    if (ptsAllowedParsed < 1) {
        points += ScoringSettings.pts_allow_0;
    } else if (ptsAllowedParsed < 7) {
        points += ScoringSettings.pts_allow_1_6;
    } else if (ptsAllowedParsed < 14) {
        points += ScoringSettings.pts_allow_7_13;
    } else if (ptsAllowedParsed < 21) {
        points += ScoringSettings.pts_allow_14_20;
    } else if (ptsAllowedParsed < 28) {
        points += ScoringSettings.pts_allow_21_27;
    } else if (ptsAllowedParsed < 35) {
        points += ScoringSettings.pts_allow_28_34;
    } else {
        points += ScoringSettings.pts_allow_35p;
    }

    // TDs
    const defTDParsed = parseInt(dst.defTD ?? 0);
    points += defTDParsed * ScoringSettings.def_td;

    // sacks
    const sacksParsed = parseInt(dst.sacks ?? 0);
    points += sacksParsed * ScoringSettings.sack;

    // interceptions
    const defensiveInterceptionsParsed = parseInt(
        dst.defensiveInterceptions ?? 0,
    );
    points += defensiveInterceptionsParsed * ScoringSettings.int;

    // fumble recoveries
    const fumblesRecoveredParsed = parseInt(dst.fumblesRecovered ?? 0);
    points += fumblesRecoveredParsed * ScoringSettings.fum_rec;

    // safeties
    const safetiesParsed = parseInt(dst.safeties ?? 0);
    points += safetiesParsed * ScoringSettings.safe;

    // forced fumbles
    const playerGames: Array<PlayerGameTankModel> = Object.values(
        game.playerStats,
    );
    for (let playerGame of playerGames) {
        if (playerGame.teamID !== teamID && playerGame.Defense?.fumbles) {
            points += ScoringSettings.ff;
        }
    }

    return points.toString();
}

export const addStatsToPlayerModels = (
    players: Array<PlayerModel>,
    playerGames: Array<PlayerGameModel>,
) => {
    players.forEach((player, index, arr) => {
        const playerGame = playerGames.find((pg) => pg.playerID === player.id);
        if (!playerGame) {
            console.error(
                `could not find player game for player with id ${player.id}`,
            );
            return;
        }

        if (player.positions.includes('DEF') && player.seasonStats.Defense) {
            player.seasonStats.Defense.defTD! +=
                playerGame.stats.Defense?.defTD ?? 0;
            player.seasonStats.Defense.defensiveInterceptions! +=
                playerGame.stats.Defense?.defensiveInterceptions ?? 0;
            player.seasonStats.Defense.fgAllowed! +=
                playerGame.stats.Defense?.fgAllowed ?? 0;
            player.seasonStats.Defense.fumblesRecovered! +=
                playerGame.stats.Defense?.fumblesRecovered ?? 0;
            player.seasonStats.Defense.passTDsAllowed! +=
                playerGame.stats.Defense?.passTDsAllowed ?? 0;
            player.seasonStats.Defense.passYdsAllowed! +=
                playerGame.stats.Defense?.passYdsAllowed ?? 0;
            player.seasonStats.Defense.ptsAllowed! +=
                playerGame.stats.Defense?.ptsAllowed ?? 0;
            player.seasonStats.Defense.rushTDsAllowed! +=
                playerGame.stats.Defense?.rushTDsAllowed ?? 0;
            player.seasonStats.Defense.rushYdsAllowed! +=
                playerGame.stats.Defense?.rushYdsAllowed ?? 0;
            player.seasonStats.Defense.sacks! +=
                playerGame.stats.Defense?.sacks ?? 0;
            player.seasonStats.Defense.xpAllowed! +=
                playerGame.stats.Defense?.xpAllowed ?? 0;
            player.seasonStats.Defense.ydsAllowed! +=
                playerGame.stats.Defense?.ydsAllowed ?? 0;
        } else if (
            player.positions.includes('K') &&
            player.seasonStats.Kicking
        ) {
            player.seasonStats.Kicking.fgAttempts! +=
                playerGame.stats.Kicking?.fgAttempts ?? 0;
            player.seasonStats.Kicking.fgLong! +=
                playerGame.stats.Kicking?.fgLong ?? 0;
            player.seasonStats.Kicking.fgMade! +=
                playerGame.stats.Kicking?.fgMade ?? 0;
            player.seasonStats.Kicking.fgPct! +=
                playerGame.stats.Kicking?.fgPct ?? 0;
            player.seasonStats.Kicking.xpAttempts! +=
                playerGame.stats.Kicking?.xpAttempts ?? 0;
            player.seasonStats.Kicking.xpMade! +=
                playerGame.stats.Kicking?.xpMade ?? 0;
        } else {
            if (player.seasonStats.Passing && playerGame.stats.Passing) {
                player.seasonStats.Passing.int! +=
                    playerGame.stats.Passing.int ?? 0;
                player.seasonStats.Passing.passAttempts! +=
                    playerGame.stats.Passing.passAttempts ?? 0;
                player.seasonStats.Passing.passCompletions! +=
                    playerGame.stats.Passing.passCompletions ?? 0;
                player.seasonStats.Passing.passTD! +=
                    playerGame.stats.Passing.passTD ?? 0;
                player.seasonStats.Passing.passYds! +=
                    playerGame.stats.Passing.passYds ?? 0;
                player.seasonStats.Passing.qbr! +=
                    playerGame.stats.Passing.qbr ?? 0;
                player.seasonStats.Passing.rtg! +=
                    playerGame.stats.Passing.rtg ?? 0;
                player.seasonStats.Passing.sacked! +=
                    playerGame.stats.Passing.sacked ?? 0;
            }

            if (player.seasonStats.Rushing && playerGame.stats.Rushing) {
                player.seasonStats.Rushing.carries +=
                    playerGame.stats.Rushing.carries ?? 0;
                player.seasonStats.Rushing.longRush +=
                    playerGame.stats.Rushing.longRush ?? 0;
                player.seasonStats.Rushing.rushAvg +=
                    playerGame.stats.Rushing.rushAvg ?? 0;
                player.seasonStats.Rushing.rushTD +=
                    playerGame.stats.Rushing.rushTD ?? 0;
                player.seasonStats.Rushing.rushYds +=
                    playerGame.stats.Rushing.rushYds ?? 0;
            }

            if (player.seasonStats.Receiving && playerGame.stats.Receiving) {
                player.seasonStats.Receiving.longRec +=
                    playerGame.stats.Receiving.longRec ?? 0;
                player.seasonStats.Receiving.recAvg +=
                    playerGame.stats.Receiving.recAvg ?? 0;
                player.seasonStats.Receiving.recTD +=
                    playerGame.stats.Receiving.recTD ?? 0;
                player.seasonStats.Receiving.recYds +=
                    playerGame.stats.Receiving.recYds ?? 0;
                player.seasonStats.Receiving.receptions +=
                    playerGame.stats.Receiving.receptions ?? 0;
                player.seasonStats.Receiving.targets +=
                    playerGame.stats.Receiving.targets ?? 0;
            }
        }

        arr[index].seasonStats = player.seasonStats;
    });

    return players;
};
