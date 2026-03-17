/** Angular Imports */
import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';

/** rxjs Imports */
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/** Environment Configuration */
import { environment } from '../../../environments/environment';

/** Custom Services */
import { Logger } from '../logger/logger.service';
import { AlertService } from '../alert/alert.service';
import { TranslateService } from '@ngx-translate/core';
import { ErrorHandlerService } from '../error-handler/error-handler.service';

const log = new Logger('ErrorHandlerInterceptor');

@Injectable()
export class ErrorHandlerInterceptor implements HttpInterceptor {
  private alertService = inject(AlertService);
  private translate = inject(TranslateService);
  private errorHandlerService = inject(ErrorHandlerService);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(catchError((error) => this.handleError(error, request)));
  }

  private handleError(response: HttpErrorResponse, request: HttpRequest<any>): Observable<HttpEvent<any>> {
    const status = response.status;
    const errorBody: any = response.error;
    const translatedErrorMessage = this.errorHandlerService.translateFineractError(errorBody);
    const developerMessage: string | undefined = errorBody?.developerMessage;
    const errorMessage = translatedErrorMessage || errorBody?.defaultUserMessage || response.message;

    let parameterName: string | null = null;
    if (errorBody?.errors?.[0] && 'parameterName' in errorBody.errors[0]) {
      parameterName = errorBody.errors[0].parameterName;
    }

    const isClientImage404 = status === 404 && request.url.includes('/clients/') && request.url.includes('/images');

    if (!environment.production && !isClientImage404) {
      if (developerMessage) { log.error(`Request Error (developerMessage): ${developerMessage}`); }
      log.error(`Request Error: ${errorMessage}`);
    }

    if (status === 401 || (environment.oauth.enabled && status === 400 && request.url.includes('/oauth/token'))) {
      this.alertService.alert({
        type: this.translate.instant('errors.error.auth.type'),
        message: this.translate.instant('errors.error.auth.message')
      });
    } else if (
      status === 403 &&
      (errorBody?.userMessageGlobalisationCode === 'error.msg.otp.token.invalid' ||
        errorBody?.errors?.[0]?.userMessageGlobalisationCode === 'error.msg.otp.token.invalid' ||
        errorBody?.errors?.[0]?.defaultUserMessage === 'The provided one time token is invalid')
    ) {
      this.alertService.alert({
        type: this.translate.instant('errors.error.token.invalid.type'),
        message: this.translate.instant('errors.error.token.invalid.message')
      });
    } else if (status === 400) {
      const fallback = this.translate.instant('errors.interceptor.invalidParams');
      const message = parameterName ? `[${parameterName}] ${errorMessage || fallback}` : `${errorMessage || fallback}`;
      this.alertService.alert({
        type: this.translate.instant('errors.error.bad.request.type'),
        message: message || this.translate.instant('errors.error.bad.request.message')
      });
    } else if (status === 403) {
      this.alertService.alert({
        type: this.translate.instant('errors.error.unauthorized.type'),
        message: errorMessage || this.translate.instant('errors.error.unauthorized.message')
      });
    } else if (status === 404) {
      if (isClientImage404) {
        return throwError(() => response);
      } else {
        this.alertService.alert({
          type: this.translate.instant('errors.error.resource.not.found.type'),
          message: errorMessage || this.translate.instant('errors.error.resource.not.found.message')
        });
      }
    } else if (status === 500) {
      this.alertService.alert({
        type: this.translate.instant('errors.error.server.internal.type'),
        message: this.translate.instant('errors.error.server.internal.message')
      });
    } else if (status === 501) {
      this.alertService.alert({
        type: this.translate.instant('errors.error.resource.notImplemented.type'),
        message: this.translate.instant('errors.error.resource.notImplemented.message')
      });
    } else {
      this.alertService.alert({
        type: this.translate.instant('errors.error.unknown.type'),
        message: errorMessage || this.translate.instant('errors.error.unknown.message')
      });
    }

    throw response;
  }
}
