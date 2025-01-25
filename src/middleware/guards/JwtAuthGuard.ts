import {Injectable,UnauthorizedException, ExecutionContext, CanActivate } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {JsonWebTokenError} from 'jsonwebtoken'
import {UNAUTHORIZED} from '../../helpers/responseHelper'
import { WsException } from '@nestjs/websockets';

import { Socket } from 'socket.io'

@Injectable()
export  class JwtAuthGuard extends AuthGuard('jwt') {
    private context
  canActivate(context: ExecutionContext) {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
     this.context = context
    return super.canActivate(context);
  }
  handleRequest(err: any, user: any, info: any, context: any, status: any) {

    console.log('user ', user)

    if (!user || info instanceof JsonWebTokenError) {
        
        //const req = this.context.switchToHttp().getRequest();
        //throw new UnauthorizedException(UNAUTHORIZED(null,req))
        throw new WsException('Invalid credentials.');
      }

    return super.handleRequest(err, user, info, context, status);
  }
}


@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {

 private context
  canActivate(context: ExecutionContext) {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
     this.context = context
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
     // console.log('userrrrr ', user)
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
     const req = this.context.switchToHttp().getRequest();
      throw err || new  UnauthorizedException(UNAUTHORIZED(null,req))
    }

    return user;
  }
}

@Injectable()
export class SocketIoGuard implements CanActivate {
  //constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();

    // Retrieve the JWT token from the client's query string or headers
    const token = client.handshake.query.token || client.handshake.headers.authorization;
    //console.log('token ', token)

    // Perform authentication and authorization checks based on the token
    try {
      //const decoded = this.jwtService.verify(token);
      // Perform additional checks based on the decoded token, e.g., user roles, permissions, etc.

      return true; // Return true if the connection is authorized
    } catch (error) {
      return false; // Return false if the connection is unauthorized
    }
  }
}