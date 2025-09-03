import { AppProps } from 'next/app'
import '@/styles/global.css'
import { Provider } from 'react-redux'
import { store } from '@/store'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useEffect, useState, useMemo } from 'react'
import { checkWallet } from '@/services/blockchain'
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  WalletModalProvider,
} from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

export default function MyApp({ Component, pageProps }: AppProps) {
  const [showChild, setShowChild] = useState<boolean>(false)
  
  useEffect(() => {
    // checkWallet()
    setShowChild(true)
  }, [])

  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;
  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      // if desired, manually define specific/custom wallets here (normally not required)
      // otherwise, the wallet-adapter will auto detect the wallets a user's browser has available
    ],
    [network],
  );

  if (!showChild || typeof window === 'undefined') {
    return null
  } else {
    return (
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <Provider store={store}>
              <Component {...pageProps} />

              <ToastContainer
                position="bottom-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
              />
            </Provider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>

      // <Provider store={store}>
      //   <CometChatNoSSR />
      //   <Component {...pageProps} />

      //   <ToastContainer
      //     position="bottom-center"
      //     autoClose={5000}
      //     hideProgressBar={false}
      //     newestOnTop={false}
      //     closeOnClick
      //     rtl={false}
      //     pauseOnFocusLoss
      //     draggable
      //     pauseOnHover
      //     theme="dark"
      //   />
      // </Provider>
    )
  }
}
