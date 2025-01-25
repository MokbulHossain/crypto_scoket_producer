import {
    SubscribeMessage,
    WebSocketGateway,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketServer,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
  import { REDIS_CONNECTION, DATABASE_CONNECTION} from '../../config/constants'
  import { AuthService } from '../auth/auth.service'
  import { winstonLog } from '@config/winstonLog'
  import { QueryTypes, Sequelize } from 'sequelize';
  import axios from 'axios'
  import { Cron, CronExpression } from '@nestjs/schedule';

  export class SignalGateway {
    constructor(
        @Inject(REDIS_CONNECTION) private redisClient: any,
        @Inject(DATABASE_CONNECTION) private DB: Sequelize
    ) {}

    @Cron(CronExpression.EVERY_5_SECONDS)
    async handleCron() {
      console.log('Called every 5 seconds');
      const coins = await this.getAllRooms()
      console.log('coins => ', coins)
      if (coins.length) {
        // fetch coin price
        for (const coin of coins) {
          //  const price = await this.coinPrice(coin)
          const price = Math.floor(Math.random() * 100) + 1
          await this.redisClient.publish("my_channel", JSON.stringify({coin_name: coin, price}));
        }
      }

    }
  
    // Get all rooms
    async getAllRooms(): Promise<string[]> {
      // Use SCAN to find all keys matching the pattern `room:*`
      const keys = await this.redisClient.keys('room:*');
      // Extract room names from keys (e.g., `room:room1` -> `room1`)
      return keys.map((key) => key.replace('room:', ''));
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
          return 0
      })
   }

}
  