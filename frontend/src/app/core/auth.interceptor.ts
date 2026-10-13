import { HttpInterceptorFn } from '@angular/common/http';

export const JWT_CLAVE = 'jwt';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(JWT_CLAVE);
  if (!token) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
