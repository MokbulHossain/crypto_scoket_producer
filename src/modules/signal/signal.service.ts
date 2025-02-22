import {
    SubscribeMessage,
    WebSocketGateway,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketServer,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { Injectable, Inject, UnauthorizedException, OnModuleInit } from '@nestjs/common';
  import { REDIS_CONNECTION, DATABASE_CONNECTION} from '../../config/constants'
  import { AuthService } from '../auth/auth.service'
  import { winstonLog } from '@config/winstonLog'
  import { QueryTypes, Sequelize } from 'sequelize';
  import axios from 'axios'
  import { Cron, CronExpression , Timeout } from '@nestjs/schedule';

  export class SignalGateway implements OnModuleInit {
    private readonly executionThreshold = 5000;
    private coinPrices = {} //{API3USDT: 100, XRPUSDT: 490, ......}
    constructor(
        @Inject(REDIS_CONNECTION) private redisClient: any,
        @Inject(DATABASE_CONNECTION) private DB: Sequelize
    ) {}

    // @Cron(CronExpression.EVERY_5_SECONDS)
    @Timeout(10000)
    async handleCron() {
      const start = new Date().getTime();
      const coins = await this.getAllCoins()
      // console.log('coins => ', coins)
      if (coins.length) {
        // fetch coin price
        for (const coin of coins) {
          const coin_name = coin['name']
           const price = await this.coinPrice(coin_name)
           if (price != -1111) {
              if (!this.coinPrices[coin_name] || this.coinPrices[coin_name] != price) {
                // const price = Math.floor(Math.random() * 100) + 1
                const query = `select  update_signals_based_on_price(p_coin_name :=:coin_name, p_current_price :=:price)`
                await this.DB.query(query, { replacements: { price, coin_name }, type: QueryTypes.SELECT });
                await this.redisClient.publish("my_channel", JSON.stringify({coin_name, price}));
              }

              this.coinPrices[coin_name] = price
           }
        }
      }
     
      const totalTimeTake = Date.now() - start;
      const delay = Math.max(this.executionThreshold - totalTimeTake, 0);
  
      console.log(`Execution time: ${totalTimeTake}ms, Next run in: ${delay}ms`);
  
      setTimeout(() => this.handleCron(), delay);

    }

    onModuleInit() {
      this.handleCron();
    }
  
    // Get all rooms
    async getAllRooms(): Promise<string[]> {
      // Use SCAN to find all keys matching the pattern `room:*`
      const keys = await this.redisClient.keys('room:*');
      // Extract room names from keys (e.g., `room:room1` -> `room1`)
      return keys.map((key) => key.replace('room:', ''));
    }

    async getAllCoins() {
      
      const redisData = await this.redisClient.get(`coin_types`)
      if (redisData) {
         return JSON.parse(redisData)
      }
      const query = `select * from coin_type`
      const data = await this.DB.query(query, { type: QueryTypes.SELECT })
      this.redisClient.setEx(`coin_types`, 3600, JSON.stringify(data))
      return data

    }

    async coinPrice(coin_name) {

      const redisData = await this.redisClient.get(`coin_price:${coin_name}`)
      if (redisData) {
       return (+redisData)
      }
      console.log('Didnot find in redis.')
      const url = process.env.PRICE_API_URL.replace(/<COIN_NAME>/g, coin_name)
      console.log(url)
      return await axios.get(url)
      .then(resp => {
          const respData = resp.data
          console.log('respData => ', respData)
          this.redisClient.setEx(`coin_price:${coin_name}`, 10, (respData['price']))
          return (+respData['price'])

      }).catch(e => {
          const errorResponse = e['response'] ? (e['response']['data'] ? e['response']['data'] : e['response']) : e
          winstonLog.log('error', `${url} api Response %o`, errorResponse);
          return -1111
      })
   }

}
  