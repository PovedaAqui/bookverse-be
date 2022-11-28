const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const PORT = process.env.PORT;
const app = express();

app.use(cors());

app.get('/api/create-paper-intent', (req, res) => {

    const listingId = req.query.listingId;
    const img = req.query.img;
    const name = req.query.name;
    console.log(name);

    const options = {
        method: 'POST',
        url: 'https://paper.xyz/api/2022-08-12/checkout-link-intent',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            charset: 'utf-8',
            responseEncoding: 'utf8',
            Authorization: process.env.REACT_APP_PAPER_KEY
        },
        data: {
            sendEmailOnCreation: false,
            requireVerifiedEmail: true,
            metadata: {},
            expiresInMinutes: 12,
            usePaperKey: false,
            hideNativeMint: false,
            hidePaperWallet: false,
            hideExternalWallet: false,
            hidePayWithCard: false,
            hideApplePayGooglePay: false,
            hidePayWithCrypto: true,
            hidePayWithIdeal: true,
            limitPerTransaction: 10,
            redirectAfterPayment: true,
            sendEmailOnTransferSucceeded: true,
            contractId: 'fbdbf966-3231-48e7-bbee-3eb2a1eafa09',
            title: `${name}`,
            contractArgs: {tokenId: `${listingId}`},
            imageUrl: `${img}`,
            description: 'Please, choose the quantity',
            successCallbackUrl: 'https://bookverse.vercel.app/mybooks',
            cancelCallbackUrl: `https://bookverse.vercel.app/${listingId}`
        }
    };

    axios.request(options)
    .then((response) => {
      res.json(response.data);
    })
    .catch((error) => {
      console.error(error);
    });
});

app.get('/api/get-my-books', (req, res) => {

    const address = req.query.address;
    const chain = "polygon";

    const options = {
        method: 'GET',
        url: `https://api.nftport.xyz/v0/accounts/${address}`,
        params: {
          chain: chain,
          include: 'metadata',
          contract_address: process.env.REACT_APP_DROP_CONTRACT
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: process.env.REACT_APP_NFT_PORT
        }
      };
      
      axios.request(options)
      .then((response) => {
        res.json(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
// Export the Express API
module.exports = app;