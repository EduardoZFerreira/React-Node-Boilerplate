class AuthenticationResponseDTO implements IResponse {
  hasError: boolean;
  errors: string[];
  userId?: string;

  constructor(hasError: boolean, errors: string[], userId?: string) {
    this.hasError = hasError;
    this.errors = errors;
    this.userId = userId;
  }
}

export { AuthenticationResponseDTO };
