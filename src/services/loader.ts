import { Injectable } from '@nestjs/common';
import { PlayerGameModel, PlayerModel } from '@tensingn/jj-bott-models';
import { DataAPIService } from '@tensingn/jj-bott-services';

export class Loader {
    private readonly dataAPI: DataAPIService;

    constructor(dataAPIURL: string) {
        this.dataAPI = new DataAPIService(dataAPIURL);
    }

    async loadPlayerGames(playerGames: Array<PlayerGameModel>) {
        await this.dataAPI.init();
        const promises = playerGames.map((pg) =>
            this.dataAPI.createSubEntity<PlayerGameModel>(
                'players',
                pg.playerID,
                'playerGames',
                pg,
            ),
        );

        return Promise.all(promises);
    }

    async updatePlayers(players: Array<PlayerModel>) {
        await this.dataAPI.init();
        return this.dataAPI.bulkUpdate('players', players);
    }

    async updatePlayerGames(playerGames: Array<PlayerGameModel>) {
        await this.dataAPI.init();
        return this.dataAPI.bulkUpdateSubEntity(
            'players',
            null,
            'playerGames',
            playerGames,
        );
    }
}
