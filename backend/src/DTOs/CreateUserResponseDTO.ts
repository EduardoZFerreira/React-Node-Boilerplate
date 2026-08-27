class CreateUserResponseDTO implements IResponse {
  hasError: boolean;
  errors: string[];
  id?: string;

  constructor(hasError: boolean, errors: string[], id?: string) {
    this.hasError = hasError;
    this.errors = errors;
    this.id = id;
  }
}

export { CreateUserResponseDTO };
