class AuthenticationResponseDTO implements IResponse {
  hasError: boolean;
  errors: string[];
  accessToken?: string;
  userId?: number;

  constructor(
    hasError: boolean,
    errors: string[],
    accessToken?: string,
    userId?: number
  ) {
    this.hasError = hasError;
    this.errors = errors;
    this.accessToken = accessToken;
    this.userId = userId;
  }
}

export { AuthenticationResponseDTO };
