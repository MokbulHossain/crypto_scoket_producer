import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
    ) { }

    async validateUser(username: string, password: string) {
        // find if user exist with this email

        if (username ) {

            return {username,login_time : Date.now()} 

        } else {

           return false
        }
    }

    public async login(user) {

        const token = await this.generateToken(user);

        return { user, token };
    }


    private async generateToken(user) {
        const token = await this.jwtService.signAsync(user);
        return token;
    }

    public async decodeToken(token) {

        try{

            return await this.jwtService.verify(`${token}`)

        } catch(e) {

            return false
        }
    }

}