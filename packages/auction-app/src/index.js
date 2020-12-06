import React, {useEffect, useState, useMemo} from 'react'
import styled from "styled-components"
import {observer} from 'mobx-react'
import {Button, Input, Spacer, useInput, useToasts} from '@zeit-ui/react'
import {Plus as PlusIcon} from '@zeit-ui/react-icons'

import {useStore} from "@/store"
import Container from '@/components/Container'
import UnlockRequired from '@/components/accounts/UnlockRequired'
import PushCommandButton from '@/components/PushCommandButton'

import {CONTRACT_AUCTION, createAuctionAppStore} from './utils/AppStore'
import {reaction} from 'mobx'

const ButtonWrapper = styled.div`
  margin-top: 5px;
  width: 200px;
`;

/**
 * Header of the HelloWorld app page
 */
const AppHeader = () => (
    <Container>
        <h1>This is AH!</h1>
    </Container>
)

/**
 * Body of the HelloWorld app page
 */
const AppBody = observer(() => {
    const {appRuntime, auctionApp} = useStore();
    const [, setToast] = useToasts()
    const {state: inc, bindings} = useInput('1')

    /**
     * Updates the counter by querying the helloworld contract
     * The type definitions of `GetCount` request and response can be found at contract/helloworld.rs
     */
    async function updateCounter() {
        if (!auctionApp) return
        try {
            const response = await auctionApp.queryWinner(appRuntime)
            // Print the response in the original to the console
            console.log('Response::GetCount', response);

            auctionApp.setCounter(response.GetCount.count)
        } catch (err) {
            setToast(err.message, 'error')
        }
    }

    /**
     * The `increment` transaction payload object
     * It follows the command type definition of the contract (at contract/helloworld.rs)
     */
    const placeBetCommandPayload = useMemo(() => {
        const num = parseInt(inc)
        if (isNaN(num) || inc <= 0) {
            return undefined
        } else {
            return {
                PlaceBet: {
                    value: num
                }
            }
        }
    }, [inc])

    return (
        <Container>
            <section>
                <div>PRuntime: {appRuntime ? 'yes' : 'no'}</div>
                <div>PRuntime ping: {appRuntime.latency || '+∞'}</div>
                <div>PRuntime connected: {appRuntime?.channelReady ? 'yes' : 'no'}</div>
            </section>
            <Spacer y={1}/>

            <h3>Counter</h3>
            <section>
                <div>Counter: {auctionApp.winner === null ? 'unknown' : auctionApp.winner}</div>
                <div><Button onClick={updateCounter}>Update</Button></div>
            </section>
            <Spacer y={1}/>

            <h3>Increment Counter</h3>
            <section>
                <div>
                    <Input label="By" {...bindings} />
                </div>
                <ButtonWrapper>
                    {/**
                     * PushCommandButton is the easy way to send confidential contract txs.
                     * Below it's configurated to send HelloWorld::Increment()
                     */}
                    <PushCommandButton
                        // tx arguments
                        contractId={CONTRACT_AUCTION}
                        payload={placeBetCommandPayload}
                        // display messages
                        modalTitle='Place bet'
                        modalSubtitle={`Place bet equal to ${inc}`}
                        onSuccessMsg='Tx succeeded'
                        // button appearance
                        buttonType='secondaryLight'
                        icon={PlusIcon}
                        name='Send'
                    />
                </ButtonWrapper>
            </section>

        </Container>
    )
})

/**
 * Injects the mobx store to the global state once initialized
 */
const StoreInjector = observer(({children}) => {
    const appStore = useStore()
    const [shouldRenderContent, setShouldRenderContent] = useState(false)

    useEffect(() => {
        if (!appStore || !appStore.appRuntime) return
        if (typeof appStore.auctionApp !== 'undefined') return
        appStore.auctionApp = createAuctionAppStore({})
    }, [appStore])

    useEffect(() => reaction(
        () => appStore.auctionApp,
        () => {
            if (appStore.auctionApp && !shouldRenderContent) {
                setShouldRenderContent(true)
            }
        },
        {fireImmediately: true})
    )

    return shouldRenderContent && children;
})

export default () => (
    <UnlockRequired>
        <StoreInjector>
            <AppHeader/>
            <AppBody/>
        </StoreInjector>
    </UnlockRequired>
)
