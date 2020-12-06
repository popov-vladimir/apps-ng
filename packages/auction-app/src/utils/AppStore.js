import {types, flow} from 'mobx-state-tree'

export const CONTRACT_AUCTION = 6;

export const createAuctionAppStore = (defaultValue = {}, options = {}) => {
    const AuctionAppStore = types
        .model('AuctionAppStore', {
            // counter: types.maybeNull(types.number),
            winner: types.maybeNull(types.string),
            bets:types.map(types.number)
        })
        .actions(self => ({
            placeBet(account, value) {
                self.properties.bets.set(account, value)
            },
            async queryWinner(runtime) {
                return await runtime.query(CONTRACT_AUCTION, 'GetWinner')
            }
        }))

    return AuctionAppStore.create(defaultValue)
}

