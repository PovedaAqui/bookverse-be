const express = require('express');
const cors = require('cors');
const axios = require('axios');
const redis = require('redis');
require('dotenv').config();

const PORT = process.env.PORT;
const app = express();

app.use(cors());

app.get('/api/create-paper-intent', async (req, res) => {

    const listingId = req.query.listingId;
    const img = req.query.img;
    const name = req.query.name;
    
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

    try {
      const response = await axios.request(options);
      res.json(response.data);
    } catch (error) {
      console.error(error);
  }
});

app.get('/api/get-my-books', async (req, res) => {

  const address = req.query.address;
  const chain = "polygon";

  // Timeout (2seg) configured directly on the server
  const client = redis.createClient({
    url: process.env.REDIS_URL,
  });

  client.on('error', (err) => {
    console.log('Error ' + err);
  });

  await client.connect();

  try {
    const reply = await client.get(address);
    if (reply) {
      res.json(JSON.parse(reply));
      console.log('from cache');
      await client.quit();
      return;
    } else {
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

      try {
          const response = await axios.request(options);
          client.set(address, JSON.stringify(response.data));
          res.json(response.data);
          await client.quit();
      } catch (error) {
          console.error(error);
      }
    }
  } catch (error) {
    console.log(error);
  }
});

const checkRedisKey = () => {
  const client = redis.createClient({
    url: process.env.REDIS_URL,
  });

  client.on('error', (err) => {
    console.log('Error ' + err);
  });

  // gett all the keys from Redis
  client.keys('*', (error, keys) => {
    if (error) return console.log(err);

    // loop through all the keys
    keys.forEach((key) => {
      // get the value of the key from Redis
      client.get(key, async (error, result) => {
        if (error) {
          console.error(error);
          await client.quit();
          return;
        }

        // store the original value of the key
        const originalValue = await result;

        // wait for one second
        setTimeout(() => {
          // get the updated value of the key
          client.get(key, async (error, result) => {
            if (error) {
              console.error(error);
              await client.quit();
              return;
            }

            // compare the original value to the updated value
            if (originalValue !== result) {
              console.log(`The value of key "${key}" has changed`);
              client.set(result, JSON.stringify(result.data));
              res.json(result.data);
              await client.quit();
            }
          });
        }, 1000);
      });
    });
  });
};
checkRedisKey();

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
// Export the Express API
module.exports = app;