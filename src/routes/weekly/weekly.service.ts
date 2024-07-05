import 'dotenv/config';
import { Injectable } from '@nestjs/common';
import {
    DataAPIService,
    NFLStateSleeperModel,
    SleeperService,
    TankService,
} from '@tensingn/jj-bott-services';
import {
    addScoreToPlayerGameModels,
    addStatsToPlayerModels,
    playersAndTankGamesToPlayerGameModels,
} from 'src/services/post-game-transformations';
import {
    NFLGameModel,
    NFLTeamModel,
    PlayerGameModel,
    PlayerModel,
} from '@tensingn/jj-bott-models';
import { Loader } from 'src/services/loader';
import {
    addingWeeklyRankingsToPlayerGames,
    arrangePlayerGamesByWeek,
} from 'src/services/pre-game-transformations';

@Injectable()
export class WeeklyService {
    private readonly dataAPI: DataAPIService;
    private readonly tankService: TankService;
    private readonly sleeperService: SleeperService;
    private readonly loader: Loader;

    constructor() {
        this.dataAPI = new DataAPIService(process.env.DATA_API_URL_LOCAL!);
        this.tankService = new TankService(process.env.TANK_KEY!);
        this.sleeperService = new SleeperService();
        this.loader = new Loader(process.env.DATA_API_URL!);
    }

    // get all data from previous week's games and load it into the db
    async runPostGame() {
        // extract
        await this.dataAPI.init();
        const nflState: NFLStateSleeperModel =
            await this.sleeperService.getNFLState();
        const players = await this.dataAPI.findMany<PlayerModel>(
            'players',
            undefined,
            10000,
        );
        const playerGames = await this.dataAPI.performAction<
            Array<PlayerGameModel>
        >('players', null, 'playerGames', 'search', {
            seasons: [nflState.season],
            weeks: [nflState.week.toString()],
            nflTeams: [],
            playerIDs: [],
        });
        const nflTeams = await this.dataAPI.findMany<NFLTeamModel>(
            'nflTeams',
            undefined,
            32,
        );
        const lastWeekGames = await this.dataAPI.performAction<
            Array<NFLGameModel>
        >('nflGames', null, null, 'search', {
            seasons: [nflState.season],
            weeks: [nflState.week.toString()],
        });
        const tankGamePromises = lastWeekGames.map((gameModel) => {
            return this.tankService.getNFLBoxScore({
                gameID: gameModel.id,
                fantasyPoints: true,
            });
        });
        const tankGames = await Promise.all(tankGamePromises);

        // transform
        const playerGameModels = addScoreToPlayerGameModels(
            tankGames,
            playerGames,
            players,
            nflTeams,
        );
        const playerModels = addStatsToPlayerModels(players, playerGameModels);

        // load
        try {
            console.log(
                `attempting to load ${playerGameModels.length} player games from week ${nflState.week} of ${nflState.season}`,
            );
            const playerGamesSaved =
                await this.loader.loadPlayerGames(playerGameModels);
            console.log(
                `loaded ${playerGamesSaved.length} player games from week ${nflState.week} of ${nflState.season}`,
            );
            console.log(
                `attempting to load ${playerModels.length} player games from week ${nflState.week} of ${nflState.season}`,
            );
            const playersSaved = await this.loader.updatePlayers(players);
            console.log(
                `loaded ${playerGamesSaved.length} player games from week ${nflState.week} of ${nflState.season}`,
            );
        } catch (e) {
            console.error(`error:\n${e}`);
        }
    }

    async runPreGame() {
        // extract
        await this.dataAPI.init();
        const players = await this.dataAPI.findMany<PlayerModel>(
            'players',
            undefined,
            10000,
        );
        const nflTeams = await this.dataAPI.findMany<NFLTeamModel>(
            'nflTeams',
            undefined,
            32,
        );
        const nflState: NFLStateSleeperModel =
            await this.sleeperService.getNFLState();

        const lastWeekGames = await this.dataAPI.performAction<
            Array<NFLGameModel>
        >('nflGames', null, null, 'search', {
            seasons: [nflState.season],
            weeks: [nflState.week.toString()],
        });
        const tankGamePromises = lastWeekGames.map((gameModel) => {
            return this.tankService.getNFLBoxScore({
                gameID: gameModel.id,
                fantasyPoints: true,
            });
        });
        const tankGames = await Promise.all(tankGamePromises);

        // transform
        const playerGameModels = playersAndTankGamesToPlayerGameModels(
            tankGames,
            players,
            nflTeams,
            nflState.season,
            nflState.week.toString(),
        );
        const playerGameModelsWithRankings = addingWeeklyRankingsToPlayerGames(
            playerGameModels,
            players,
        );

        // load
        try {
            console.log(
                `attempting to load ${playerGameModelsWithRankings.length} player games from week ${nflState.week} of ${nflState.season}`,
            );
            const playerGamesSaved = await this.loader.loadPlayerGames(
                playerGameModelsWithRankings,
            );
            console.log(
                `loaded ${playerGamesSaved.length} player games from week ${nflState.week} of ${nflState.season}`,
            );
        } catch (e) {
            console.error(`error:\n${e}`);
        }
    }
}
