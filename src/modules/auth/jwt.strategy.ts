import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
             jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
           //  ignoreExpiration: false,
             ignoreExpiration: true,
             secretOrKey: process.env.JWTKEY,
        });
    }

    async validate(payload: any) {
        
        return payload;
    }

}