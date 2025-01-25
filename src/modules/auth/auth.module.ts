import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: process.env.JWTKEY,
            signOptions: { expiresIn: process.env.TOKEN_EXPIRATION },
        }),
    ],
    providers: [
        AuthService,
        LocalStrategy,
        JwtStrategy
    ],
    controllers: [],
    exports: [AuthService]
    
})
export class AuthModule { }