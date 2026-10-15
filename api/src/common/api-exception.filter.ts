import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception instanceof HttpException ? exception.getResponse() : null;
    const objectBody = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {};
    const rawMessage = objectBody.message ?? (typeof body === 'string' ? body : undefined);
    const details = Array.isArray(rawMessage) ? rawMessage.map((message) => ({ message })) : undefined;
    const message = Array.isArray(rawMessage)
      ? 'Request validation failed'
      : typeof rawMessage === 'string'
        ? rawMessage
        : status === 500
          ? 'Internal server error'
          : 'Request failed';
    const code = typeof objectBody.code === 'string'
      ? objectBody.code
      : status === 400 ? 'BAD_REQUEST'
        : status === 404 ? 'NOT_FOUND'
          : status === 409 ? 'CONFLICT'
            : 'INTERNAL_ERROR';
    response.status(status).json({ statusCode: status, code, message, ...(details ? { details } : {}) });
  }
}
