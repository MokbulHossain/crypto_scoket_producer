import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import {UNAUTHORIZED} from '../../helpers/responseHelper'
import 'dotenv/config'

@Injectable()
export class AuthModuleGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateHeaderRequest(request);
  }

  async validateHeaderRequest(request) { 

    const {headers = null} = request

    if (!headers || !headers['module'] || headers['module'] != process.env.AUTH_MODULE) {

        throw new UnauthorizedException(UNAUTHORIZED(null,request))

    }

    return true;
   }
}