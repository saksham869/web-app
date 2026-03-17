import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

export interface ErrorMessage {
  title: string;
  message: string;
  action?: string;
  actionType?: string;
}

export interface FineractErrorDetail {
  userMessageGlobalisationCode?: string;
  defaultUserMessage?: string;
}
export interface FineractErrorResponse {
  userMessageGlobalisationCode?: string;
  defaultUserMessage?: string;
  errors?: FineractErrorDetail[];
}

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private translate = inject(TranslateService);

  handleError(error: HttpErrorResponse, context?: string): Observable<never> {
    const errorMessage = this.getErrorMessage(error, context);
    this.showError(errorMessage);
    return throwError(() => error);
  }

  private getErrorMessage(error: HttpErrorResponse, context?: string): ErrorMessage {
    if (error.error instanceof ErrorEvent) {
      return {
        title: this.translate.instant('errors.http.connection.title'),
        message: this.translate.instant('errors.http.connection.message'),
        action: this.translate.instant('labels.buttons.OK')
      };
    }

    const fineractError = error.error?.errors?.[0]?.defaultUserMessage;
    const defaultMessage = error.error?.defaultUserMessage;

    switch (error.status) {
      case 400:
        return {
          title: this.translate.instant('errors.http.badRequest.title'),
          message: fineractError || defaultMessage || this.translate.instant('errors.http.badRequest.message'),
          action: this.translate.instant('labels.buttons.OK')
        };
      case 401:
        return {
          title: this.translate.instant('errors.http.unauthorized.title'),
          message: this.translate.instant('errors.http.unauthorized.message'),
          action: this.translate.instant('errors.http.unauthorized.action'),
          actionType: 'login'
        };
      case 403:
        return {
          title: this.translate.instant('errors.http.forbidden.title'),
          message: fineractError || defaultMessage || this.translate.instant('errors.http.forbidden.message'),
          action: this.translate.instant('labels.buttons.OK')
        };
      case 404:
        return {
          title: this.translate.instant('errors.http.notFound.title'),
          message: context
            ? this.translate.instant('errors.http.notFound.contextMessage', { context })
            : fineractError || defaultMessage || this.translate.instant('errors.http.notFound.message'),
          action: this.translate.instant('labels.buttons.OK')
        };
      case 409:
        return {
          title: this.translate.instant('errors.http.conflict.title'),
          message: fineractError || defaultMessage || this.translate.instant('errors.http.conflict.message'),
          action: this.translate.instant('labels.buttons.OK')
        };
      case 500:
        return {
          title: this.translate.instant('errors.http.serverError.title'),
          message: fineractError || defaultMessage || this.translate.instant('errors.http.serverError.message'),
          action: this.translate.instant('labels.buttons.OK')
        };
      case 503:
        return {
          title: this.translate.instant('errors.http.serviceUnavailable.title'),
          message: this.translate.instant('errors.http.serviceUnavailable.message'),
          action: this.translate.instant('labels.buttons.OK')
        };
      default:
        return {
          title: this.translate.instant('errors.http.default.title'),
          message: fineractError || defaultMessage || this.translate.instant('errors.http.default.message'),
          action: this.translate.instant('labels.buttons.OK')
        };
    }
  }

  private showError(errorMessage: ErrorMessage): void {
    const snackBarRef = this.snackBar.open(
      `${errorMessage.title}: ${errorMessage.message}`,
      errorMessage.action || this.translate.instant('labels.buttons.Close'),
      { duration: 5000, horizontalPosition: 'center', verticalPosition: 'top', panelClass: ['error-snackbar'] }
    );
    if (errorMessage.actionType === 'login') {
      snackBarRef.onAction().subscribe(() => { this.router.navigate(['/login']); });
    }
  }

  showSuccess(message: string, action: string = 'OK'): void {
    this.snackBar.open(message, action, {
      duration: 3000, horizontalPosition: 'center', verticalPosition: 'bottom', panelClass: ['success-snackbar']
    });
  }

  showInfo(message: string, action: string = 'OK'): void {
    this.snackBar.open(message, action, {
      duration: 4000, horizontalPosition: 'center', verticalPosition: 'bottom', panelClass: ['info-snackbar']
    });
  }

  translateFineractError(errorResponse: FineractErrorResponse | null | undefined): string {
    if (!errorResponse || typeof errorResponse !== 'object') { return ''; }
    const messages: string[] = [];
    if (errorResponse.userMessageGlobalisationCode) {
      const mainMsg = this.getMessageForCode(errorResponse.userMessageGlobalisationCode, errorResponse.defaultUserMessage);
      if (mainMsg) { messages.push(mainMsg); }
    } else if (errorResponse.defaultUserMessage) {
      messages.push(errorResponse.defaultUserMessage);
    }
    if (Array.isArray(errorResponse.errors)) {
      errorResponse.errors.forEach((error: FineractErrorDetail) => {
        if (!error || typeof error !== 'object') { return; }
        if (error.userMessageGlobalisationCode) {
          const nestedMsg = this.getMessageForCode(error.userMessageGlobalisationCode, error.defaultUserMessage);
          if (nestedMsg) { messages.push(nestedMsg); }
        } else if (error.defaultUserMessage) {
          messages.push(error.defaultUserMessage);
        }
      });
    }
    return Array.from(new Set(messages.filter((m) => !!m && typeof m === 'string'))).join(' ');
  }

  private getMessageForCode(code: string, defaultMessage?: string): string {
    if (!code) { return defaultMessage || ''; }
    const translated = this.translate.instant(code);
    return (translated && translated !== code) ? translated : (defaultMessage || '');
  }
}
